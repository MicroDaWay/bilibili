<!-- 更新数据库 -->
<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])

// 主函数
async function main() {
  const result = await window.electronAPI.updateDatabase()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '更新数据库',
    type: 'info',
    message: '更新数据库成功'
  })
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
        <tr v-for="item in itemList" :key="item.id" class="tr-text">
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
  margin: 50px 0;

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
    width: 98%;

    .table-tr {
      font-size: 22px;

      .post-time {
        width: 20%;
      }

      .view {
        width: 6%;
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
