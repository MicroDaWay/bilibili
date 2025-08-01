import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 持久化存储Excel数据
  saveExcelData: (callback) => {
    ipcRenderer.on('save-excel-data', (e, data) => {
      callback(data)
    })
  },
  // 消息弹窗
  showMessage: (params) => ipcRenderer.invoke('show-message', params),
  // 展示右键菜单
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  // 获取登录二维码
  getQRCode: () => ipcRenderer.invoke('get-qrcode'),
  // 检查二维码状态
  checkQRCodeStatus: (params) => ipcRenderer.invoke('check-qrcode-status', params),
  // 保存cookie
  saveCookie: (params) => ipcRenderer.invoke('save-cookie', params),
  // 获取导航栏数据
  getNavigationData: () => ipcRenderer.invoke('get-navigation-data'),
  // 退出登录
  logout: () => ipcRenderer.invoke('logout'),
  // 稿件管理
  manuscriptManagement: (params) => ipcRenderer.invoke('manuscript-management', params),
  // 打卡挑战
  checkInChallenge: () => ipcRenderer.invoke('check-in-challenge'),
  // 热门活动
  popularEvents: () => ipcRenderer.invoke('popular-events'),
  // 收益中心
  earningsCenter: () => ipcRenderer.invoke('earnings-center'),
  // 更新数据库
  updateDatabase: () => ipcRenderer.invoke('update-database'),
  // 活动资格取消
  cancelEventQualification: () => ipcRenderer.invoke('cancel-event-qualification'),
  // 获取bilibili表中的数据
  getBilibiliData: () => ipcRenderer.invoke('get-bilibili-data'),
  // 获取rewards表中的数据
  getRewardsData: () => ipcRenderer.invoke('get-rewards-data'),
  // 获取disqualification表中的数据
  getDisqualificationData: () => ipcRenderer.invoke('get-disqualification-data')
})
