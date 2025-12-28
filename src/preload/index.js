import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 持久化存储Excel数据
  saveExcelData: (callback) => {
    ipcRenderer.on('save-excel-data', (event, data) => {
      callback(data)
    })
  },
  // 检查登录状态
  checkLoginStatus: () => ipcRenderer.invoke('check-login-status'),
  // 登录成功
  loginSuccess: (callback) => ipcRenderer.on('login-success', callback),
  // 消息弹窗
  showMessage: (params) => ipcRenderer.invoke('show-message', params),
  // 展示右键菜单
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  // 查询登录二维码
  getQRCode: () => ipcRenderer.invoke('get-qrcode'),
  // 检查二维码状态
  checkQRCodeStatus: (params) => ipcRenderer.invoke('check-qrcode-status', params),
  // 保存cookie
  saveCookie: (params) => ipcRenderer.invoke('save-cookie', params),
  // 查询导航栏数据
  getNavigationData: () => ipcRenderer.invoke('get-navigation-data'),
  // 退出登录
  logout: () => ipcRenderer.invoke('logout'),
  // 修改登录状态
  setLoginStatus: (params) => ipcRenderer.send('login-status-change', params),
  // 监听登录状态变更
  loginStatusChange: (params) => ipcRenderer.on('login-status-change', params),
  // 稿件管理
  manuscriptManagement: (params) => ipcRenderer.invoke('manuscript-management', params),
  // 热门活动
  popularEvents: () => ipcRenderer.invoke('popular-events'),
  // 收益中心
  earningsCenter: () => ipcRenderer.send('earnings-center'),
  earningsCenterProgress: (callback) => ipcRenderer.on('earnings-center-progress', callback),
  earningsCenterFinish: (callback) => ipcRenderer.on('earnings-center-finish', callback),
  removeEarningsCenterProgressListener: (callback) =>
    ipcRenderer.removeListener('earnings-center-progress', callback),
  removeEarningsCenterFinishListener: (callback) =>
    ipcRenderer.removeListener('earnings-center-finish', callback),
  // 更新数据库
  updateDatabase: () => ipcRenderer.send('update-database'),
  updateDatabaseProgress: (callback) => ipcRenderer.on('update-database-progress', callback),
  updateDatabaseFinish: (callback) => ipcRenderer.on('update-database-finish', callback),
  removeUpdateDatabaseProgressListener: (callback) =>
    ipcRenderer.removeListener('update-database-progress', callback),
  removeUpdateDatabaseFinishListener: (callback) =>
    ipcRenderer.removeListener('update-database-finish', callback),
  // 活动资格取消稿件
  cancelEventQualification: () => ipcRenderer.send('cancel-event-qualification'),
  cancelEventQualificationProgress: (callback) =>
    ipcRenderer.on('cancel-event-qualification-progress', callback),
  cancelEventQualificationFinish: (callback) =>
    ipcRenderer.on('cancel-event-qualification-finish', callback),
  removeCancelEventQualificationProgressListener: (callback) =>
    ipcRenderer.removeListener('cancel-event-qualification-progress', callback),
  removeCancelEventQualificationFinishListener: (callback) =>
    ipcRenderer.removeListener('cancel-event-qualification-finish', callback),
  // 查询播放量<100的稿件
  viewLessOneHundred: () => ipcRenderer.invoke('view-less-one-hundred'),
  // 查询每年获得的激励金额
  getMoneyByYear: () => ipcRenderer.invoke('get-money-by-year'),
  // 查询每月获得的激励金额
  getMoneyByMonth: () => ipcRenderer.invoke('get-money-by-month'),
  // 根据标签查询激励金额
  getMoneyByTag: (params) => ipcRenderer.invoke('get-money-by-tag', params),
  // 根据投稿标签查询稿件
  getManuscriptByTag: (params) => ipcRenderer.invoke('get-manuscript-by-tag', params),
  // 根据标签查询取消稿件
  getDisqualificationByTag: (params) => ipcRenderer.invoke('get-disqualification-by-tag', params),
  // 查询manuscript表中的数据
  getManuscriptData: () => ipcRenderer.invoke('get-manuscript-data'),
  // 查询rewards表中的数据
  getRewardsData: () => ipcRenderer.invoke('get-rewards-data'),
  // 查询disqualification表中的数据
  getDisqualificationData: () => ipcRenderer.invoke('get-disqualification-data'),
  // 查询每月的工资
  getSalaryByMonth: () => ipcRenderer.invoke('get-salary-by-month'),
  // 查询每年的工资
  getSalaryByYear: () => ipcRenderer.invoke('get-salary-by-year'),
  // 查询每月提现金额
  getWithdrawByMonth: () => ipcRenderer.invoke('get-withdraw-by-month'),
  // 查询每年提现金额
  getWithdrawByYear: () => ipcRenderer.invoke('get-withdraw-by-year')
})
