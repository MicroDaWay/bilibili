<!-- 稿件管理卡片组件 -->
<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => {}
  },
  count: {
    type: Number,
    default: 0
  }
})

const proxyImage = (url) => {
  return `http://localhost:3000/proxy/image?url=${encodeURIComponent(url)}`
}
</script>

<template>
  <div class="content-card">
    <div class="img-container">
      <a :href="`https://www.bilibili.com/video/${props.item.bvid}`" target="_blank">
        <img :src="proxyImage(item.cover)" :alt="props.item.title" />
      </a>
    </div>
    <div class="details">
      <div class="title">标题：{{ props.item.title }}</div>
      <div class="ptime">投稿时间：{{ props.item.ptime }}</div>
      <div class="tag">投稿标签：{{ props.item.tag }}</div>
      <div :class="['view', { 'high-view': props.item.view >= 100 }]">
        播放量：{{ props.item.view }}
      </div>
      <div>稿件数：{{ props.count }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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

    .title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .view {
      &.high-view {
        color: red;
      }
    }
  }
}
</style>
