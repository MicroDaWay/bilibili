<!-- 根据标签查询投稿稿件 -->
<script setup>
import { format } from 'date-fns'
import { ref } from 'vue'

import SearchComponent from '@/components/SearchComponent.vue'

const itemList = ref([])
const columns = [
  { title: '标题', key: 'title' },
  { title: '播放量', key: 'view', width: '8%' },
  {
    title: '投稿时间',
    key: 'postTime',
    width: '22%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '投稿标签', key: 'tag', width: '22%' }
]

// 点击搜索的处理函数
const searchHandler = async (tag) => {
  const result = await window.electronAPI.getManuscriptByTag(tag)
  itemList.value = result

  if (result.length === 0) {
    window.electronAPI.showMessage({
      title: '根据标签查询投稿稿件',
      type: 'info',
      message: '未查询到相关数据'
    })
  } else {
    window.electronAPI.showMessage({
      title: '根据标签查询投稿稿件',
      type: 'info',
      message: '查询结束'
    })
  }
}

const orderHandler = () => {
  // 根据播放量降序排序
  itemList.value.sort((a, b) => b.view - a.view)
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
