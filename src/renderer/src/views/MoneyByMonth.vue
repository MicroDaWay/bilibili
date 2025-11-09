<!-- 每月获得的激励金额 -->
<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '每月获得的激励金额'
const columns = [
  { title: '年份', key: 'year', width: '33%' },
  { title: '月份', key: 'month', width: '33%' },
  { title: '累计金额', key: 'totalMoney', width: '34%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.moneyByMonth()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  const result = await window.electronAPI.moneyByMonth()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '查询每月获得的激励金额',
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
