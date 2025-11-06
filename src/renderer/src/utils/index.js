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
  if (timestamp == null) return null
  const dt = new Date(timestamp * 1000)
  return dt.toISOString().slice(0, 19).replace('T', ' ')
}

export {
  excelDateToJSDate,
  jsDateToExcelDate,
  formatDatetimeToTimestamp,
  formatTimestampToDatetime
}
