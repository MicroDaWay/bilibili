<!-- 热门活动 -->
<script setup>
import { format } from 'date-fns'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '热门活动'
const isProcessing = ref(false)
let globalItemListRef = null

const columns = [
  {
    title: '活动开始时间',
    key: 'startTime',
    width: '22%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '活动名称', key: 'name' }
]

const handleProgress = async (e, item) => {
  if (globalItemListRef) {
    itemList.value.push({
      startTime: item.startTime,
      name: item.name
    })

    await nextTick()
    const container = document.querySelector('.right-content')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
}

const handleFinish = () => {
  if (globalItemListRef) {
    isProcessing.value = false
  }
}

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getHotActivityData()
  itemList.value = result
}

onMounted(() => {
  globalItemListRef = itemList
  isProcessing.value = false

  window.electronAPI.removeHotActivityProgressListener(handleProgress)
  window.electronAPI.removeHotActivityFinishListener(handleFinish)

  window.electronAPI.hotActivityProgress(handleProgress)
  window.electronAPI.hotActivityFinish(handleFinish)

  getDatabaseData()
})

onUnmounted(() => {
  globalItemListRef = null
  window.electronAPI.removeHotActivityProgressListener(handleProgress)
  window.electronAPI.removeHotActivityFinishListener(handleFinish)
})

// 主函数
const main = () => {
  if (isProcessing.value) return
  isProcessing.value = true
  itemList.value = []
  window.electronAPI.hotActivity()
}
</script>

<template>
  <TableComponent
    :title="title"
    :item-list="itemList"
    :columns="columns"
    @main-handler="main"
  ></TableComponent>
</template>

<style scoped lang="scss"></style>
