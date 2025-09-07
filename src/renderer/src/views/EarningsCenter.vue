<!-- 收益中心 -->
<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { useBilibiliStore } from '../stores/bilibiliStore'
import DataTable from '../components/DataTable.vue'

const itemList = ref([])
const totalMoney = ref('')
const balance = ref('')
const title = '收益中心'
const columns = [
  {
    title: '发放时间',
    key: 'create_time',
    width: '20%',
    formatter: (value) => format(value, 'yyyy-MM-dd HH:mm:ss')
  },
  { title: '发放金额', key: 'money', width: '8%' },
  { title: '活动名称', key: 'product_name' }
]

const bilibiliStore = useBilibiliStore()

// 获取数据库中的数据
const getDatabaseData = async () => {
  const result = await window.electronAPI.getRewardsData()
  itemList.value = result
}

onMounted(() => {
  itemList.value = []
  totalMoney.value = bilibiliStore.totalMoney
  balance.value = bilibiliStore.balance

  window.electronAPI.earningsCenterProgress((event, item) => {
    itemList.value.push({
      create_time: item.create_time,
      money: item.money,
      product_name: item.product_name
    })
    totalMoney.value = item.totalMoney
    balance.value = item.balance
    bilibiliStore.setTotalMoney(item.totalMoney)
    bilibiliStore.setBalance(item.balance)
  })

  window.electronAPI.earningsCenterFinish(() => {
    window.electronAPI.showMessage({
      title: '收益中心',
      type: 'info',
      message: '查询结束'
    })
  })

  getDatabaseData()
})

// 主函数
const main = () => {
  itemList.value = []
  window.electronAPI.earningsCenter()
}
</script>

<template>
  <DataTable
    :title="title"
    :item-list="itemList"
    :columns="columns"
    :total-money="totalMoney"
    :balance="balance"
    @main-handler="main"
  ></DataTable>
</template>

<style scoped lang="scss"></style>
