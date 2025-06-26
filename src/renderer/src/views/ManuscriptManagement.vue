<!-- 稿件管理 -->
<script setup>
import { ref } from 'vue'
import { format } from 'date-fns'
import { useBilibiliStore } from '../stores/bilibiliStore'
import { excelDateToJSDate, formatTimestampToDatetime } from '../utils'
import ContentCard from '../components/ContentCard.vue'

// 投稿话题
const topic = ref('')

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

const bilibiliStore = useBilibiliStore()

// 获取指定页码的数据
async function getManuscriptList(pn) {
  const result = await window.electronAPI.manuscriptManagement(pn)
  return result
}

// 处理每一页的数据
function itemListHandler(items, startTime) {
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
async function main() {
  try {
    totalPlay.value = 0
    totalCount.value = 0
    itemList.value = []
    const startTime = filterData.value.eventStartTime
    let pn = 1

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const itemList = await getManuscriptList(pn)
      const latestPostTime = formatTimestampToDatetime(itemListHandler(itemList, startTime))
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
      type: 'error',
      message: `发生错误：, ${error.message}`
    })
  }
}

// 点击搜索的处理函数
const searchHandler = () => {
  bilibiliStore.excelData.map((item) => {
    if (item['投稿话题'].includes(topic.value)) {
      filterData.value = {
        ...item,
        eventStartTime: format(excelDateToJSDate(item['活动开始时间']), 'yyyy-MM-dd'),
        eventEndTime: format(excelDateToJSDate(item['活动结束时间']), 'yyyy-MM-dd')
      }
    }
  })

  main()
}
</script>

<template>
  <div class="manuscript-management">
    <div class="search-input-box">
      <input
        v-model.trim="topic"
        class="search-input"
        type="text"
        placeholder="请输入投稿话题"
        @keyup.enter="searchHandler"
      />
      <div class="search-button" @click="searchHandler">搜索</div>
    </div>
    <div class="event-rules">
      <div>活动规则：{{ filterData['活动规则'] }}</div>
      <div>当前话题：投稿量={{ totalCount }}，播放量={{ totalPlay }}</div>
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
  width: 100%;
  height: 100%;

  .search-input-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: fixed;
    width: 1100px;
    padding: 20px 0;
    background-color: #fff;

    .search-input {
      width: 900px;
      height: 40px;
      border-radius: 22px;
      border: none;
      outline: none;
      border: 1px solid #ccc;
      font-size: 20px;
      padding: 0 16px;
    }

    .search-button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 130px;
      height: 40px;
      background-color: orange;
      border-radius: 22px;
      font-size: 20px;
      margin-left: 50px;
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
    position: fixed;
    top: 80px;
    width: 1100px;
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
