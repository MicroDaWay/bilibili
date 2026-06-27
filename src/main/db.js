import path from 'node:path'

import { config } from 'dotenv'
import { app, dialog } from 'electron'
import mysql from 'mysql2/promise'

const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(process.cwd(), '.env')

config({ path: envPath })

// 创建数据库连接池
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
}

export const pool = mysql.createPool(dbConfig)

// 检查数据库连接
export const checkDatabaseConnection = async (mainWindow) => {
  try {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    return true
  } catch (err) {
    dialog.showMessageBox(mainWindow, {
      title: '检查数据库连接',
      type: 'error',
      message: `数据库连接失败, ${err.message}`
    })
    app.quit()
    return false
  }
}

// 初始化数据库表
export const initTable = async (mainWindow) => {
  const conn = await pool.getConnection()
  try {
    // 初始化manuscript表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS manuscript (
        uid INT COMMENT '用户ID',
        title VARCHAR(255) COMMENT '标题',
        view INT COMMENT '播放量',
        post_time DATETIME COMMENT '投稿时间',
        tag VARCHAR(255) COMMENT '投稿标签'
      ) COMMENT '稿件管理'
    `)

    // 初始化hot_activity表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS hot_activity (
        name VARCHAR(255) COMMENT '活动名称',
        start_time DATETIME COMMENT '活动开始时间'
      ) COMMENT '热门活动'
    `)

    // 初始化rewards表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        uid INT COMMENT '用户ID',
        product_name VARCHAR(255) COMMENT '活动名称',
        money DECIMAL(10,2) COMMENT '发放金额',
        create_time DATETIME COMMENT '发放时间',
        total_money DECIMAL(10,2) COMMENT '累计金额',
        balance DECIMAL(10,2) COMMENT '余额'
      ) COMMENT '收益中心'
    `)

    // 初始化disqualification表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS disqualification (
        uid INT COMMENT '用户ID',
        title VARCHAR(255) COMMENT '标题',
        tag VARCHAR(255) COMMENT '投稿标签',
        view INT COMMENT '播放量',
        post_time DATETIME COMMENT '投稿时间',
        UNIQUE KEY UK_disqualification_uid_title_post_time(uid, title, post_time)
      ) COMMENT '活动资格取消稿件'
    `)

    // 初始化salary表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS salary (
        uid INT COMMENT '用户ID',
        year INT COMMENT '年份',
        month INT COMMENT '月份',
        salary DECIMAL(10,2) COMMENT '工资',
        working_hours DECIMAL(4,1) COMMENT '工时',
        hourly_wage DECIMAL(4,2) COMMENT '时薪',
        UNIQUE KEY UK_salary_uid_year_month(uid, year, month)
      ) COMMENT '每月工资'
    `)

    // 初始化withdraw表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS withdraw (
        uid INT COMMENT '用户ID',
        year INT COMMENT '年份',
        month INT COMMENT '月份',
        brokerage DECIMAL(10,2) COMMENT '提现金额',
        type INT COMMENT '提现类型',
        UNIQUE KEY UK_withdraw_uid_year_month_type(uid, year, month, type)
      ) COMMENT '提现表'
    `)

    // 初始化outcome表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS outcome (
        uid INT COMMENT '用户ID',
        pay_date date COMMENT '日期',
        pay_platform INT COMMENT '支付平台',
        amount DECIMAL(10,2) COMMENT '支付金额',
        note VARCHAR(255) COMMENT '备注',
        UNIQUE KEY UK_outcome_uid_pay_date_pay_platform_amount_note(uid, pay_date, pay_platform, amount, note)
      ) COMMENT '支出表'
    `)
  } catch (err) {
    dialog.showMessageBox(mainWindow, {
      title: '初始化数据库表',
      type: 'error',
      message: `初始化数据库表失败: ${err.message}`
    })
  } finally {
    conn.release()
  }
}
