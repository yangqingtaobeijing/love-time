<script setup lang="ts">
import { ref, computed } from 'vue'
import { bucketList, bucketStats } from '../store'
import { uuid, today } from '../utils/date'
import type { BucketCategory, BucketItem, BucketCategoryConfig } from '../types'

// ─── Category config ───────────────────────────────────────
const CATEGORIES: BucketCategoryConfig[] = [
  { key: 'travel', label: '旅行', emoji: '✈️' },
  { key: 'food', label: '美食', emoji: '🍜' },
  { key: 'experience', label: '体验', emoji: '🎯' },
  { key: 'shopping', label: '购物', emoji: '🛍️' },
  { key: 'other', label: '其他', emoji: '💫' },
]

function getCategoryEmoji(key: BucketCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.emoji ?? '💫'
}

function getCategoryLabel(key: BucketCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? '其他'
}

// ─── Filter ────────────────────────────────────────────────
const activeFilter = ref<BucketCategory | 'all'>('all')

const pendingItems = computed(() => {
  const list = bucketList.filter((i) => !i.completed)
  if (activeFilter.value === 'all') return list
  return list.filter((i) => i.category === activeFilter.value)
})

const completedItems = computed(() => {
  const list = bucketList.filter((i) => i.completed)
  if (activeFilter.value === 'all') return list
  return list.filter((i) => i.category === activeFilter.value)
})

// ─── Add wish ──────────────────────────────────────────────
const showAddForm = ref(false)
const newTitle = ref('')
const newDesc = ref('')
const newCategory = ref<BucketCategory>('other')

function openAddForm() {
  newTitle.value = ''
  newDesc.value = ''
  newCategory.value = 'other'
  showAddForm.value = true
}

function closeAddForm() {
  showAddForm.value = false
}

function submitAdd() {
  const title = newTitle.value.trim()
  if (!title) return
  const item: BucketItem = {
    id: uuid(),
    title,
    description: newDesc.value.trim() || undefined,
    category: newCategory.value,
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  bucketList.push(item)
  showAddForm.value = false
}

// ─── Complete / Delete ─────────────────────────────────────
function toggleComplete(item: BucketItem) {
  const idx = bucketList.findIndex((i) => i.id === item.id)
  if (idx === -1) return
  if (!bucketList[idx].completed) {
    bucketList[idx].completed = true
    bucketList[idx].completedDate = today()
    bucketList[idx].updatedAt = Date.now()
  } else {
    bucketList[idx].completed = false
    bucketList[idx].completedDate = undefined
    bucketList[idx].updatedAt = Date.now()
  }
}

// ─── Delete via context menu ───────────────────────────────
const contextItem = ref<BucketItem | null>(null)
const showContextMenu = ref(false)

function openContextMenu(item: BucketItem) {
  contextItem.value = item
  showContextMenu.value = true
}

function deleteItem() {
  if (!contextItem.value) return
  const idx = bucketList.findIndex((i) => i.id === contextItem.value!.id)
  if (idx !== -1) bucketList.splice(idx, 1)
  showContextMenu.value = false
  contextItem.value = null
}

function closeContextMenu() {
  showContextMenu.value = false
  contextItem.value = null
}
</script>

<template>
  <div class="wishlist-page">
    <div class="wishlist-container">
      <!-- Page header -->
      <div class="wishlist-header">
        <h1 class="wishlist-title">📝 心愿清单</h1>
        <p class="wishlist-desc">写下你们想一起做的事</p>
      </div>

      <!-- Progress -->
      <div class="wl-progress card">
        <div class="wl-progress-text">
          <span>已完成 <strong>{{ bucketStats.completed }}</strong> / 共 <strong>{{ bucketStats.total }}</strong> 个</span>
          <span class="wl-progress-pct">{{ bucketStats.percentage }}%</span>
        </div>
        <div class="wl-progress-bar">
          <div class="wl-progress-fill" :style="{ width: bucketStats.percentage + '%' }" />
        </div>
      </div>

      <!-- Category tabs -->
      <div class="wl-tabs">
        <button
          class="wl-tab"
          :class="{ active: activeFilter === 'all' }"
          @click="activeFilter = 'all'"
        >
          全部
        </button>
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          class="wl-tab"
          :class="{ active: activeFilter === cat.key }"
          @click="activeFilter = cat.key"
        >
          {{ cat.emoji }} {{ cat.label }}
        </button>
      </div>

      <!-- Content -->
      <div class="wl-content">
        <!-- Empty state -->
        <div v-if="pendingItems.length === 0 && completedItems.length === 0" class="wl-empty">
          <p class="wl-empty-emoji">📋</p>
          <p class="wl-empty-text">还没有心愿呢</p>
          <p class="wl-empty-sub">写下你们想一起做的事吧 💕</p>
        </div>

        <!-- Pending section -->
        <template v-if="pendingItems.length > 0">
          <div class="wl-section-title">待完成</div>
          <div class="wl-grid">
            <div
              v-for="item in pendingItems"
              :key="item.id"
              class="wl-item card"
              @contextmenu.prevent="openContextMenu(item)"
            >
              <button class="wl-checkbox" @click="toggleComplete(item)">
                <span class="wl-checkbox-circle" />
              </button>
              <div class="wl-item-body">
                <div class="wl-item-title">{{ item.title }}</div>
                <div v-if="item.description" class="wl-item-desc">{{ item.description }}</div>
                <div class="wl-item-cat">{{ getCategoryEmoji(item.category) }} {{ getCategoryLabel(item.category) }}</div>
              </div>
              <button class="wl-item-delete" @click="openContextMenu(item)">🗑️</button>
            </div>
          </div>
        </template>

        <!-- Completed section -->
        <template v-if="completedItems.length > 0">
          <div class="wl-section-title">已完成 🎉</div>
          <div class="wl-grid">
            <div
              v-for="item in completedItems"
              :key="item.id"
              class="wl-item card completed"
              @contextmenu.prevent="openContextMenu(item)"
            >
              <button class="wl-checkbox checked" @click="toggleComplete(item)">
                <span class="wl-checkbox-check">✓</span>
              </button>
              <div class="wl-item-body">
                <div class="wl-item-title line-through">{{ item.title }}</div>
                <div v-if="item.completedDate" class="wl-item-date">完成于 {{ item.completedDate }}</div>
              </div>
              <button class="wl-item-delete" @click="openContextMenu(item)">🗑️</button>
            </div>
          </div>
        </template>
      </div>

      <!-- FAB -->
      <button class="wl-fab" @click="openAddForm">＋</button>

      <!-- Add form modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showAddForm" class="modal-overlay" @click="closeAddForm">
            <div class="modal-backdrop" />
            <div class="modal-card animate-scale-in" @click.stop>
              <h3 class="modal-title">添加心愿 ✨</h3>

              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">标题</label>
                  <input
                    v-model="newTitle"
                    class="form-input"
                    placeholder="想一起做什么？"
                    maxlength="50"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">描述（可选）</label>
                  <textarea
                    v-model="newDesc"
                    class="form-textarea"
                    placeholder="补充一下细节..."
                    maxlength="200"
                    rows="2"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">分类</label>
                  <div class="wl-cat-picker">
                    <button
                      v-for="cat in CATEGORIES"
                      :key="cat.key"
                      class="wl-cat-btn"
                      :class="{ active: newCategory === cat.key }"
                      @click="newCategory = cat.key"
                    >
                      {{ cat.emoji }} {{ cat.label }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button class="modal-btn-cancel" @click="closeAddForm">取消</button>
                <button class="modal-btn-primary" :disabled="!newTitle.trim()" @click="submitAdd">保存</button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Context menu (delete) -->
      <Teleport to="body">
        <Transition name="modal">
          <div v-if="showContextMenu" class="modal-overlay" @click="closeContextMenu">
            <div class="modal-backdrop" />
            <div class="modal-card modal-card-small animate-scale-in" @click.stop>
              <p class="modal-confirm-title">{{ contextItem?.title }}</p>
              <button class="wl-context-delete" @click="deleteItem">🗑️ 删除心愿</button>
              <button class="wl-context-cancel" @click="closeContextMenu">取消</button>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.wishlist-page {
  min-height: 100vh;
  padding: 40px 48px 80px;
  background-color: var(--color-bg);
}

.wishlist-container {
  max-width: 1100px;
  margin: 0 auto;
}

.wishlist-header {
  text-align: center;
  margin-bottom: 36px;
}

.wishlist-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.wishlist-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
}

/* ─── Progress ──────────────────────────────────────────── */
.wl-progress {
  padding: 20px 24px;
  margin-bottom: 24px;
}

.wl-progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: var(--color-text);
  margin-bottom: 12px;
}

.wl-progress-text strong {
  color: var(--color-primary);
  font-weight: 700;
}

.wl-progress-pct {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 18px;
}

.wl-progress-bar {
  width: 100%;
  height: 10px;
  background: var(--color-bg-secondary);
  border-radius: 5px;
  overflow: hidden;
}

.wl-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 5px;
  transition: width 0.5s ease;
}

/* ─── Tabs ──────────────────────────────────────────────── */
.wl-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.wl-tab {
  padding: 8px 18px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.wl-tab:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.wl-tab.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

/* ─── Content ───────────────────────────────────────────── */
.wl-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wl-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 12px 0 8px;
}

/* ─── Grid: 2 columns ──────────────────────────────────── */
.wl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* ─── Item ──────────────────────────────────────────────── */
.wl-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  transition: transform 0.3s, box-shadow 0.3s, opacity 0.3s;
}

.wl-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.wl-item.completed {
  opacity: 0.6;
}

.wl-checkbox {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  margin-top: 2px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.wl-checkbox-circle {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.2s;
}

.wl-checkbox:hover .wl-checkbox-circle {
  background: var(--color-primary);
  opacity: 0.4;
}

.wl-checkbox.checked {
  background: var(--color-success);
  border-color: var(--color-success);
}

.wl-checkbox-check {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.wl-item-body {
  flex: 1;
  min-width: 0;
}

.wl-item-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  word-break: break-word;
}

.wl-item-title.line-through {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.wl-item-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 6px;
  word-break: break-word;
  line-height: 1.5;
}

.wl-item-cat {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.wl-item-date {
  font-size: 13px;
  color: var(--color-success);
  margin-top: 6px;
}

.wl-item-delete {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
}

.wl-item:hover .wl-item-delete {
  opacity: 1;
}

.wl-item-delete:hover {
  background-color: var(--color-bg-secondary);
}

/* ─── Empty state ───────────────────────────────────────── */
.wl-empty {
  text-align: center;
  padding: 80px 20px;
}

.wl-empty-emoji {
  font-size: 56px;
  margin-bottom: 16px;
}

.wl-empty-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.wl-empty-sub {
  font-size: 15px;
  color: var(--color-text-secondary);
}

/* ─── FAB ───────────────────────────────────────────────── */
.wl-fab {
  position: fixed;
  bottom: 40px;
  right: 48px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 28px;
  font-weight: 300;
  box-shadow: 0 4px 24px rgba(255, 107, 107, 0.3);
  cursor: pointer;
  z-index: 20;
  transition: transform 0.2s, box-shadow 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wl-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 32px rgba(255, 107, 107, 0.4);
}

/* ─── Modal ─────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
}

.modal-card {
  position: relative;
  width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-card);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.modal-card-small {
  width: 380px;
  text-align: center;
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 24px;
  text-align: center;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  font-size: 15px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  font-size: 15px;
  font-family: inherit;
  outline: none;
  resize: none;
  line-height: 1.6;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  border-color: var(--color-primary);
}

.form-textarea::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

.wl-cat-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.wl-cat-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.wl-cat-btn.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.modal-actions {
  display: flex;
  gap: 14px;
  margin-top: 28px;
}

.modal-btn-cancel {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-btn-cancel:hover {
  background-color: var(--color-bg-secondary);
}

.modal-btn-primary {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.modal-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 20px;
  word-break: break-word;
}

.wl-context-delete {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #ff4757;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
  transition: opacity 0.2s;
}

.wl-context-delete:hover {
  opacity: 0.9;
}

.wl-context-cancel {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 15px;
  cursor: pointer;
}

/* ─── Transitions ───────────────────────────────────────── */
.modal-enter-active {
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  animation: modalIn 0.2s ease-in reverse;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
</style>
