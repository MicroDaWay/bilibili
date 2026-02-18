import fs from 'node:fs'
import path from 'node:path'

import { spawn } from 'child_process'
import { app, BrowserWindow, dialog } from 'electron'
import xlsx from 'xlsx'

import { formatTimestampToDatetime, sleep } from '../renderer/src/utils/index'
import { getManuscriptList } from './api'

// 根据标题查询投稿标签
export const getTagByTitle = async (targetTitle) => {
  let pn = 1
  let totalPage = 1

  while (true) {
    await sleep(10)
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
        dialog.showMessageBox(mainWindow, {
          title: '导入Excel表',
          type: 'info',
          message: '导入Excel表成功'
        })

        BrowserWindow.getFocusedWindow().webContents.send(ipcHandler, excelData)
      }
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '导入Excel表',
        type: 'error',
        message: `导入Excel表失败, ${err.message}`
      })
    }
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
    console.log(`恢复转换中: ${ts}`)
    const p = spawn(getFFmpegPath(), ['-y', '-i', ts, '-c', 'copy', '-movflags', '+faststart', mp4])

    p.on('close', (code) => {
      if (code === 0) {
        console.log(`恢复成功: ${mp4}`)
      } else {
        console.log(`恢复失败, ${ts}`)
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

// 根据文件名中的part数字进行排序
export const sortByPart = (files) => {
  return files.sort((a, b) => {
    const pa = Number(a.match(/part(\d+)/)?.[1] || 0)
    const pb = Number(b.match(/part(\d+)/)?.[1] || 0)
    return pa - pb
  })
}

// 合并MP4文件
export const mergeMp4 = async (files) => {
  const upName = files[0].split('\\').at(-1).split('_')[0]
  const sorted = sortByPart(files)
  const dir = path.dirname(sorted[0])
  const listFile = path.join(dir, 'concat.txt')
  const content = sorted.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n')
  fs.writeFileSync(listFile, content)
  const outputDir = path.join(app.getPath('videos'), 'BilibiliRecorder')
  const outputPath = path.join(outputDir, `${upName}_merge.mp4`)

  return new Promise((resolve, reject) => {
    const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outputPath]
    const p = spawn(getFFmpegPath(), args, { windowsHide: true })

    p.on('close', (code) => {
      fs.unlinkSync(listFile)
      if (code === 0) resolve(outputPath)
      else reject(new Error('合并失败'))
    })
  })
}
