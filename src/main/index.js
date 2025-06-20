import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import xlsx from 'xlsx'
import axios from 'axios'
import express from 'express'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

let server
let mainWindow

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

  // 获取稿件管理数据
  ipcMain.handle('fetch-bilibili-data', async (e, pn) => {
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

  // 提示信息
  ipcMain.handle('show-message', (e, params) => {
    dialog.showMessageBox(mainWindow, {
      ...params
    })
  })

  // 获取打卡挑战数据
  ipcMain.handle('fetch-bilibili-activities', async () => {
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
        message: `请求失败, ${error.message}`
      })
      console.error('请求失败:', error.message)
      return []
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
        message: '导入Excel文件失败'
      })
      console.error('导入Excel文件失败: ', error)
    }
  }
}

// 开启图片代理服务器
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
        message: '代理错误'
      })
      console.error('代理错误:', error.message)
      res.status(500).send('代理错误')
    }
  })

  server = expressApp.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}/`)
  })
}
