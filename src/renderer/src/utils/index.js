function excelDateToJSDate(excelDate) {
  const baseDate = new Date('1899-12-30')
  return new Date(baseDate.setDate(baseDate.getDate() + excelDate))
}

function jsDateToExcelDate(jsDate) {
  const baseDate = new Date('1899-12-30')
  return Math.floor((jsDate - baseDate) / (24 * 60 * 60 * 1000)) + 1
}

function formatDatetimeToTimestamp(year, month, day, hour = 0, minute = 0, second = 0) {
  const dt = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  return Math.floor(dt.getTime() / 1000)
}

function formatTimestampToDatetime(timestamp) {
  const dt = new Date(timestamp * 1000)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  const hours = String(dt.getHours()).padStart(2, '0')
  const minutes = String(dt.getMinutes()).padStart(2, '0')
  const seconds = String(dt.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export {
  excelDateToJSDate,
  jsDateToExcelDate,
  formatDatetimeToTimestamp,
  formatTimestampToDatetime
}
