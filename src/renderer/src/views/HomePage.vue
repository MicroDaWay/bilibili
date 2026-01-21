<!-- 首页 -->
<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const list = [
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
    url: '/event-disqualification'
  },
  {
    text: '播放量<100的稿件',
    url: '/view-less-one-hundred'
  },
  {
    text: '查询每月的激励金额',
    url: '/get-rewards-by-month'
  },
  {
    text: '查询每年的激励金额',
    url: '/get-rewards-by-year'
  },
  {
    text: '根据标签查询激励金额',
    url: '/get-rewards-by-tag'
  },
  {
    text: '根据标签查询投稿稿件',
    url: '/get-manuscript-by-tag'
  },
  {
    text: '根据标签查询取消稿件',
    url: '/get-disqualification-by-tag'
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
  },
  {
    text: '查询每月的收入',
    url: '/get-income-by-month'
  },
  {
    text: '查询每年的收入',
    url: '/get-income-by-year'
  },
  {
    text: '查询支出明细',
    url: '/get-outcome-details'
  },
  {
    text: '查询每月的支出',
    url: '/get-outcome-by-month'
  },
  {
    text: '查询每年的支出',
    url: '/get-outcome-by-year'
  },
  {
    text: '直播录制',
    url: '/live-recorder'
  }
]

const isLogin = ref(false)

// 检查登录状态
const checkIsLogin = async () => {
  isLogin.value = await window.electronAPI.checkLoginStatus()
}

const itemList = computed(() => {
  if (isLogin.value) {
    return list
  } else {
    return [
      {
        text: '登录',
        url: '/login'
      }
    ]
  }
})

onMounted(() => {
  // 检查登录状态
  checkIsLogin()

  // 监听登录成功事件
  window.electronAPI.loginSuccess(() => {
    isLogin.value = true
    // 如果当前在登录页, 跳转到稿件管理
    if (router.currentRoute.value.path === '/login') {
      router.push('/manuscript-management')
    }
  })

  // 监听登录状态变化事件
  window.electronAPI.loginStatusChange((event, status) => {
    isLogin.value = status
  })

  // 监听右键菜单事件
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
  overflow-y: auto;

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: transparent;
  }

  &:hover {
    &::-webkit-scrollbar-thumb {
      background: #ccd0d7;
    }
    &::-webkit-scrollbar-track {
      background: #fff;
    }
  }

  .item {
    height: 5vh;
    line-height: 5vh;
    font-size: 1.3vw;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
    text-indent: 1em;
    user-select: none;

    &:hover {
      background-color: var(--color-primary);
    }

    a {
      display: block;
      width: 100%;
      height: 100%;

      &.active {
        background-color: var(--color-primary);
      }
    }
  }
}

.right-content {
  width: 85%;
  height: 100vh;
  overflow-y: auto;
  border-top: 1px solid #ccc;
  scrollbar-gutter: stable;
  padding: 0 1vw 1vh 1vw;
  scroll-behavior: smooth;

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
