<!-- 热门活动 -->
<script setup>
import dayjs from 'dayjs'
import { ref } from 'vue'

const itemList = ref([])

// 获取7天前的日期
function getSevenDaysAgo() {
  const today = dayjs()
  const sevenDaysAgo = today.subtract(7, 'day')
  return sevenDaysAgo.startOf('day').toDate()
}

// 过滤出前一周的活动
function filterActivityListByTime(activityList, startTime) {
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
async function main() {
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
    title: '热门活动',
    type: 'info',
    message: '查询结束'
  })
}
</script>

<template>
  <div class="popular-events">
    <div class="text" @click="main">热门活动</div>
    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="start-time">活动开始时间</th>
          <th class="title">活动名称</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itemList" :key="item.name" class="tr-text">
          <td>{{ item.startTime }}</td>
          <td>{{ item.name }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.popular-events {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;

  .text {
    font-size: 30px;

    &:hover {
      cursor: pointer;
      background-color: orange;
    }
  }

  .table-container {
    margin-top: 20px;
    padding-bottom: 50px;
    width: 80%;

    .table-tr {
      font-size: 22px;

      .start-time {
        width: 30%;
      }
    }

    .tr-text {
      font-size: 22px;
      margin: 6px 0;

      &:hover {
        background-color: orange;
      }
    }
  }
}
</style>
