import axios from 'axios'
import { dialog } from 'electron'
import express from 'express'

// 开启图片代理服务器
export const startServer = (server, mainWindow) => {
  const expressApp = express()
  const port = 3000

  expressApp.use(express.json())
  expressApp.use(express.urlencoded({ extended: true }))

  expressApp.get('/proxy/image', async (req, res) => {
    const imageUrl = req.query.url
    if (!imageUrl || !/^https?:\/\/.*\.hdslb\.com/.test(imageUrl)) {
      return res.status(400).send('无效的URL')
    }

    try {
      const response = await axios({
        url: imageUrl,
        responseType: 'stream'
      })
      response.data.pipe(res)
    } catch (err) {
      dialog.showMessageBox(mainWindow, {
        title: '开启图片代理服务器',
        type: 'error',
        message: `开启图片代理服务器失败, ${err.message}`
      })
      res.status(500).send('代理错误')
    }
  })

  server = expressApp.listen(port, () => {
    console.log(`服务器运行在: http://localhost:${port}/`)
  })
}
