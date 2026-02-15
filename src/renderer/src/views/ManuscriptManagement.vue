<!-- 稿件管理 -->
<script setup>
import { format } from 'date-fns'
import { nextTick, ref } from 'vue'

import ContentCardComponent from '@/components/ContentCardComponent.vue'
import { useBilibiliStore } from '@/stores/bilibiliStore'
import { excelDateToJSDate, formatTimestampToDatetime, sleep } from '@/utils'

// 投稿标签
const postTag = ref('')
const isSearching = ref(false)

// 过滤后的数据
const filterData = ref({})

const totalPlay = ref(0)
const totalCount = ref(0)
const itemList = ref([])
const isInputFocus = ref(false)

const bilibiliStore = useBilibiliStore()

const scrollToBottom = () => {
  const container = document.querySelector('.right-content')
  if (!container) return
  container.scrollTop = container.scrollHeight
}

// 主函数
const main = async () => {
  try {
    isSearching.value = true
    totalPlay.value = 0
    totalCount.value = 0
    itemList.value = []
    const startTime = filterData.value['活动开始时间']
    let pn = 1

    while (true) {
      await sleep(1)
      const result = await window.electronAPI.manuscriptManagement(pn)
      const arc_audits = result?.arc_audits

      for (const item of arc_audits) {
        const tag = item?.Archive?.tag
        const view = item?.stat?.view
        const ptime = formatTimestampToDatetime(item?.Archive?.ptime)
        const title = item?.Archive?.title
        const cover = item?.Archive?.cover

        if (tag.includes(postTag.value) && ptime >= startTime) {
          totalPlay.value += view
          totalCount.value++

          itemList.value.push({
            view,
            ptime,
            title,
            cover,
            tag: postTag.value
          })

          console.log(
            `投稿标签 = ${postTag.value}, ` +
              `投稿量 = ${String(totalCount.value).padEnd(2, ' ')}, ` +
              `播放量 = ${String(view).padEnd(5, ' ')}, ` +
              `总播放量 = ${String(totalPlay.value).padEnd(5, ' ')}, ` +
              `投稿时间 = ${ptime}, ` +
              `稿件名称 = ${title}`
          )
        }
      }

      await nextTick()
      scrollToBottom()

      const latestPostTime = formatTimestampToDatetime(arc_audits.at(-1)?.Archive?.ptime)

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
  } catch (err) {
    window.electronAPI.showMessage({
      title: '稿件管理',
      type: 'error',
      message: `查询失败, ${err.message}`
    })
  } finally {
    isSearching.value = false
  }
}

// 点击搜索的处理函数
const searchHandler = () => {
  if (isSearching.value) return
  let flag = false

  if (postTag.value === '') {
    window.electronAPI.showMessage({
      title: '稿件管理',
      type: 'info',
      message: '未输入投稿标签'
    })
    return
  }

  bilibiliStore.excelData.map((item) => {
    if (item['投稿标签'].includes(postTag.value)) {
      filterData.value = {
        ...item,
        ['活动开始时间']: format(excelDateToJSDate(item['活动开始时间']), 'yyyy-MM-dd'),
        ['活动结束时间']: format(excelDateToJSDate(item['活动结束时间']), 'yyyy-MM-dd')
      }
      flag = true
    }
  })

  if (!flag) {
    window.electronAPI.showMessage({
      title: '稿件管理',
      type: 'info',
      message: '没有找到相关投稿标签'
    })
    return
  }

  main()
}
</script>

<template>
  <div class="manuscript-management">
    <div class="header">
      <div class="search-input-box">
        <div class="input-container">
          <input
            v-model.trim="postTag"
            class="search-input"
            type="text"
            :class="{ 'input-focus': isInputFocus }"
            placeholder="请输入投稿标签"
            @focus="isInputFocus = true"
            @blur="isInputFocus = false"
            @keyup.enter="searchHandler"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="#000"
            class="search-icon"
            @click="searchHandler"
          >
            <path
              d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"
            ></path>
          </svg>
        </div>
        <div class="search-button" @click="searchHandler">搜索</div>
      </div>
      <div class="event-rules">
        <div>活动规则：{{ filterData['活动规则'] }}</div>
        <div>当前投稿：投稿量={{ totalCount }}, 播放量={{ totalPlay }}</div>
      </div>
    </div>
    <div class="content-box">
      <ContentCardComponent
        v-for="(item, index) in itemList"
        :key="item.title"
        :item="item"
        :count="index + 1"
      ></ContentCardComponent>
    </div>
  </div>
</template>

<style scoped lang="scss">
.manuscript-management {
  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;

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
            border: 1px solid var(--color-primary);
          }
        }

        .search-icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: 1vw;
          width: 1.6vw;
          height: 1.6vw;
        }
      }

      .search-button {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 8vw;
        height: 5.4vh;
        background-color: var(--color-primary);
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

    .event-rules {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 10vh;
      font-size: 1.3vw;
      background-color: #fff;
    }
  }

  .content-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }
}
</style>
