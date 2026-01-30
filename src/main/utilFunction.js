import fs from 'node:fs'
import path from 'node:path'

import { spawn } from 'child_process'
import { app, BrowserWindow, dialog } from 'electron'
import xlsx from 'xlsx'

import { formatTimestampToDatetime } from '../renderer/src/utils/index'
import { getManuscriptList } from './api'

// 根据标题查询投稿标签
export const getTagByTitle = async (targetTitle) => {
  let pn = 1
  let totalPage = 1

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 10000))
    const result = await getManuscriptList(pn)
    if (!result) break
    const { arc_audits, page } = result
    const count = page?.count || 0
    const ps = page?.ps || 10
    totalPage = Math.ceil(count / ps)

    for (const item of arc_audits) {
      const title = item?.Archive?.title || ''
      const tag = item?.Archive?.tag || ''
      const ptime = item?.Archive?.ptime || 0
      const view = item?.stat?.view || 0

      console.log(title)

      if (title === targetTitle) {
        console.log(
          `投稿时间 = ${formatTimestampToDatetime(ptime)}, 标题 = ${title}, 播放量 = ${view}, 投稿标签 = ${tag}`
        )
        return {
          tag,
          view
        }
      }
    }

    if (pn >= totalPage) break
    pn++
  }

  return null
}

// 根据标题查询投稿标签和播放量
export const getTagAndViewByTitle = async (conn, title) => {
  const sql = `
    SELECT tag, view
    FROM manuscript
    WHERE title = ?
    LIMIT 1
  `
  const [rows] = await conn.query(sql, [title])
  if (rows.length === 0) return null
  return {
    tag: rows[0].tag || '',
    view: rows[0].view || 0
  }
}

// 导入Excel文件的处理函数
export const importExcelHandler = async (mainWindow, ipcHandler) => {
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
        await dialog.showMessageBox(mainWindow, {
          title: '导入Excel表',
          type: 'info',
          message: '导入Excel表成功'
        })

        BrowserWindow.getFocusedWindow().webContents.send(ipcHandler, excelData)
      }
    } catch (err) {
      await dialog.showMessageBox(mainWindow, {
        title: '导入Excel表',
        type: 'error',
        message: `导入Excel表失败, ${err.message}`
      })
    }
  }
}

// 解析房间号
export const parseRoomId = (url) => {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('bilibili.com')) return null
    const match = u.pathname.match(/\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// 扫描BilibiliRecorder目录下的ts文件并转换为mp4
export const scanAndConvertTs = (dir) => {
  if (!fs.existsSync(dir)) return
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))

  for (const file of files) {
    const ts = path.join(dir, file)
    const mp4 = ts.replace(/\.ts$/, '.mp4')

    if (fs.existsSync(mp4)) continue

    console.log('[recover] converting:', ts)

    const p = spawn(getFFmpegPath(), ['-y', '-i', ts, '-c', 'copy', '-movflags', '+faststart', mp4])

    p.on('close', (code) => {
      if (code === 0) {
        console.log('[recover] done:', mp4)
      } else {
        console.error('[recover] failed:', ts)
      }
    })
  }
}

export const getFFmpegPath = () => {
  if (!app.isPackaged) {
    // 开发环境
    return require('ffmpeg-static')
  }

  // 打包后: 指向asar.unpacked
  return path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    'ffmpeg-static',
    'ffmpeg.exe'
  )
}
