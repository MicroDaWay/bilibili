<!-- 活动资格取消稿件 -->
<script setup>
import { format } from 'date-fns'
import { onMounted, onUnmounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '活动资格取消稿件'
const isProcessing = ref(false)
let globalItemListRef = null

const columns = [
  {
    title: '活动资格取消时间',
    key: 'postTime',
    width: '22%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '播放量', key: 'view', width: '8%' },
  { title: '标题', key: 'title' },
  { title: '投稿标签', key: 'tag', width: '22%' }
]

const handleProgress = (e, item) => {
  if (globalItemListRef) {
    globalItemListRef.value.push(item)
  }
}

const handleFinish = () => {
  if (globalItemListRef) {
    isProcessing.value = false
  }
}

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getDisqualificationData()
  itemList.value = result
}

onMounted(() => {
  globalItemListRef = itemList
  isProcessing.value = false

  // 先移除可能存在的监听器
  window.electronAPI.removeEventDisqualificationProgressListener(handleProgress)
  window.electronAPI.removeEventDisqualificationFinishListener(handleFinish)

  // 再注册
  window.electronAPI.eventDisqualificationProgress(handleProgress)
  window.electronAPI.eventDisqualificationFinish(handleFinish)

  getDatabaseData()
})

onUnmounted(() => {
  globalItemListRef = null
  window.electronAPI.removeEventDisqualificationProgressListener(handleProgress)
  window.electronAPI.removeEventDisqualificationFinishListener(handleFinish)
})

// 主函数
const main = () => {
  if (isProcessing.value) return
  isProcessing.value = true
  itemList.value = []
  window.electronAPI.eventDisqualification()
}

const orderHandler = () => {
  // 根据播放量降序排序
  itemList.value.sort((a, b) => b.view - a.view)
}
</script>

<template>
  <TableComponent
    :title="title"
    :item-list="itemList"
    :columns="columns"
    @main-handler="main"
    @order-handler="orderHandler"
  ></TableComponent>
</template>

<style scoped lang="scss"></style>
