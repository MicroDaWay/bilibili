import { spawn } from 'child_process'
import { format } from 'date-fns'
import fs from 'fs'
import path from 'path'

import { getM3U8 } from './api'
import { getFFmpegPath } from './utilFunction'

export class LiveRecorder {
  constructor() {
    this.process = null
    this.roomId = null
    this.outputDir = ''
    this.username = ''
    this.tsFiles = []
    this.currentTs = ''
    this.mp4File = ''
    this.restarting = false
    this.stopping = false
    this.part = 0
  }

  // 开始录制
  start(m3u8Url, outputDir, username, roomId) {
    if (this.process) return this.currentTs

    this.roomId = roomId
    this.outputDir = outputDir
    this.username = username

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const base = `${username}_${format(Date.now(), 'yyyy_MM_dd_HH_mm_ss')}`

    this.mp4File = path.join(outputDir, base + '.mp4')
    this.startFFmpeg(m3u8Url)

    return this.currentTs
  }

  // 启动ffmpeg(单段)
  startFFmpeg(m3u8Url) {
    const ffmpegPath = getFFmpegPath()

    this.part++
    this.currentTs = path.join(this.outputDir, `${this.username}_part${this.part}.ts`)

    this.tsFiles.push(this.currentTs)

    const args = [
      '-y',
      '-loglevel',
      'warning',
      '-stats',

      // 自动重连
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
      this.currentTs
    ]

    this.process = spawn(ffmpegPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })

    this.process.stderr.on('data', (data) => {
      const msg = data.toString()
      console.log('[ffmpeg]', msg)

      if (
        !this.stopping &&
        !this.restarting &&
        (msg.includes('403 Forbidden') || msg.includes('Failed to reload playlist'))
      ) {
        this.restarting = true
        console.log('[recorder] m3u8过期, 准备续录')
        setTimeout(() => this.restart(), 0)
      }
    })

    this.process.on('close', (code) => {
      console.log('[ffmpeg] exited:', code)
      this.process = null
    })
  }

  // 续录
  async restart() {
    if (this.stopping) {
      this.restarting = false
      return
    }

    if (this.process) {
      this.process.kill('SIGKILL')
      this.process = null
    }

    await new Promise((r) => setTimeout(r, 1500))

    let newM3u8
    try {
      newM3u8 = await getM3U8(this.roomId, 10000)
    } catch (error) {
      console.error('[recorder] 获取m3u8失败, 5秒后重试', error)
      this.restarting = false
      setTimeout(() => this.restart(), 5000)
      return
    }

    this.restarting = false
    this.startFFmpeg(newM3u8)
  }

  // 停止录制
  async stop() {
    if (!this.process) return

    this.stopping = true

    await new Promise((resolve) => {
      this.process.once('close', resolve)
      this.process.stdin.write('q')
      this.process.stdin.end()
    })

    this.process = null
    this.restarting = false

    try {
      const mp4 = await this.mergeTsToMp4()
      console.log('[recorder] 转封装完成:', mp4)
    } catch (e) {
      console.error('[recorder] 转封装失败', e)
    }

    this.stopping = false
  }

  // ts合并为mp4(无损)
  mergeTsToMp4() {
    return new Promise((resolve, reject) => {
      if (!this.tsFiles.length) {
        return reject(new Error('没有ts文件'))
      }

      const ffmpegPath = getFFmpegPath()
      const input = 'concat:' + this.tsFiles.join('|')

      const args = ['-y', '-i', input, '-c', 'copy', '-movflags', '+faststart', this.mp4File]

      const p = spawn(ffmpegPath, args)

      p.on('close', (code) => {
        if (code === 0) resolve(this.mp4File)
        else reject(new Error('ffmpeg合并失败'))
      })
    })
  }

  isRecording() {
    return !!this.process
  }
}
