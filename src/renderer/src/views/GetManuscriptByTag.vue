<!-- 根据标签查询投稿稿件 -->
<script setup>
import { format } from 'date-fns'
import { ref } from 'vue'
import SearchByTag from '@/components/SearchByTag.vue'

const itemList = ref([])
const columns = [
  { title: '标题', key: 'title' },
  { title: '播放量', key: 'view', width: '6%' },
  {
    title: '投稿时间',
    key: 'postTime',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '投稿标签', key: 'tag' }
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
</script>

<template>
  <SearchByTag
    :item-list="itemList"
    :columns="columns"
    @search-handler="searchHandler"
  ></SearchByTag>
</template>

<style scoped lang="scss"></style>
