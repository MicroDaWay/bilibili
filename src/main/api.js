import axios from 'axios'
import { readCookie } from './cookie'

// 查询稿件数据
export const getManuscriptList = async (pn) => {
  const url = 'https://member.bilibili.com/x/web/archives'
  const headers = {
    Referer: 'https://member.bilibili.com/platform/upload-manager/article',
    Cookie: readCookie(),
    'User-Agent': process.env.DB_USER_AGENT
  }
  const params = {
    pn,
    ps: 10
  }
  const response = await axios.get(url, {
    headers,
    params
  })
  return response.data?.data || null
}

// 查询余额
export const getBalance = async () => {
  const url = 'https://pay.bilibili.com/bk/brokerage/getUserBrokerage'
  const payload = {
    sdkVersion: '1.1.7',
    timestamp: Math.floor(Date.now() / 1000),
    traceId: Math.floor(Date.now() / 1000)
  }
  const headers = {
    Referer: 'https://pay.bilibili.com/pay-v2/shell/index',
    Cookie: readCookie().replace(/,/g, '%2C'),
    'User-Agent': process.env.DB_USER_AGENT,
    'Content-Type': 'application/json'
  }
  const response = await axios.post(url, payload, {
    headers
  })
  return response.data?.data || null
}

// 查询收益数据
export const getEarningsList = async (currentPage) => {
  const url = 'https://pay.bilibili.com/payplatform/cashier/bk/trans/list'
  const payload = {
    currentPage,
    pageSize: 20,
    sdkVersion: '1.1.7',
    traceId: Math.floor(Date.now() / 1000)
  }
  const headers = {
    Referer: 'https://pay.bilibili.com/pay-v2/shell/bill',
    Cookie: readCookie().replace(/,/g, '%2C'),
    'User-Agent': process.env.DB_USER_AGENT,
    'Content-Type': 'application/json'
  }
  const response = await axios.post(url, payload, {
    headers
  })

  return response.data?.data || null
}

// 查询消息数据
export const getMessageList = async (end_seqno) => {
  const url = 'https://api.vc.bilibili.com/svr_sync/v1/svr_sync/fetch_session_msgs'
  const headers = {
    Referer: 'https://text.bilibili.com/',
    Cookie: readCookie(),
    'User-Agent': process.env.DB_USER_AGENT
  }
  const params = {
    size: 20,
    session_type: 1,
    talker_id: 844424930131966,
    end_seqno
  }
  const response = await axios.get(url, {
    headers,
    params
  })
  return response.data?.data || null
}
