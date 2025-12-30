<!-- 每月的工资 -->
<script setup>
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '每月的工资'
const columns = [
  { title: '年份', key: 'year', width: '20%' },
  { title: '月份', key: 'month', width: '20%' },
  { title: '工资', key: 'salary', width: '20%' },
  { title: '时长', key: 'workingHours', width: '20%' },
  { title: '时薪', key: 'hourlyWage', width: '20%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getSalaryByMonth()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  const result = await window.electronAPI.getSalaryByMonth()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '查询每月的工资',
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
