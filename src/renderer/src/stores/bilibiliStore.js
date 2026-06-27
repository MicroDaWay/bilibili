import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBilibiliStore = defineStore(
  'bilibili',
  () => {
    const uid = ref('')
    const uname = ref('')
    const excelData = ref([])
    const roomUrl = ref('')
    const liveItem = ref({
      username: '',
      title: '',
      userCover: '',
      liveTime: '',
      areaName: ''
    })

    const setUid = (value) => {
      uid.value = value
    }

    const setUname = (value) => {
      uname.value = value
    }

    const setExcelData = (value) => {
      excelData.value = value
    }

    const setRoomUrl = (value) => {
      roomUrl.value = value
    }

    const setLiveItem = (value) => {
      liveItem.value = value
    }

    const resetStore = () => {
      uid.value = ''
      uname.value = ''
      excelData.value = []
      roomUrl.value = ''
      liveItem.value = {
        username: '',
        title: '',
        userCover: '',
        liveTime: '',
        areaName: ''
      }
    }

    return {
      uid,
      uname,
      excelData,
      roomUrl,
      liveItem,
      setUid,
      setUname,
      setExcelData,
      setRoomUrl,
      setLiveItem,
      resetStore
    }
  },
  {
    persist: true
  }
)
