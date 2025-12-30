<!-- 每年的提现金额 -->
<script setup>
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '每年的提现金额'
const columns = [
  { title: '年份', key: 'year', width: '50%' },
  { title: '提现总额', key: 'totalBrokerage', width: '50%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getWithdrawByYear()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  const result = await window.electronAPI.getWithdrawByYear()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '查询每年的提现金额',
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
