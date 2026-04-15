<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { settings, toggleTheme, exportAllData, importAllData, clearAllData } from '../store'
import type { ExportData } from '../types'

const router = useRouter()

/* ─── Export ────────────────────────────────────── */
function handleExport() {
  const data = exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `love-time-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/* ─── Import ───────────────────────────────────── */
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  fileInput.value?.click()
}

function handleImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result as string) as ExportData
      if (confirm('导入将覆盖当前所有数据，确定继续？')) {
        const ok = importAllData(raw)
        if (ok) {
          alert('导入成功 ✨')
        } else {
          alert('数据格式不正确，请检查文件')
        }
      }
    } catch {
      alert('无法解析文件，请确认是有效的 JSON')
    }
    target.value = ''
  }
  reader.readAsText(file)
}

/* ─── Clear ────────────────────────────────────── */
const showClearConfirm = ref(false)

function doClear() {
  clearAllData()
  showClearConfirm.value = false
  router.replace('/welcome')
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- Page header -->
      <div class="settings-header">
        <h1 class="settings-title">⚙️ 设置</h1>
        <p class="settings-desc">管理你的恋爱时光</p>
      </div>

      <!-- About us -->
      <section class="settings-section">
        <h2 class="settings-section-title">💑 关于我们</h2>
        <div class="settings-card card">
          <div class="settings-field">
            <label class="settings-label">恋爱开始日期</label>
            <input
              v-model="settings.startDate"
              type="date"
              class="settings-input"
            />
          </div>
          <div class="settings-divider" />
          <div class="settings-field">
            <label class="settings-label">你的昵称</label>
            <input
              v-model="settings.nicknameA"
              type="text"
              placeholder="你的昵称"
              class="settings-input"
            />
          </div>
          <div class="settings-divider" />
          <div class="settings-field">
            <label class="settings-label">TA 的昵称</label>
            <input
              v-model="settings.nicknameB"
              type="text"
              placeholder="TA 的昵称"
              class="settings-input"
            />
          </div>
        </div>
      </section>

      <!-- Theme -->
      <section class="settings-section">
        <h2 class="settings-section-title">🎨 外观</h2>
        <div class="settings-card card">
          <div class="settings-row">
            <span class="settings-row-label">主题模式</span>
            <div class="settings-row-right">
              <span class="settings-row-value">
                {{ settings.theme === 'light' ? '☀️ 浅色' : '🌙 深色' }}
              </span>
              <button
                class="toggle-btn"
                :class="{ active: settings.theme === 'dark' }"
                @click="toggleTheme()"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Data management -->
      <section class="settings-section">
        <h2 class="settings-section-title">💾 数据管理</h2>
        <div class="settings-card card">
          <button class="settings-action" @click="handleExport">
            <span>📤 导出数据</span>
          </button>
          <div class="settings-divider" />
          <button class="settings-action" @click="triggerImport">
            <span>📥 导入数据</span>
          </button>
          <div class="settings-divider" />
          <button class="settings-action settings-action-danger" @click="showClearConfirm = true">
            <span>🗑️ 清除所有数据</span>
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden-input"
          @change="handleImport"
        />
      </section>

      <!-- About -->
      <section class="settings-section">
        <h2 class="settings-section-title">ℹ️ 关于</h2>
        <div class="settings-card card settings-about">
          <p class="settings-about-name">恋爱时光 v1.0</p>
          <p class="settings-about-credit">Made with ❤️ by 涛哥</p>
        </div>
      </section>
    </div>

    <!-- Clear confirm dialog -->
    <Teleport to="body">
      <div
        v-if="showClearConfirm"
        class="modal-overlay"
        @click.self="showClearConfirm = false"
      >
        <div class="modal-backdrop" @click="showClearConfirm = false" />
        <div class="modal-card animate-scale-in">
          <p class="modal-confirm-title">⚠️ 清除所有数据？</p>
          <p class="modal-confirm-desc">
            所有记录、纪念日、心愿都将永久删除，建议先导出备份
          </p>
          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="showClearConfirm = false">取消</button>
            <button class="modal-btn-danger" @click="doClear">确认清除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  padding: 40px 48px 80px;
  background-color: var(--color-bg);
}

.settings-container {
  max-width: 560px;
  margin: 0 auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 40px;
}

.settings-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.settings-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
}

/* ─── Sections ──────────────────────────────────────────── */
.settings-section {
  margin-bottom: 32px;
}

.settings-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  padding-left: 4px;
}

.settings-card {
  padding: 0;
  overflow: hidden;
}

.settings-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: 0 20px;
}

/* ─── Field ─────────────────────────────────────────────── */
.settings-field {
  padding: 16px 20px;
}

.settings-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.settings-input {
  width: 100%;
  height: 40px;
  font-size: 15px;
  outline: none;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-family: inherit;
}

.settings-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

/* ─── Row ───────────────────────────────────────────────── */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

.settings-row-label {
  font-size: 15px;
  color: var(--color-text);
}

.settings-row-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-row-value {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.toggle-btn {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background-color: var(--color-border);
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-btn.active {
  background-color: var(--color-primary);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.toggle-btn.active .toggle-thumb {
  transform: translateX(20px);
}

/* ─── Action buttons ────────────────────────────────────── */
.settings-action {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 18px 20px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;
}

.settings-action:hover {
  background-color: var(--color-bg-secondary);
}

.settings-action-danger {
  color: #FF6B6B;
}

.hidden-input {
  display: none;
}

/* ─── About ─────────────────────────────────────────────── */
.settings-about {
  padding: 24px;
  text-align: center;
}

.settings-about-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.settings-about-credit {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* ─── Modal ─────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.modal-card {
  position: relative;
  width: 380px;
  background-color: var(--color-card);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.modal-confirm-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.modal-confirm-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 14px;
}

.modal-btn-cancel {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-btn-cancel:hover {
  background-color: var(--color-bg-secondary);
}

.modal-btn-danger {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: #FF6B6B;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}

.modal-btn-danger:hover {
  transform: translateY(-1px);
}
</style>
