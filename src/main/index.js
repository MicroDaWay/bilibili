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
const createMenuItem = (label, role, shortcut) => {
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

// 创建数据库连接池
const dbConfig = {
  host: import.meta.env.VITE_HOST,
  user: import.meta.env.VITE_USER,
  password: import.meta.env.VITE_PASSWORD,
  database: import.meta.env.VITE_DATABASE
}

const pool = mysql.createPool(dbConfig)

// 检查数据库连接
const checkDatabaseConnection = async () => {
  try {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    return true
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      title: '检查数据库连接',
      type: 'error',
      message: `数据库连接失败, ${error.message}`
    })

    app.quit()
    return false
  }
}

// 初始化数据库表
const initTable = async () => {
  const conn = await pool.getConnection()
  try {
    // 初始化bilibili表
    await conn.query(`
    CREATE TABLE IF NOT EXISTS bilibili (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
      title VARCHAR(255) COMMENT '标题',
      view INT COMMENT '播放量',
      post_time DATETIME COMMENT '投稿时间',
      tag VARCHAR(255) COMMENT '投稿标签',
      UNIQUE KEY UK_title_post_time(title, post_time)
    ) COMMENT '稿件管理'
  `)

    // 初始化rewards表
    await conn.query(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
      product_name VARCHAR(100) COMMENT '活动名称',
      money DECIMAL(10,2) COMMENT '发放金额',
      create_time DATETIME COMMENT '发放时间',
      UNIQUE KEY UK_product_name_money_create_time(product_name, money, create_time)
    ) COMMENT '收益中心'
  `)

    // 初始化disqualification表
    await conn.query(`
    CREATE TABLE IF NOT EXISTS disqualification (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
      title VARCHAR(255) COMMENT '标题',
      topic VARCHAR(255) COMMENT '投稿标签',
      play INT COMMENT '播放量',
      post_time DATETIME COMMENT '投稿时间',
      UNIQUE KEY UK_title_post_time(title, post_time)
    ) COMMENT '活动资格取消稿件'
  `)
  } catch (error) {
    dialog.showMessageBox(mainWindow, {
      title: '初始化数据库表',
      type: 'error',
      message: `初始化数据库表失败: ${error.message}`
    })
  } finally {
    conn.release()
  }
}

// 获取余额
const getBalance = async () => {
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
  return response.data?.data || null
}

// 获取稿件列表
const getManuscriptList = async (pn) => {
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
  return response.data?.data || null
}

// 获取收益列表
const getEarningsList = async (currentPage) => {
  const url = 'https://pay.bilibili.com/payplatform/cashier/bk/trans/list'
  const payload = {
    currentPage,
    pageSize: 20,
    sdkVersion: '1.1.7',
    traceId: Math.floor(Date.now() / 1000)
  }
  const headers = {
    Referer: 'https://pay.bilibili.com/pay-v2/shell/bill',
    Cookie: fs.readFileSync(cookieFilePath, 'utf8').replace(/,/g, '%2C'),
    'User-Agent': import.meta.env.VITE_USER_AGENT,
    'Content-Type': 'application/json'
  }
  const response = await axios.post(url, payload, {
    headers
  })

  return response.data?.data || null
}

// 获取动态列表数据
const getDynamicList = async (offset) => {
  const url = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space'
  const headers = {
    Referer: 'https://space.bilibili.com/506485454/dynamic',
    Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }
  const params = {
    offset,
    host_mid: '506485454'
  }
  const response = await axios.get(url, {
    headers,
    params
  })
  return response.data?.data || null
}

// 根据标题查找投稿标签
const getTopicByTitle = async (titleToFind) => {
  let offset

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 10000))
    const result = await getDynamicList(offset)
    if (!result) break
    const { items, offset: nextOffset } = result

    // 遍历动态列表
    for (const item of items) {
      const archive = item?.modules?.module_dynamic?.major?.archive || {}
      const topic = item?.modules?.module_dynamic?.topic?.name || ''
      const title = archive?.title || ''
      const pub_ts = item?.modules?.module_author?.pub_ts || 0
      const post_time = formatTimestampToDatetime(pub_ts)
      const play = archive?.stat?.play || 0

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

    offset = nextOffset
    if (!offset) break
  }

  return null
}

// 获取10天前的零点时间
const getTenDaysAgo = () => {
  const date = new Date()
  date.setDate(date.getDate() - 10)
  date.setHours(0, 0, 0, 0)
  return date
}

// 获取消息列表数据
const getMessageList = async (end_seqno) => {
  const url = 'https://api.vc.bilibili.com/svr_sync/v1/svr_sync/fetch_session_msgs'
  const headers = {
    Referer: 'https://text.bilibili.com/',
    Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }
  const params = {
    talker_id: 844424930131966,
    session_type: 1,
    size: 20,
    end_seqno
  }
  const response = await axios.get(url, {
    headers,
    params
  })
  return response.data?.data || null
}

// 导入Excel文件的处理函数
const importExcelHandler = async () => {
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
          title: '导入Excel表',
          type: 'info',
          message: '导入Excel表成功'
        })

        BrowserWindow.getFocusedWindow().webContents.send('save-excel-data', excelData)
      }
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '导入Excel表',
        type: 'error',
        message: `导入Excel表失败, ${error.message}`
      })
    }
  }
}

// 图片代理服务器
const startServer = () => {
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
        message: `开启图片代理服务器失败, ${error.message}`
      })
      res.status(500).send('代理错误')
    }
  })

  server = expressApp.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}/`)
  })
}

// 创建窗口
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    minWidth: 1200,
    height: 600,
    minHeight: 600,
    show: false,
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
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

// 请求单实例锁
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 如果没拿到锁，说明已有实例在运行，直接退出当前进程
  app.quit()
} else {
  // 如果拿到了锁，监听second-instance事件
  app.on('second-instance', () => {
    // 当用户再次尝试启动应用时，聚焦到已有窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(async () => {
  const result = await checkDatabaseConnection()
  // 如果连不上数据库，直接退出应用
  if (!result) return
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
    try {
      const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate'
      const response = await axios.get(url, {
        params: {
          source: 'main-fe-header'
        }
      })
      return response.data || null
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取登录二维码',
        type: 'error',
        message: `获取登录二维码失败, ${error.message}`
      })
      return null
    }
  })

  // 检查二维码状态
  ipcMain.handle('check-qrcode-status', async (e, qrcode_key) => {
    try {
      const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll'
      const response = await axios.get(url, {
        params: {
          qrcode_key,
          source: 'main-fe-header'
        }
      })
      return response.data
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '检查二维码状态',
        type: 'error',
        message: `检查二维码状态失败, ${error.message}`
      })
    }
  })

  // 保存cookie
  ipcMain.handle('save-cookie', async (e, cookie) => {
    await fs.promises.writeFile(cookieFilePath, cookie, 'utf8')
  })

  // 获取导航栏数据
  ipcMain.handle('get-navigation-data', async () => {
    try {
      const url = 'https://api.bilibili.com/x/web-interface/nav'
      const headers = {
        Referer: 'https://www.bilibili.com',
        Cookie: fs.readFileSync(cookieFilePath, 'utf8'),
        'User-Agent': import.meta.env.VITE_USER_AGENT
      }
      const response = await axios.get(url, {
        headers
      })
      return response.data?.data || null
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取导航栏数据',
        type: 'error',
        message: `获取导航栏数据失败, ${error.message}`
      })
      return null
    }
  })

  // 退出登录
  ipcMain.handle('logout', async () => {
    try {
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
      return response.data || null
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '退出登录',
        type: 'error',
        message: `退出登录失败, ${error.message}`
      })
      return null
    }
  })

  // 稿件管理
  ipcMain.handle('manuscript-management', async (e, pn) => {
    try {
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
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取稿件管理数据',
        type: 'error',
        message: `获取稿件管理数据失败, ${error.message}`
      })
      return null
    }
  })

  // 打卡挑战
  ipcMain.handle('check-in-challenge', async () => {
    try {
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
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取打卡挑战数据',
        type: 'error',
        message: `获取打卡挑战数据失败, ${error.message}`
      })
      return null
    }
  })

  // 热门活动
  ipcMain.handle('popular-events', async () => {
    try {
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
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取热门活动数据',
        type: 'error',
        message: `获取热门活动数据失败, ${error.message}`
      })
      return null
    }
  })

  // 收益中心
  ipcMain.on('earnings-center', async (event) => {
    const conn = await pool.getConnection()
    try {
      let currentPage = 1
      let totalPage = 1
      let totalMoney = 0
      const result = await getBalance()
      if (!result) {
        dialog.showMessageBox(mainWindow, {
          title: '获取余额',
          type: 'error',
          message: '获取余额失败'
        })
      }
      const { brokerage } = result

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const result2 = await getEarningsList(currentPage)
        if (!result2) {
          dialog.showMessageBox(mainWindow, {
            title: '获取收益列表数据',
            type: 'error',
            message: '获取收益列表数据失败'
          })
          break
        }

        const records = result2?.result || []
        totalPage = result2?.page?.totalPage || 1

        for (const item of records) {
          const { brokerage: money, title: productName, ctime: createTime } = item
          if (productName === '银行卡提现' || productName === '支付宝提现') continue
          totalMoney += money
          console.log(
            `发放时间 = ${createTime}, 发放金额 = ${money.toFixed(2).padEnd(6)}, 活动名称 = ${productName}`
          )

          const sql = `
            INSERT IGNORE INTO rewards (product_name, money, create_time)
            VALUES (?, ?, ?)
          `
          await conn.query(sql, [productName, money, createTime])

          event.sender.send('earnings-center-progress', {
            productName,
            money,
            createTime,
            totalMoney: totalMoney.toFixed(2),
            balance: brokerage.toFixed(2)
          })
        }

        if (currentPage >= totalPage) {
          event.sender.send('earnings-center-finish')
          dialog.showMessageBox(mainWindow, {
            title: '获取收益中心数据',
            type: 'info',
            message: '查询结束'
          })
          break
        }
        currentPage++
      }
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取收益中心数据',
        type: 'error',
        message: `获取收益中心数据失败, ${error.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 更新数据库
  ipcMain.on('update-database', async (event) => {
    const conn = await pool.getConnection()
    try {
      let page = 1

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const result = await getManuscriptList(page)
        if (!result) {
          dialog.showMessageBox(mainWindow, {
            title: '获取稿件列表数据',
            type: 'error',
            message: '获取稿件列表数据失败'
          })
          break
        }

        const { count, ps } = result?.page || {}
        const totalPage = Math.ceil(count / ps)
        const arc_audits = result?.arc_audits || []

        for (const item of arc_audits) {
          const archive = item?.Archive || {}
          const stat = item?.stat || {}
          const title = archive?.title
          const view = stat?.view || 0
          const pubTime = archive?.ptime
          const tag = archive?.tag
          const postTime = formatTimestampToDatetime(pubTime)

          console.log(
            `投稿时间 = ${postTime}, 播放量 = ${view.toString().padEnd(5)}, 标题 = ${title}, 投稿标签 = ${tag}`
          )

          const sql = `
            INSERT IGNORE INTO bilibili(title, view, post_time, tag)
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

        if (page >= totalPage) {
          event.sender.send('update-database-finish')
          dialog.showMessageBox(mainWindow, {
            title: '更新数据库',
            type: 'info',
            message: '更新数据库成功'
          })
          break
        }
        page++
      }
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '更新数据库',
        type: 'error',
        message: `更新数据库失败, ${error.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 活动资格取消稿件
  ipcMain.on('cancel-event-qualification', async (event) => {
    const conn = await pool.getConnection()
    try {
      let end_seqno
      let messageTime
      const tenDaysAgo = getTenDaysAgo()
      const text = '由于不符合本次征稿活动的规则，故无法参与本次活动的评选'

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const result = await getMessageList(end_seqno)
        if (!result) {
          dialog.showMessageBox(mainWindow, {
            title: '获取消息列表数据',
            type: 'error',
            message: '获取消息列表数据失败'
          })
          break
        }
        const { messages, has_more, min_seqno } = result

        for (const item of messages) {
          const { content, timestamp } = item
          if (!content.includes(text)) continue
          messageTime = new Date(timestamp * 1000)

          let titleStart = content.indexOf('《') + 1
          let titleEnd = content.indexOf('》')
          let title =
            titleStart > 0 && titleEnd > titleStart
              ? content.substring(titleStart, titleEnd)
              : '未知标题'

          const result2 = await getTopicByTitle(title)
          if (!result2) {
            dialog.showMessageBox(mainWindow, {
              title: '根据标题查找投稿标签',
              type: 'error',
              message: '根据标题查找投稿标签失败'
            })
          }
          const { topic, play } = result2

          const sql = `
            INSERT IGNORE INTO disqualification (title, topic, play, post_time)
            VALUES (?, ?, ?, ?)
          `
          const postTime = formatTimestampToDatetime(timestamp)
          await conn.query(sql, [title, topic, play, postTime])

          event.sender.send('cancel-event-qualification-progress', {
            title,
            topic,
            play,
            postTime
          })
        }

        if (!has_more || messageTime < tenDaysAgo) {
          event.sender.send('cancel-event-qualification-finish')
          dialog.showMessageBox(mainWindow, {
            title: '查询活动资格取消稿件',
            type: 'info',
            message: '查询结束'
          })
          break
        }

        end_seqno = min_seqno
      }
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '活动资格取消稿件',
        type: 'error',
        message: `查找活动资格取消稿件失败, ${error.message}`
      })
    } finally {
      conn.release()
    }
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
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '播放量<100的稿件',
        type: 'error',
        message: `获取播放量<100的稿件失败, ${error.message}`
      })
      return null
    } finally {
      conn.release()
    }
  })

  // 每年获得的激励金额
  ipcMain.handle('money-by-year', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT YEAR(create_time) AS year, SUM(money) AS totalMoney
        FROM rewards
        GROUP BY YEAR(create_time)
        ORDER BY year DESC
      `
      const [rows] = await conn.query(sql)
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '每年获得的激励金额',
        type: 'error',
        message: `获取每年获得的激励金额失败, ${error.message}`
      })
      return null
    } finally {
      conn.release()
    }
  })

  // 每月获得的激励金额
  ipcMain.handle('money-by-month', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT YEAR(create_time) AS year, MONTH(create_time) AS month, SUM(money) AS totalMoney
        FROM rewards
        GROUP BY YEAR(create_time), MONTH(create_time)
        ORDER BY year DESC, month DESC
      `
      const [rows] = await conn.query(sql)
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '每月获得的激励金额',
        type: 'error',
        message: `获取每月获得的激励金额失败, ${error.message}`
      })
      return null
    } finally {
      conn.release()
    }
  })

  // 根据标签查询激励金额
  ipcMain.handle('get-money-by-tag', async (e, product_name) => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT product_name AS productName, money, create_time AS createTime, SUM(money) OVER () AS totalMoney
        FROM rewards
        WHERE product_name LIKE ?
      `
      const [rows] = await conn.query(sql, [`%${product_name}%`])
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '根据标签查询激励金额',
        type: 'error',
        message: `根据标签查询激励金额失败, ${error.message}`
      })
      return null
    } finally {
      conn.release()
    }
  })

  // 根据投稿标签查询稿件
  ipcMain.handle('get-manuscript-by-tag', async (e, tag) => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT title, view, post_time AS postTime, tag
        FROM bilibili
        WHERE tag LIKE ?
      `
      const [rows] = await conn.query(sql, [`%${tag}%`])
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '根据投稿标签查询稿件',
        type: 'error',
        message: `根据投稿标签查询稿件失败, ${error.message}`
      })
      return null
    } finally {
      conn.release()
    }
  })

  // 根据标签查询取消稿件
  ipcMain.handle('get-disqualification-by-tag', async (e, tag) => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT title, topic, play, post_time AS postTime
        FROM disqualification
        WHERE topic LIKE ?
      `
      const [rows] = await conn.query(sql, [`%${tag}%`])
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '根据标签查询取消稿件',
        type: 'error',
        message: `根据标签查询取消稿件失败, ${error.message}`
      })
      return null
    } finally {
      conn.release()
    }
  })

  // 获取bilibili表中的数据
  ipcMain.handle('get-bilibili-data', async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM bilibili ORDER BY post_time DESC')
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取bilibili表中的数据',
        type: 'error',
        message: `获取bilibili表中的数据失败, ${error.message}`
      })
      return null
    }
  })

  // 获取rewards表中的数据
  ipcMain.handle('get-rewards-data', async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM rewards ORDER BY create_time DESC')
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取rewards表中的数据',
        type: 'error',
        message: `获取rewards表中的数据失败, ${error.message}`
      })
      return null
    }
  })

  // 获取disqualification表中的数据
  ipcMain.handle('get-disqualification-data', async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM disqualification ORDER BY post_time DESC')
      return rows
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        title: '获取disqualification表中的数据',
        type: 'error',
        message: `获取disqualification表中的数据失败, ${error.message}`
      })
      return null
    }
  })

  await initTable()
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    server.close()
  }
})
