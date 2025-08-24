<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'

const tag = ref('')
const itemList = ref([])
const activeRow = ref(null)
const inputEl = ref(null)
let resizeObserver = null

const checkScrollbar = () => {
  const container = document.querySelector('.right-content')
  if (!container || !inputEl.value) return
  const hasScrollbar = container.scrollHeight > container.clientHeight
  inputEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
}

onMounted(() => {
  checkScrollbar()

  // 用 ResizeObserver 监控容器变化
  const container = document.querySelector('.right-content')
  if (container) {
    resizeObserver = new ResizeObserver(checkScrollbar)
    resizeObserver.observe(container)
  }

  // 监听窗口变化
  window.addEventListener('resize', checkScrollbar)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', checkScrollbar)
})

// 点击搜索的处理函数
const searchHandler = async () => {
  const result = await window.electronAPI.getMoneyByTag(tag.value)
  itemList.value = result

  if (result.length === 0) {
    window.electronAPI.showMessage({
      title: '根据标签查询激励金额',
      type: 'info',
      message: '未查询到相关数据'
    })
  } else {
    window.electronAPI.showMessage({
      title: '根据标签查询激励金额',
      type: 'info',
      message: '查询结束'
    })
  }
}
</script>

<template>
  <div class="get-money-by-tag">
    <div ref="inputEl" class="search-input-box">
      <input
        v-model.trim="tag"
        class="search-input"
        type="text"
        placeholder="请输入投稿标签"
        @keyup.enter="searchHandler"
      />
      <div class="search-button" @click="searchHandler">搜索</div>
    </div>

    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="product-name">投稿话题</th>
          <th class="money">金额</th>
          <th class="create-time">奖励时间</th>
          <th class="total-money">累计金额</th>
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
          <td>{{ item.productName }}</td>
          <td>{{ item.money }}</td>
          <td>{{ format(item.createTime, 'yyyy-MM-dd HH:mm:ss') }}</td>
          <td>{{ item.totalMoney }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.get-money-by-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;

  .search-input-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    width: 83.3%;
    padding: 20px 0;
    background-color: #fff;

    .search-input {
      width: 80%;
      height: 40px;
      border-radius: 22px;
      border: none;
      outline: none;
      border: 1px solid #ccc;
      font-size: 20px;
      padding: 0 16px;
      user-select: none;
    }

    .search-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 10%;
      height: 40px;
      background-color: orange;
      border-radius: 22px;
      font-size: 20px;
      margin-left: 50px;
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: #ffb121;
      }
    }
  }

  .table-container {
    margin-top: 100px;
    padding-bottom: 50px;
    width: 98%;

    .table-tr {
      font-size: 22px;
      .money {
        width: 8%;
      }

      .create-time {
        width: 20%;
      }

      .total-money {
        width: 8%;
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
