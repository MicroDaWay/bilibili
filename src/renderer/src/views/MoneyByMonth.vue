<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const itemList = ref([])
const activeRow = ref(null)
const textEl = ref(null)
let resizeObserver = null

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.moneyByMonth()
  itemList.value = result
}

const checkScrollbar = () => {
  const container = document.querySelector('.right-content')
  if (!container || !textEl.value) return
  const hasScrollbar = container.scrollHeight > container.clientHeight
  textEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
}

onMounted(() => {
  getDatabaseData()

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
  const result = await window.electronAPI.moneyByMonth()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '每月获得的激励金额',
    type: 'info',
    message: '查询结束'
  })
}
</script>

<template>
  <div class="money-by-month">
    <div ref="textEl" class="text" @click="main">每年获得的激励金额</div>
    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="year">年份</th>
          <th class="month">月份</th>
          <th class="total-money">累计金额</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in itemList"
          :key="item.id"
          class="tr-text"
          :class="{ 'tr-active': activeRow === item }"
          @click="activeRow = item"
        >
          <td>{{ item.year }}</td>
          <td>{{ item.month }}</td>
          <td>{{ item.totalMoney }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.money-by-month {
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
    font-size: 30px;
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
      font-size: 22px;

      .year {
        width: 33%;
      }

      .month {
        width: 33%;
      }

      .total-money {
        width: 34%;
      }
    }

    .tr-text {
      font-size: 22px;
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
