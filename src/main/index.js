import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import xlsx from 'xlsx'
import axios from 'axios'
import express from 'express'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { formatTimestampToDatetime } from '../renderer/src/utils/index'

// 加载环境变量
dotenv.config()

let server
let mainWindow

function createMenuItem(label, role, shortcut) {
  // 控制左侧文字宽度
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
        message: `导入失败：, ${error.message}`
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
async function getBalance(headers) {
  const url = 'https://pay.bilibili.com/payplatform/getUserWalletInfo'
  const response = await axios.get(url, {
    headers
  })
  return response.data?.data?.accountInfo.brokerage || 0
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

// 获取 bilibili 数据
async function getBilibiliList(pageNumber) {
  const url = 'https://member.bilibili.com/x/web/archives'
  const headers = {
    Referer: 'https://member.bilibili.com/platform/upload-manager/article',
    Cookie: import.meta.env.VITE_COOKIE,
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
async function parseData(data, conn) {
  const records = []

  for (const item of data.arc_audits || []) {
    const archive = item.Archive || {}
    const stat = item.stat || {}

    const title = archive.title
    const view = stat.view || 0
    const pubTime = archive.ptime
    const tag = archive.tag
    const postTime = formatTimestampToDatetime(pubTime)
    records.push([title, view, postTime, tag])
    console.log(
      `投稿时间 = ${postTime}, 播放量 = ${view.toString().padEnd(5)}, 标题 = ${title}, 投稿标签 = ${tag}`
    )
  }

  if (records.length > 0) {
    const sql = `
      INSERT INTO bilibili(title, view, post_time, tag)
      VALUES ?
    `
    await conn.query(sql, [records])
  }
}

// 查找指定标题的投稿标签
async function fetchBilibiliVideoData(titleToFind) {
  const headers = {
    Referer: 'https://space.bilibili.com/506485454/dynamic',
    Cookie: import.meta.env.VITE_COOKIE,
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }

  const URL_DYNAMIC = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space'

  let offset = ''

  while (true) {
    const params = {
      offset,
      host_mid: '506485454'
    }

    try {
      const response = await axios.get(URL_DYNAMIC, {
        headers,
        params
      })
      const data = response.data

      // 遍历动态列表
      for (const item of data.data.items) {
        const archive = item?.modules?.module_dynamic?.major?.archive || {}
        const topic = item?.modules?.module_dynamic?.topic?.name || ''
        const title = archive.title || ''
        const pub_ts = item?.modules?.module_author?.pub_ts || ''
        const post_time = formatTimestampToDatetime(pub_ts)

        if (title === titleToFind) {
          console.log(`标题 = ${title}, 投稿时间 = ${post_time}, 投稿标签 = ${topic}`)
          return topic
        }
      }

      // 更新 offset，继续下一页
      offset = data.data.offset || ''
      if (!offset) {
        console.log('未找到匹配的视频')
        return null
      }
    } catch (error) {
      console.error('请求失败:', error.message)
      return null
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

// 获取 10 天前的零点时间
function getTenDaysAgo() {
  const today = new Date()
  const tenDaysAgo = new Date(today)
  tenDaysAgo.setDate(today.getDate() - 10)
  tenDaysAgo.setHours(0, 0, 0, 0)
  return tenDaysAgo
}

// 创建 disqualification 表
async function createDisqualificationTable(conn) {
  await conn.query('DROP TABLE IF EXISTS disqualification')
  await conn.query(`
    CREATE TABLE IF NOT EXISTS disqualification (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) COMMENT '标题',
      topic VARCHAR(255) COMMENT '投稿标签',
      post_time DATETIME COMMENT '投稿时间',
      content VARCHAR(255) COMMENT '消息内容'
    ) COMMENT '活动资格取消'
  `)
}

// 获取消息数据
async function fetchMessages() {
  const URL_FETCH_MESSAGES = 'https://api.vc.bilibili.com/svr_sync/v1/svr_sync/fetch_session_msgs'

  const headers = {
    Referer: 'https://message.bilibili.com/',
    Cookie: import.meta.env.VITE_COOKIE,
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }

  const params = {
    talker_id: 844424930131966,
    session_type: 1,
    size: 200
  }

  try {
    const res = await axios.get(URL_FETCH_MESSAGES, {
      headers,
      params
    })

    return res.data?.data?.messages || []
  } catch (error) {
    console.error('获取消息失败:', error.message)
    return []
  }
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
      dialog.showMessageBox({
        type: 'error',
        message: `代理错误：, ${error.message}`
      })
      res.status(500).send('代理错误')
    }
  })

  server = expressApp.listen(port, () => {
    console.log(`服务器运行在http://localhost:${port}/`)
  })
}

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

  // 获取稿件管理数据
  ipcMain.handle('manuscript-management', async (e, pn) => {
    const url = 'https://member.bilibili.com/x/web/archives'
    const headers = {
      Referer: 'https://member.bilibili.com/platform/upload-manager/article',
      Cookie: import.meta.env.VITE_COOKIE,
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
      Cookie: import.meta.env.VITE_COOKIE,
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
      Cookie: import.meta.env.VITE_COOKIE,
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }
    const response = await axios.get(url, {
      headers
    })
    return response.data?.data || []
  })

  // 获取收益中心数据
  ipcMain.handle('earnings-center', async () => {
    await initRewards()

    const headers = {
      Referer: 'https://pay.bilibili.com/pay-v2/shell/bill',
      Cookie: import.meta.env.VITE_COOKIE,
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }

    let currentPage = 1
    let totalPage = 1
    let totalMoney = 0

    const balance = await getBalance(headers)

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

      const response = await axios.post(url, payload, {
        headers
      })
      const data = response.data?.data || {}
      const records = data.result || []
      totalPage = data.page?.totalPage || 1

      const items = []

      for (const item of records) {
        const money = item.brokerage || 0
        const name = item.productName || ''
        const ctime = item.ctime || ''

        totalMoney += money
        items.push([name, money, ctime])
        console.log(
          `发放时间 = ${ctime}, 发放金额 = ${money.toFixed(2).padEnd(6)}, 活动名称 = ${name}`
        )
      }

      if (items.length > 0) {
        const query = `
            INSERT INTO rewards (product_name, money, create_time)
            VALUES ?
          `
        const conn = await pool.getConnection()
        try {
          await conn.query(query, [items])
        } finally {
          conn.release()
        }
      }

      currentPage++
    }

    // 查询数据库中的所有记录
    const [rows] = await pool.query('SELECT * FROM rewards ORDER BY create_time DESC')
    return {
      rows,
      totalMoney: totalMoney.toFixed(2),
      balance: balance.toFixed(2)
    }
  })

  // 更新数据库
  ipcMain.handle('update-database', async () => {
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

        await parseData(data, conn)
        await conn.commit()

        if (page >= totalPage) break
        page++
      }

      const [rows] = await pool.query('SELECT * FROM bilibili ORDER BY post_time DESC')
      return rows
    } finally {
      conn.release()
    }
  })

  // 活动资格取消
  ipcMain.handle('cancel-event-qualification', async () => {
    const connection = await pool.getConnection()
    const FILTER_MESSAGE =
      '已经通过审核，但由于不符合本次征稿活动的规则，故该稿件无法参与本次活动的评选'

    try {
      await createDisqualificationTable(connection)

      const messages = await fetchMessages()
      const tenDaysAgo = getTenDaysAgo()

      for (const item of messages) {
        const content = item.content || ''
        const timestamp = item.timestamp || 0

        if (!content.includes(FILTER_MESSAGE)) continue

        const messageTime = new Date(timestamp * 1000)
        if (messageTime < tenDaysAgo) break

        let titleStart = content.indexOf('《') + 1
        let titleEnd = content.indexOf('》')
        let title =
          titleStart > 0 && titleEnd > titleStart
            ? content.substring(titleStart, titleEnd)
            : '未知标题'

        const topic = await fetchBilibiliVideoData(title)

        const sql = `
          INSERT INTO disqualification (title, topic, post_time, content)
          VALUES (?, ?, ?, ?)
        `

        const post_time = formatTimestampToDatetime(timestamp)
        await connection.query(sql, [title, topic, post_time, content])
      }

      // 查询数据库中的所有记录
      const [rows] = await pool.query('SELECT * FROM disqualification')
      return rows
    } finally {
      connection.release()
    }
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
