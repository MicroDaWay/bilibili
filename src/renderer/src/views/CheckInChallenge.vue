<!-- 打卡挑战 -->
<script setup>
import { ref } from 'vue'
import { formatTimestampToDatetime } from '../utils/index.js'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const title = '打卡挑战'
const columns = [
  { title: '活动开始时间', key: 'startTime', width: '26%' },
  { title: '活动名称', key: 'title' }
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
      const stime = new Date(item.stime * 1000)
      return stime >= startTime
    })
    .map((item) => ({
      title: item.title,
      startTime: formatTimestampToDatetime(item.stime)
    }))
}

// 主函数
const main = async () => {
  itemList.value = []
  const sevenDaysAgo = getSevenDaysAgo()
  const activityList = await window.electronAPI.checkInChallenge()
  const filterActivityList = filterActivityListByTime(activityList, sevenDaysAgo)

  filterActivityList.forEach((item) => {
    itemList.value.push({
      startTime: item.startTime,
      title: item.title
    })
    console.log(`活动开始时间 = ${item.startTime}, 活动名称 = ${item.title}`)
  })

  window.electronAPI.showMessage({
    title: '查询打卡挑战数据',
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
