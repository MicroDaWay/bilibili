import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBilibiliStore = defineStore(
  'bilibili',
  () => {
    const excelData = ref([])
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

    const setRoomUrl = (value) => {
      roomUrl.value = value
    }

    const setLiveItem = (value) => {
      liveItem.value = value
    }

    return {
      excelData,
      roomUrl,
      liveItem,
      setExcelData,
      setRoomUrl,
      setLiveItem
    }
  },
  {
    persist: true
  }
)
