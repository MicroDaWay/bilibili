<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])
const totalMoney = ref('')
const balance = ref('')

async function main() {
  try {
    await window.electronAPI.initTableRewards()
    const result = await window.electronAPI.fetchEarningsCenter()
    itemList.value = result.rows
    totalMoney.value = result.totalMoney
    balance.value = result.balance

    window.electronAPI.showMessage({
      type: 'info',
      message: '查询结束'
    })
  } catch (error) {
    console.error('获取数据失败:', error.message)
  }
}

function formatMoney(money) {
  return parseFloat(money).toFixed(2).padEnd(6)
}
</script>

<template>
  <div class="earnings-center">
    <div class="text" @click="main">收益中心</div>
    <div class="container">
      <div class="total-money">累计金额：{{ totalMoney }}</div>
      <div class="balance">账户余额：{{ balance }}</div>
    </div>
    <ul class="item-list">
      <li v-for="item in itemList" :key="item.id" class="item-text">
        发放时间 = {{ format(item.create_time, 'yyyy-MM-dd') }}，发放金额 =
        {{ formatMoney(item.money) }}，活动名称 =
        {{ item.product_name }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.earnings-center {
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

  .container {
    margin: 10px 0;

    .total-money,
    .balance {
      font-size: 22px;

      &:hover {
        cursor: pointer;
        background-color: orange;
      }
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
