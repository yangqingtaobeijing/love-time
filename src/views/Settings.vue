<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  settings,
  cloudSyncSettings,
  cloudSyncStatus,
  toggleTheme,
  exportAllData,
  importAllData,
  clearAllData,
  testCloudConnection,
  uploadCloudData,
  downloadCloudData,
} from '../store'
import type { ExportData } from '../types'

const router = useRouter()

const cloudBusy = computed(() =>
  cloudSyncStatus.testing || cloudSyncStatus.uploading || cloudSyncStatus.downloading,
)

const cloudLastSyncText = computed(() => {
  if (!cloudSyncSettings.lastSyncAt) return '尚未同步'
  return new Date(cloudSyncSettings.lastSyncAt).toLocaleString()
})

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

/* ─── Cloud sync ───────────────────────────────── */
async function handleTestCloudConnection() {
  const ok = await testCloudConnection()
  alert(ok ? 'GitHub 连接正常' : `GitHub 连接失败：${cloudSyncSettings.lastSyncError}`)
}

async function handleUploadCloudData() {
  const ok = await uploadCloudData()
  alert(ok ? '已上传到 GitHub' : `上传失败：${cloudSyncSettings.lastSyncError || cloudSyncStatus.message}`)
}

async function handleDownloadCloudData() {
  if (!confirm('从云端恢复会覆盖当前浏览器里的数据，确定继续？')) return
  const ok = await downloadCloudData()
  alert(ok ? '已从 GitHub 恢复数据' : `恢复失败：${cloudSyncSettings.lastSyncError || cloudSyncStatus.message}`)
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

      <!-- GitHub cloud sync -->
      <section class="settings-section">
        <h2 class="settings-section-title">☁️ GitHub 云同步</h2>
        <div class="settings-card card cloud-card">
          <div class="settings-row">
            <div>
              <span class="settings-row-label">自动上传到 GitHub</span>
              <p class="settings-row-hint">开启后，每次保存数据都会自动提交到指定仓库文件。</p>
            </div>
            <button
              class="toggle-btn"
              :class="{ active: cloudSyncSettings.enabled }"
              @click="cloudSyncSettings.enabled = !cloudSyncSettings.enabled"
            >
              <span class="toggle-thumb" />
            </button>
          </div>

          <div class="settings-divider" />

          <div class="cloud-warning">
            token 只保存在当前浏览器本地。建议使用 Fine-grained token，只授予数据仓库 Contents 读写权限。
          </div>

          <div class="cloud-fields">
            <div class="cloud-field">
              <label class="cloud-label">GitHub 用户名</label>
              <input v-model="cloudSyncSettings.owner" class="cloud-input" placeholder="yangqingtaobeijing" />
            </div>

            <div class="cloud-field">
              <label class="cloud-label">数据仓库名</label>
              <input v-model="cloudSyncSettings.repo" class="cloud-input" placeholder="love-time-data" />
            </div>

            <div class="cloud-field cloud-field-half">
              <label class="cloud-label">分支</label>
              <input v-model="cloudSyncSettings.branch" class="cloud-input" placeholder="main" />
            </div>

            <div class="cloud-field">
              <label class="cloud-label">数据文件路径</label>
              <input v-model="cloudSyncSettings.path" class="cloud-input" placeholder="love-time-data.json" />
            </div>

            <div class="cloud-field">
              <label class="cloud-label">GitHub Token</label>
              <input
                v-model="cloudSyncSettings.token"
                type="password"
                class="cloud-input"
                placeholder="github_pat_..."
                autocomplete="off"
              />
            </div>
          </div>

          <div class="cloud-actions">
            <button class="cloud-btn" :disabled="cloudBusy" @click="handleTestCloudConnection">
              测试连接
            </button>
            <button class="cloud-btn cloud-btn-primary" :disabled="cloudBusy" @click="handleUploadCloudData">
              上传当前数据
            </button>
            <button class="cloud-btn" :disabled="cloudBusy" @click="handleDownloadCloudData">
              从云端恢复
            </button>
          </div>

          <div class="cloud-status">
            <p>状态：{{ cloudSyncStatus.message || '等待配置' }}</p>
            <p>最近同步：{{ cloudLastSyncText }}</p>
            <p v-if="cloudSyncSettings.lastSyncError" class="cloud-error">
              {{ cloudSyncSettings.lastSyncError }}
            </p>
          </div>
        </div>
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

.settings-row-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-top: 4px;
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

/* ─── GitHub cloud sync ─────────────────────────────────── */
.cloud-card {
  padding-bottom: 20px;
}

.cloud-warning {
  margin: 18px 20px 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.cloud-fields {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.cloud-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.cloud-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.cloud-input {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.cloud-input:focus {
  border-color: var(--color-primary);
}

.cloud-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 0 20px 18px;
}

.cloud-btn {
  height: 42px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.cloud-btn-primary {
  border-color: transparent;
  background: var(--color-primary);
  color: #fff;
}

.cloud-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.cloud-status {
  margin: 0 20px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.cloud-error {
  color: #FF6B6B;
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

@media (max-width: 640px) {
  .settings-page {
    padding: 28px 18px 72px;
  }

  .cloud-actions {
    grid-template-columns: 1fr;
  }
}
</style>
