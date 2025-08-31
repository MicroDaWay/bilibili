<!-- 打卡挑战 -->
<script setup>
import dayjs from 'dayjs'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { formatTimestampToDatetime } from '../utils/index.js'

const itemList = ref([])
const activeRow = ref(null)
const textEl = ref(null)
let resizeObserver = null

// 获取7天前的日期
const getSevenDaysAgo = () => {
  const today = dayjs()
  const sevenDaysAgo = today.subtract(7, 'day')
  return sevenDaysAgo.startOf('day').toDate()
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

const checkScrollbar = () => {
  const container = document.querySelector('.right-content')
  if (!container || !textEl.value) return
  const hasScrollbar = container.scrollHeight > container.clientHeight
  textEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
}

onMounted(() => {
  // 初始化检测
  checkScrollbar()

  // 用 ResizeObserver 监控容器变化
  const container = document.querySelector('.right-content')
  if (container) {
    resizeObserver = new ResizeObserver(checkScrollbar)
    resizeObserver.observe(container)
  }

  // 监听窗口变化
  window.addEventListener('resize', checkScrollbar)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', checkScrollbar)
})

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
    title: '打卡挑战',
    type: 'info',
    message: '查询结束'
  })
}
</script>

<template>
  <div class="check-in-challenge">
    <div ref="textEl" class="text" @click="main">打卡挑战</div>
    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="start-time">活动开始时间</th>
          <th class="title">活动名称</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in itemList"
          :key="item.title"
          class="tr-text"
          :class="{ 'tr-active': activeRow === item }"
          @click="activeRow = item"
        >
          <td>{{ item.startTime }}</td>
          <td>{{ item.title }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.check-in-challenge {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50px;

  .text {
    position: fixed;
    width: 83.3%;
    height: 100px;
    line-height: 100px;
    text-align: center;
    font-size: 2vw;
    background-color: #fff;
    user-select: none;

    &:hover {
      cursor: pointer;
      background-color: orange;
    }
  }

  .table-container {
    margin-top: 100px;
    padding-bottom: 50px;
    width: 98%;

    .table-tr {
      font-size: 1.4vw;

      .start-time {
        width: 26%;
      }
    }

    .tr-text {
      font-size: 1.4vw;
      margin: 6px 0;

      &.tr-active {
        background-color: orange;
      }

      &:hover {
        background-color: orange;
      }
    }
  }
}
</style>
