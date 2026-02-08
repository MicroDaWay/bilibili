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
  return response.data?.data
}

// 查询热门活动数据
export const getHotActivityList = async (pn) => {
  const url = 'https://api.bilibili.com/x/activity_components/video_activity/hot_activity'
  const headers = {
    Referer: 'https://www.bilibili.com/blackboard/era/reward-activity-list-page.html',
    Cookie: readCookie(),
    'User-Agent': process.env.DB_USER_AGENT
  }
  const params = {
    csrf: 'f687804a4f6b7fb2baf9a1e5043c060f',
    pn,
    ps: 20
  }
  const response = await axios.get(url, {
    headers,
    params
  })
  return response.data?.data
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
  return response.data?.data
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
  return response.data?.data
}

// 查询消息数据
export const getMessageList = async (end_seqno) => {
  const url = 'https://api.vc.bilibili.com/svr_sync/v1/svr_sync/fetch_session_msgs'
  const headers = {
    Referer: 'https://text.bilibili.com',
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
  return response.data?.data
}

// 查询直播间是否开播
export const isLiving = async (roomId) => {
  const url = 'https://api.live.bilibili.com/room/v1/Room/get_info'
  const headers = {
    Referer: 'https://live.bilibili.com',
    'User-Agent': process.env.DB_USER_AGENT
  }
  const params = {
    room_id: roomId
  }
  const response = await axios.get(url, {
    headers,
    params
  })
  return response.data?.data
}

// 获取直播间m3u8地址
export const getM3U8 = async (roomId, qn = 10000) => {
  const url = 'https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo'
  const headers = {
    Referer: 'https://live.bilibili.com',
    Cookie: readCookie(),
    'User-Agent': process.env.DB_USER_AGENT
  }
  const params = {
    room_id: roomId,
    protocol: '0,1',
    format: '0,1,2',
    codec: '0,1',
    qn,
    platform: 'web'
  }
  const response = await axios.get(url, {
    headers,
    params
  })

  const playurl = response.data?.data?.playurl_info?.playurl
  if (!playurl || !playurl?.stream?.length) {
    throw new Error('未获取到直播流, playurl为空')
  }

  for (const stream of playurl.stream) {
    for (const format of stream.format || []) {
      // 只要是m3u8就行, 不强制ts
      if (!format.format_name?.includes('ts') && !format.format_name?.includes('fmp4')) {
        continue
      }

      for (const codec of format.codec || []) {
        const baseUrl = codec.base_url
        const info = codec.url_info?.[0]

        if (baseUrl && info?.host && info?.extra) {
          return info.host + baseUrl + info.extra
        }
      }
    }
  }

  throw new Error('未找到可用的m3u8流')
}

// 查询用户名
export const getUsernameByUid = async (uid) => {
  const url = 'https://api.live.bilibili.com/live_user/v1/Master/info'
  const headers = {
    Referer: 'https://live.bilibili.com',
    'User-Agent': process.env.DB_USER_AGENT
  }
  const params = {
    uid
  }
  const response = await axios.get(url, {
    headers,
    params
  })
  return response.data?.data
}
