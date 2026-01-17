<!-- 根据标签查询激励金额 -->
<script setup>
import { format } from 'date-fns'
import { ref } from 'vue'

import SearchComponent from '@/components/SearchComponent.vue'

const itemList = ref([])
const columns = [
  { title: '投稿标签', key: 'productName' },
  { title: '金额', key: 'money', width: '8%' },
  {
    title: '奖励时间',
    key: 'createTime',
    width: '22%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '累计金额', key: 'totalMoney', width: '10%' }
]

// 点击搜索的处理函数
const searchHandler = async (tag) => {
  const result = await window.electronAPI.getMoneyByTag(tag)
  itemList.value = result

  if (result.length === 0) {
    window.electronAPI.showMessage({
      title: '根据标签查询激励金额',
      type: 'info',
      message: '未查询到相关数据'
    })
  } else {
    window.electronAPI.showMessage({
      title: '根据标签查询激励金额',
      type: 'info',
      message: '查询结束'
    })
  }
}

const orderHandler = () => {
  // 根据金额降序排序
  itemList.value.sort((a, b) => b.money - a.money)
}
</script>

<template>
  <SearchComponent
    :columns="columns"
    :item-list="itemList"
    @order-handler="orderHandler"
    @search-handler="searchHandler"
  ></SearchComponent>
</template>

<style scoped lang="scss"></style>
