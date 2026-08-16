<!-- 限流稿件 -->
<script setup>
import { format } from 'date-fns'
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'
import { useBilibiliStore } from '@/stores/bilibiliStore'

const itemList = ref([])
const bilibiliStore = useBilibiliStore()
const title = '限流稿件'
const columns = [
  {
    title: '投稿时间',
    key: 'postTime',
    width: '22%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '播放量', key: 'view', width: '8%' },
  { title: '标题', key: 'title' },
  { title: '投稿标签', key: 'tag', width: '22%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.restrictManuscript(bilibiliStore.uid)
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  getDatabaseData()
  window.electronAPI.showMessage({
    title: '查询限流稿件',
    type: 'info',
    message: '查询结束'
  })
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
