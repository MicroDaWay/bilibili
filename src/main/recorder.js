import fs from 'node:fs'
import path from 'node:path'

import { spawn } from 'child_process'
import { format } from 'date-fns'

import { sleep } from '../renderer/src/utils'
import { getM3U8 } from './api'
import { getFFmpegPath } from './utilFunction'

export class LiveRecorder {
  constructor() {
    this.process = null
    this.roomId = null
    this.outputDir = ''
    this.username = ''
    this.currentTs = ''
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

    this.startFFmpeg(m3u8Url)
    return this.currentTs
  }

  // 启动ffmpeg(单段)
  startFFmpeg(m3u8Url) {
    this.part++
    this.currentTs = path.join(
      this.outputDir,
      `${this.username}_part${this.part}_${format(Date.now(), 'yyyy_MM_dd_HH_mm_ss')}.ts`
    )

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

    this.process = spawn(getFFmpegPath(), args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })

    this.process.stderr.on('data', (data) => {
      const msg = data.toString()
      console.log(`录制中: ${msg}`)

      if (
        !this.stopping &&
        !this.restarting &&
        (msg.includes('403 Forbidden') || msg.includes('Failed to reload playlist'))
      ) {
        this.restarting = true
        console.log('m3u8过期, 准备续录')
        setTimeout(() => this.restart(), 0)
      }
    })

    this.process.on('close', async (code) => {
      console.log(`code: ${code}`)

      const tsFile = this.currentTs
      this.process = null

      // 如果是切段或停止, 都转mp4
      try {
        await this.tsToMp4(tsFile)
        console.log(`单段转mp4完成: ${tsFile}`)
      } catch (err) {
        console.log(`ts转mp4失败, ${err.message}`)
      }
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

    await sleep(1)

    let newM3u8
    try {
      newM3u8 = await getM3U8(this.roomId, 10000)
    } catch (err) {
      this.restarting = false
      setTimeout(() => this.restart(), 5000)
      console.log(`获取新m3u8失败, 5秒后重试, ${err.message}`)
      return
    }

    this.restarting = false
    this.startFFmpeg(newM3u8)
  }

  // 停止录制
  async stop() {
    if (!this.process || this.stopping) return
    this.stopping = true
    const proc = this.process

    await new Promise((resolve) => {
      proc.once('close', resolve)

      // stdin可能已经被关掉
      if (proc.stdin && !proc.stdin.destroyed) {
        try {
          proc.stdin.write('q')
          proc.stdin.end()
        } catch (err) {
          resolve()
          console.log(`通过stdin关闭ffmpeg失败, 直接杀掉进程, ${err.message}`)
        }
      } else {
        proc.kill('SIGKILL')
        resolve()
      }
    })

    this.process = null
    this.restarting = false
    this.stopping = false
  }

  tsToMp4(tsFile) {
    return new Promise((resolve, reject) => {
      const mp4File = tsFile.replace(/\.ts$/, '.mp4')

      const args = ['-y', '-i', tsFile, '-c', 'copy', '-movflags', '+faststart', mp4File]

      const p = spawn(getFFmpegPath(), args, {
        windowsHide: true
      })

      p.on('close', (code) => {
        if (code === 0) {
          // 转封装成功, 删除ts
          fs.unlink(tsFile, (err) => {
            if (err) {
              console.log(`mp4已生成, 但ts删除失败, ${err.message}`)
            } else {
              console.log('ts已删除')
            }
            resolve(mp4File)
          })
        } else {
          reject(new Error('ts转mp4失败'))
        }
      })
    })
  }

  isRecording() {
    return !!this.process
  }
}
