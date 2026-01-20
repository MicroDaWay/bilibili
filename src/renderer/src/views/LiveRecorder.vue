<script setup>
import { ref } from 'vue'

const roomUrl = ref('')
const isRecording = ref(false)
const isInputFocus = ref(false)

const item = ref({
  username: '',
  title: '',
  userCover: '',
  liveTime: '',
  tags: ''
})

// 开始录制
const startRecord = async () => {
  try {
    isRecording.value = true
    const { file, username, title, userCover, liveTime, tags } =
      await window.electronAPI.startByRoomUrl(roomUrl.value)
    item.value.username = username
    item.value.title = title
    item.value.userCover = userCover
    item.value.liveTime = liveTime
    item.value.tags = tags
    console.log('正在录制:', file)
  } catch (error) {
    isRecording.value = false
    window.electronAPI.showMessage({
      title: '直播录制',
      type: 'error',
      message: `录制失败: ${error.message}`
    })
  }
}

// 停止录制
const stopRecord = () => {
  isRecording.value = false
  window.electronAPI.stopRecorder()
}

const clickHandler = () => {
  if (!isRecording.value) {
    startRecord()
  } else {
    stopRecord()
  }
}

const proxyImage = (url) => {
  return `http://localhost:3000/proxy/image?url=${encodeURIComponent(url)}`
}
</script>

<template>
  <div class="live-recorder">
    <div class="search-input-box">
      <div class="input-container">
        <input
          v-model.trim="roomUrl"
          class="search-input"
          type="text"
          :class="{ 'input-focus': isInputFocus }"
          placeholder="请输入直播间地址"
          @focus="isInputFocus = true"
          @blur="isInputFocus = false"
          @keyup.enter="clickHandler"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#000"
          class="search-icon"
          width="24"
          height="24"
          @click="searchHandler"
        >
          <path
            d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"
          ></path>
        </svg>
      </div>
      <div v-if="!isRecording" class="search-button" @click="clickHandler">开始录制</div>
      <div v-else class="search-button" @click="clickHandler">停止录制</div>
    </div>
    <div v-if="isRecording" class="content-container">
      <div class="img-container">
        <img :src="proxyImage(item.userCover)" :alt="item.title" />
      </div>
      <div class="details">
        <div class="name">UP: {{ item.username }}</div>
        <div class="title">标题：{{ item.title }}</div>
        <div class="live-time">直播时间：{{ item.liveTime }}</div>
        <div class="tags">直播标签：{{ item.tags }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.live-recorder {
  .search-input-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2vh 0;
    background-color: #fff;

    .input-container {
      position: relative;
      width: 100%;

      .search-input {
        width: 100%;
        height: 5.4vh;
        border-radius: 2vw;
        border: none;
        outline: none;
        border: 1px solid #ccc;
        font-size: 1.3vw;
        padding: 0 3vw 0 1.2vw;
        user-select: none;

        &.input-focus {
          border: 1px solid orange;
        }
      }

      .search-icon {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 1vw;
      }
    }

    .search-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 10vw;
      height: 5.4vh;
      background-color: orange;
      border-radius: 2vw;
      font-size: 1.5vw;
      margin-left: 2vw;
      user-select: none;
      cursor: pointer;

      &:hover {
        background-color: #ffb121;
      }
    }
  }

  .content-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ccc;
    padding: 2vh 0;

    .img-container {
      img {
        display: block;
        width: 14vw;
      }
    }

    .details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      height: 16vh;
      margin-left: 1vw;
      font-size: 1.2vw;

      .title,
      .tags {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
    }
  }
}
</style>
