<!-- 每年的工资 -->
<script setup>
import { ref, onMounted } from 'vue'
import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '每年的工资'
const columns = [
  { title: '年份', key: 'year', width: '50%' },
  { title: '全年工资', key: 'totalSalary', width: '50%' }
]

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getSalaryByYear()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
const main = async () => {
  const result = await window.electronAPI.getSalaryByYear()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '查询每年的工资',
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
