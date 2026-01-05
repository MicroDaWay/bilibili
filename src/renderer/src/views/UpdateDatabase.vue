<!-- 更新数据库 -->
<script setup>
import { format } from 'date-fns'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '更新数据库'
const isProcessing = ref(false)
let globalItemListRef = null
const TableComponentContainer = ref(null)

const columns = [
  {
    title: '投稿时间',
    key: 'postTime',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '播放量', key: 'view', width: '6%', formatter: (value) => value.toString().padEnd(5) },
  { title: '标题', key: 'title' }
]

const handleProgress = async (event, item) => {
  if (globalItemListRef) {
    itemList.value.push({
      title: item.title,
      view: item.view,
      postTime: item.postTime,
      tag: item.tag
    })

    await nextTick()
    const container = TableComponentContainer.value
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
  const result = await window.electronAPI.getManuscriptData()
  itemList.value = result
}

onMounted(() => {
  globalItemListRef = itemList
  isProcessing.value = false

  window.electronAPI.removeUpdateDatabaseProgressListener(handleProgress)
  window.electronAPI.removeUpdateDatabaseFinishListener(handleFinish)

  window.electronAPI.updateDatabaseProgress(handleProgress)
  window.electronAPI.updateDatabaseFinish(handleFinish)

  getDatabaseData()
})

onUnmounted(() => {
  globalItemListRef = null
  window.electronAPI.removeUpdateDatabaseProgressListener(handleProgress)
  window.electronAPI.removeUpdateDatabaseFinishListener(handleFinish)
})

// 主函数
const main = () => {
  if (isProcessing.value) return
  isProcessing.value = true
  itemList.value = []
  window.electronAPI.updateDatabase()
}

const orderHandler = () => {
  // 根据播放量降序排序
  itemList.value.sort((a, b) => b.view - a.view)
}
</script>

<template>
  <div ref="TableComponentContainer" class="data-table-container">
    <TableComponent
      :title="title"
      :item-list="itemList"
      :columns="columns"
      @main-handler="main"
      @order-handler="orderHandler"
    ></TableComponent>
  </div>
</template>

<style scoped lang="scss">
.data-table-container {
  height: 100%;
  overflow-y: auto;
}
</style>
