<!-- 播放量<100的稿件 -->
<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '播放量<100的稿件'
const columns = [
  {
    title: '投稿时间',
    key: 'postTime',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '播放量', key: 'view', width: '6%' },
  { title: '标题', key: 'title' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.viewLessOneHundred()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  const result = await window.electronAPI.viewLessOneHundred()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '查询播放量<100的稿件',
    type: 'info',
    message: '查询结束'
  })
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
