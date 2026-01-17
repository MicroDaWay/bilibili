<!-- 登录 -->
<script setup>
import qrcode from 'qrcode'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const QRCode = ref(null)
const QRCodeKey = ref('')
const isLogin = ref(false)
const avatar = ref('')
const qrUrl = ref('')

const drawQRCode = async () => {
  if (!QRCode.value || !qrUrl.value) return
  const size = Math.min(Math.max(window.innerWidth * 0.2, 180), 320)
  await qrcode.toCanvas(QRCode.value, qrUrl.value, {
    width: size,
    height: size
  })
}

// 登录
const login = async () => {
  const result = await window.electronAPI.getQRCode()
  qrUrl.value = result.data.url
  QRCodeKey.value = result.data.qrcode_key

  await nextTick()
  await drawQRCode()
  checkStatus()
}

// 检查二维码状态
const checkStatus = async () => {
  isLogin.value = false

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
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

      const DedeUserID = params.get('DedeUserID')
      const SESSDATA = params.get('SESSDATA')
      const bili_jct = params.get('bili_jct')

      const cookie = `DedeUserID=${DedeUserID}; SESSDATA=${SESSDATA}; bili_jct=${bili_jct};`
      await window.electronAPI.saveCookie(cookie)
      await getNavigation()
      break
    }
  }
}

// 退出登录
const logout = async () => {
  const result = await window.electronAPI.logout()
  if (result.code === 0) {
    isLogin.value = false
    QRCodeKey.value = ''
    avatar.value = ''
    window.electronAPI.setLoginStatus(false)
    login()
  }
}

// 获取导航栏信息
const getNavigation = async () => {
  const result = await window.electronAPI.getNavigationData()
  avatar.value = result.face
  isLogin.value = result.isLogin
}

const handleResize = () => {
  drawQRCode()
}

onMounted(async () => {
  await getNavigation()
  if (!isLogin.value) {
    await login()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const proxyImage = (url) => {
  return `http://localhost:3000/proxy/image?url=${encodeURIComponent(url)}`
}
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
  height: calc(99vh - 1px);
  justify-content: center;

  canvas,
  img {
    border: 1px solid #ccc;
    user-select: none;
  }

  .login-btn,
  .logout {
    width: 10vw;
    height: 6vh;
    line-height: 6vh;
    text-align: center;
    border-radius: 2vw;
    background-color: orange;
    font-size: 1.6vw;
    user-select: none;
    margin-top: 4vh;

    &:hover {
      cursor: pointer;
    }
  }
}
</style>
