import fs from 'node:fs'
import path from 'node:path'

import { spawn } from 'child_process'
import { format } from 'date-fns'
import { app, BrowserWindow, dialog } from 'electron'
import ExcelJS from 'exceljs'
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
    ],
    defaultPath: app.getPath('desktop')
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

        BrowserWindow.getFocusedWindow().webContents.send(ipcHandler, {
          excelData,
          excelPath: filePath
        })
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

// 将播放量投稿量和查询时间写回Excel文件
export const writeBackToExcel = async (filePath, postTag, totalPlay, totalCount, queryTime) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Excel文件不存在或未导入')
  }

  const workbook = new ExcelJS.Workbook()
  // 完整读取含样式
  await workbook.xlsx.readFile(filePath)

  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('工作表为空')

  // 定位表头列索引
  const headerRow = worksheet.getRow(1)
  let tagCol = null,
    playCol = null,
    countCol = null,
    timeCol = null
  const existingHeaders = []

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const val = String(cell.value ?? '').trim()
    existingHeaders.push(val)
    if (val === '投稿标签') tagCol = colNumber
    else if (val === '播放量') playCol = colNumber
    else if (val === '投稿量') countCol = colNumber
    else if (val === '查询时间') timeCol = colNumber
  })

  if (tagCol === null) throw new Error('未找到"投稿标签"列')

  // 动态添加缺失的列
  const ensureColumn = (colName, refCol) => {
    if (refCol !== null) return refCol
    const newCol = existingHeaders.length + 1
    const headerCell = headerRow.getCell(newCol)
    headerCell.value = colName
    // 复制参考列的表头样式
    if (refCol === null && existingHeaders.length > 0) {
      const refCell = headerRow.getCell(existingHeaders.length)
      if (refCell.font) headerCell.font = refCell.font
      if (refCell.fill) headerCell.fill = refCell.fill
      if (refCell.border) headerCell.border = refCell.border
      if (refCell.alignment) headerCell.alignment = refCell.alignment
    }
    existingHeaders.push(colName)
    return newCol
  }

  playCol = ensureColumn('播放量', playCol)
  countCol = ensureColumn('投稿量', countCol)
  timeCol = ensureColumn('查询时间', timeCol)

  // 遍历数据行, 只改目标单元格(其他单元格样式完全不动)
  let matched = false

  const rowCount = worksheet.rowCount

  for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    const tagValue = String(row.getCell(tagCol).value ?? '')

    if (tagValue.includes(postTag)) {
      row.getCell(playCol).value = totalPlay
      row.getCell(countCol).value = totalCount
      row.getCell(timeCol).value = queryTime
      matched = true
      break
    }
  }

  if (!matched) throw new Error(`未找到投稿标签 "${postTag}" 对应的行`)

  // 写回原文件
  await workbook.xlsx.writeFile(filePath)
  return true
}

// 扫描BilibiliRecord目录下的ts文件并转换为mp4
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
export const mergeMp4 = async (files, onProgress) => {
  const upName = files[0].split('\\').at(-1).split('_')[0]
  const sorted = sortByPart(files)
  const dir = path.dirname(sorted[0])
  const listFile = path.join(dir, 'concat.txt')

  let totalInputBytes = 0
  for (const f of sorted) {
    totalInputBytes += fs.statSync(f).size
  }

  const content = sorted.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n')
  fs.writeFileSync(listFile, content)

  const outputDir = path.join(app.getPath('videos'), 'BilibiliRecord')
  const dateString = format(new Date(), 'yyyyMMdd')
  const outputPath = path.join(outputDir, `${upName}_${dateString}.mp4`)

  return new Promise((resolve, reject) => {
    const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outputPath]
    const p = spawn(getFFmpegPath(), args, { windowsHide: true })

    let lastPercent = 0
    const progressTimer = setInterval(() => {
      if (fs.existsSync(outputPath)) {
        const currentSize = fs.statSync(outputPath).size
        const percent = Math.min(Math.round((currentSize / totalInputBytes) * 100), 99)
        if (percent > lastPercent) {
          lastPercent = percent
          onProgress?.(percent)
        }
      }
    }, 300)

    p.on('close', (code) => {
      clearInterval(progressTimer)
      fs.unlinkSync(listFile)
      if (code === 0) {
        onProgress?.(100)
        resolve(outputPath)
      } else {
        reject(new Error(`合并失败, exit code: ${code}`))
      }
    })

    p.on('error', (err) => {
      clearInterval(progressTimer)
      fs.unlinkSync(listFile)
      reject(err)
    })
  })
}
