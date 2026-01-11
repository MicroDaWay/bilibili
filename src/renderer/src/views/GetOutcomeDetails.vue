<!-- 支出明细 -->
<script setup>
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '支出明细'
const columns = [
  { title: '年份', key: 'year', width: '15%' },
  { title: '月份', key: 'month', width: '15%' },
  { title: '日期', key: 'day', width: '15%' },
  { title: '支付平台', key: 'payPlatform', width: '15%' },
  { title: '支付金额', key: 'amount', width: '20%' },
  { title: '备注', key: 'note', width: '20%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getOutcomeDetails()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  const result = await window.electronAPI.getOutcomeDetails()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '查询支出明细',
    type: 'info',
    message: '查询结束'
  })
}

const orderHandler = () => {
  // 根据支付金额降序排序
  itemList.value.sort((a, b) => b.amount - a.amount)
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
