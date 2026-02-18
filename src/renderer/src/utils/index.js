export const excelDateToJSDate = (excelDate) => {
  const baseDate = new Date('1899-12-30')
  return new Date(baseDate.setDate(baseDate.getDate() + excelDate))
}

export const jsDateToExcelDate = (jsDate) => {
  const baseDate = new Date('1899-12-30')
  return Math.floor((jsDate - baseDate) / (24 * 60 * 60 * 1000)) + 1
}

export const formatDatetimeToTimestamp = (year, month, day, hour = 0, minute = 0, second = 0) => {
  const dt = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  return Math.floor(dt.getTime() / 1000)
}

export const formatTimestampToDatetime = (timestamp) => {
  if (typeof timestamp !== 'number' || timestamp <= 0) return null
  const dt = new Date(timestamp * 1000)
  if (isNaN(dt.getTime())) return null

  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
}

// 下划线命名转驼峰命名
export const rowsToCamel = (rows) => {
  return rows.map((row) => {
    const newRow = {}
    for (const key in row) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      newRow[camelKey] = row[key]
    }
    return newRow
  })
}

// 查询几天前的零点时间
export const getAnyDaysAgo = (day) => {
  const date = new Date()
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

// 睡眠函数, 单位为秒
export const sleep = (second) => {
  return new Promise((resolve) => setTimeout(resolve, second * 1000))
}

// 解析房间号
export const parseRoomId = (url) => {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('bilibili.com')) return null
    const match = u.pathname.match(/\/(\d+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
