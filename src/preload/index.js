import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 保存bilibili.xlsx的数据到pinia
  saveExcelData: (callback) => {
    ipcRenderer.on('save-excel-data', (e, data) => {
      callback(data)
    })
  },
  // 消息弹窗
  showMessage: (params) => ipcRenderer.invoke('show-message', params),
  // 获取稿件管理数据
  fetchManuscriptManagement: (params) => ipcRenderer.invoke('manuscript-management', params),
  // 获取打卡挑战数据
  fetchCheckInChallenge: () => ipcRenderer.invoke('check-in-challenge'),
  // 获取热门活动数据
  fetchPopularEvents: () => ipcRenderer.invoke('popular-events')
})
