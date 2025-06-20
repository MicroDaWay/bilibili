import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 保存bilibili.xlsx的数据到pinia
  saveExcelData: (callback) => {
    ipcRenderer.on('save-excel-data', (e, data) => {
      callback(data)
    })
  },
  // 获取bilibili稿件管理数据
  fetchBilibiliData: (params) => ipcRenderer.invoke('fetch-bilibili-data', params),
  // 获取bilibili打卡挑战数据
  fetchBilibiliActivities: () => ipcRenderer.invoke('fetch-bilibili-activities'),
  showMessage: (params) => ipcRenderer.invoke('show-message', params)
})
