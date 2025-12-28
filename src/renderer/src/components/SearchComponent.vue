<!-- 搜索框组件 -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: '请输入投稿标签'
  },
  itemList: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search-handler'])

const tag = ref('')
const activeRow = ref(null)
const inputEl = ref(null)
let resizeObserver = null
const isInputFocus = ref(false)

// 处理滚动条导致输入框宽度变化
const checkScrollbar = () => {
  const container = document.querySelector('.right-content')
  if (!container || !inputEl.value) return
  const hasScrollbar = container.scrollHeight > container.clientHeight
  inputEl.value.style.width = hasScrollbar ? 'calc(83.3% - 12px)' : '83.3%'
}

onMounted(() => {
  checkScrollbar()
  const container = document.querySelector('.right-content')
  if (container) {
    resizeObserver = new ResizeObserver(checkScrollbar)
    resizeObserver.observe(container)
  }
  window.addEventListener('resize', checkScrollbar)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('resize', checkScrollbar)
})

// 点击搜索
const searchHandler = async () => {
  emit('search-handler', tag.value)
}
</script>

<template>
  <div class="search-by-tag">
    <div ref="inputEl" class="search-input-box">
      <div class="input-container">
        <input
          v-model.trim="tag"
          type="text"
          class="search-input"
          :class="{ 'input-focus': isInputFocus }"
          :placeholder="placeholder"
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

    <table class="table-container">
      <thead v-if="itemList.length">
        <tr class="table-tr">
          <th
            v-for="column in props.columns"
            :key="column.key"
            :style="{ width: column.width || 'auto' }"
          >
            {{ column.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in props.itemList"
          :key="item.id"
          class="tr-text"
          :class="{ 'tr-active': activeRow === item }"
          @click="activeRow = item"
        >
          <td v-for="column in columns" :key="column.key">
            {{ column.formatter ? column.formatter(item[column.key]) : item[column.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.search-by-tag {
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
  .table-container {
    margin: 100px 0 50px 0;
    width: 98%;
    .table-tr {
      font-size: 22px;
    }
    .tr-text {
      font-size: 22px;
      margin: 6px 0;
      &.tr-active {
        background-color: orange;
      }
      &:hover {
        background-color: orange;
      }
    }
  }
}
</style>
