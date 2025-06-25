<!-- 活动资格取消 -->
<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])

async function main() {
  try {
    const result = await window.electronAPI.cancelEventQualification()
    itemList.value = result
    window.electronAPI.showMessage({
      type: 'info',
      message: '查询结束'
    })
  } catch (error) {
    window.electronAPI.showMessage({
      type: 'error',
      message: `查询失败：, ${error.message}`
    })
    console.error('查询失败：', error.message)
  }
}
</script>

<template>
  <div class="cancel-event-qualification">
    <div class="text" @click="main">活动资格取消</div>
    <ul class="item-list">
      <li v-for="item in itemList" :key="item.id" class="item-text">
        投稿时间 = {{ format(item.post_time, 'yyyy-MM-dd HH:mm:ss') }}, 标题 = {{ item.title }},
        投稿标签 = {{ item.topic }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.cancel-event-qualification {
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
      font-size: 20px;
      margin: 6px 0;
      white-space: pre;

      &:hover {
        background-color: orange;
      }
    }
  }
}
</style>
