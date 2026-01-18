import { config } from 'dotenv'
import { app, dialog } from 'electron'
import mysql from 'mysql2/promise'
import path from 'path'

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
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      title: '检查数据库连接',
      type: 'error',
      message: `数据库连接失败, ${error.message}`
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
        title VARCHAR(255) COMMENT '标题',
        view INT COMMENT '播放量',
        post_time DATETIME COMMENT '投稿时间',
        tag VARCHAR(255) COMMENT '投稿标签',
      ) COMMENT '稿件管理'
    `)

    // 初始化rewards表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        product_name VARCHAR(100) COMMENT '活动名称',
        money DECIMAL(10,2) COMMENT '发放金额',
        create_time DATETIME COMMENT '发放时间',
      ) COMMENT '收益中心'
    `)

    // 初始化disqualification表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS disqualification (
        title VARCHAR(255) COMMENT '标题',
        tag VARCHAR(255) COMMENT '投稿标签',
        view INT COMMENT '播放量',
        post_time DATETIME COMMENT '投稿时间',
        UNIQUE KEY UK_disqualification_title_post_time(title, post_time)
      ) COMMENT '活动资格取消稿件'
    `)

    // 初始化salary表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS salary (
        year INT COMMENT '年份',
        month INT COMMENT '月份',
        salary DECIMAL(10,2) COMMENT '工资',
        working_hours DECIMAL(4,1) COMMENT '工时',
        hourly_wage DECIMAL(4,2) COMMENT '时薪',
        UNIQUE KEY UK_salary_year_month(year, month)
      ) COMMENT '每月工资'
    `)

    // 初始化withdraw表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS withdraw (
        year INT COMMENT '年份',
        month INT COMMENT '月份',
        brokerage DECIMAL(10,2) COMMENT '提现金额',
        type INT COMMENT '提现类型',
        UNIQUE KEY UK_withdraw_year_month_type(year, month)
      ) COMMENT '提现表'
    `)

    // 初始化outcome表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS outcome (
        pay_date date COMMENT '日期',
        pay_platform INT COMMENT '支付平台',
        amount DECIMAL(10,2) COMMENT '支付金额',
        note VARCHAR(255) COMMENT '备注',
        UNIQUE KEY UK_outcome_pay_date_pay_platform_amount_note(pay_date, pay_platform, amount, note)
      ) COMMENT '支出表'
    `)
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      title: '初始化数据库表',
      type: 'error',
      message: `初始化数据库表失败: ${error.message}`
    })
  } finally {
    conn.release()
  }
}
