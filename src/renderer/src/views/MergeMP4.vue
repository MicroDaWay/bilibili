<script setup>
import { ref } from 'vue'

const isMerging = ref(false)

const upload = async () => {
  if (isMerging.value) return
  isMerging.value = true
  const result = await window.electronAPI.mergeMp4()
  isMerging.value = false

  if (result) {
    window.electronAPI.showMessage({
      title: '合并MP4',
      type: 'info',
      message: `合并完成`
    })
  }
}
</script>

<template>
  <div class="merge-mp4" @click="upload">
    <button v-if="!isMerging" class="upload-video">上传视频</button>
    <button v-else class="upload-video">合并中</button>
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
}
</style>
