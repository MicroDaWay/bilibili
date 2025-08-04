<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])
const activeRow = ref(null)

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.viewLessOneHundred()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

// 主函数
async function main() {
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
    <div class="text" @click="main">播放量&lt;100的稿件</div>
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
    width: 1280px;
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
      .view {
        width: 6%;
      }

      .post-time {
        width: 20%;
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
