<!-- 每年的支出 -->
<script setup>
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'
import { useBilibiliStore } from '@/stores/bilibiliStore'

const itemList = ref([])
const bilibiliStore = useBilibiliStore()
const title = '每年的支出'
const columns = [
  { title: '年份', key: 'year', width: '50%' },
  { title: '总支出', key: 'totalOutcome', width: '50%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getOutcomeByYear(bilibiliStore.uid)
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  getDatabaseData()
  window.electronAPI.showMessage({
    title: '查询每年的支出',
    type: 'info',
    message: '查询结束'
  })
}

const orderHandler = () => {
  // 根据总支出降序排序
  itemList.value.sort((a, b) => b.totalOutcome - a.totalOutcome)
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
