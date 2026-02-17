import path, { join } from 'node:path'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, clipboard, globalShortcut, Menu, shell } from 'electron'

import { checkDatabaseConnection, initTable, pool } from './db.js'
import { registerIpcHandler } from './ipcHandler.js'
import { LiveRecorder } from './recorder.js'
import { startServer } from './server.js'
import { importExcelHandler, scanAndConvertTs } from './utilFunction.js'

let server
let mainWindow
let isQuit = false
const recorder = new LiveRecorder()

async function gracefulQuit() {
  if (isQuit) return
  isQuit = true

  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('app-exit')
  }

  try {
    if (recorder.isRecording()) {
      await recorder.stop()
    }

    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve))
    }

    await pool.end()
  } catch (err) {
    console.log(`退出时发生错误, ${err.message}`)
  }

  app.quit()
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
      sandbox: false,
      contextIsolation: true,
      devTools: is.dev
    }
  })

  // 开发者调试工具, 只在开发环境才能调用
  if (is.dev) {
    globalShortcut.register('F11', () => {
      mainWindow.webContents.toggleDevTools()
    })
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.on('close', (e) => {
    if (!isQuit) {
      e.preventDefault()
      gracefulQuit()
    }
  })

  // 右键菜单
  mainWindow.webContents.on('context-menu', (e, params) => {
    const { linkURL, srcURL, selectionText } = params
    const template = []

    // 如果是链接
    if (linkURL) {
      template.push(
        {
          label: '复制链接地址'.padEnd(20),
          click: () => clipboard.writeText(linkURL)
        },
        { type: 'separator' }
      )
    }

    // 如果是图片
    if (srcURL) {
      const realImageURL = decodeURIComponent(new URL(srcURL).searchParams.get('url'))
      template.push(
        {
          label: '复制图片地址'.padEnd(20),
          click: () => clipboard.writeText(realImageURL)
        },
        {
          label: '在浏览器中打开图片'.padEnd(20),
          click: () => shell.openExternal(realImageURL)
        },
        { type: 'separator' }
      )
    }

    // 如果有选中文本
    if (selectionText) {
      template.push(
        { label: '复制'.padEnd(20), role: 'copy', accelerator: 'Ctrl + C' },
        { type: 'separator' }
      )
    }

    // 通用菜单
    template.push(
      { label: '粘贴'.padEnd(20), role: 'paste', accelerator: 'Ctrl + V' },
      { label: '全选'.padEnd(20), role: 'selectAll', accelerator: 'Ctrl + A' }
    )

    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: mainWindow })
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
  // 如果没拿到锁, 说明已有实例在运行, 直接退出当前进程
  app.quit()
} else {
  // 如果拿到了锁, 监听second-instance事件
  app.on('second-instance', () => {
    // 当用户再次尝试启动应用时, 聚焦到已有窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.whenReady().then(async () => {
  const recordDir = path.join(app.getPath('videos'), 'BilibiliRecorder')
  // 启动兜底恢复
  scanAndConvertTs(recordDir)

  createWindow()

  // 检查数据库连接
  const result = await checkDatabaseConnection(mainWindow)
  // 如果连不上数据库, 直接退出应用
  if (!result) return

  // 初始化数据库表
  await initTable(mainWindow)

  // 开启图片代理服务器
  startServer(server, mainWindow)

  registerIpcHandler(pool, mainWindow, recorder)

  // 菜单栏
  const myMenu = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入salary.xlsx',
          click() {
            importExcelHandler(mainWindow, 'save-salary-data')
          }
        },
        {
          label: '导入bilibili.xlsx',
          click() {
            importExcelHandler(mainWindow, 'save-bilibili-data')
          }
        },
        {
          label: '导入outcome.xlsx',
          click() {
            importExcelHandler(mainWindow, 'save-outcome-data')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(myMenu)
  Menu.setApplicationMenu(menu)
  electronApp.setAppUserModelId('com.microdaway.bilibili')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', (e) => {
    if (!isQuit) {
      e.preventDefault()
      gracefulQuit()
    }
  })
})
