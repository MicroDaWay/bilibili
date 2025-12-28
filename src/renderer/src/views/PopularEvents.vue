<!-- 热门活动 -->
<script setup>
import dayjs from 'dayjs'
import { ref } from 'vue'
import TableComponent from '@/components/TableComponent.vue'

const itemList = ref([])
const title = '热门活动'
const columns = [
  { title: '活动开始时间', key: 'startTime', width: '26%' },
  { title: '活动名称', key: 'name' }
]

// 获取7天前的零点时间
const getSevenDaysAgo = () => {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  date.setHours(0, 0, 0, 0)
  return date
}

// 过滤出前一周的活动
const filterActivityListByTime = (activityList, startTime) => {
  return activityList
    .filter((item) => {
      const activityTime = dayjs.unix(item.stime)
      return activityTime.isAfter(startTime) || activityTime.isSame(startTime)
    })
    .map((item) => ({
      name: item.name,
      startTime: dayjs.unix(item.stime).format('YYYY-MM-DD HH:mm:ss')
    }))
}

// 主函数
const main = async () => {
  itemList.value = []
  const activityList = await window.electronAPI.popularEvents()
  const sevenDaysAgo = getSevenDaysAgo()
  const filterActivityList = filterActivityListByTime(activityList, sevenDaysAgo)

  filterActivityList.forEach((item) => {
    itemList.value.push({
      startTime: item.startTime,
      name: item.name
    })
    console.log(`活动开始时间 = ${item.startTime}, 活动名称 = ${item.name}`)
  })

  window.electronAPI.showMessage({
    title: '查询热门活动数据',
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
