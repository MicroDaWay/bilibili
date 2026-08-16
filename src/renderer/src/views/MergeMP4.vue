<!-- 合并MP4 -->
<script setup>
import { computed, nextTick, onUnmounted, ref } from 'vue'

const isSelecting = ref(false)
const isMerging = ref(false)
const isCompleted = ref(false)
const progress = ref(0)

const handleProgress = (percent) => {
  progress.value = percent
}

const upload = async () => {
  if (isSelecting.value || isMerging.value) return

  if (isCompleted.value) {
    isCompleted.value = false
    progress.value = 0
    await nextTick()
  }

  isSelecting.value = true
  progress.value = 0

  window.electronAPI.mergeMp4Progress(handleProgress)

  window.electronAPI.mergeMp4Started(() => {
    isSelecting.value = false
    isMerging.value = true
  })

  const result = await window.electronAPI.mergeMp4()

  isSelecting.value = false
  isMerging.value = false

  if (result) {
    isCompleted.value = true
    progress.value = 100
  } else {
    isCompleted.value = false
    progress.value = 0
  }

  window.electronAPI.removeMergeMp4ProgressListener(handleProgress)
}

onUnmounted(() => {
  window.electronAPI.removeMergeMp4ProgressListener(handleProgress)
})

const radius = 50
const strokeWidth = 7
const circumference = 2 * Math.PI * radius
const strokeDashoffset = computed(() => circumference - (progress.value / 100) * circumference)

const buttonText = computed(() => {
  if (isCompleted.value) return '合并完成，继续上传'
  if (isSelecting.value) return '选择文件中...'
  return '上传视频'
})
</script>

<template>
  <div class="merge-mp4" @click="!isSelecting && !isMerging && upload()">
    <button v-if="!isMerging" class="upload-video" :class="{ completed: isCompleted }">
      {{ buttonText }}
    </button>

    <div v-else class="circle-progress">
      <svg viewBox="0 0 120 120" class="circle-svg">
        <circle
          cx="60"
          cy="60"
          :r="radius"
          fill="none"
          stroke="#e0e0e0"
          :stroke-width="strokeWidth"
        />
        <circle
          cx="60"
          cy="60"
          :r="radius"
          fill="none"
          stroke="var(--color-primary)"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
          transform="rotate(-90 60 60)"
          class="progress-ring"
        />
      </svg>
      <span class="progress-text">{{ progress }}%</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.merge-mp4 {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  left: 25%;
  right: 10%;
  top: 10%;
  bottom: 10%;
  background-color: #fafafb;
  border-radius: 10px;
  cursor: pointer;

  .upload-video {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20vw;
    height: 10vh;
    font-size: 2vw;
    border: none;
    border-radius: 10px;
    background-color: var(--color-primary);
    cursor: pointer;
  }

  .circle-progress {
    position: relative;
    width: 160px;
    height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;

    .circle-svg {
      width: 100%;
      height: 100%;
    }

    .progress-ring {
      transition: stroke-dashoffset 0.3s ease;
    }

    .progress-text {
      position: absolute;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--color-primary);
    }
  }
}
</style>
