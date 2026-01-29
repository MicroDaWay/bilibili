<script setup>
import { onMounted } from 'vue'

import { useBilibiliStore } from './stores/bilibiliStore'
import HomePage from './views/HomePage.vue'

const bilibiliStore = useBilibiliStore()

onMounted(() => {
  window.electronAPI.saveBilibiliData((excelData) => {
    bilibiliStore.setExcelData(excelData)
  })

  window.electronAPI.saveOutcomeData(async (excelData) => {
    await window.electronAPI.saveOutcome(excelData)
  })

  window.electronAPI.saveSalaryData(async (excelData) => {
    await window.electronAPI.saveSalary(excelData)
  })

  window.electronAPI.appExit(() => {
    bilibiliStore.setRoomUrl('')
    bilibiliStore.setLiveItem({
      username: '',
      title: '',
      userCover: '',
      liveTime: '',
      areaName: ''
    })
  })
})
</script>

<template>
  <div class="app">
    <HomePage></HomePage>
  </div>
</template>

<style scoped lang="scss">
.app {
  display: flex;
  justify-content: space-between;
}
</style>
