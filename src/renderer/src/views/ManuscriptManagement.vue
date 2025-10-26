<!-- 稿件管理 -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { format } from 'date-fns'
import { useBilibiliStore } from '../stores/bilibiliStore'
import { excelDateToJSDate, formatTimestampToDatetime } from '../utils'
import ContentCard from '../components/ContentCard.vue'

// 投稿话题
const topic = ref('')
const isSearching = ref(false)

// 过滤后的数据
const filterData = ref({
  eventName: '',
  eventStartTime: '',
  eventEndTime: '',
  eventRules: '',
  postCategory: '',
  postCount: 0,
  postTopic: ''
})

const totalPlay = ref(0)
const totalCount = ref(0)
const itemList = ref([])
const inputEl = ref(null)
const eventRulesEl = ref(null)
let resizeObserver = null
const isInputFocus = ref(false)

const bilibiliStore = useBilibiliStore()

const checkScrollbar = () => {
  const container = document.querySelector('.right-content')
  if (!container || !inputEl.value) return
  const hasScrollbar = container.scrollHeight > container.clientHeight
  inputEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
  if (eventRulesEl.value) {
    eventRulesEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
  }
}

onMounted(() => {
  checkScrollbar()

  // 用 ResizeObserver 监控容器变化
  const container = document.querySelector('.right-content')
  if (container) {
    resizeObserver = new ResizeObserver(checkScrollbar)
    resizeObserver.observe(container)
  }

  // 监听窗口变化
  window.addEventListener('resize', checkScrollbar)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', checkScrollbar)
})

// 获取指定页码的数据
const getItemListByPageNumber = async (pn) => {
  const result = await window.electronAPI.manuscriptManagement(pn)
  return result
}

// 处理每一页的数据
const everyPageHandler = (items, startTime) => {
  for (const item of items) {
    const archive = item.Archive || {}
    const stat = item.stat || {}
    const tag = archive.tag || ''
    const view = stat.view || 0
    const ptime = formatTimestampToDatetime(archive.ptime) || 0
    const title = archive.title || ''
    const cover = archive.cover || ''

    if (tag.includes(topic.value) && ptime >= startTime) {
      totalPlay.value += parseInt(view, 10)
      totalCount.value++

      itemList.value.push({
        view,
        ptime,
        title,
        cover,
        topic: topic.value
      })

      console.log(
        `投稿话题 = ${topic.value}, ` +
          `投稿量 = ${String(totalCount.value).padEnd(2, ' ')}, ` +
          `播放量 = ${String(view).padEnd(5, ' ')}, ` +
          `总播放量 = ${String(totalPlay.value).padEnd(5, ' ')}, ` +
          `投稿时间 = ${ptime}, ` +
          `稿件名称 = ${title}`
      )
    }
  }

  return items.length > 0 ? items[items.length - 1].Archive.ptime : 0
}

// 主函数
const main = async () => {
  try {
    totalPlay.value = 0
    totalCount.value = 0
    itemList.value = []
    const startTime = filterData.value.eventStartTime
    let pn = 1

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const itemList = await getItemListByPageNumber(pn)
      const latestPostTime = formatTimestampToDatetime(everyPageHandler(itemList, startTime))
      if (latestPostTime < startTime) {
        window.electronAPI.showMessage({
          title: '稿件管理',
          type: 'info',
          message: '查询结束'
        })
        break
      }
      pn++
    }
  } catch (error) {
    window.electronAPI.showMessage({
      title: '稿件管理',
      type: 'error',
      message: `发生错误：, ${error.message}`
    })
  } finally {
    isSearching.value = false
  }
}

// 点击搜索的处理函数
const searchHandler = () => {
  if (isSearching.value) return
  let flag = false

  bilibiliStore.excelData.map((item) => {
    if (item['投稿话题'].includes(topic.value)) {
      filterData.value = {
        ...item,
        eventStartTime: format(excelDateToJSDate(item['活动开始时间']), 'yyyy-MM-dd'),
        eventEndTime: format(excelDateToJSDate(item['活动结束时间']), 'yyyy-MM-dd')
      }

      flag = true
    }
  })

  if (!flag) {
    window.electronAPI.showMessage({
      title: '稿件管理',
      type: 'info',
      message: '没有找到相关话题'
    })
    return
  }

  isSearching.value = true
  main()
}
</script>

<template>
  <div class="manuscript-management">
    <div ref="inputEl" class="search-input-box">
      <div class="input-container">
        <input
          v-model.trim="topic"
          class="search-input"
          type="text"
          :class="{ 'input-focus': isInputFocus }"
          placeholder="请输入投稿话题"
          @focus="isInputFocus = true"
          @blur="isInputFocus = false"
          @keyup.enter="searchHandler"
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
      <div class="search-button" @click="searchHandler">搜索</div>
    </div>
    <div ref="eventRulesEl" class="event-rules">
      <div>活动规则：{{ filterData['活动规则'] }}</div>
      <div>当前话题：投稿量={{ totalCount }}, 播放量={{ totalPlay }}</div>
    </div>
    <div class="content-box">
      <ContentCard
        v-for="(item, index) in itemList"
        :key="item.title"
        :item="item"
        :count="index + 1"
      ></ContentCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
.manuscript-management {
  display: flex;
  flex-direction: column;
  align-items: center;

  .search-input-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    width: 83.3%;
    padding: 20px 0;
    background-color: #fff;

    .input-container {
      position: relative;
      width: 100%;

      .search-input {
        width: 100%;
        height: 40px;
        border-radius: 22px;
        border: none;
        outline: none;
        border: 1px solid #ccc;
        font-size: 20px;
        padding: 0 42px 0 16px;
        user-select: none;

        &.input-focus {
          border: 1px solid orange;
        }
      }

      .search-icon {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: 12px;
      }
    }

    .search-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 10%;
      height: 40px;
      background-color: orange;
      border-radius: 22px;
      font-size: 20px;
      margin-left: 50px;
      cursor: pointer;
      user-select: none;

      &:hover {
        background-color: #ffb121;
      }
    }
  }

  .event-rules {
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: fixed;
    top: 80px;
    width: 83.3%;
    min-height: 80px;
    font-size: 20px;
    background-color: #fff;
  }

  .content-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding-top: 160px;
  }
}
</style>
