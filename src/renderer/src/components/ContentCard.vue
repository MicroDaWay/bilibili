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
      <img :src="proxyImage(item.cover)" :alt="props.item.title" />
    </div>
    <div class="details">
      <div class="title">{{ props.item.title }}</div>
      <div class="ptime">投稿时间：{{ props.item.ptime }}</div>
      <div class="topic">投稿话题：{{ props.item.topic }}</div>
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
  width: 85%;
  border-bottom: 1px solid #ccc;
  padding: 20px 0;

  .img-container {
    img {
      display: block;
      width: 230px;
    }
  }

  .details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 500px;
    height: 130px;
    margin-left: 20px;
    font-size: 18px;

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
