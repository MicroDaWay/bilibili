<!-- 活动资格取消稿件 -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '活动资格取消稿件'
const isProcessing = ref(false)
let globalItemListRef = null

const columns = [
  {
    title: '活动资格取消时间',
    key: 'postTime',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '标题', key: 'title' },
  { title: '播放量', key: 'play', width: '6%' },
  { title: '投稿标签', key: 'topic', width: '26%' }
]

const handleProgress = (event, item) => {
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
  window.electronAPI.removeCancelEventQualificationProgressListener(handleProgress)
  window.electronAPI.removeCancelEventQualificationFinishListener(handleFinish)

  // 再注册
  window.electronAPI.cancelEventQualificationProgress(handleProgress)
  window.electronAPI.cancelEventQualificationFinish(handleFinish)

  getDatabaseData()
})

onUnmounted(() => {
  globalItemListRef = null
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
