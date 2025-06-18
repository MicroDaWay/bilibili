<!-- 首页 -->
<script setup></script>

<template>
  <ul class="left-nav">
    <li class="item">
      <RouterLink to="/manuscript-management">稿件管理</RouterLink>
    </li>
    <li class="item">
      <RouterLink to="/check-in-challenge">打卡挑战</RouterLink>
    </li>
    <li class="item">
      <RouterLink to="/popular-events">热门活动</RouterLink>
    </li>
    <li class="item">
      <RouterLink to="/earnings-center">收益中心</RouterLink>
    </li>
    <li class="item">
      <RouterLink to="/update-database">更新数据库</RouterLink>
    </li>
    <li class="item">
      <RouterLink to="/cancel-event-qualification">活动资格取消</RouterLink>
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
    height: 50px;
    line-height: 50px;
    font-size: 20px;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
    text-indent: 1em;

    &:hover {
      background-color: orange;
    }

    a {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
}

.right-content {
  width: 85%;
  height: 100vh;
  overflow-y: auto;
  border-top: 1px solid #ccc;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
