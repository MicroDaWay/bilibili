<!-- 收益中心 -->
<script setup>
import { format } from 'date-fns'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'
import { useBilibiliStore } from '@/stores/bilibiliStore'

const itemList = ref([])
const totalMoney = ref('')
const balance = ref('')
const title = '收益中心'
const isProcessing = ref(false)
let globalItemListRef = null
const TableComponentContainer = ref(null)

const columns = [
  {
    title: '发放时间',
    key: 'createTime',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '发放金额', key: 'money', width: '8%' },
  { title: '活动名称', key: 'productName' }
]

const bilibiliStore = useBilibiliStore()

const handleProgress = async (event, item) => {
  if (globalItemListRef) {
    itemList.value.push({
      createTime: item.createTime,
      money: item.money,
      productName: item.productName
    })
    totalMoney.value = item.totalMoney
    balance.value = item.balance
    bilibiliStore.setTotalMoney(item.totalMoney)
    bilibiliStore.setBalance(item.balance)

    await nextTick()
    const container = TableComponentContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }
}

const handleFinish = () => {
  if (globalItemListRef) {
    isProcessing.value = false
  }
}

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getRewardsData()
  itemList.value = result
}

onMounted(() => {
  globalItemListRef = itemList
  isProcessing.value = false
  totalMoney.value = bilibiliStore.totalMoney
  balance.value = bilibiliStore.balance

  window.electronAPI.removeEarningsCenterProgressListener(handleProgress)
  window.electronAPI.removeEarningsCenterFinishListener(handleFinish)

  window.electronAPI.earningsCenterProgress(handleProgress)
  window.electronAPI.earningsCenterFinish(handleFinish)

  getDatabaseData()
})

onUnmounted(() => {
  globalItemListRef = null
  window.electronAPI.removeEarningsCenterProgressListener(handleProgress)
  window.electronAPI.removeEarningsCenterFinishListener(handleFinish)
})

// 主函数
const main = () => {
  if (isProcessing.value) return
  isProcessing.value = true
  itemList.value = []
  window.electronAPI.earningsCenter()
}

const orderHandler = () => {
  // 根据金额降序排序
  itemList.value.sort((a, b) => b.money - a.money)
}
</script>

<template>
  <div ref="TableComponentContainer" class="data-table-container">
    <TableComponent
      :title="title"
      :item-list="itemList"
      :columns="columns"
      :total-money="totalMoney"
      :balance="balance"
      @main-handler="main"
      @order-handler="orderHandler"
    ></TableComponent>
  </div>
</template>

<style scoped lang="scss">
.data-table-container {
  height: 100%;
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
