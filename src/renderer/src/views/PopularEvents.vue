<!-- 热门活动 -->
<script setup>
import dayjs from 'dayjs'
import { onMounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'
import { getAnyDaysAgo } from '@/utils/index'

const itemList = ref([])
const title = '热门活动'
const columns = [
  { title: '活动开始时间', key: 'startTime', width: '22%' },
  { title: '活动名称', key: 'name' }
]

// 过滤出前一周的活动
const filterActivityListByTime = (activityList, startTime) => {
  return activityList
    .filter((item) => {
      const activityTime = dayjs.unix(item.stime)
      return activityTime.isAfter(startTime) || activityTime.isSame(startTime)
    })
    .sort((a, b) => a.stime - b.stime)
    .map((item) => ({
      name: item.name,
      startTime: dayjs.unix(item.stime).format('YYYY-MM-DD HH:mm:ss')
    }))
}

// 主函数
const main = async () => {
  itemList.value = []
  const activityList = await window.electronAPI.popularEvents()
  const sevenDaysAgo = getAnyDaysAgo(7)
  const filterActivityList = filterActivityListByTime(activityList, sevenDaysAgo)

  filterActivityList.forEach((item) => {
    itemList.value.push({
      startTime: item.startTime,
      name: item.name
    })
    console.log(`活动开始时间 = ${item.startTime}, 活动名称 = ${item.name}`)
  })
}

onMounted(() => {
  main()
})
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
