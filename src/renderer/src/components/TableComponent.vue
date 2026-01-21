<!-- 表格组件 -->
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

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

const emit = defineEmits(['main-handler', 'order-handler'])

const headerRef = ref(null)
const stickyTop = ref(0)
const activeRow = ref(null)

const mainHandler = () => {
  emit('main-handler')
}

const orderHandler = () => {
  emit('order-handler')
}

const calcHeaderHeight = () => {
  nextTick(() => {
    if (headerRef.value) {
      stickyTop.value = headerRef.value.offsetHeight
    }
  })
}

onMounted(() => {
  calcHeaderHeight()
  window.addEventListener('resize', calcHeaderHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calcHeaderHeight)
})
</script>

<template>
  <div class="table-component">
    <div ref="headerRef" class="header">
      <div class="title" @click="mainHandler">{{ props.title }}</div>
      <div v-if="props.totalMoney && props.balance" class="container">
        <div class="total-money">累计金额：{{ props.totalMoney }}</div>
        <div class="balance">账户余额：{{ props.balance }}</div>
      </div>
      <table v-if="props.itemList.length" class="table-thead">
        <thead>
          <tr class="table-tr" @click="orderHandler">
            <th
              v-for="column in props.columns"
              :key="column.key"
              :style="{ width: column.width || 'auto' }"
            >
              {{ column.title }}
            </th>
          </tr>
        </thead>
      </table>
    </div>
    <table class="table-tbody">
      <tbody>
        <tr
          v-for="item in props.itemList"
          :key="item.name"
          class="tr-text"
          :class="{ 'tr-active': activeRow === item }"
          @click="activeRow = item"
        >
          <td
            v-for="column in props.columns"
            :key="column.key"
            :style="{ width: column.width || 'auto' }"
          >
            {{ column.formatter ? column.formatter(item[column.key]) : item[column.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.table-component {
  .header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #fff;

    .title {
      height: 14vh;
      line-height: 14vh;
      text-align: center;
      font-size: 2.4vw;
      cursor: pointer;

      &:hover {
        background-color: var(--color-primary);
      }
    }

    .container {
      text-align: center;
      padding: 1vh 0;

      .total-money,
      .balance {
        font-size: 1.5vw;

        &:hover {
          background-color: var(--color-primary);
        }
      }
    }

    .table-thead {
      width: 100%;

      .table-tr {
        font-size: 1.5vw;
        cursor: pointer;
      }
    }
  }

  .table-tbody {
    width: 100%;

    .tr-text {
      font-size: 1.5vw;

      &.tr-active {
        background-color: var(--color-primary);
      }

      &:hover {
        background-color: var(--color-primary);
      }
    }
  }
}
</style>
