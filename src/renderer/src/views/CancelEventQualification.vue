<!-- 活动资格取消稿件 -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '活动资格取消稿件'
const isProcessing = ref(false)

const columns = [
  {
    title: '活动资格取消时间',
    key: 'post_time',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '标题', key: 'title' },
  { title: '播放量', key: 'play', width: '6%' },
  { title: '投稿标签', key: 'topic', width: '26%' }
]

const handleProgress = (event, item) => {
  itemList.value.push(item)
}

const handleFinish = () => {
  isProcessing.value = false
  window.electronAPI.showMessage({
    title: '活动资格取消稿件',
    type: 'info',
    message: '查询结束'
  })
}

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getDisqualificationData()
  itemList.value = result
}

onMounted(() => {
  itemList.value = []

  window.electronAPI.cancelEventQualificationProgress(handleProgress)
  window.electronAPI.cancelEventQualificationFinish(handleFinish)

  getDatabaseData()
})

onUnmounted(() => {
  window.electronAPI.removeCancelEventQualificationProgressListener(handleProgress)
  window.electronAPI.removeCancelEventQualificationFinishListener(handleFinish)
})

// 主函数
const main = () => {
  if (isProcessing.value) return
  isProcessing.value = true
  itemList.value = []
  window.electronAPI.cancelEventQualification()
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
