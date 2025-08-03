import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBilibiliStore = defineStore(
  'bilibili',
  () => {
    const excelData = ref([])
    const totalMoney = ref(0)
    const balance = ref(0)

    const setExcelData = (value) => {
      excelData.value = value
    }

    const setTotalMoney = (value) => {
      totalMoney.value = value
    }

    const setBalance = (value) => {
      balance.value = value
    }

    return {
      excelData,
      totalMoney,
      balance,
      setExcelData,
      setTotalMoney,
      setBalance
    }
  },
  {
    persist: true
  }
)
