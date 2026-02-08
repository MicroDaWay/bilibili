import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 持久化存储Excel数据
  saveBilibiliData: (callback) => ipcRenderer.on('save-bilibili-data', (e, data) => callback(data)),
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
  hotActivity: () => ipcRenderer.send('hot-activity'),
  hotActivityProgress: (callback) => ipcRenderer.on('hot-activity-progress', callback),
  hotActivityFinish: (callback) => ipcRenderer.on('hot-activity-finish', callback),
  removeHotActivityProgressListener: (callback) =>
    ipcRenderer.removeListener('hot-activity-progress', callback),
  removeHotActivityFinishListener: (callback) =>
    ipcRenderer.removeListener('hot-activity-finish', callback),
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
  eventDisqualification: () => ipcRenderer.send('event-disqualification'),
  eventDisqualificationProgress: (callback) =>
    ipcRenderer.on('event-disqualification-progress', callback),
  eventDisqualificationFinish: (callback) =>
    ipcRenderer.on('event-disqualification-finish', callback),
  removeEventDisqualificationProgressListener: (callback) =>
    ipcRenderer.removeListener('event-disqualification-progress', callback),
  removeEventDisqualificationFinishListener: (callback) =>
    ipcRenderer.removeListener('event-disqualification-finish', callback),
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
  // 查询hot_activity表中的数据
  getHotActivityData: () => ipcRenderer.invoke('get-hot-activity-data'),
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
  getWithdrawByYear: () => ipcRenderer.invoke('get-withdraw-by-year'),
  saveOutcomeData: (callback) => ipcRenderer.on('save-outcome-data', (e, data) => callback(data)),
  saveSalaryData: (callback) => ipcRenderer.on('save-salary-data', (e, data) => callback(data)),
  saveOutcome: (params) => ipcRenderer.invoke('save-outcome', params),
  saveSalary: (params) => ipcRenderer.invoke('save-salary', params),
  // 查询每月的收入
  getIncomeByMonth: () => ipcRenderer.invoke('get-income-by-month'),
  // 查询每年的收入
  getIncomeByYear: () => ipcRenderer.invoke('get-income-by-year'),
  // 查询支出明细
  getOutcomeDetails: () => ipcRenderer.invoke('get-outcome-details'),
  // 查询每月的支出
  getOutcomeByMonth: () => ipcRenderer.invoke('get-outcome-by-month'),
  // 查询每年的支出
  getOutcomeByYear: () => ipcRenderer.invoke('get-outcome-by-year'),
  // 停止录制
  stopRecord: () => ipcRenderer.invoke('stop-record'),
  // 通过直播间地址开始录制
  startRecordByRoomUrl: (params) => ipcRenderer.invoke('start-record-by-room-url', params),
  appExit: (callback) => ipcRenderer.on('app-exit', callback),
  // 判断是否正在直播录制
  isRecording: () => ipcRenderer.invoke('is-recording'),
  // 判断是否正在监控直播
  isWatching: () => ipcRenderer.invoke('is-watching'),
  // 开始录制直播间
  startRecord: (callback) => ipcRenderer.on('start-record', (e, data) => callback(data)),
  // 直播断开后重新开始录制
  restartRecord: (callback) => ipcRenderer.on('restart-record', () => callback())
})
