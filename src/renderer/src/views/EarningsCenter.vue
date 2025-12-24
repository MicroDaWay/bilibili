<!-- 收益中心 -->
<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { format } from 'date-fns'
import { useBilibiliStore } from '../stores/bilibiliStore'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const totalMoney = ref('')
const balance = ref('')
const title = '收益中心'
const isProcessing = ref(false)
let globalItemListRef = null
const dataTableContainer = ref(null)

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
    const container = dataTableContainer.value
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
</script>

<template>
  <div ref="dataTableContainer" class="data-table-container">
    <DataTable
      :title="title"
      :item-list="itemList"
      :columns="columns"
      :total-money="totalMoney"
      :balance="balance"
      @main-handler="main"
    ></DataTable>
  </div>
</template>

<style scoped lang="scss">
.data-table-container {
  height: 100%;
  overflow-y: auto;
}
</style>
