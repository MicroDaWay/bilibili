import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBilibiliStore = defineStore(
  'bilibili',
  () => {
    const excelData = ref([])

    const setExcelData = (value) => {
      excelData.value = value
    }

    return {
      excelData,
      setExcelData
    }
  },
  {
    persist: true
  }
)
