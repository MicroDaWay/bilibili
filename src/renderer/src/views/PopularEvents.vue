<!-- 热门活动 -->
<script setup>
import dayjs from 'dayjs'
import { ref } from 'vue'

const itemList = ref([])

// 获取上周六的零点时间
function getLastSaturday() {
  const today = dayjs()
  let lastSaturday = today.subtract(7, 'day')

  // 如果今天是周六，则再减一周
  if (today.day() === 6) {
    lastSaturday = today.subtract(1, 'week')
  }

  return lastSaturday.startOf('day').toDate()
}

// 过滤出在指定时间之后的活动
function filterActivitiesByTime(activities, startTime) {
  return activities
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
  try {
    itemList.value = []
    const activities = await window.electronAPI.fetchPopularEvents()
    const lastSaturday = getLastSaturday()
    const validActivities = filterActivitiesByTime(activities, lastSaturday)
    itemList.value = validActivities
    validActivities.forEach((item) => {
      console.log(`活动开始时间 = ${item.startTime}, 活动名称 = ${item.name}`)
    })
    window.electronAPI.showMessage({
      type: 'info',
      message: '查询结束'
    })
  } catch (error) {
    window.electronAPI.showMessage({
      type: 'error',
      message: `获取活动失败：, ${error.message}`
    })
    console.error('获取活动失败：', error.message)
  }
}
</script>

<template>
  <div class="popular-events">
    <div class="text" @click="main">热门活动</div>
    <ul class="item-list">
      <li v-for="item in itemList" :key="item.title" class="item-text">
        活动开始时间 = {{ item.startTime }}，活动名称 = {{ item.name }}
      </li>
    </ul>
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

  .item-list {
    margin-top: 20px;
    padding-bottom: 50px;

    .item-text {
      font-size: 22px;
      margin: 6px 0;

      &:hover {
        background-color: orange;
      }
    }
  }
}
</style>
