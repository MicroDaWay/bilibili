<!-- 下载M3U8 -->
<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const m3u8Url = ref('')
const isInputFocus = ref(false)
const isDownloading = ref(false)
const progress = ref(0)
const progressInfo = ref(null)
const statusMsg = ref('')
const startTime = ref(0)
const elapsedMs = ref(0)
let timerHandle = null

const startTimer = () => {
  startTime.value = Date.now()
  elapsedMs.value = 0
  timerHandle = setInterval(() => {
    elapsedMs.value = Date.now() - startTime.value
  }, 1000)
}

const stopTimer = () => {
  if (timerHandle) {
    clearInterval(timerHandle)
    timerHandle = null
  }
}

const formatDuration = (ms) => {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

const elapsedDisplay = computed(() => formatDuration(elapsedMs.value))

const progressDisplay = computed(() => {
  const info = progressInfo.value
  if (!info) return ''

  if (info.type === 'download') {
    return `已下载分片: ${info.downloadedSegments}/${info.totalSegments}`
  }

  return ''
})

const progressPercent = computed(() => progressInfo.value?.percent ?? 0)

const downloadHandler = async () => {
  const url = m3u8Url.value
  if (!url || !url.endsWith('.m3u8')) {
    window.electronAPI.showMessage({
      title: '下载M3U8',
      type: 'error',
      message: '请输入有效的M3U8链接'
    })
    return
  }
  if (isDownloading.value) return

  const outputPath = await window.electronAPI.selectOutputPath()
  if (!outputPath) return

  isDownloading.value = true
  progress.value = 0
  statusMsg.value = '准备中...'

  startTimer()

  window.electronAPI.onM3u8Progress((info) => {
    progressInfo.value = info
    if (info.type === 'download') {
      statusMsg.value = `下载中... 当前进度: ${info.percent}%`
    } else if (info.type === 'merge') {
      statusMsg.value = `合并中... 当前进度: ${info.percent}%`
    } else if (info.type === 'done') {
      statusMsg.value = ''
    }
  })

  const result = await window.electronAPI.downloadM3u8({ url, outputPath })

  stopTimer()

  window.electronAPI.offM3u8Progress()
  isDownloading.value = false

  if (result.success) {
    window.electronAPI.showMessage({
      title: '下载M3U8',
      type: 'info',
      message: `下载完成，总用时: ${elapsedDisplay.value}`
    })
  } else {
    statusMsg.value = ''
    window.electronAPI.showMessage({
      title: '下载M3U8',
      type: 'error',
      message: `下载失败: ${result.error}`
    })
  }
}

onBeforeUnmount(() => {
  window.electronAPI.offM3u8Progress()
})
</script>

<template>
  <div class="download-m3u8">
    <div class="header">
      <div class="search-input-box">
        <div class="input-container">
          <input
            v-model.trim="m3u8Url"
            class="search-input"
            type="text"
            :class="{ 'input-focus': isInputFocus }"
            :disabled="isDownloading"
            placeholder="请输入M3U8链接"
            @focus="isInputFocus = true"
            @blur="isInputFocus = false"
            @keyup.enter="downloadHandler"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="#000"
            class="search-icon"
            @click="downloadHandler"
          >
            <path
              d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"
            ></path>
          </svg>
        </div>
        <div class="search-button" @click="downloadHandler">下载</div>
      </div>

      <div v-if="isDownloading || statusMsg" class="status-bar">
        <!-- 进度条 -->
        <div v-if="isDownloading" class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <!-- 状态信息行 -->
        <div class="status-row">
          <div class="status-left">
            <span class="status-label">{{ statusMsg }}</span>
            <span v-if="progressDisplay" class="status-detail">{{ progressDisplay }}</span>
          </div>
          <span v-if="isDownloading || elapsedMs > 0" class="elapsed-time">
            总用时: {{ elapsedDisplay }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.download-m3u8 {
  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;

    .search-input-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2vh 0;
      background-color: #fff;

      .input-container {
        position: relative;
        width: 100%;

        .search-input {
          width: 100%;
          height: 5.4vh;
          border-radius: 2vw;
          border: none;
          outline: none;
          border: 1px solid #ccc;
          font-size: 1.3vw;
          padding: 0 3vw 0 1.2vw;
          user-select: none;

          &.input-focus {
            border: 1px solid var(--color-primary);
          }
        }

        .search-icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: 1vw;
          width: 1.6vw;
          height: 1.6vw;
        }
      }

      .search-button {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 8vw;
        height: 5.4vh;
        background-color: var(--color-primary);
        border-radius: 2vw;
        font-size: 1.5vw;
        margin-left: 2vw;
        user-select: none;
        cursor: pointer;

        &:hover {
          background-color: #ffb121;
        }
      }
    }

    .status-bar {
      padding: 1.2vh 0;

      .progress-bar {
        width: 100%;
        height: 0.5vh;
        background: #f0f0f0;
        border-radius: 0.25vh;
        overflow: hidden;
        margin-bottom: 1vh;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), #ffcc00);
          border-radius: 0.25vh;
          transition: width 0.3s ease;
        }
      }

      .status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .status-left {
          display: flex;
          align-items: center;
          gap: 1.5vw;

          .status-label {
            font-size: 1vw;
            color: #333;
            font-weight: 500;
          }

          .status-detail {
            font-size: 1vw;
            color: #333;
            padding-left: 1.5vw;
            border-left: 1px solid #333;
          }
        }

        .elapsed-time {
          font-size: 1vw;
          color: #333;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.05em;
        }
      }
    }
  }
}
</style>
