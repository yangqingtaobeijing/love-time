<script setup lang="ts">
import { ref } from 'vue'
import {
  settings,
  daysTogether,
  upcomingAnniversaries,
  pastAnniversaries,
  addAnniversary,
  deleteAnniversary,
} from '../store'
import { today } from '../utils/date'

/* ─── Form state ───────────────────────────────── */
const showForm = ref(false)
const formName = ref('')
const formDate = ref(today())
const formEmoji = ref('🎂')
const formRepeat = ref(false)

const emojiOptions = ['🎂', '💑', '🎄', '🎁', '💝', '🌹', '✈️', '🎓', '🏠', '💍']

function openAdd() {
  formName.value = ''
  formDate.value = today()
  formEmoji.value = '🎂'
  formRepeat.value = false
  showForm.value = true
}

function saveForm() {
  if (!formName.value.trim() || !formDate.value) return
  addAnniversary({
    name: formName.value.trim(),
    date: formDate.value,
    emoji: formEmoji.value,
    isYearlyRepeat: formRepeat.value,
  })
  showForm.value = false
}

/* ─── Delete ───────────────────────────────────── */
const confirmDeleteId = ref<string | null>(null)

function askDelete(id: string) {
  confirmDeleteId.value = id
}

function doDelete() {
  if (confirmDeleteId.value) {
    deleteAnniversary(confirmDeleteId.value)
    confirmDeleteId.value = null
  }
}
</script>

<template>
  <div class="anniversary-page">
    <div class="anniversary-container">
      <!-- Hero card -->
      <div class="anniversary-hero card">
        <div class="hero-bg" />
        <div class="hero-content">
          <p class="hero-label">我们已经在一起</p>
          <div class="hero-days">✨ {{ daysTogether }} 天 ✨</div>
          <p v-if="settings.nicknameA || settings.nicknameB" class="hero-names">
            {{ settings.nicknameA }} & {{ settings.nicknameB }}
          </p>
        </div>
      </div>

      <!-- Upcoming -->
      <div v-if="upcomingAnniversaries.length" class="anniversary-section">
        <h2 class="section-title">即将到来</h2>
        <div class="anniversary-grid">
          <div
            v-for="a in upcomingAnniversaries"
            :key="a.id"
            class="anniversary-card card"
          >
            <div class="anniversary-card-inner">
              <span class="anniversary-emoji">{{ a.emoji }}</span>
              <div class="anniversary-info">
                <h3 class="anniversary-name">
                  {{ a.name }}
                  <span v-if="a.yearCount" class="anniversary-year">({{ a.yearCount }}周年)</span>
                </h3>
                <p class="anniversary-date">{{ a.targetDate }}</p>
              </div>
              <div class="anniversary-countdown">
                <span class="countdown-text">{{ a.displayText }}</span>
              </div>
              <button class="anniversary-delete" @click="askDelete(a.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Past -->
      <div v-if="pastAnniversaries.length" class="anniversary-section">
        <h2 class="section-title">已经过去</h2>
        <div class="anniversary-grid">
          <div
            v-for="a in pastAnniversaries"
            :key="a.id"
            class="anniversary-card card past"
          >
            <div class="anniversary-card-inner">
              <span class="anniversary-emoji">{{ a.emoji }}</span>
              <div class="anniversary-info">
                <h3 class="anniversary-name">{{ a.name }}</h3>
                <p class="anniversary-date">{{ a.targetDate }}</p>
              </div>
              <div class="anniversary-countdown">
                <span class="countdown-text past-text">{{ a.displayText }}</span>
              </div>
              <button class="anniversary-delete" @click="askDelete(a.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="upcomingAnniversaries.length === 0 && pastAnniversaries.length === 0"
        class="anniversary-empty"
      >
        <div class="anniversary-empty-emoji">🎂</div>
        <p class="anniversary-empty-text">还没有添加纪念日</p>
      </div>

      <!-- Add button -->
      <div class="anniversary-add-wrap">
        <button class="anniversary-add-btn" @click="openAdd">+ 添加纪念日</button>
      </div>
    </div>

    <!-- Add form modal -->
    <Teleport to="body">
      <div
        v-if="showForm"
        class="modal-overlay"
        @click.self="showForm = false"
      >
        <div class="modal-backdrop" @click="showForm = false" />
        <div class="modal-card animate-scale-in">
          <h2 class="modal-title">添加纪念日</h2>

          <div class="modal-body">
            <!-- Name -->
            <div class="form-group">
              <label class="form-label">名称 *</label>
              <input
                v-model="formName"
                type="text"
                placeholder="比如：宝宝生日"
                class="form-input"
              />
            </div>

            <!-- Date -->
            <div class="form-group">
              <label class="form-label">日期 *</label>
              <input
                v-model="formDate"
                type="date"
                class="form-input"
              />
            </div>

            <!-- Emoji -->
            <div class="form-group">
              <label class="form-label">Emoji</label>
              <div class="emoji-picker">
                <button
                  v-for="e in emojiOptions"
                  :key="e"
                  class="emoji-btn"
                  :class="{ active: formEmoji === e }"
                  @click="formEmoji = e"
                >
                  {{ e }}
                </button>
              </div>
            </div>

            <!-- Yearly repeat -->
            <div class="form-toggle">
              <span class="form-toggle-label">每年重复</span>
              <button
                class="toggle-btn"
                :class="{ active: formRepeat }"
                @click="formRepeat = !formRepeat"
              >
                <span class="toggle-thumb" />
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="showForm = false">取消</button>
            <button class="modal-btn-primary" @click="saveForm">保存 💕</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm -->
    <Teleport to="body">
      <div
        v-if="confirmDeleteId"
        class="modal-overlay"
        @click.self="confirmDeleteId = null"
      >
        <div class="modal-backdrop" @click="confirmDeleteId = null" />
        <div class="modal-card modal-card-small animate-scale-in">
          <p class="modal-confirm-title">确认删除？</p>
          <p class="modal-confirm-desc">这个纪念日将被永久删除</p>
          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="confirmDeleteId = null">取消</button>
            <button class="modal-btn-danger" @click="doDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.anniversary-page {
  min-height: 100vh;
  padding: 40px 48px 80px;
  background-color: var(--color-bg);
}

.anniversary-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* ─── Hero card ─────────────────────────────────────────── */
.anniversary-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 48px;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  opacity: 1;
}

.hero-content {
  position: relative;
  padding: 40px 32px;
  text-align: center;
}

.hero-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.hero-days {
  font-size: 52px;
  font-weight: 700;
  color: #fff;
  margin: 8px 0;
  line-height: 1.2;
}

.hero-names {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}

/* ─── Section ───────────────────────────────────────────── */
.anniversary-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
  padding-left: 4px;
}

/* ─── Grid: 3 columns ──────────────────────────────────── */
.anniversary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.anniversary-card {
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.anniversary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
}

.anniversary-card.past {
  opacity: 0.6;
}

.anniversary-card-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.anniversary-emoji {
  font-size: 32px;
  flex-shrink: 0;
}

.anniversary-info {
  flex: 1;
  min-width: 0;
}

.anniversary-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anniversary-year {
  font-weight: 400;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.anniversary-date {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.anniversary-countdown {
  flex-shrink: 0;
}

.countdown-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.past-text {
  color: var(--color-text-secondary);
  font-weight: 400;
}

.anniversary-delete {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
}

.anniversary-card:hover .anniversary-delete {
  opacity: 1;
}

.anniversary-delete:hover {
  background-color: var(--color-bg-secondary);
}

/* ─── Empty state ───────────────────────────────────────── */
.anniversary-empty {
  text-align: center;
  padding: 60px 0;
}

.anniversary-empty-emoji {
  font-size: 64px;
  margin-bottom: 16px;
}

.anniversary-empty-text {
  font-size: 16px;
  color: var(--color-text-secondary);
}

/* ─── Add button ────────────────────────────────────────── */
.anniversary-add-wrap {
  max-width: 480px;
  margin: 0 auto;
}

.anniversary-add-btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border: 2px dashed var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.anniversary-add-btn:hover {
  background-color: var(--color-tag-bg);
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
  width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background-color: var(--color-card);
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
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  border: 2px solid transparent;
  background-color: var(--color-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-btn.active {
  border-color: var(--color-primary);
  background-color: var(--color-tag-bg);
}

.emoji-btn:hover {
  background-color: var(--color-bg-secondary);
}

.form-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
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
  font-weight: 500;
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
  transition: transform 0.15s;
}

.modal-btn-primary:hover {
  transform: translateY(-1px);
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
}
</style>
