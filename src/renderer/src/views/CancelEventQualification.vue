<!-- 活动资格取消稿件 -->
<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])

// 主函数
async function main() {
  const result = await window.electronAPI.cancelEventQualification()
  itemList.value = result
  window.electronAPI.showMessage({
    title: '活动资格取消',
    type: 'info',
    message: '查询结束'
  })
}
</script>

<template>
  <div class="cancel-event-qualification">
    <div class="text" @click="main">活动资格取消</div>
    <!-- <ul class="item-list">
      <li v-for="item in itemList" :key="item.id" class="item-text">
        投稿时间 = {{ format(item.post_time, 'yyyy-MM-dd HH:mm:ss') }}, 标题 = {{ item.title }},
        投稿标签 = {{ item.topic }}
      </li>
    </ul> -->
    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="post-time">投稿时间</th>
          <th class="title">标题</th>
          <th class="topic">投稿标签</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itemList" :key="item.id" class="tr-text">
          <td>{{ format(item.post_time, 'yyyy-MM-dd HH:mm:ss') }}</td>
          <td>{{ item.title }}</td>
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

      .topic {
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
