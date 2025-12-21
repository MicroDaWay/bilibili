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
    text: '查询每月的激励金额',
    url: '/get-money-by-month'
  },
  {
    text: '查询每年的激励金额',
    url: '/get-money-by-year'
  },
  {
    text: '根据标签查询激励金额',
    url: '/get-money-by-tag'
  },
  {
    text: '根据标签查询投稿稿件',
    url: '/get-manuscript-by-tag'
  },
  {
    text: '根据标签查询取消稿件',
    url: '/get-disqualified-by-tag'
  },
  {
    text: '查询每月的工资',
    url: '/get-salary-by-month'
  },
  {
    text: '查询每年的工资',
    url: '/get-salary-by-year'
  },
  {
    text: '查询每月的提现金额',
    url: '/get-withdraw-by-month'
  },
  {
    text: '查询每年的提现金额',
    url: '/get-withdraw-by-year'
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

  .item {
    height: 5vh;
    line-height: 5vh;
    font-size: 1.3vw;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
    text-indent: 1em;
    user-select: none;

    &:first-child {
      border-top: 1px solid #ccc;
    }

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
  border-top: 1px solid #ccc;

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
