<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  sortedTimeline,
  timelineTags,
  addTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} from '../store'
import type { TimelineEvent, TimelineTag } from '../types'
import { today, uuid } from '../utils/date'

/* ─── Modal state ──────────────────────────────── */
const showForm = ref(false)
const editingEvent = ref<TimelineEvent | null>(null)

const formTitle = ref('')
const formDate = ref(today())
const formDescription = ref('')
const formTagId = ref('')
const formPhotoUrl = ref('')
const formPhotos = ref<{ id: string; type: 'url'; src: string }[]>([])

function openAdd() {
  editingEvent.value = null
  formTitle.value = ''
  formDate.value = today()
  formDescription.value = ''
  formTagId.value = ''
  formPhotoUrl.value = ''
  formPhotos.value = []
  showForm.value = true
}

function openEdit(ev: TimelineEvent) {
  editingEvent.value = ev
  formTitle.value = ev.title
  formDate.value = ev.date
  formDescription.value = ev.description ?? ''
  formTagId.value = ev.tagId ?? ''
  formPhotoUrl.value = ''
  formPhotos.value = ev.photos.map((p) => ({ id: p.id, type: 'url' as const, src: p.src }))
  showForm.value = true
}

function addPhoto() {
  const url = formPhotoUrl.value.trim()
  if (!url) return
  formPhotos.value.push({ id: uuid(), type: 'url', src: url })
  formPhotoUrl.value = ''
}

function removePhoto(id: string) {
  formPhotos.value = formPhotos.value.filter((p) => p.id !== id)
}

function saveForm() {
  if (!formTitle.value.trim()) return
  const data = {
    title: formTitle.value.trim(),
    date: formDate.value,
    description: formDescription.value.trim() || undefined,
    tagId: formTagId.value || undefined,
    photos: formPhotos.value.map((p) => ({ id: p.id, type: p.type, src: p.src })),
  }
  if (editingEvent.value) {
    updateTimelineEvent(editingEvent.value.id, data)
  } else {
    addTimelineEvent({ ...data, photos: data.photos })
  }
  showForm.value = false
}

/* ─── Delete ───────────────────────────────────── */
const confirmDeleteId = ref<string | null>(null)

function askDelete(id: string) {
  confirmDeleteId.value = id
}

function doDelete() {
  if (confirmDeleteId.value) {
    deleteTimelineEvent(confirmDeleteId.value)
    confirmDeleteId.value = null
  }
}

/* ─── Photo lightbox ───────────────────────────── */
const lightboxSrc = ref('')
function openLightbox(src: string) {
  lightboxSrc.value = src
}

/* ─── Tag helper ───────────────────────────────── */
function getTag(tagId?: string): TimelineTag | undefined {
  if (!tagId) return undefined
  return timelineTags.find((t) => t.id === tagId)
}

/* ─── Intersection Observer for fade-in ────────── */
const nodeRefs = ref<HTMLElement[]>([])

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up')
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1 },
  )
  nextTick(() => {
    nodeRefs.value.forEach((el) => observer?.observe(el))
  })
})

onUnmounted(() => {
  observer?.disconnect()
})

function setNodeRef(el: unknown, _index: number) {
  if (el instanceof HTMLElement) {
    nodeRefs.value.push(el)
    observer?.observe(el)
  }
}

/* ─── Context menu ─────────────────────────────── */
const menuEventId = ref<string | null>(null)

function toggleMenu(id: string) {
  menuEventId.value = menuEventId.value === id ? null : id
}
</script>

<template>
  <div class="timeline-page">
    <div class="timeline-container">
      <!-- Page header -->
      <div class="timeline-header">
        <h1 class="timeline-page-title">📅 时间轴</h1>
        <p class="timeline-page-desc">记录你们一起走过的每一步</p>
      </div>

      <!-- Empty state -->
      <div
        v-if="sortedTimeline.length === 0"
        class="timeline-empty"
      >
        <div class="timeline-empty-emoji">📖</div>
        <p class="timeline-empty-text">还没有任何记录哦</p>
        <p class="timeline-empty-sub">点击右下角的 + 开始记录你们的故事</p>
      </div>

      <!-- Timeline dual-column -->
      <div v-else class="timeline-track">
        <!-- Center vertical line -->
        <div class="timeline-line" />

        <!-- Nodes -->
        <div
          v-for="(ev, index) in sortedTimeline"
          :key="ev.id"
          :ref="(el) => setNodeRef(el, index)"
          class="timeline-node opacity-0"
          :class="index % 2 === 0 ? 'tl-left' : 'tl-right'"
        >
          <!-- Dot -->
          <div
            class="timeline-dot"
            :style="{ backgroundColor: getTag(ev.tagId)?.color ?? 'var(--color-primary)' }"
          />

          <!-- Date label -->
          <div class="tl-date">{{ ev.date }}</div>

          <!-- Card -->
          <div class="tl-card card">
            <!-- Menu button -->
            <button
              class="tl-menu-btn"
              @click.stop="toggleMenu(ev.id)"
            >
              ⋮
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="menuEventId === ev.id"
              class="tl-dropdown animate-scale-in"
            >
              <button
                class="tl-dropdown-item"
                @click="openEdit(ev); menuEventId = null"
              >
                ✏️ 编辑
              </button>
              <button
                class="tl-dropdown-item tl-dropdown-danger"
                @click="askDelete(ev.id); menuEventId = null"
              >
                🗑️ 删除
              </button>
            </div>

            <!-- Tag -->
            <div v-if="getTag(ev.tagId)" class="tl-tag-wrap">
              <span
                class="tl-tag"
                :style="{ backgroundColor: getTag(ev.tagId)!.color }"
              >
                {{ getTag(ev.tagId)!.name }}
              </span>
            </div>

            <!-- Title -->
            <h3 class="tl-card-title">{{ ev.title }}</h3>

            <!-- Description -->
            <p v-if="ev.description" class="tl-card-desc">{{ ev.description }}</p>

            <!-- Photos -->
            <div v-if="ev.photos.length" class="tl-photos">
              <img
                v-for="photo in ev.photos"
                :key="photo.id"
                :src="photo.src"
                :alt="ev.title"
                class="tl-photo"
                loading="lazy"
                @click="openLightbox(photo.src)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <button class="tl-fab" @click="openAdd">+</button>

    <!-- Add / Edit modal -->
    <Teleport to="body">
      <div
        v-if="showForm"
        class="modal-overlay"
        @click.self="showForm = false"
      >
        <div class="modal-backdrop" @click="showForm = false" />
        <div class="modal-card animate-scale-in">
          <h2 class="modal-title">
            {{ editingEvent ? '编辑记录' : '添加记录' }}
          </h2>

          <div class="modal-body">
            <!-- Title -->
            <div class="form-group">
              <label class="form-label">标题 *</label>
              <input
                v-model="formTitle"
                type="text"
                placeholder="发生了什么甜蜜的事？"
                class="form-input"
              />
            </div>

            <!-- Date -->
            <div class="form-group">
              <label class="form-label">日期</label>
              <input
                v-model="formDate"
                type="date"
                class="form-input"
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="formDescription"
                rows="3"
                placeholder="记录更多细节..."
                class="form-textarea"
              />
            </div>

            <!-- Tag -->
            <div class="form-group">
              <label class="form-label">分类</label>
              <div class="form-tags">
                <button
                  v-for="tag in timelineTags"
                  :key="tag.id"
                  class="form-tag-btn"
                  :class="{ active: formTagId === tag.id }"
                  :style="{
                    backgroundColor: formTagId === tag.id ? tag.color : 'var(--color-tag-bg)',
                    color: formTagId === tag.id ? '#fff' : 'var(--color-text-secondary)',
                  }"
                  @click="formTagId = formTagId === tag.id ? '' : tag.id"
                >
                  {{ tag.name }}
                </button>
              </div>
            </div>

            <!-- Photo URL -->
            <div class="form-group">
              <label class="form-label">照片 URL</label>
              <div class="form-photo-add">
                <input
                  v-model="formPhotoUrl"
                  type="url"
                  placeholder="https://..."
                  class="form-input"
                  @keyup.enter="addPhoto"
                />
                <button class="form-photo-btn" @click="addPhoto">添加</button>
              </div>
              <div v-if="formPhotos.length" class="form-photo-preview">
                <div
                  v-for="photo in formPhotos"
                  :key="photo.id"
                  class="form-photo-thumb"
                >
                  <img :src="photo.src" alt="photo" />
                  <button class="form-photo-remove" @click="removePhoto(photo.id)">×</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="showForm = false">取消</button>
            <button class="modal-btn-primary" @click="saveForm">保存 💕</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete confirm dialog -->
    <Teleport to="body">
      <div
        v-if="confirmDeleteId"
        class="modal-overlay"
        @click.self="confirmDeleteId = null"
      >
        <div class="modal-backdrop" @click="confirmDeleteId = null" />
        <div class="modal-card modal-card-small animate-scale-in">
          <p class="modal-confirm-title">确认删除？</p>
          <p class="modal-confirm-desc">这条记录删除后无法恢复</p>
          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="confirmDeleteId = null">取消</button>
            <button class="modal-btn-danger" @click="doDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Photo lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxSrc"
        class="lightbox"
        @click="lightboxSrc = ''"
      >
        <img :src="lightboxSrc" alt="照片" class="lightbox-img" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.timeline-page {
  min-height: 100vh;
  padding: 40px 48px 80px;
  background-color: var(--color-bg);
}

.timeline-container {
  max-width: 1100px;
  margin: 0 auto;
}

.timeline-header {
  text-align: center;
  margin-bottom: 48px;
}

.timeline-page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.timeline-page-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
}

/* ─── Empty state ───────────────────────────────────────── */
.timeline-empty {
  text-align: center;
  padding: 80px 0;
}

.timeline-empty-emoji {
  font-size: 64px;
  margin-bottom: 16px;
}

.timeline-empty-text {
  font-size: 18px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.timeline-empty-sub {
  font-size: 14px;
  color: var(--color-text-secondary);
  opacity: 0.7;
}

/* ─── Timeline track (dual-column alternating) ──────────── */
.timeline-track {
  position: relative;
  padding: 0 20px;
}

.timeline-line {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 50%;
  width: 2px;
  background-color: var(--color-border);
  border-radius: 1px;
  transform: translateX(-50%);
}

.timeline-node {
  position: relative;
  width: 50%;
  padding-bottom: 32px;
}

.timeline-dot {
  position: absolute;
  top: 8px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  z-index: 10;
  box-shadow: 0 0 0 4px var(--color-bg);
}

.tl-date {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
}

/* Left-side cards (even) */
.tl-left {
  margin-left: 0;
  margin-right: auto;
  padding-right: 48px;
  text-align: right;
}

.tl-left .tl-card {
  text-align: left;
}

.tl-left .timeline-dot {
  right: -7px;
}

/* Right-side cards (odd) */
.tl-right {
  margin-left: auto;
  margin-right: 0;
  padding-left: 48px;
}

.tl-right .timeline-dot {
  left: -7px;
}

/* ─── Card ──────────────────────────────────────────────── */
.tl-card {
  padding: 24px;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.tl-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.tl-menu-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tl-menu-btn:hover {
  background-color: var(--color-bg-secondary);
}

.tl-dropdown {
  position: absolute;
  top: 48px;
  right: 16px;
  z-index: 20;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  background-color: var(--color-card);
  padding: 6px 0;
  min-width: 120px;
}

.tl-dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 18px;
  text-align: left;
  font-size: 14px;
  color: var(--color-text);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s;
}

.tl-dropdown-item:hover {
  background-color: var(--color-bg-secondary);
}

.tl-dropdown-danger {
  color: #FF6B6B;
}

.tl-tag-wrap {
  margin-bottom: 10px;
}

.tl-tag {
  display: inline-block;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  color: #fff;
}

.tl-card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  padding-right: 36px;
  line-height: 1.4;
}

.tl-card-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-top: 8px;
  line-height: 1.7;
}

.tl-photos {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.tl-photo {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.tl-photo:hover {
  transform: scale(1.08);
}

/* ─── FAB ───────────────────────────────────────────────── */
.tl-fab {
  position: fixed;
  bottom: 40px;
  right: 48px;
  z-index: 30;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(255, 107, 107, 0.3);
  transition: transform 0.2s, box-shadow 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tl-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 32px rgba(255, 107, 107, 0.4);
}

/* ─── Modal (shared) ────────────────────────────────────── */
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

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.form-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-tag-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.form-photo-add {
  display: flex;
  gap: 10px;
}

.form-photo-add .form-input {
  flex: 1;
}

.form-photo-btn {
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  border: none;
  background-color: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.form-photo-btn:hover {
  opacity: 0.9;
}

.form-photo-preview {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.form-photo-thumb {
  position: relative;
  width: 72px;
  height: 72px;
}

.form-photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.form-photo-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: #FF6B6B;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition: transform 0.15s;
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

/* ─── Lightbox ──────────────────────────────────────────── */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  cursor: pointer;
}

.lightbox-img {
  max-width: 85vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 12px;
}
</style>
