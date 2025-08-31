<!-- 活动资格取消稿件 -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])
const activeRow = ref(null)
const textEl = ref(null)
let resizeObserver = null

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getDisqualificationData()
  itemList.value = result
}

const checkScrollbar = () => {
  const container = document.querySelector('.right-content')
  if (!container || !textEl.value) return
  const hasScrollbar = container.scrollHeight > container.clientHeight
  textEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
}

onMounted(() => {
  itemList.value = []

  checkScrollbar()

  // 用 ResizeObserver 监控容器变化
  const container = document.querySelector('.right-content')
  if (container) {
    resizeObserver = new ResizeObserver(checkScrollbar)
    resizeObserver.observe(container)
  }

  // 监听窗口变化
  window.addEventListener('resize', checkScrollbar)

  // 监听主进程发送的单条数据
  window.electronAPI.cancelEventQualificationProgress((event, item) => {
    itemList.value.push(item)
  })

  // 监听处理完成
  window.electronAPI.cancelEventQualificationFinish(() => {
    window.electronAPI.showMessage({
      title: '活动资格取消稿件',
      type: 'info',
      message: '查询结束'
    })
  })

  getDatabaseData()
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', checkScrollbar)
})

// 主函数
const main = () => {
  itemList.value = []
  window.electronAPI.cancelEventQualification()
}
</script>

<template>
  <div class="cancel-event-qualification">
    <div ref="textEl" class="text" @click="main">活动资格取消稿件</div>
    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="post-time">活动资格取消时间</th>
          <th class="title">标题</th>
          <th class="play">播放量</th>
          <th class="topic">投稿标签</th>
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
          <td>{{ item.title }}</td>
          <td>{{ item.play }}</td>
          <td>{{ item.topic }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.cancel-event-qualification {
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

      .post-time {
        width: 20%;
      }

      .play {
        width: 6%;
      }

      .topic {
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
