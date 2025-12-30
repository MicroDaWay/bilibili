<!-- 数据表格组件 -->
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  itemList: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  totalMoney: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['main-handler'])

const activeRow = ref(null)
const textEl = ref(null)
let resizeObserver = null

const clickHandler = () => {
  emit('main-handler')
}

const checkScrollbar = () => {
  const container = document.querySelector('.right-content')
  if (!container || !textEl.value) return
  const hasScrollbar = container.scrollHeight > container.clientHeight
  textEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
}

onMounted(() => {
  // 初始化检测
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
</script>

<template>
  <div class="data-table">
    <div ref="textEl" class="text" @click="clickHandler">{{ props.title }}</div>
    <div v-if="props.totalMoney && props.balance" class="container">
      <div class="total-money">累计金额：{{ totalMoney }}</div>
      <div class="balance">账户余额：{{ balance }}</div>
    </div>
    <table
      class="table-container"
      :style="{
        marginTop: props.totalMoney && props.balance ? '24vh' : '14vh'
      }"
    >
      <thead v-if="props.itemList.length">
        <tr class="table-tr">
          <th
            v-for="column in props.columns"
            :key="column.key"
            :style="{ width: column.width || 'auto' }"
          >
            {{ column.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in props.itemList"
          :key="item.name"
          class="tr-text"
          :class="{ 'tr-active': activeRow === item }"
          @click="activeRow = item"
        >
          <td v-for="column in columns" :key="column.key">
            {{ column.formatter ? column.formatter(item[column.key]) : item[column.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.data-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50px;

  .text {
    position: fixed;
    width: 83.3%;
    height: 14vh;
    line-height: 14vh;
    text-align: center;
    font-size: 2.4vw;
    background-color: #fff;
    user-select: none;

    &:hover {
      cursor: pointer;
      background-color: orange;
    }
  }

  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 14vh;
    width: calc(83.3% - 12px);
    text-align: center;
    margin-bottom: 10px;
    background-color: #fff;

    .total-money,
    .balance {
      font-size: 1.5vw;

      &:hover {
        background-color: orange;
      }
    }
  }

  .table-container {
    padding-bottom: 50px;
    width: 98%;

    .table-tr {
      font-size: 1.5vw;
    }

    .tr-text {
      font-size: 1.5vw;

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
