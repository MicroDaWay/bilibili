import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import axios from 'axios'
import { spawn } from 'child_process'
import { format } from 'date-fns'
import { app, BrowserWindow, dialog } from 'electron'
import ExcelJS from 'exceljs'
import { request } from 'undici'
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

// 单文件TS转MP4
const ffmpegRemux = (inputPath, outputPath, onProgress) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      inputPath,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-bsf:a',
      'aac_adtstoasc',
      '-movflags',
      '+faststart',
      outputPath
    ]
    const proc = spawn(getFFmpegPath(), args, { windowsHide: true })
    let stderrOutput = ''
    proc.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString()
    })
    let totalInputBytes = 0
    totalInputBytes = fs.statSync(inputPath).size
    const timer = setInterval(() => {
      if (fs.existsSync(outputPath) && totalInputBytes > 0) {
        const pct = Math.min(Math.round((fs.statSync(outputPath).size / totalInputBytes) * 5), 5)
        onProgress?.({ type: 'merge', percent: 95 + pct })
      }
    }, 300)
    proc.on('close', (code) => {
      clearInterval(timer)
      if (code === 0) resolve()
      else {
        const tail = stderrOutput.split('\n').filter(Boolean).slice(-3).join('\n')
        reject(new Error(`FFmpeg转换失败, exit code: ${code}\n${tail}`))
      }
    })
    proc.on('error', (err) => {
      clearInterval(timer)
      reject(err)
    })
  })
}

// 多文件合并
const ffmpegConcat = (listFile, outputPath, tsPaths, onProgress) => {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listFile,
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-bsf:a',
      'aac_adtstoasc',
      '-movflags',
      '+faststart',
      outputPath
    ]
    const proc = spawn(getFFmpegPath(), args, { windowsHide: true })
    let stderrOutput = ''
    proc.stderr.on('data', (chunk) => {
      stderrOutput += chunk.toString()
    })
    let totalInputBytes = 0
    for (const p of tsPaths) {
      totalInputBytes += fs.statSync(p).size
    }
    const timer = setInterval(() => {
      if (fs.existsSync(outputPath) && totalInputBytes > 0) {
        const pct = Math.min(Math.round((fs.statSync(outputPath).size / totalInputBytes) * 9), 9)
        onProgress?.({ type: 'merge', percent: 91 + pct })
      }
    }, 300)
    proc.on('close', (code) => {
      clearInterval(timer)
      if (code === 0) resolve()
      else {
        const tail = stderrOutput.split('\n').filter(Boolean).slice(-3).join('\n')
        reject(new Error(`FFmpeg合并失败, exit code: ${code}\n${tail}`))
      }
    })
    proc.on('error', (err) => {
      clearInterval(timer)
      reject(err)
    })
  })
}

const undiciFetch = async (url, retries = 3) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { statusCode, body } = await request(url, {
        headersTimeout: 15000,
        bodyTimeout: 30000
      })
      if (statusCode !== 200) {
        await body.dump()
        throw new Error(`HTTP ${statusCode}`)
      }
      const ab = await body.arrayBuffer()
      return Buffer.from(ab, 0, ab.byteLength)
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(500 * (attempt + 1))
    }
  }
}

// 下载m3u8并转换为mp4
export const downloadM3u8BySegments = async (m3u8Url, outputPath, onProgress) => {
  let finalUrl = m3u8Url
  let content = ''

  const masterRes = await axios.get(m3u8Url, { responseType: 'text', timeout: 15000 })
  if (masterRes.data.includes('#EXT-X-STREAM-INF')) {
    const lines = masterRes.data.split('\n')
    let bestUrl = ''
    let maxBw = 0
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
        const bwMatch = lines[i].match(/BANDWIDTH=(\d+)/)
        const bw = bwMatch ? +bwMatch[1] : 0
        if (bw >= maxBw) {
          maxBw = bw
          bestUrl = lines[i + 1]?.trim() || ''
        }
      }
    }
    if (!bestUrl) throw new Error('无法解析 master playlist')
    if (!bestUrl.startsWith('http')) {
      bestUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1) + bestUrl
    }
    finalUrl = bestUrl
    const mediaRes = await axios.get(finalUrl, { responseType: 'text', timeout: 15000 })
    content = mediaRes.data
  } else {
    content = masterRes.data
  }

  const baseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1)
  const allLines = content.split('\n')

  // 解析 AES-128 加密信息
  let keyInfo = null
  for (const line of allLines) {
    if (line.startsWith('#EXT-X-KEY')) {
      const methodMatch = line.match(/METHOD=([^,\s]+)/)
      const uriMatch = line.match(/URI="([^"]+)"/)
      const ivMatch = line.match(/IV=0x([0-9a-fA-F]+)/)
      if (methodMatch?.[1] === 'AES-128' && uriMatch) {
        let keyUrl = uriMatch[1]
        if (!keyUrl.startsWith('http')) keyUrl = baseUrl + keyUrl
        console.log('检测到 AES-128 加密, 正在下载密钥:', keyUrl)
        // 密钥也用 undici 下载
        const keyBuf = await undiciFetch(keyUrl)
        if (keyBuf.length !== 16) throw new Error(`AES 密钥长度异常: ${keyBuf.length} bytes`)
        const iv = ivMatch ? Buffer.from(ivMatch[1], 'hex') : null
        keyInfo = { key: keyBuf, iv, hasExplicitIv: !!ivMatch }
        console.log('密钥下载成功, IV:', iv ? iv.toString('hex') : '(按序号生成)')
      }
      break
    }
  }

  // 解析分片列表
  const segments = []
  for (const line of allLines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      segments.push(trimmed.startsWith('http') ? trimmed : baseUrl + trimmed)
    }
  }
  if (segments.length === 0) throw new Error('未找到任何TS分片')

  // undici 高速并发下载 + 解密
  const CONCURRENCY = 32
  let downloadedCount = 0
  const totalSegments = segments.length
  const buffers = new Array(totalSegments)

  const ivBuffers =
    keyInfo && !keyInfo.hasExplicitIv
      ? segments.map((_, i) => {
          const buf = Buffer.allocUnsafe(16)
          buf.fill(0)
          buf.writeUInt32BE(i, 12)
          return buf
        })
      : null

  const downloadSegment = async (url, index) => {
    let data = await undiciFetch(url)

    // AES-128-CBC 解密
    if (keyInfo) {
      const iv = keyInfo.hasExplicitIv ? keyInfo.iv : ivBuffers[index]
      const decipher = crypto.createDecipheriv('aes-128-cbc', keyInfo.key, iv)
      data = Buffer.concat([decipher.update(data), decipher.final()])
    }

    buffers[index] = data
  }

  let nextIndex = 0
  const workers = Array.from({ length: Math.min(CONCURRENCY, totalSegments) }, async () => {
    while (true) {
      const idx = nextIndex++
      if (idx >= totalSegments) break
      await downloadSegment(segments[idx], idx)
      downloadedCount++
      onProgress?.({
        type: 'download',
        downloadedSegments: downloadedCount,
        totalSegments,
        percent: Math.round((downloadedCount / totalSegments) * 90)
      })
    }
  })

  await Promise.all(workers)

  // 检测格式
  const firstBytes = buffers[0].subarray(0, 12)
  const isMpegTs = firstBytes[0] === 0x47
  const isFmp4 = firstBytes.subarray(4, 8).toString('ascii') === 'ftyp'
  console.log(
    `解密后格式检测: MPEG-TS=${isMpegTs}, fMP4=${isFmp4}, 前12字节hex=${firstBytes.toString('hex')}`
  )

  // 合并
  if (isMpegTs) {
    onProgress?.({ type: 'merge', percent: 91 })
    const mergedBuffer = Buffer.concat(buffers)
    // 释放内存
    buffers.length = 0
    const mergedTsPath = outputPath + '.tmp.ts'
    await fs.promises.writeFile(mergedTsPath, mergedBuffer)
    onProgress?.({ type: 'merge', percent: 95 })
    await ffmpegRemux(mergedTsPath, outputPath, onProgress)
    fs.unlinkSync(mergedTsPath)
  } else {
    onProgress?.({ type: 'merge', percent: 91 })
    const tmpDir = path.join(path.dirname(outputPath), 'download_m3u8_' + Date.now())
    fs.mkdirSync(tmpDir, { recursive: true })
    const tsPaths = buffers.map((buf, i) => {
      const p = path.join(tmpDir, String(i).padStart(5, '0') + '.ts')
      fs.writeFileSync(p, buf)
      return p
    })
    buffers.length = 0
    const listFile = path.join(tmpDir, 'concat.txt')
    fs.writeFileSync(
      listFile,
      tsPaths.map((f) => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
    )
    await ffmpegConcat(listFile, outputPath, tsPaths, onProgress)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  onProgress?.({ type: 'done', percent: 100 })
  return outputPath
}
