import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import xlsx from 'xlsx'
import axios from 'axios'
import express from 'express'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { formatTimestampToDatetime } from '../renderer/src/utils/index'
import fs from 'fs'
import path from 'node:path'

// 加载环境变量
dotenv.config()

// 确保cookie.txt文件所在的目录存在
const userDataPath = app.getPath('userData')
const cookieFilePath = path.join(userDataPath, 'cookie.txt')

// 确保文件存在，如果不存在则创建空文件
if (!fs.existsSync(cookieFilePath)) {
  fs.writeFileSync(cookieFilePath, '', 'utf8')
}

let server
let mainWindow

// 创建自定义右键菜单项
function createMenuItem(label, role, shortcut) {
  const paddingLength = 20
  const paddedLabel = label.padEnd(paddingLength)
  return {
    label: `${paddedLabel}`,
    accelerator: shortcut,
    role: role
  }
}

// 自定义右键菜单
const contextMenuTemplate = [
  createMenuItem('复制', 'copy', 'Ctrl + C'),
  createMenuItem('粘贴', 'paste', 'Ctrl + V'),
  { type: 'separator' },
  createMenuItem('剪切', 'cut', 'Ctrl + X'),
  createMenuItem('全选', 'selectAll', 'Ctrl + A')
]

// 导入Excel文件的处理函数
async function importExcelHandler() {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Excel',
        extensions: ['xlsx', 'xls']
      }
    ]
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    try {
      const workbook = xlsx.readFile(filePath)
      const sheetNames = workbook.SheetNames
      const excelData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]])
      if (excelData) {
        dialog.showMessageBox(mainWindow, {
          title: '导入Excel',
          type: 'info',
          message: '导入成功'
        })

        BrowserWindow.getFocusedWindow().webContents.send('save-excel-data', excelData)
      }
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '导入Excel',
        type: 'error',
        message: `导入失败：, ${error.text}`
      })
    }
  }
}

// 创建数据库连接池
const dbConfig = {
  host: import.meta.env.VITE_HOST,
  user: import.meta.env.VITE_USER,
  password: import.meta.env.VITE_PASSWORD,
  database: import.meta.env.VITE_DATABASE
}

const pool = mysql.createPool(dbConfig)

// 初始化 rewards 表
async function initRewards() {
  const conn = await pool.getConnection()
  try {
    await conn.query('DROP TABLE IF EXISTS rewards')
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
        product_name VARCHAR(100) COMMENT '活动名称',
        money DECIMAL(10,2) COMMENT '发放金额',
        create_time DATETIME COMMENT '发放时间'
      ) COMMENT '收益中心'
    `)
  } finally {
    conn.release()
  }
}

// 获取余额
async function getBalance() {
  const url = 'https://pay.bilibili.com/bk/brokerage/getUserBrokerage'
  const payload = {
    sdkVersion: '1.1.7',
    timestamp: Math.floor(Date.now() / 1000),
    traceId: Math.floor(Date.now() / 1000)
  }
  const headers = {
    Referer: 'https://pay.bilibili.com/pay-v2/shell/index',
    Cookie: fs.readFileSync(cookieFilePath, 'utf8').replace(/,/g, '%2C'),
    'User-Agent': import.meta.env.VITE_USER_AGENT,
    'Content-Type': 'application/json'
  }
  const response = await axios.post(url, payload, {
    headers
  })
  return response.data?.data?.brokerage || 0
}

// 初始化 bilibili 表
async function initBilibili(conn) {
  await conn.query('DROP TABLE IF EXISTS bilibili')
  await conn.query(`
    CREATE TABLE IF NOT EXISTS bilibili (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
      title VARCHAR(255) COMMENT '标题',
      view INT COMMENT '播放量',
      post_time DATETIME COMMENT '投稿时间',
      tag VARCHAR(255) COMMENT '投稿标签'
    ) COMMENT '稿件管理'
  `)
}

// 获取 bilibili 列表
async function getBilibiliList(pageNumber) {
  const url = 'https://member.bilibili.com/x/web/archives'
  const headers = {
    Referer: 'https://member.bilibili.com/platform/upload-manager/article',
    Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }

  const response = await axios.get(url, {
    params: {
      pn: pageNumber,
      ps: 10
    },
    headers
  })

  return response.data?.data || null
}

// 解析数据
async function parseData(event, data, conn) {
  for (const item of data.arc_audits || []) {
    const archive = item.Archive || {}
    const stat = item.stat || {}

    const title = archive.title
    const view = stat.view || 0
    const pubTime = archive.ptime
    const tag = archive.tag
    const postTime = formatTimestampToDatetime(pubTime)
    console.log(
      `投稿时间 = ${postTime}, 播放量 = ${view.toString().padEnd(5)}, 标题 = ${title}, 投稿标签 = ${tag}`
    )

    const sql = `
      INSERT INTO bilibili(title, view, post_time, tag)
      VALUES (?, ?, ?, ?)
    `
    await conn.query(sql, [title, view, postTime, tag])

    event.sender.send('update-database-progress', {
      title,
      view,
      postTime,
      tag
    })
  }
}

// 根据标题查找投稿标签
async function getTopicByTitle(titleToFind) {
  const url = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space'
  const headers = {
    Referer: 'https://space.bilibili.com/506485454/dynamic',
    Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }

  let offset = ''

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const params = {
      offset,
      host_mid: '506485454'
    }

    const response = await axios.get(url, {
      headers,
      params
    })

    const data = response.data

    // 遍历动态列表
    for (const item of data.data.items) {
      const archive = item?.modules?.module_dynamic?.major?.archive || {}
      const topic = item?.modules?.module_dynamic?.topic?.name || ''
      const title = archive.title || ''
      const pub_ts = item?.modules?.module_author?.pub_ts || 0
      const post_time = formatTimestampToDatetime(pub_ts)
      const play = archive.stat?.play || 0

      if (title === titleToFind) {
        console.log(
          `投稿时间 = ${post_time}, 标题 = ${title}, 播放量 = ${play}, 投稿标签 = ${topic}`
        )
        return {
          topic,
          play
        }
      }
    }

    // 更新 offset，继续下一页
    offset = data.data.offset || ''

    if (!offset) {
      dialog.showMessageBox(mainWindow, {
        title: '查找活动资格取消稿件',
        type: 'info',
        message: '未找到匹配的视频'
      })
      return null
    }
  }
}

// 获取10天前的零点时间
function getTenDaysAgo() {
  const today = new Date()
  const tenDaysAgo = new Date(today)
  tenDaysAgo.setDate(today.getDate() - 10)
  tenDaysAgo.setHours(0, 0, 0, 0)
  return tenDaysAgo
}

// 初始化 disqualification 表
async function initDisqualification(conn) {
  await conn.query('DROP TABLE IF EXISTS disqualification')
  await conn.query(`
    CREATE TABLE IF NOT EXISTS disqualification (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
      title VARCHAR(255) COMMENT '标题',
      topic VARCHAR(255) COMMENT '投稿标签',
      play INT COMMENT '播放量',
      post_time DATETIME COMMENT '投稿时间',
      content VARCHAR(255) COMMENT '消息内容'
    ) COMMENT '活动资格取消稿件'
  `)
}

// 获取消息列表
async function getMessageList() {
  const url = 'https://api.vc.bilibili.com/svr_sync/v1/svr_sync/fetch_session_msgs'
  const headers = {
    Referer: 'https://text.bilibili.com/',
    Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }

  const params = {
    talker_id: 844424930131966,
    session_type: 1,
    size: 200
  }

  const response = await axios.get(url, {
    headers,
    params
  })

  return response.data?.data?.messages || []
}

// 图片代理服务器
function startServer() {
  const expressApp = express()
  const port = 3000

  expressApp.use(express.json())
  expressApp.use(express.urlencoded({ extended: true }))

  expressApp.get('/proxy/image', async (req, res) => {
    const imageUrl = req.query.url
    if (!imageUrl || !/^https?:\/\/.*\.hdslb\.com/.test(imageUrl)) {
      return res.status(400).send('无效的URL')
    }

    try {
      const response = await axios({
        url: imageUrl,
        responseType: 'stream'
      })
      response.data.pipe(res)
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '开启图片代理服务器',
        type: 'error',
        text: `代理错误：, ${error.text}`
      })
      res.status(500).send('代理错误')
    }
  })

  server = expressApp.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}/`)
  })
}

// 创建窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // 最大化应用窗口
    mainWindow.maximize()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 消息弹窗
  ipcMain.handle('show-message', (e, params) => {
    dialog.showMessageBox(mainWindow, {
      ...params
    })
  })

  // 展示右键菜单
  ipcMain.on('show-context-menu', () => {
    const menu = Menu.buildFromTemplate(contextMenuTemplate)
    menu.popup({
      window: BrowserWindow.getFocusedWindow()
    })
  })

  // 获取登录二维码
  ipcMain.handle('get-qrcode', async () => {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate'
    const response = await axios.get(url, {
      params: {
        source: 'main-fe-header'
      }
    })
    return response.data || {}
  })

  // 检查二维码状态
  ipcMain.handle('check-qrcode-status', async (e, qrcode_key) => {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll'
    const response = await axios.get(url, {
      params: {
        qrcode_key,
        source: 'main-fe-header'
      }
    })
    return response.data
  })

  // 保存cookie
  ipcMain.handle('save-cookie', async (e, cookie) => {
    await fs.promises.writeFile(cookieFilePath, cookie, 'utf8')
  })

  // 获取导航栏数据
  ipcMain.handle('get-navigation-data', async () => {
    const url = 'https://api.bilibili.com/x/web-interface/nav'
    const headers = {
      Referer: 'https://www.bilibili.com',
      Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }
    const response = await axios.get(url, {
      headers
    })
    return response.data?.data || {}
  })

  // 退出登录
  ipcMain.handle('logout', async () => {
    const result = fs.readFileSync(cookieFilePath, 'utf8')
    const biliCSRF = result.split(';')[2].split('=')[1]
    const url = 'https://passport.bilibili.com/login/exit/v2'
    const headers = {
      Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
      'User-Agent': import.meta.env.VITE_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    const response = await axios.post(url, `biliCSRF=${biliCSRF}`, {
      headers
    })
    await fs.promises.writeFile(cookieFilePath, '', 'utf8')
    return response.data || {}
  })

  // 获取稿件管理数据
  ipcMain.handle('manuscript-management', async (e, pn) => {
    const url = 'https://member.bilibili.com/x/web/archives'
    const headers = {
      Referer: 'https://member.bilibili.com/platform/upload-manager/article',
      Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }
    const response = await axios.get(url, {
      params: {
        pn,
        ps: 10
      },
      headers
    })
    return response.data?.data?.arc_audits || []
  })

  // 获取打卡挑战数据
  ipcMain.handle('check-in-challenge', async () => {
    const url = 'https://member.bilibili.com/x2/creative/h5/clock/v4/activity/list'
    const headers = {
      Referer: 'https://member.bilibili.com/york/platform-punch-card/personal',
      Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }
    const response = await axios.get(url, {
      headers
    })
    return response.data?.data?.list || []
  })

  // 获取热门活动数据
  ipcMain.handle('popular-events', async () => {
    const url = 'https://member.bilibili.com/x/web/activity/videoall'
    const headers = {
      Referer: 'https://member.bilibili.com/platform/releasecenter',
      Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }
    const response = await axios.get(url, {
      headers
    })
    return response.data?.data || []
  })

  // 获取收益中心数据
  ipcMain.on('earnings-center', async (event) => {
    await initRewards()

    let currentPage = 1
    let totalPage = 1
    let totalMoney = 0

    const balance = await getBalance()

    while (currentPage <= totalPage) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const url = 'https://pay.bilibili.com/bk/brokerage/v2/listForRechargeRecord'
      const payload = {
        currentPage,
        pageSize: 15,
        sdkVersion: '1.1.7',
        timestamp: Math.floor(Date.now() / 1000),
        traceId: Math.floor(Date.now() / 1000)
      }
      const headers = {
        Referer: 'https://pay.bilibili.com/pay-v2/shell/index',
        Cookie: fs.readFileSync(cookieFilePath, 'utf8').replace(/,/g, '%2C'),
        'User-Agent': import.meta.env.VITE_USER_AGENT,
        'Content-Type': 'application/json'
      }
      const response = await axios.post(url, payload, {
        headers
      })
      const data = response.data?.data || {}
      const records = data.result || []
      totalPage = data.page?.totalPage || 1

      for (const item of records) {
        const money = item.brokerage || 0
        const product_name = item.productName || ''
        const create_time = item.ctime || ''

        totalMoney += money
        console.log(
          `发放时间 = ${create_time}, 发放金额 = ${money.toFixed(2).padEnd(6)}, 活动名称 = ${product_name}`
        )

        const sql = `
          INSERT INTO rewards (product_name, money, create_time)
          VALUES (?, ?, ?)
        `
        const conn = await pool.getConnection()
        try {
          await conn.query(sql, [product_name, money, create_time])

          event.sender.send('earnings-center-progress', {
            product_name,
            money,
            create_time,
            totalMoney: totalMoney.toFixed(2),
            balance: balance.toFixed(2)
          })
        } finally {
          conn.release()
        }
      }

      currentPage++
    }

    event.sender.send('earnings-center-finish')
  })

  // 更新数据库
  ipcMain.on('update-database', async (event) => {
    const conn = await pool.getConnection()
    try {
      await initBilibili(conn)

      let page = 1
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const data = await getBilibiliList(page)
        if (!data) break

        const { count, ps } = data.page || {}
        const totalPage = Math.ceil(count / ps)

        await parseData(event, data, conn)
        await conn.commit()

        if (page >= totalPage) {
          event.sender.send('update-database-finish')
          break
        }
        page++
      }
    } finally {
      conn.release()
    }
  })

  // 活动资格取消稿件
  ipcMain.on('cancel-event-qualification', async (event) => {
    const conn = await pool.getConnection()
    const text = '由于不符合本次征稿活动的规则，故无法参与本次活动的评选'

    try {
      await initDisqualification(conn)

      const messages = await getMessageList()
      const tenDaysAgo = getTenDaysAgo()

      for (const item of messages) {
        const content = item.content || ''
        const timestamp = item.timestamp || 0

        if (!content.includes(text)) continue

        const messageTime = new Date(timestamp * 1000)
        if (messageTime < tenDaysAgo) break

        let titleStart = content.indexOf('《') + 1
        let titleEnd = content.indexOf('》')
        let title =
          titleStart > 0 && titleEnd > titleStart
            ? content.substring(titleStart, titleEnd)
            : '未知标题'

        const { topic, play } = await getTopicByTitle(title)
        const sql = `
          INSERT INTO disqualification (title, topic, play, post_time, content)
          VALUES (?, ?, ?, ?, ?)
        `
        const post_time = formatTimestampToDatetime(timestamp)
        await conn.query(sql, [title, topic, play, post_time, content])

        event.sender.send('cancel-event-qualification-progress', {
          title,
          topic,
          play,
          post_time
        })
      }
    } finally {
      conn.release()
    }

    event.sender.send('cancel-event-qualification-finish')
  })

  // 播放量<100的稿件
  ipcMain.handle('view-less-one-hundred', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT * FROM bilibili
        WHERE view < 100 AND post_time <= DATE_SUB(CURDATE(),INTERVAL 180 DAY)
        ORDER BY view ASC
      `
      const [rows] = await conn.query(sql)
      return rows
    } finally {
      conn.release()
    }
  })

  // 获取bilibili表中的数据
  ipcMain.handle('get-bilibili-data', async () => {
    const [rows] = await pool.query('SELECT * FROM bilibili ORDER BY post_time DESC')
    return rows
  })

  // 获取rewards表中的数据
  ipcMain.handle('get-rewards-data', async () => {
    const [rows] = await pool.query('SELECT * FROM rewards ORDER BY create_time DESC')
    return rows
  })

  // 获取disqualification表中的数据
  ipcMain.handle('get-disqualification-data', async () => {
    const [rows] = await pool.query('SELECT * FROM disqualification ORDER BY post_time DESC')
    return rows
  })

  createWindow()
  startServer()

  // 菜单栏
  const myMenu = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入bilibili.xlsx',
          click() {
            importExcelHandler()
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(myMenu)
  Menu.setApplicationMenu(menu)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    server.close()
  }
})
