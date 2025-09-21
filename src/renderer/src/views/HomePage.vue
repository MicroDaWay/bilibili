<!-- 首页 -->
<script setup>
import { onMounted } from 'vue'

const itemList = [
  {
    text: '登录',
    url: '/login'
  },
  {
    text: '稿件管理',
    url: '/manuscript-management'
  },
  {
    text: '打卡挑战',
    url: '/check-in-challenge'
  },
  {
    text: '热门活动',
    url: '/popular-events'
  },
  {
    text: '收益中心',
    url: '/earnings-center'
  },
  {
    text: '更新数据库',
    url: '/update-database'
  },
  {
    text: '活动资格取消稿件',
    url: '/cancel-event-qualification'
  },
  {
    text: '播放量<100的稿件',
    url: '/view-less-one-hundred'
  },
  {
    text: '每年获得的激励金额',
    url: '/money-by-year'
  },
  {
    text: '每月获得的激励金额',
    url: '/money-by-month'
  },
  {
    text: '根据标签查询激励金额',
    url: '/get-money-by-tag'
  },
  {
    text: '根据投稿标签查询稿件',
    url: '/get-manuscript-by-tag'
  }
]

// 监听右键菜单事件
onMounted(() => {
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    window.electronAPI.showContextMenu()
  })
})
</script>

<template>
  <ul class="left-nav">
    <li v-for="item in itemList" :key="item.url" class="item">
      <RouterLink :to="item.url" active-class="active">{{ item.text }}</RouterLink>
    </li>
  </ul>
  <div class="right-content">
    <RouterView></RouterView>
  </div>
</template>

<style scoped lang="scss">
.left-nav {
  width: 15%;
  height: 100vh;
  border-right: 1px solid #ccc;
  border-top: 1px solid #ccc;

  .item {
    height: 6.25vh;
    line-height: 6.25vh;
    font-size: 1.3vw;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
    text-indent: 1em;
    user-select: none;

    &:hover {
      background-color: orange;
    }

    a {
      display: block;
      width: 100%;
      height: 100%;

      &.active {
        background-color: orange;
      }
    }
  }
}

.right-content {
  width: 85%;
  height: 100vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: #e0e0e0;
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #9e9e9e;
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #757575;
  }

  &::-webkit-scrollbar-button {
    display: none;
  }
}
</style>
