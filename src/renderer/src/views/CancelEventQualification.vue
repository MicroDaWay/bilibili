<!-- 活动资格取消稿件 -->
<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getDisqualificationData()
  itemList.value = result
}

onMounted(() => {
  getDatabaseData()
})

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
  margin-bottom: 50px;

  .text {
    position: fixed;
    width: 1280px;
    height: 100px;
    line-height: 100px;
    text-align: center;
    font-size: 30px;
    background-color: #fff;

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
