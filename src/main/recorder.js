import { spawn } from 'child_process'
import { format } from 'date-fns'
import fs from 'fs'
import path from 'path'

import { getFFmpegPath } from './utilFunction'

export class LiveRecorder {
  constructor() {
    this.process = null
    this.tsFile = ''
  }

  start(m3u8Url, outputDir, username) {
    if (this.process) return this.tsFile

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const ffmpegPath = getFFmpegPath()
    const baseName = `${username}_${format(Date.now(), 'yyyy_MM_dd_HH_mm_ss')}`
    this.tsFile = path.join(outputDir, baseName + '.ts')
    this.mp4File = path.join(outputDir, baseName + '.mp4')

    const args = [
      '-y',
      '-loglevel',
      'warning',
      '-stats',

      // 断流重连
      '-reconnect',
      '1',
      '-reconnect_streamed',
      '1',
      '-reconnect_delay_max',
      '5',

      '-fflags',
      '+genpts',
      '-i',
      m3u8Url,

      '-c',
      'copy',
      '-f',
      'mpegts',
      this.tsFile
    ]

    this.process = spawn(ffmpegPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })

    this.process.stderr.on('data', (data) => {
      console.log('[ffmpeg]', data.toString())
    })

    this.process.on('close', (code) => {
      console.log('录制结束, code =', code)
      this.process = null
    })

    return this.tsFile
  }

  convertToMp4() {
    return new Promise((resolve, reject) => {
      if (!this.tsFile || !fs.existsSync(this.tsFile)) {
        return reject(new Error('ts文件不存在'))
      }

      const args = ['-y', '-i', this.tsFile, '-c', 'copy', '-movflags', '+faststart', this.mp4File]
      const ffmpegPath = getFFmpegPath()
      const p = spawn(ffmpegPath, args)

      p.on('close', (code) => {
        if (code === 0) {
          resolve(this.mp4File)
        } else {
          reject(new Error('ts转mp4失败'))
        }
      })
    })
  }

  async stop() {
    if (!this.process) return

    await new Promise((resolve) => {
      this.process.once('close', resolve)
      this.process.stdin.write('q')
      this.process.stdin.end()
    })

    try {
      const mp4 = await this.convertToMp4()
      console.log('转封装完成:', mp4)
    } catch (error) {
      console.error(error)
    }
  }

  isRecording() {
    return !!this.process
  }
}
