import { spawn } from 'child_process'
import { format } from 'date-fns'
import ffmpegPath from 'ffmpeg-static'
import fs from 'fs'
import path from 'path'

export class LiveRecorder {
  constructor() {
    this.process = null
    this.output = ''
  }

  start(m3u8Url, outputDir) {
    if (this.process) return this.output

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const filename = `${format(Date.now(), 'yyyy_MM_dd_HH_mm_ss')}.mp4`
    this.output = path.join(outputDir, filename)

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

      // 不重新编码, 性能最好
      '-c',
      'copy',
      '-bsf:a',
      'aac_adtstoasc',

      // 保证mp4正常
      '-movflags',
      '+faststart',

      this.output
    ]

    this.process = spawn(ffmpegPath, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    this.process.stderr.on('data', (data) => {
      console.log('[ffmpeg]', data.toString())
    })

    this.process.on('close', (code) => {
      console.log('录制结束, code =', code)
      this.process = null
    })

    return this.output
  }

  stop() {
    if (!this.process) return

    // mp4不会损坏
    this.process.stdin.write('q')
    this.process.stdin.end()
  }

  isRecording() {
    return !!this.process
  }
}
