<!-- 更新数据库 -->
<script setup>
import { ref } from 'vue'

const itemList = ref([])

async function main() {
  try {
    const result = await window.electronAPI.updateDatabase()
    itemList.value = result
    window.electronAPI.showMessage({
      type: 'info',
      message: '更新数据库结束'
    })
  } catch (error) {
    window.electronAPI.showMessage({
      type: 'error',
      message: `更新失败：, ${error.message}`
    })
    console.error('更新失败：', error.message)
  }
}
</script>

<template>
  <div class="update-database">
    <div class="text" @click="main">更新数据库</div>
    <ul class="item-list">
      <li v-for="item in itemList" :key="item.id" class="item-text">
        播放量 = {{ item.view.toString().padEnd(5) }}，标题 = {{ item.title }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.update-database {
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
