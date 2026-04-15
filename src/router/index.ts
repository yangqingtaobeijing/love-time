import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'timeline', component: () => import('../views/Timeline.vue') },
  { path: '/starry', name: 'starry', component: () => import('../views/Starry.vue') },
  { path: '/anniversary', name: 'anniversary', component: () => import('../views/Anniversary.vue') },
  { path: '/wishlist', name: 'wishlist', component: () => import('../views/Wishlist.vue') },
  { path: '/wheel', name: 'wheel', component: () => import('../views/Wheel.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue') },
  { path: '/welcome', name: 'welcome', component: () => import('../views/Welcome.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
