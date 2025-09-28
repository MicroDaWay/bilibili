<!-- 根据标签查询激励金额 -->
<script setup>
import { ref } from 'vue'
import SearchByTag from '../components/SearchByTag.vue'
import { format } from 'date-fns'

const itemList = ref([])
const columns = [
  { title: '投稿话题', key: 'productName' },
  { title: '金额', key: 'money', width: '8%' },
  {
    title: '奖励时间',
    key: 'createTime',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '累计金额', key: 'totalMoney', width: '8%' }
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
</script>

<template>
  <SearchByTag
    :title="title"
    :item-list="itemList"
    :columns="columns"
    @search-handler="searchHandler"
  ></SearchByTag>
</template>

<style scoped lang="scss"></style>
