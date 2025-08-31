<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])
const activeRow = ref(null)
const textEl = ref(null)
let resizeObserver = null

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.viewLessOneHundred()
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
  const result = await window.electronAPI.viewLessOneHundred()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '播放量<100的稿件',
    type: 'info',
    message: '查询结束'
  })
}
</script>

<template>
  <div class="view-less-one-hundred">
    <div ref="textEl" class="text" @click="main">播放量&lt;100的稿件</div>
    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="post-time">投稿时间</th>
          <th class="view">播放量</th>
          <th class="title">标题</th>
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
          <td>{{ format(item.post_time, 'yyyy-MM-dd HH:mm:ss') }}</td>
          <td>{{ item.view }}</td>
          <td>{{ item.title }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.view-less-one-hundred {
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
      .view {
        width: 6%;
      }

      .post-time {
        width: 20%;
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
