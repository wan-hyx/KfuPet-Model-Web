import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

// Edge / Chrome 从往返缓存（bfcache）恢复旧页面时，重新加载以拿到最新路由与页面状态
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.location.reload()
  }
})
