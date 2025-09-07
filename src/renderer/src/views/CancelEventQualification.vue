<!-- 活动资格取消稿件 -->
<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '活动资格取消稿件'
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

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getDisqualificationData()
  itemList.value = result
}

onMounted(() => {
  itemList.value = []

  // 监听主进程发送的单条数据
  window.electronAPI.cancelEventQualificationProgress((event, item) => {
    itemList.value.push(item)
  })

  // 监听处理完成
  window.electronAPI.cancelEventQualificationFinish(() => {
    window.electronAPI.showMessage({
      title: '活动资格取消稿件',
      type: 'info',
      message: '查询结束'
    })
  })

  getDatabaseData()
})

// 主函数
const main = () => {
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
