<!-- 收益中心 -->
<script setup>
import { format } from 'date-fns'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

import TableComponent from '@/components/TableComponent.vue'
import { useBilibiliStore } from '@/stores/bilibiliStore'

const itemList = ref([])
const totalMoney = ref(0)
const balance = ref(0)
const title = '收益中心'
const isProcessing = ref(false)
let globalItemListRef = null

const columns = [
  {
    title: '发放时间',
    key: 'createTime',
    width: '22%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '发放金额', key: 'money', width: '10%' },
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
    totalMoney.value = +item.totalMoney
    balance.value = +item.balance
    bilibiliStore.setTotalMoney(+item.totalMoney)
    bilibiliStore.setBalance(+item.balance)

    await nextTick()
    const container = document.querySelector('.right-content')
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
  <TableComponent
    :title="title"
    :item-list="itemList"
    :columns="columns"
    :total-money="totalMoney"
    :balance="balance"
    @main-handler="main"
    @order-handler="orderHandler"
  ></TableComponent>
</template>

<style scoped lang="scss"></style>
