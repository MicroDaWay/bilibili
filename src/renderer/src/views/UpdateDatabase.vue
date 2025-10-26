<!-- 更新数据库 -->
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { format } from 'date-fns'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '更新数据库'
const isProcessing = ref(false)

const columns = [
  {
    title: '投稿时间',
    key: 'post_time',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '播放量', key: 'view', width: '6%', formatter: (value) => value.toString().padEnd(5) },
  { title: '标题', key: 'title' }
]

const handleProgress = (event, item) => {
  itemList.value.push({
    title: item.title,
    view: item.view,
    post_time: item.postTime,
    tag: item.tag
  })
}

const handleFinish = () => {
  isProcessing.value = false
  window.electronAPI.showMessage({
    title: '更新数据库',
    type: 'info',
    message: '更新数据库成功'
  })
}

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getBilibiliData()
  itemList.value = result
}

onMounted(() => {
  itemList.value = []
  window.electronAPI.updateDatabaseProgress(handleProgress)
  window.electronAPI.updateDatabaseFinish(handleFinish)
  getDatabaseData()
})

onUnmounted(() => {
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
</script>

<template>
  <DataTable
    :title="title"
    :item-list="itemList"
    :columns="columns"
    @main-handler="main"
  ></DataTable>
</template>

<style scoped lang="scss"></style>
