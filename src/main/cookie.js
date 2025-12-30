import fs from 'node:fs'
import path from 'node:path'

import { app } from 'electron'

// 确保cookie.txt文件所在的目录存在
const userDataPath = app.getPath('userData')
const cookieFilePath = path.join(userDataPath, 'cookie.txt')

// 如果cookie.txt不存在则创建空文件
if (!fs.existsSync(cookieFilePath)) {
  fs.writeFileSync(cookieFilePath, '', 'utf8')
}

export const readCookie = () => {
  return fs.readFileSync(cookieFilePath, 'utf8').trim()
}

export const writeCookie = async (cookie) => {
  await fs.promises.writeFile(cookieFilePath, cookie.trim(), 'utf8')
}
