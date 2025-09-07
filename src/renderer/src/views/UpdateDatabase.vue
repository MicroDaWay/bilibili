<!-- 更新数据库 -->
<script setup>
import { onMounted, ref } from 'vue'
import { format } from 'date-fns'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '更新数据库'
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

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getBilibiliData()
  itemList.value = result
}

onMounted(() => {
  itemList.value = []

  window.electronAPI.updateDatabaseProgress((event, item) => {
    itemList.value.push({
      title: item.title,
      view: item.view,
      post_time: item.postTime,
      tag: item.tag
    })
  })

  window.electronAPI.updateDatabaseFinish(() => {
    window.electronAPI.showMessage({
      title: '更新数据库',
      type: 'info',
      message: '更新数据库成功'
    })
  })

  getDatabaseData()
})

// 主函数
const main = () => {
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
