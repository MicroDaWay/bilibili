<!-- 支出明细 -->
<script setup>
import { format } from 'date-fns'
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'
import { useBilibiliStore } from '@/stores/bilibiliStore'

const itemList = ref([])
const bilibiliStore = useBilibiliStore()
const title = '支出明细'
const columns = [
  {
    title: '日期',
    key: 'payDate',
    width: '25%',
    formatter: (value) => format(value, 'yyyy-MM-dd')
  },
  { title: '支付平台', key: 'payPlatform', width: '25%' },
  { title: '支付金额', key: 'amount', width: '25%' },
  { title: '备注', key: 'note', width: '25%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getOutcomeDetails(bilibiliStore.uid)
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  getDatabaseData()
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
