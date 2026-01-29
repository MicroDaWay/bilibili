import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBilibiliStore = defineStore(
  'bilibili',
  () => {
    const excelData = ref([])
    const totalMoney = ref(0)
    const balance = ref(0)
    const roomUrl = ref('')
    const liveItem = ref({
      username: '',
      title: '',
      userCover: '',
      liveTime: '',
      areaName: ''
    })

    const setExcelData = (value) => {
      excelData.value = value
    }

    const setTotalMoney = (value) => {
      totalMoney.value = value
    }

    const setBalance = (value) => {
      balance.value = value
    }

    const setRoomUrl = (value) => {
      roomUrl.value = value
    }

    const setLiveItem = (value) => {
      liveItem.value = value
    }

    return {
      excelData,
      totalMoney,
      balance,
      roomUrl,
      liveItem,
      setExcelData,
      setTotalMoney,
      setBalance,
      setRoomUrl,
      setLiveItem
    }
  },
  {
    persist: true
  }
)
