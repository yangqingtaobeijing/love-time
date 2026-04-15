<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isFirstUse, settings, daysTogether, toggleTheme } from './store'

const router = useRouter()
const route = useRoute()

const tabs = [
  { name: 'timeline', label: '时间轴', emoji: '📅', path: '/' },
  { name: 'starry', label: '星空许愿', emoji: '✨', path: '/starry' },
  { name: 'anniversary', label: '纪念日', emoji: '💝', path: '/anniversary' },
  { name: 'wishlist', label: '心愿清单', emoji: '📝', path: '/wishlist' },
  { name: 'wheel', label: '今天吃什么', emoji: '🍽️', path: '/wheel' },
  { name: 'settings', label: '设置', emoji: '⚙️', path: '/settings' },
]

const showSidebar = computed(() => {
  const name = route.name as string
  return name !== 'welcome'
})

const currentTab = computed(() => {
  const found = tabs.find((t) => t.name === route.name)
  return found ?? tabs[0]
})

function goTo(path: string) {
  router.push(path)
}

/* Redirect to welcome page on first use */
watch(
  () => route.name,
  (name) => {
    if (isFirstUse.value && name !== 'welcome') {
      router.replace('/welcome')
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="app-shell">
    <!-- Left sidebar -->
    <aside v-if="showSidebar" class="sidebar">
      <!-- Brand -->
      <div class="sidebar-brand" @click="goTo('/')">
        <span class="sidebar-brand-emoji">💕</span>
        <span class="sidebar-brand-text">恋爱时光</span>
      </div>

      <!-- Couple info -->
      <div v-if="settings.nicknameA || settings.nicknameB" class="sidebar-couple">
        <p class="sidebar-couple-names">{{ settings.nicknameA }} & {{ settings.nicknameB }}</p>
        <p class="sidebar-couple-days">在一起 <strong>{{ daysTogether }}</strong> 天</p>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          class="sidebar-nav-item"
          :class="{ active: currentTab.name === tab.name }"
          @click="goTo(tab.path)"
        >
          <span class="sidebar-nav-emoji">{{ tab.emoji }}</span>
          <span class="sidebar-nav-label">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Theme toggle at bottom -->
      <div class="sidebar-footer">
        <button class="sidebar-theme-btn" @click="toggleTheme()">
          <span>{{ settings.theme === 'light' ? '☀️ 浅色模式' : '🌙 深色模式' }}</span>
        </button>
      </div>
    </aside>

    <!-- Main content area -->
    <main
      class="main-content"
      :class="{ 'with-sidebar': showSidebar }"
    >
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ─── Sidebar ───────────────────────────────────────────── */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background-color: var(--color-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 40;
  padding: 28px 16px 20px;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 0 8px;
  margin-bottom: 24px;
  transition: opacity 0.2s;
}

.sidebar-brand:hover {
  opacity: 0.8;
}

.sidebar-brand-emoji {
  font-size: 28px;
}

.sidebar-brand-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.sidebar-couple {
  padding: 14px 16px;
  margin: 0 0 20px;
  background: linear-gradient(135deg, var(--color-tag-bg), var(--color-bg-secondary));
  border-radius: 12px;
}

.sidebar-couple-names {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.sidebar-couple-days {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.sidebar-couple-days strong {
  color: var(--color-primary);
  font-weight: 700;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.sidebar-nav-item:hover {
  background-color: var(--color-bg-secondary);
}

.sidebar-nav-item.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.sidebar-nav-emoji {
  font-size: 18px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.sidebar-nav-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  transition: color 0.2s;
}

.sidebar-nav-item.active .sidebar-nav-label {
  color: #fff;
  font-weight: 600;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
}

.sidebar-theme-btn {
  width: 100%;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.sidebar-theme-btn:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
}

/* ─── Main content ──────────────────────────────────────── */
.main-content {
  flex: 1;
  min-height: 100vh;
  overflow-y: auto;
}

.main-content.with-sidebar {
  margin-left: 240px;
}
</style>
