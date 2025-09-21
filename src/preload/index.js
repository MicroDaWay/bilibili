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
  earningsCenter: () => ipcRenderer.send('earnings-center'),
  earningsCenterProgress: (callback) => ipcRenderer.on('earnings-center-progress', callback),
  earningsCenterFinish: (callback) => ipcRenderer.on('earnings-center-finish', callback),
  // 更新数据库
  updateDatabase: () => ipcRenderer.send('update-database'),
  updateDatabaseProgress: (callback) => ipcRenderer.on('update-database-progress', callback),
  updateDatabaseFinish: (callback) => ipcRenderer.on('update-database-finish', callback),
  // 活动资格取消稿件
  cancelEventQualification: () => ipcRenderer.send('cancel-event-qualification'),
  cancelEventQualificationProgress: (callback) =>
    ipcRenderer.on('cancel-event-qualification-progress', callback),
  cancelEventQualificationFinish: (callback) =>
    ipcRenderer.on('cancel-event-qualification-finish', callback),
  // 播放量<100的稿件
  viewLessOneHundred: () => ipcRenderer.invoke('view-less-one-hundred'),
  // 每年获得的激励金额
  moneyByYear: () => ipcRenderer.invoke('money-by-year'),
  // 每月获得的激励金额
  moneyByMonth: () => ipcRenderer.invoke('money-by-month'),
  // 根据标签查询激励金额
  getMoneyByTag: (params) => ipcRenderer.invoke('get-money-by-tag', params),
  // 根据投稿标签查询稿件
  getManuscriptByTag: (params) => ipcRenderer.invoke('get-manuscript-by-tag', params),
  // 获取bilibili表中的数据
  getBilibiliData: () => ipcRenderer.invoke('get-bilibili-data'),
  // 获取rewards表中的数据
  getRewardsData: () => ipcRenderer.invoke('get-rewards-data'),
  // 获取disqualification表中的数据
  getDisqualificationData: () => ipcRenderer.invoke('get-disqualification-data')
})
