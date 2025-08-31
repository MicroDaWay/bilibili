<!-- 更新数据库 -->
<script setup>
import { onMounted, ref } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])
const activeRow = ref(null)

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getBilibiliData()
  itemList.value = result
}

onMounted(() => {
  itemList.value = []

  window.electronAPI.updateDatabaseProgress((event, item) => {
    itemList.value.push({
      title: item.title,
      view: item.view,
      post_time: item.postTime,
      tag: item.tag
    })
  })

  window.electronAPI.updateDatabaseFinish(() => {
    window.electronAPI.showMessage({
      title: '更新数据库',
      type: 'info',
      message: '更新数据库成功'
    })
  })

  getDatabaseData()
})

// 主函数
const main = () => {
  itemList.value = []
  window.electronAPI.updateDatabase()
}
</script>

<template>
  <div class="update-database">
    <div class="text" @click="main">更新数据库</div>
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
          <td>{{ item.view.toString().padEnd(5) }}</td>
          <td>{{ item.title }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.update-database {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50px;

  .text {
    position: fixed;
    width: calc(83.3% - 12px);
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

      .view {
        width: 6%;
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
