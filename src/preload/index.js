import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 持久化存储Excel数据
  saveBilibiliData: (callback) => ipcRenderer.on('save-bilibili-data', (e, data) => callback(data)),
  // 登录成功
  loginSuccess: (callback) => ipcRenderer.on('login-success', callback),
  // 消息弹窗
  showMessage: (params) => ipcRenderer.invoke('show-message', params),
  // 查询登录二维码
  getQRCode: () => ipcRenderer.invoke('get-qrcode'),
  // 检查二维码状态
  checkQRCodeStatus: (qrcode_key) => ipcRenderer.invoke('check-qrcode-status', qrcode_key),
  // 保存cookie
  saveCookie: (cookie) => ipcRenderer.invoke('save-cookie', cookie),
  // 查询导航栏数据
  getNavigationData: () => ipcRenderer.invoke('get-navigation-data'),
  // 退出登录
  logout: () => ipcRenderer.invoke('logout'),
  // 修改登录状态
  setLoginStatus: (status) => ipcRenderer.send('login-status-change', status),
  // 监听登录状态变更
  loginStatusChange: (status) => ipcRenderer.on('login-status-change', status),
  // 稿件管理
  manuscriptManagement: (pn) => ipcRenderer.invoke('manuscript-management', pn),
  // 热门活动
  hotActivity: () => ipcRenderer.send('hot-activity'),
  hotActivityProgress: (callback) => ipcRenderer.on('hot-activity-progress', callback),
  hotActivityFinish: (callback) => ipcRenderer.on('hot-activity-finish', callback),
  removeHotActivityProgressListener: (callback) =>
    ipcRenderer.removeListener('hot-activity-progress', callback),
  removeHotActivityFinishListener: (callback) =>
    ipcRenderer.removeListener('hot-activity-finish', callback),
  // 收益中心
  earningsCenter: (uid) => ipcRenderer.send('earnings-center', uid),
  earningsCenterProgress: (callback) => ipcRenderer.on('earnings-center-progress', callback),
  earningsCenterFinish: (callback) => ipcRenderer.on('earnings-center-finish', callback),
  removeEarningsCenterProgressListener: (callback) =>
    ipcRenderer.removeListener('earnings-center-progress', callback),
  removeEarningsCenterFinishListener: (callback) =>
    ipcRenderer.removeListener('earnings-center-finish', callback),
  // 更新数据库
  updateDatabase: (uid) => ipcRenderer.send('update-database', uid),
  updateDatabaseProgress: (callback) => ipcRenderer.on('update-database-progress', callback),
  updateDatabaseFinish: (callback) => ipcRenderer.on('update-database-finish', callback),
  removeUpdateDatabaseProgressListener: (callback) =>
    ipcRenderer.removeListener('update-database-progress', callback),
  removeUpdateDatabaseFinishListener: (callback) =>
    ipcRenderer.removeListener('update-database-finish', callback),
  // 活动资格取消稿件
  eventDisqualification: (uid) => ipcRenderer.send('event-disqualification', uid),
  eventDisqualificationProgress: (callback) =>
    ipcRenderer.on('event-disqualification-progress', callback),
  eventDisqualificationFinish: (callback) =>
    ipcRenderer.on('event-disqualification-finish', callback),
  removeEventDisqualificationProgressListener: (callback) =>
    ipcRenderer.removeListener('event-disqualification-progress', callback),
  removeEventDisqualificationFinishListener: (callback) =>
    ipcRenderer.removeListener('event-disqualification-finish', callback),
  // 查询播放量<100的稿件
  viewLessOneHundred: (uid) => ipcRenderer.invoke('view-less-one-hundred', uid),
  // 查询每年获得的激励金额
  getMoneyByYear: (uid) => ipcRenderer.invoke('get-money-by-year', uid),
  // 查询每月获得的激励金额
  getMoneyByMonth: (uid) => ipcRenderer.invoke('get-money-by-month', uid),
  // 根据标签查询激励金额
  getMoneyByTag: (productName, uid) => ipcRenderer.invoke('get-money-by-tag', productName, uid),
  // 根据投稿标签查询稿件
  getManuscriptByTag: (tag, uid) => ipcRenderer.invoke('get-manuscript-by-tag', tag, uid),
  // 根据标签查询取消稿件
  getDisqualificationByTag: (tag, uid) =>
    ipcRenderer.invoke('get-disqualification-by-tag', tag, uid),
  // 查询manuscript表中的数据
  getManuscriptData: (uid) => ipcRenderer.invoke('get-manuscript-data', uid),
  // 查询hot_activity表中的数据
  getHotActivityData: () => ipcRenderer.invoke('get-hot-activity-data'),
  // 查询rewards表中的数据
  getRewardsData: (uid) => ipcRenderer.invoke('get-rewards-data', uid),
  // 查询disqualification表中的数据
  getDisqualificationData: (uid) => ipcRenderer.invoke('get-disqualification-data', uid),
  // 查询收益中心累计金额
  getTotalMoney: (uid) => ipcRenderer.invoke('get-total-money', uid),
  // 查询收益中心余额
  getBalance: (uid) => ipcRenderer.invoke('get-balance', uid),
  // 查询每月的工资
  getSalaryByMonth: (uid) => ipcRenderer.invoke('get-salary-by-month', uid),
  // 查询每年的工资
  getSalaryByYear: (uid) => ipcRenderer.invoke('get-salary-by-year', uid),
  // 查询每月提现金额
  getWithdrawByMonth: (uid) => ipcRenderer.invoke('get-withdraw-by-month', uid),
  // 查询每年提现金额
  getWithdrawByYear: (uid) => ipcRenderer.invoke('get-withdraw-by-year', uid),
  saveOutcomeData: (callback) => ipcRenderer.on('save-outcome-data', (e, data) => callback(data)),
  saveSalaryData: (callback) => ipcRenderer.on('save-salary-data', (e, data) => callback(data)),
  saveOutcome: (excelData, uid) => ipcRenderer.invoke('save-outcome', excelData, uid),
  saveSalary: (excelData, uid) => ipcRenderer.invoke('save-salary', excelData, uid),
  // 查询每月的收入
  getIncomeByMonth: (uid) => ipcRenderer.invoke('get-income-by-month', uid),
  // 查询每年的收入
  getIncomeByYear: (uid) => ipcRenderer.invoke('get-income-by-year', uid),
  // 查询支出明细
  getOutcomeDetails: (uid) => ipcRenderer.invoke('get-outcome-details', uid),
  // 查询每月的支出
  getOutcomeByMonth: (uid) => ipcRenderer.invoke('get-outcome-by-month', uid),
  // 查询每年的支出
  getOutcomeByYear: (uid) => ipcRenderer.invoke('get-outcome-by-year', uid),
  // 停止录制
  stopRecord: () => ipcRenderer.invoke('stop-record'),
  // 通过直播间地址开始录制
  startRecordByRoomUrl: (roomUrl) => ipcRenderer.invoke('start-record-by-room-url', roomUrl),
  appExit: (callback) => ipcRenderer.on('app-exit', callback),
  // 开始录制直播间
  startRecord: (callback) => ipcRenderer.on('start-record', (e, data) => callback(data)),
  // 直播断开后重新开始录制
  restartRecord: (callback) => ipcRenderer.on('restart-record', (e, data) => callback(data)),
  // 合并MP4文件
  mergeMp4: () => ipcRenderer.invoke('merge-mp4'),
  // 获取录制或监控状态
  getStatus: () => ipcRenderer.invoke('get-status'),
  // 录制或监控状态变化
  statusChange: (callback) => ipcRenderer.on('status-change', (e, params) => callback(params))
})
