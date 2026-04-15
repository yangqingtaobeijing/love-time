import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { applyTheme } from './store'
import './style.css'

applyTheme()

const app = createApp(App)
app.use(router)
app.mount('#app')
