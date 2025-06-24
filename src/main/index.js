import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import xlsx from 'xlsx'
import axios from 'axios'
import express from 'express'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

// 加载环境变量
dotenv.config()

let server
let mainWindow

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
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100),
        money DECIMAL(10,2),
        create_time DATETIME
      ) COMMENT '活动奖励'
    `)
  } finally {
    conn.release()
  }
}

// 获取余额
async function getBalance(headers) {
  const URL_WALLET = 'https://pay.bilibili.com/payplatform/getUserWalletInfo'
  try {
    const res = await axios.get(URL_WALLET, { headers })
    return res.data.data.accountInfo.brokerage
  } catch (error) {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      message: `获取余额失败：, ${error.message}`
    })
    console.error('获取余额失败：', error.message)
    return 0
  }
}

// 初始化 bilibili 表
async function initBilibili(conn) {
  await conn.query('DROP TABLE IF EXISTS bilibili')
  await conn.query(`
    CREATE TABLE IF NOT EXISTS bilibili (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      view INT,
      post_time DATETIME,
      tag VARCHAR(255)
    ) COMMENT 'bilibili投稿数据'
  `)
}

// 获取 bilibili 数据
async function fetchBilibiliData(pageNumber) {
  const URL_BILIBILI_ARCHIVES = 'https://member.bilibili.com/x/web/archives'

  const headers = {
    Referer: 'https://member.bilibili.com/platform/upload-manager/article',
    Cookie: import.meta.env.VITE_COOKIE,
    'User-Agent': import.meta.env.VITE_USER_AGENT
  }

  try {
    const res = await axios.get(URL_BILIBILI_ARCHIVES, {
      params: {
        pn: pageNumber,
        ps: 10
      },
      headers
    })

    return res.data?.data || null
  } catch (e) {
    console.error(`获取第 ${pageNumber} 页失败`, e.message)
    return null
  }
}

async function parseAndSave(data, conn) {
  const records = []

  for (const item of data.arc_audits || []) {
    const archive = item.Archive || {}
    const stat = item.stat || {}

    const title = archive.title
    const view = stat.view || 0
    const pubTime = archive.ptime
    const tag = archive.tag

    const postTime = new Date(pubTime * 1000).toISOString().slice(0, 19).replace('T', ' ')

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
      headers,
      timeout: 5000
    })
    return response.data?.data?.arc_audits || []
  })

  // 获取打卡挑战数据
  ipcMain.handle('check-in-challenge', async () => {
    try {
      const response = await axios.get(
        'https://member.bilibili.com/x2/creative/h5/clock/v4/activity/list',
        {
          headers: {
            Referer: 'https://member.bilibili.com/york/platform-punch-card/personal',
            Cookie: import.meta.env.VITE_COOKIE,
            'User-Agent': import.meta.env.VITE_USER_AGENT
          }
        }
      )
      return response.data?.data?.list || []
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        message: `请求失败：, ${error.message}`
      })
      console.error('请求失败：', error.message)
      return []
    }
  })

  // 获取热门活动数据
  ipcMain.handle('popular-events', async () => {
    const headers = {
      Referer: 'https://member.bilibili.com/platform/releasecenter',
      Cookie: import.meta.env.VITE_COOKIE,
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }

    const url = 'https://member.bilibili.com/x/web/activity/videoall'

    try {
      const response = await axios.get(url, { headers })
      return response.data?.data || []
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        message: `请求失败：, ${error.message}`
      })
      console.error('请求失败：', error.message)
      return []
    }
  })

  // 获取收益中心数据并保存到数据库
  ipcMain.handle('earnings-center', async () => {
    await initRewards()

    const headers = {
      Referer: 'https://pay.bilibili.com/pay-v2/shell/bill',
      Cookie: import.meta.env.VITE_COOKIE,
      'User-Agent': import.meta.env.VITE_USER_AGENT
    }

    let currentPage = 1
    let totalPages = 1
    let totalMoney = 0

    const balance = await getBalance(headers)

    while (currentPage <= totalPages) {
      await new Promise((r) => setTimeout(r, 1000))

      const URL_RECORDS = 'https://pay.bilibili.com/bk/brokerage/v2/listForRechargeRecord'
      const payload = {
        currentPage,
        pageSize: 15,
        sdkVersion: '1.1.7',
        timestamp: Math.floor(Date.now() / 1000),
        traceId: Math.floor(Date.now() / 1000)
      }

      try {
        const response = await axios.post(URL_RECORDS, payload, { headers })
        const data = response.data?.data || {}
        const records = data.result || []
        totalPages = data.page?.totalPage || 1

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
      } catch (error) {
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          message: `请求失败：, ${error.message}`
        })
        console.error(`请求失败：`, error.message)
        break
      }
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
        await new Promise((r) => setTimeout(r, 1000))
        const data = await fetchBilibiliData(page)
        if (!data) break

        const { count, ps } = data.page || {}
        const totalPages = Math.ceil(count / ps)

        await parseAndSave(data, conn)
        await conn.commit()

        if (page >= totalPages) break
        page++
      }

      const [rows] = await pool.query('SELECT * FROM bilibili ORDER BY post_time DESC')
      return rows
    } finally {
      conn.release()
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
          type: 'info',
          message: '导入成功'
        })

        BrowserWindow.getFocusedWindow().webContents.send('save-excel-data', excelData)
      }
    } catch (error) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        message: `导入Excel文件失败：, ${error.message}`
      })
      console.error(`导入Excel文件失败：`, error.message)
    }
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
      console.error('代理错误：', error.message)
      res.status(500).send('代理错误')
    }
  })

  server = expressApp.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}/`)
  })
}
