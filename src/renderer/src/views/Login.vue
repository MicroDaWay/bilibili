<script setup>
import { onMounted, ref } from 'vue'
import qrcode from 'qrcode'

const QRCode = ref(null)
const QRCodeKey = ref('')
const isLogin = ref(false)
const avatar = ref('')

// 登录
async function login() {
  const result = await window.electronAPI.getQRCode()
  const url = result.data.url
  QRCodeKey.value = result.data.qrcode_key
  const QRCodeCanvas = QRCode.value
  await qrcode.toCanvas(QRCodeCanvas, url, {
    width: 300,
    height: 300
  })
  checkStatus()
}

// 检查二维码状态
async function checkStatus() {
  isLogin.value = false

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const result = await window.electronAPI.checkQRCodeStatus(QRCodeKey.value)
    if (result.data.code === 86101) {
      console.log('未扫码')
    } else if (result.data.code === 86038) {
      console.log('二维码已失效')
    } else if (result.data.code === 86090) {
      console.log('二维码已扫码未确认')
    } else if (result.data.code === 0) {
      isLogin.value = true

      const cookieUrl = new URL(result.data.url)
      const params = new URLSearchParams(cookieUrl.search)

      const SESSDATA = params.get('SESSDATA')
      const bili_jct = params.get('bili_jct')
      const DedeUserID = params.get('DedeUserID')

      const cookie = `SESSDATA=${SESSDATA}; bili_jct=${bili_jct}; DedeUserID=${DedeUserID}`
      await window.electronAPI.saveCookie(cookie)
      await getNavigation()
      console.log('cookie:', cookie)
      break
    }
    console.log(result)
  }
}

// 退出登录
async function logout() {
  await window.electronAPI.logout()
  isLogin.value = false
  QRCodeKey.value = ''
  QRCode.value.getContext('2d').clearRect(0, 0, QRCode.value.width, QRCode.value.height)
  console.log('退出登录成功')
}

function proxyImage(url) {
  return `http://localhost:3000/proxy/image?url=${encodeURIComponent(url)}`
}

async function getNavigation() {
  const result = await window.electronAPI.getNavigationData()
  avatar.value = result.face
  isLogin.value = result.isLogin
}

onMounted(async () => {
  await getNavigation()
  if (!isLogin.value) {
    login()
  }
  // 读取主进程中cookie.txt是否有内容
})
</script>

<template>
  <div class="login">
    <canvas v-if="!isLogin" ref="QRCode" class="QRCode"></canvas>
    <img v-else :src="proxyImage(avatar)" />
    <div v-if="!isLogin" class="login-btn" @click="login">登录</div>
    <div v-else class="logout" @click="logout">退出登录</div>
  </div>
</template>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  justify-content: center;

  canvas,
  img {
    width: 300px;
    height: 300px;
    border: 1px solid #ccc;
  }

  .login-btn,
  .logout {
    width: 180px;
    height: 50px;
    line-height: 50px;
    text-align: center;
    border-radius: 30px;
    background-color: orange;
    font-size: 26px;
    user-select: none;
    margin-top: 20px;

    &:hover {
      cursor: pointer;
    }
  }
}
</style>
