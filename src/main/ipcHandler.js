import path from 'node:path'

import axios from 'axios'
import { format } from 'date-fns'
import { app, BrowserWindow, dialog, ipcMain } from 'electron'

import {
  excelDateToJSDate,
  formatTimestampToDatetime,
  getAnyDaysAgo,
  parseRoomId,
  rowsToCamel,
  sleep
} from '../renderer/src/utils'
import {
  getBalance,
  getEarningsList,
  getHotActivityList,
  getM3U8,
  getManuscriptList,
  getMessageList,
  getUsernameByUid,
  isLiving
} from './api.js'
import { readCookie, writeCookie } from './cookie.js'
import { getTagByTitle, mergeMp4 } from './utilFunction.js'

// 注册IPC处理函数
export const registerIpcHandler = (pool, mainWindow, recorder) => {
  // 消息弹窗
  ipcMain.handle('show-message', async (e, params) => {
    dialog.showMessageBox(mainWindow, params)
  })

  // 获取登录二维码
  ipcMain.handle('get-qrcode', async () => {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate'
    const headers = {
      Referer: 'https://www.bilibili.com',
      'User-Agent': process.env.DB_USER_AGENT
    }
    const params = {
      source: 'main-fe-header'
    }
    const response = await axios.get(url, {
      headers,
      params
    })
    return response.data?.data
  })

  // 检查登录二维码状态
  ipcMain.handle('check-qrcode-status', async (e, qrcode_key) => {
    const url = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll'
    const headers = {
      Referer: 'https://www.bilibili.com',
      'User-Agent': process.env.DB_USER_AGENT
    }
    const params = {
      qrcode_key,
      source: 'main-fe-header'
    }
    const response = await axios.get(url, {
      headers,
      params
    })
    return response.data?.data
  })

  // 保存cookie
  ipcMain.handle('save-cookie', async (e, cookie) => {
    writeCookie(cookie)
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('login-success')
    })
  })

  // 获取导航栏信息
  ipcMain.handle('get-navigation-data', async () => {
    const url = 'https://api.bilibili.com/x/web-interface/nav'
    const headers = {
      Referer: 'https://www.bilibili.com',
      Cookie: readCookie(),
      'User-Agent': process.env.DB_USER_AGENT
    }
    const response = await axios.get(url, {
      headers
    })
    return response.data?.data
  })

  // 退出登录
  ipcMain.handle('logout', async () => {
    const cookie = readCookie()
    const biliCSRF = cookie.split(';')[2].split('=')[1]
    const url = 'https://passport.bilibili.com/login/exit/v2'
    const headers = {
      Cookie: readCookie(),
      'User-Agent': process.env.DB_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    const response = await axios.post(url, `biliCSRF=${biliCSRF}`, {
      headers
    })
    writeCookie('')
    return response.data
  })

  // 登录状态改变
  ipcMain.on('login-status-change', (e, status) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('login-status-change', status)
    })
  })

  // 查询稿件管理数据
  ipcMain.handle('manuscript-management', async (e, pn) => {
    const result = getManuscriptList(pn)
    return result
  })

  // 查询热门活动数据
  ipcMain.on('hot-activity', async (e) => {
    const conn = await pool.getConnection()
    await conn.query('DELETE FROM hot_activity')

    try {
      let currentPage = 1

      while (true) {
        await sleep(1)
        const result = await getHotActivityList(currentPage)
        const list = result?.list
        const ps = result?.page?.ps
        const total = result?.page?.total
        const totalPage = Math.ceil(total / ps)

        for (const item of list) {
          const { name, stime } = item
          const startTime = formatTimestampToDatetime(stime)
          console.log(`活动开始时间 = ${startTime}, 活动名称 = ${name}`)

          const sevenDaysAgo = getAnyDaysAgo(7)
          if (new Date(startTime) < sevenDaysAgo) {
            continue
          }

          const sql = `
            INSERT INTO hot_activity(name, start_time)
            VALUES(?, ?)
          `
          await conn.query(sql, [name, startTime])

          e.sender.send('hot-activity-progress', {
            name,
            startTime
          })
        }

        if (currentPage >= totalPage) {
          e.sender.send('hot-activity-finish')
          dialog.showMessageBox(mainWindow, {
            title: '查询热门活动数据',
            type: 'info',
            message: '查询结束'
          })
          break
        }
        currentPage++
      }
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询热门活动数据',
        type: 'error',
        message: `查询热门活动数据失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询收益中心数据
  ipcMain.on('earnings-center', async (e) => {
    const conn = await pool.getConnection()
    await conn.query('DELETE FROM rewards')

    try {
      let currentPage = 1
      let totalPage = 1
      let totalMoney = 0
      const result = await getBalance()
      const brokerage = result?.brokerage

      while (true) {
        await sleep(5)
        const data = await getEarningsList(currentPage)
        const records = data?.result
        totalPage = data?.page?.totalPage

        for (const item of records) {
          const { brokerage: money, title: productName, ctime: createTime, statusDesc } = item
          const year = new Date(createTime).getFullYear()
          const month = new Date(createTime).getMonth() + 1

          if (productName === '银行卡提现') {
            const sql = `
              INSERT IGNORE INTO withdraw(year, month, brokerage, type)
              VALUES(?, ?, ?, ?)
            `
            await conn.query(sql, [year, month, money, 0])
          } else if (productName === '支付宝提现') {
            const sql = `
              INSERT IGNORE INTO withdraw(year, month, brokerage, type)
              VALUES(?, ?, ?, ?)
            `
            await conn.query(sql, [year, month, money, 1])
          }

          if (
            productName === '银行卡提现' ||
            productName === '支付宝提现' ||
            statusDesc === '撤销转入'
          ) {
            continue
          }

          totalMoney += money
          console.log(
            `发放时间 = ${createTime}, 发放金额 = ${money.toFixed(2).padEnd(6)}, 活动名称 = ${productName}`
          )

          const sql = `
            INSERT INTO rewards(product_name, money, create_time)
            VALUES(?, ?, ?)
          `
          await conn.query(sql, [productName, money, createTime])

          e.sender.send('earnings-center-progress', {
            productName,
            money,
            createTime,
            totalMoney: totalMoney.toFixed(2),
            balance: brokerage.toFixed(2)
          })
        }

        if (currentPage >= totalPage) {
          e.sender.send('earnings-center-finish')
          dialog.showMessageBox(mainWindow, {
            title: '查询收益中心数据',
            type: 'info',
            message: '查询结束'
          })
          break
        }
        currentPage++
      }
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询收益中心数据',
        type: 'error',
        message: `查询收益中心数据失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 更新数据库
  ipcMain.on('update-database', async (e) => {
    const conn = await pool.getConnection()
    await conn.query('DELETE FROM manuscript')

    try {
      let currentPage = 1

      while (true) {
        await sleep(5)
        const result = await getManuscriptList(currentPage)
        const count = result?.page?.count
        const ps = result?.page?.ps
        const totalPage = Math.ceil(count / ps)
        const arc_audits = result?.arc_audits

        for (const item of arc_audits) {
          const archive = item?.Archive
          const stat = item?.stat
          const title = archive?.title
          const view = stat?.view
          const pubTime = archive?.ptime
          const tag = archive?.tag
          const postTime = formatTimestampToDatetime(pubTime)

          console.log(
            `投稿时间 = ${postTime}, 播放量 = ${view.toString().padEnd(5)}, 标题 = ${title}, 投稿标签 = ${tag}`
          )

          const sql = `
            INSERT INTO manuscript(title, view, post_time, tag)
            VALUES(?, ?, ?, ?)
          `
          await conn.query(sql, [title, view, postTime, tag])

          e.sender.send('update-database-progress', {
            title,
            view,
            postTime,
            tag
          })
        }

        if (currentPage >= totalPage) {
          e.sender.send('update-database-finish')
          dialog.showMessageBox(mainWindow, {
            title: '更新数据库',
            type: 'info',
            message: '查询结束'
          })
          break
        }
        currentPage++
      }
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '更新数据库',
        type: 'error',
        message: `更新数据库失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询活动资格取消稿件
  ipcMain.on('event-disqualification', async (e) => {
    const conn = await pool.getConnection()

    try {
      let end_seqno
      let messageTime
      let isExit = false
      const tenDaysAgo = getAnyDaysAgo(10)
      const text = '由于不符合本次征稿活动的规则'

      while (true) {
        await sleep(5)
        const result = await getMessageList(end_seqno)
        const { has_more, messages, min_seqno } = result

        for (const item of messages) {
          const { content, timestamp } = item
          console.log(content)
          if (!content.includes(text)) continue
          messageTime = new Date(timestamp * 1000)

          if (messageTime < tenDaysAgo) {
            isExit = true
            break
          }

          let titleStart = content.indexOf('《') + 1
          let titleEnd = content.indexOf('》')
          let title =
            titleStart > 0 && titleEnd > titleStart
              ? content.substring(titleStart, titleEnd)
              : '未知标题'

          if (!/[\u4e00-\u9fa5]/.test(title)) continue
          const data = await getTagByTitle(title)
          // 查询所有数据, 较慢
          // const data = await getTagAndViewByTitle(conn, title)

          const { tag, view } = data

          const sql = `
            INSERT IGNORE INTO disqualification(title, tag, view, post_time)
            VALUES(?, ?, ?, ?)
          `
          const postTime = formatTimestampToDatetime(timestamp)
          await conn.query(sql, [title, tag, view, postTime])

          e.sender.send('event-disqualification-progress', {
            title,
            tag,
            view,
            postTime
          })
        }

        if (isExit || !has_more) {
          e.sender.send('event-disqualification-finish')
          dialog.showMessageBox(mainWindow, {
            title: '查询活动资格取消稿件',
            type: 'info',
            message: '查询结束'
          })
          break
        }

        end_seqno = min_seqno
      }
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询活动资格取消稿件',
        type: 'error',
        message: `查询活动资格取消稿件失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询播放量<100的稿件
  ipcMain.handle('view-less-one-hundred', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT * FROM manuscript
        WHERE view < 100 AND post_time <= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
        ORDER BY view ASC
      `
      const [rows] = await conn.query(sql)
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询播放量<100的稿件',
        type: 'error',
        message: `查询播放量<100的稿件失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询每年获得的激励金额
  ipcMain.handle('get-money-by-year', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT YEAR(create_time) AS year, SUM(money) AS totalMoney
        FROM rewards
        GROUP BY YEAR(create_time)
        ORDER BY year DESC
      `
      const [rows] = await conn.query(sql)
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询每年获得的激励金额',
        type: 'error',
        message: `查询每年获得的激励金额失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询每月获得的激励金额
  ipcMain.handle('get-money-by-month', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT YEAR(create_time) AS year, MONTH(create_time) AS month, SUM(money) AS totalMoney
        FROM rewards
        GROUP BY YEAR(create_time), MONTH(create_time)
        ORDER BY year DESC, month DESC
      `
      const [rows] = await conn.query(sql)
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询每月获得的激励金额',
        type: 'error',
        message: `查询每月获得的激励金额失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 根据标签查询激励金额
  ipcMain.handle('get-money-by-tag', async (e, productName) => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT product_name AS productName, money, create_time AS createTime, SUM(money) OVER () AS totalMoney
        FROM rewards
        WHERE product_name LIKE ?
        ORDER BY create_time DESC
      `
      const [rows] = await conn.query(sql, [`%${productName}%`])
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '根据标签查询激励金额',
        type: 'error',
        message: `根据标签查询激励金额失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 根据投稿标签查询稿件
  ipcMain.handle('get-manuscript-by-tag', async (e, tag) => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT title, view, post_time AS postTime, tag
        FROM manuscript
        WHERE tag LIKE ?
      `
      const [rows] = await conn.query(sql, [`%${tag}%`])
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '根据投稿标签查询稿件',
        type: 'error',
        message: `根据投稿标签查询稿件失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 根据标签查询取消稿件
  ipcMain.handle('get-disqualification-by-tag', async (e, tag) => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT title, tag, view, post_time AS postTime
        FROM disqualification
        WHERE tag LIKE ?
        ORDER BY post_time DESC
      `
      const [rows] = await conn.query(sql, [`%${tag}%`])
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '根据标签查询取消稿件',
        type: 'error',
        message: `根据标签查询取消稿件失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询每月的工资
  ipcMain.handle('get-salary-by-month', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT year, month, salary, working_hours, hourly_wage
        FROM salary
        ORDER BY year DESC, month DESC
      `
      const [rows] = await conn.query(sql)
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询每月的工资',
        type: 'error',
        message: `查询每月的工资失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询每年的工资
  ipcMain.handle('get-salary-by-year', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT year, SUM(salary) AS totalSalary
        FROM salary
        GROUP BY year
        ORDER BY year DESC
      `
      const [rows] = await conn.query(sql)
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询每年的工资',
        type: 'error',
        message: `查询每年的工资失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询每月提现金额
  ipcMain.handle('get-withdraw-by-month', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT
          year,
          month,
          brokerage,
          CASE type
            WHEN 0 THEN '银行卡提现'
            WHEN 1 THEN '支付宝提现'
          END AS type
        FROM withdraw
        ORDER BY year DESC, month DESC
      `
      const [rows] = await conn.query(sql)
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询每月提现金额',
        type: 'error',
        message: `查询每月提现金额失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询每年提现金额
  ipcMain.handle('get-withdraw-by-year', async () => {
    const conn = await pool.getConnection()
    try {
      const sql = `
        SELECT year, SUM(brokerage) AS totalBrokerage
        FROM withdraw
        GROUP BY year
        ORDER BY year DESC
      `
      const [rows] = await conn.query(sql)
      return rowsToCamel(rows)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '查询每年提现金额',
        type: 'error',
        message: `查询每年提现金额失败, ${err.message}`
      })
    } finally {
      conn.release()
    }
  })

  // 查询manuscript表中的数据
  ipcMain.handle('get-manuscript-data', async () => {
    const sql = `
        SELECT title, view, post_time, tag
        FROM manuscript
        ORDER BY post_time DESC
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 查询hot_activity表中的数据
  ipcMain.handle('get-hot-activity-data', async () => {
    const sql = `
        SELECT name, start_time
        FROM hot_activity
        ORDER BY start_time ASC
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 查询rewards表中的数据
  ipcMain.handle('get-rewards-data', async () => {
    const sql = `
        SELECT product_name, money, create_time
        FROM rewards
        ORDER BY create_time DESC
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 查询disqualification表中的数据
  ipcMain.handle('get-disqualification-data', async () => {
    const sql = `
        SELECT title, tag, view, post_time
        FROM disqualification
        ORDER BY post_time DESC
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 将outcome中的数据写入数据库
  ipcMain.handle('save-outcome', async (e, excelData) => {
    const records = excelData.map((item) => {
      return [
        format(excelDateToJSDate(item['日期']), 'yyyy-MM-dd'),
        item['支付平台'],
        item['支付金额'],
        item['备注']
      ]
    })
    const sql = `
      INSERT IGNORE INTO outcome(pay_date, pay_platform, amount, note)
      VALUES ?
    `
    await pool.query(sql, [records])
  })

  // 将salary.excel中的数据写入数据库
  ipcMain.handle('save-salary', async (e, excelData) => {
    const records = excelData.map((item) => [
      item['年份'],
      item['月份'],
      item['工资'],
      item['工时'],
      item['时薪']
    ])
    const sql = `
      INSERT IGNORE INTO salary(year, month, salary, working_hours, hourly_wage)
      VALUES ?
    `
    await pool.query(sql, [records])
  })

  // 查询每月的收入
  ipcMain.handle('get-income-by-month', async () => {
    const sql = `
        SELECT
          year,
          month,
          SUM(COALESCE(salary, 0) + COALESCE(brokerage, 0)) AS totalIncome
        FROM (
            SELECT year, month, salary, NULL AS brokerage FROM salary
            UNION ALL
            SELECT year, month, NULL AS salary, brokerage FROM withdraw
        ) combined
        GROUP BY year, month
        ORDER BY year DESC, month DESC;
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 查询每年的收入
  ipcMain.handle('get-income-by-year', async () => {
    const sql = `
        SELECT
          year,
          SUM(COALESCE(salary, 0) + COALESCE(brokerage, 0)) AS totalIncome
        FROM (
            SELECT year, salary, NULL AS brokerage FROM salary
            UNION ALL
            SELECT year, NULL AS salary, brokerage FROM withdraw
        ) t
        GROUP BY year
        ORDER BY year DESC;
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 查询支出明细
  ipcMain.handle('get-outcome-details', async () => {
    const sql = `
        SELECT
          CAST(pay_date AS DATE) AS payDate,
          CASE pay_platform
            WHEN 0 THEN '微信'
            WHEN 1 THEN '支付宝'
            WHEN 2 THEN '银行卡'
          END AS payPlatform,
          amount,
          note
        FROM outcome
        ORDER BY pay_date DESC
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 查询每月的支出
  ipcMain.handle('get-outcome-by-month', async () => {
    const sql = `
        SELECT
          YEAR(pay_date) AS year,
          MONTH(pay_date) AS month,
          SUM(amount) AS totalOutcome
        FROM outcome
        GROUP BY YEAR(pay_date), MONTH(pay_date)
        ORDER BY year DESC, month DESC;
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 查询每年的支出
  ipcMain.handle('get-outcome-by-year', async () => {
    const sql = `
        SELECT YEAR(pay_date) AS year, SUM(amount) AS totalOutcome
        FROM outcome
        GROUP BY YEAR(pay_date)
        ORDER BY year DESC
      `
    const [rows] = await pool.query(sql)
    return rowsToCamel(rows)
  })

  // 通过直播间地址开始录制
  ipcMain.handle('start-record-by-room-url', async (e, roomUrl) => {
    const roomId = parseRoomId(roomUrl)
    if (!roomId) {
      dialog.showMessageBox(mainWindow, {
        title: '直播录制',
        type: 'error',
        message: '无效的直播间地址'
      })

      return {
        username: '',
        title: '',
        userCover: '',
        liveTime: '',
        areaName: '',
        watching: false
      }
    }

    // 判断是否在播
    const { uid, live_status, title, user_cover, live_time, area_name } = await isLiving(roomId)
    const outputDir = path.join(app.getPath('videos'), 'BilibiliRecorder')

    const living = live_status === 1
    if (!living) {
      dialog.showMessageBox(mainWindow, {
        title: '直播录制',
        type: 'info',
        message: '当前直播间未开播, 已进入监控状态'
      })

      recorder.watchRoom(roomId, outputDir, mainWindow)

      return {
        username: '',
        title: '',
        userCover: '',
        liveTime: '',
        areaName: '',
        watching: true
      }
    }

    const result = await getUsernameByUid(uid)
    const username = result?.info?.uname

    // 获取m3u8(原画优先)
    const m3u8Url = await getM3U8(roomId, 10000)
    recorder.start(m3u8Url, outputDir, username, roomId, mainWindow)
    return {
      username,
      title,
      userCover: user_cover,
      liveTime: live_time,
      areaName: area_name,
      watching: false
    }
  })

  // 停止录制
  ipcMain.handle('stop-record', () => {
    recorder.stop()
  })

  // 判断是否正在直播录制
  ipcMain.handle('is-recording', () => {
    return recorder.isRecording()
  })

  // 判断是否正在监控直播
  ipcMain.handle('is-watching', () => {
    return recorder.isWatching()
  })

  // 合并MP4文件
  ipcMain.handle('merge-mp4', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择要合并的mp4文件',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Video', extensions: ['mp4'] }]
    })

    if (canceled || filePaths.length === 0) return false
    await mergeMp4(filePaths)
    return true
  })
}
