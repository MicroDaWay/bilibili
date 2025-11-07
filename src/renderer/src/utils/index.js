const excelDateToJSDate = (excelDate) => {
  const baseDate = new Date('1899-12-30')
  return new Date(baseDate.setDate(baseDate.getDate() + excelDate))
}

const jsDateToExcelDate = (jsDate) => {
  const baseDate = new Date('1899-12-30')
  return Math.floor((jsDate - baseDate) / (24 * 60 * 60 * 1000)) + 1
}

const formatDatetimeToTimestamp = (year, month, day, hour = 0, minute = 0, second = 0) => {
  const dt = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  return Math.floor(dt.getTime() / 1000)
}

const formatTimestampToDatetime = (timestamp) => {
  if (typeof timestamp !== 'number' || timestamp <= 0) return null
  const dt = new Date(timestamp * 1000)
  if (isNaN(dt.getTime())) return null

  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
}

export {
  excelDateToJSDate,
  jsDateToExcelDate,
  formatDatetimeToTimestamp,
  formatTimestampToDatetime
}
