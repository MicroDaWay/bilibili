import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useBilibiliStore } from './stores/bilibiliStore'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')

window.electronAPI.saveExcelData((excelData) => {
  const bilibiliStore = useBilibiliStore()
  bilibiliStore.setExcelData(excelData)
})
