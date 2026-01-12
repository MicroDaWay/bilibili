<!-- 每月的支出 -->
<script setup>
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '每月的支出'
const columns = [
  { title: '年份', key: 'year', width: '33%' },
  { title: '月份', key: 'month', width: '33%' },
  { title: '总支出', key: 'totalOutcome', width: '34%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getOutcomeByMonth()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  const result = await window.electronAPI.getOutcomeByMonth()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '查询每月的支出',
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
