<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'

const itemList = ref([])
const totalMoney = ref('')
const balance = ref('')

// 主函数
async function main() {
  const result = await window.electronAPI.earningsCenter()
  itemList.value = result.rows
  totalMoney.value = result.totalMoney
  balance.value = result.balance

  window.electronAPI.showMessage({
    title: '收益中心',
    type: 'info',
    message: '查询结束'
  })
}
</script>

<template>
  <div class="earnings-center">
    <div class="text" @click="main">收益中心</div>
    <div class="container">
      <div class="total-money">累计金额：{{ totalMoney }}</div>
      <div class="balance">账户余额：{{ balance }}</div>
    </div>
    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th class="create-time">发放时间</th>
          <th class="money">发放金额</th>
          <th class="title">活动名称</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itemList" :key="item.id" class="tr-text">
          <td>{{ format(item.create_time, 'yyyy-MM-dd HH:mm:ss') }}</td>
          <td>{{ item.money }}</td>
          <td>{{ item.product_name }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.earnings-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0 50px 0;

  .text {
    position: fixed;
    width: 1280px;
    height: 100px;
    line-height: 100px;
    text-align: center;
    font-size: 30px;
    background-color: #fff;

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
    top: 100px;
    width: 1280px;
    text-align: center;
    margin-bottom: 10px;
    background-color: #fff;

    .total-money,
    .balance {
      font-size: 22px;

      &:hover {
        background-color: orange;
      }
    }
  }

  .table-container {
    margin-top: 160px;
    padding-bottom: 50px;
    width: 98%;

    .table-tr {
      font-size: 22px;

      .create-time {
        width: 20%;
      }

      .money {
        width: 8%;
      }
    }

    .tr-text {
      font-size: 22px;
      margin: 6px 0;

      &:hover {
        background-color: orange;
      }
    }
  }
}
</style>
