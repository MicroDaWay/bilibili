import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 保存bilibili.xlsx的数据到pinia
  saveExcelData: (callback) => {
    ipcRenderer.on('save-excel-data', (e, data) => {
      callback(data)
    })
  },
  // 获取bilibili投稿数据
  fetchBilibiliData: (params) => ipcRenderer.invoke('fetch-bilibili-data', params),
  showMessage: (params) => ipcRenderer.invoke('show-message', params)
})
