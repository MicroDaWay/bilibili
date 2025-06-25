<!-- 打卡挑战 -->
<script setup>
import dayjs from 'dayjs'
import { ref } from 'vue'

const itemList = ref([])

// 获取上周六的开始时间
function getLastWeekStart() {
  const today = dayjs()
  const lastSaturday = today.subtract(7, 'day')
  return lastSaturday.startOf('day').toDate()
}

// 获取活动列表
async function fetchActivities() {
  try {
    const activities = await window.electronAPI.checkInChallenge()
    return activities
  } catch (error) {
    window.electronAPI.showMessage({
      type: 'error',
      message: `请求失败：, ${error.message}`
    })
    console.error('请求失败：', error.message)
    return []
  }
}

// 过滤出在指定时间之后的活动
function filterActivitiesByTime(activities, startTime) {
  return activities
    .filter((item) => {
      const stime = new Date(item.stime * 1000)
      return stime >= startTime
    })
    .map((item) => ({
      title: item.title,
      startTime: new Date(item.stime * 1000).toISOString().replace('T', ' ').substring(0, 19)
    }))
}

async function main() {
  itemList.value = []
  const lastWeekStart = getLastWeekStart()
  const activities = await fetchActivities()
  const validActivities = filterActivitiesByTime(activities, lastWeekStart)

  validActivities.forEach((item) => {
    itemList.value.push({
      startTime: item.startTime,
      title: item.title
    })
    console.log(`活动开始时间 = ${item.startTime}, 活动名称 = ${item.title}`)
  })

  window.electronAPI.showMessage({
    type: 'info',
    message: '查询结束'
  })
}
</script>

<template>
  <div class="check-in-challenge">
    <div class="text" @click="main">打卡挑战</div>
    <ul class="item-list">
      <li v-for="item in itemList" :key="item.title" class="item-text">
        活动开始时间 = {{ item.startTime }}，活动名称 = {{ item.title }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.check-in-challenge {
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
