<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { wishStars } from '../store'
import { uuid, today } from '../utils/date'
import type { WishStar } from '../types'

// ─── Canvas state ──────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId = 0
let ctx: CanvasRenderingContext2D | null = null
let canvasW = 0
let canvasH = 0

interface BgStar { x: number; y: number; r: number; baseAlpha: number; alpha: number; speed: number; phase: number }
interface Meteor { x: number; y: number; len: number; speed: number; angle: number; alpha: number; trail: { x: number; y: number }[] }

const bgStars: BgStar[] = []
let meteors: Meteor[] = []
let lastMeteorTime = 0
let nextMeteorInterval = 5000

function initBgStars() {
  bgStars.length = 0
  const count = 200
  for (let i = 0; i < count; i++) {
    bgStars.push({
      x: Math.random() * canvasW,
      y: Math.random() * canvasH,
      r: Math.random() * 2 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.3,
      alpha: 0,
      speed: Math.random() * 0.002 + 0.001,
      phase: Math.random() * Math.PI * 2,
    })
  }
}

function spawnMeteor() {
  const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3
  meteors.push({
    x: Math.random() * canvasW * 0.8 + canvasW * 0.1,
    y: -10,
    len: Math.random() * 100 + 80,
    speed: Math.random() * 4 + 6,
    angle,
    alpha: 1,
    trail: [],
  })
}

function drawFrame(time: number) {
  if (!ctx) return
  ctx.clearRect(0, 0, canvasW, canvasH)

  for (const s of bgStars) {
    s.alpha = s.baseAlpha + Math.sin(time * s.speed + s.phase) * 0.3
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, s.alpha)})`
    ctx.fill()
  }

  if (time - lastMeteorTime > nextMeteorInterval) {
    spawnMeteor()
    lastMeteorTime = time
    nextMeteorInterval = (Math.random() * 10 + 5) * 1000
  }

  const aliveMeteors: Meteor[] = []
  for (const m of meteors) {
    m.x += Math.cos(m.angle) * m.speed
    m.y += Math.sin(m.angle) * m.speed
    m.trail.push({ x: m.x, y: m.y })
    if (m.trail.length > 20) m.trail.shift()

    if (m.x > canvasW + 50 || m.y > canvasH + 50) continue
    aliveMeteors.push(m)

    for (let i = 0; i < m.trail.length; i++) {
      const t = m.trail[i]
      const a = (i / m.trail.length) * 0.8
      ctx.beginPath()
      ctx.arc(t.x, t.y, 1.5 * (i / m.trail.length), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fill()
  }
  meteors = aliveMeteors

  animationId = requestAnimationFrame(drawFrame)
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.parentElement?.getBoundingClientRect()
  if (!rect) return
  const dpr = window.devicePixelRatio || 1
  canvasW = rect.width
  canvasH = rect.height
  canvas.width = canvasW * dpr
  canvas.height = canvasH * dpr
  canvas.style.width = canvasW + 'px'
  canvas.style.height = canvasH + 'px'
  ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
  initBgStars()
}

onMounted(() => {
  resizeCanvas()
  animationId = requestAnimationFrame(drawFrame)
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
})

// ─── Wish interaction ──────────────────────────────────────
const showInput = ref(false)
const wishText = ref('')
const tapPosition = reactive({ x: 50, y: 50 })
const selectedStar = ref<WishStar | null>(null)
const showDetail = ref(false)

function onBackgroundClick(e: MouseEvent) {
  if (showInput.value || showDetail.value) return
  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()
  const xPct = ((e.clientX - rect.left) / rect.width) * 100
  const yPct = ((e.clientY - rect.top) / rect.height) * 100
  tapPosition.x = Math.min(90, Math.max(10, xPct))
  tapPosition.y = Math.min(85, Math.max(10, yPct))
  showInput.value = true
  nextTick(() => {
    const input = document.getElementById('wish-input')
    input?.focus()
  })
}

function submitWish() {
  const content = wishText.value.trim()
  if (!content) return
  const star: WishStar = {
    id: uuid(),
    content,
    x: tapPosition.x,
    y: tapPosition.y,
    fulfilled: false,
    createdDate: today(),
    createdAt: Date.now(),
  }
  wishStars.push(star)
  wishText.value = ''
  showInput.value = false
}

function cancelWish() {
  wishText.value = ''
  showInput.value = false
}

function onStarClick(star: WishStar, e: Event) {
  e.stopPropagation()
  selectedStar.value = star
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedStar.value = null
}

function fulfillWish() {
  if (!selectedStar.value) return
  const idx = wishStars.findIndex((s) => s.id === selectedStar.value!.id)
  if (idx !== -1) {
    wishStars[idx].fulfilled = true
    wishStars[idx].fulfilledDate = today()
    selectedStar.value = { ...wishStars[idx] }
  }
}
</script>

<template>
  <div class="starry-page" @click="onBackgroundClick">
    <!-- Canvas background -->
    <canvas ref="canvasRef" class="starry-canvas" />

    <!-- Wish stars (DOM) -->
    <div
      v-for="star in wishStars"
      :key="star.id"
      class="wish-star"
      :class="{ fulfilled: star.fulfilled }"
      :style="{ left: star.x + '%', top: star.y + '%' }"
      @click="onStarClick(star, $event)"
    >
      <span class="wish-star-icon">{{ star.fulfilled ? '🌟' : '⭐' }}</span>
    </div>

    <!-- Hint text -->
    <div v-if="!showInput && !showDetail" class="starry-hint">
      <p>点击星空，许下你的愿望 ✨</p>
    </div>

    <!-- Wish input modal -->
    <Transition name="modal">
      <div v-if="showInput" class="wish-modal-overlay" @click.stop>
        <div class="wish-modal-backdrop" @click="cancelWish" />
        <div class="wish-modal animate-scale-in">
          <h3 class="wish-modal-title">许个愿望吧 🌠</h3>
          <textarea
            id="wish-input"
            v-model="wishText"
            class="wish-textarea"
            placeholder="写下你的愿望..."
            maxlength="100"
            rows="3"
          />
          <div class="wish-modal-actions">
            <button class="wish-btn-cancel" @click="cancelWish">取消</button>
            <button class="wish-btn-submit" :disabled="!wishText.trim()" @click="submitWish">
              许愿 ✨
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Wish detail card -->
    <Transition name="modal">
      <div v-if="showDetail && selectedStar" class="wish-modal-overlay" @click="closeDetail">
        <div class="wish-modal-backdrop" />
        <div class="wish-detail-card animate-scale-in" @click.stop>
          <div class="wish-detail-emoji">{{ selectedStar.fulfilled ? '🌟' : '⭐' }}</div>
          <p class="wish-detail-content">{{ selectedStar.content }}</p>
          <p class="wish-detail-date">许愿于 {{ selectedStar.createdDate }}</p>
          <p v-if="selectedStar.fulfilled && selectedStar.fulfilledDate" class="wish-detail-fulfilled">
            ✨ 已实现于 {{ selectedStar.fulfilledDate }}
          </p>
          <div class="wish-detail-actions">
            <button v-if="!selectedStar.fulfilled" class="wish-btn-fulfill" @click="fulfillWish">
              已实现 💫
            </button>
            <button class="wish-btn-close" @click="closeDetail">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.starry-page {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #0a0a2e 0%, #1a1040 40%, #0d0d30 100%);
  overflow: hidden;
  user-select: none;
}

.starry-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ─── Wish stars ────────────────────────────────────────── */
.wish-star {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
  cursor: pointer;
  animation: starPulse 3s ease-in-out infinite;
}

.wish-star-icon {
  font-size: 28px;
  display: block;
  filter: drop-shadow(0 0 8px rgba(255, 255, 200, 0.6));
  transition: filter 0.3s ease, transform 0.3s ease;
}

.wish-star:hover .wish-star-icon {
  transform: scale(1.3);
  filter: drop-shadow(0 0 16px rgba(255, 255, 200, 0.9));
}

.wish-star.fulfilled .wish-star-icon {
  font-size: 32px;
  filter: drop-shadow(0 0 14px rgba(255, 215, 0, 0.8));
}

@keyframes starPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.15); }
}

.wish-star.fulfilled {
  animation: starPulseGold 2.5s ease-in-out infinite;
}

@keyframes starPulseGold {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

/* ─── Hint ──────────────────────────────────────────────── */
.starry-hint {
  position: absolute;
  bottom: 48px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 5;
  pointer-events: none;
}

.starry-hint p {
  display: inline-block;
  padding: 10px 28px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border-radius: 24px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  letter-spacing: 0.5px;
}

/* ─── Wish modal ────────────────────────────────────────── */
.wish-modal-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wish-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.wish-modal {
  position: relative;
  width: 420px;
  background: rgba(20, 15, 50, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}

.wish-modal-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
}

.wish-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  padding: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.2s;
}

.wish-textarea:focus {
  border-color: rgba(255, 215, 0, 0.5);
}

.wish-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.wish-modal-actions {
  display: flex;
  gap: 14px;
  margin-top: 20px;
}

.wish-btn-cancel {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.wish-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
}

.wish-btn-submit {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #6c5ce7, #a855f7);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.wish-btn-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wish-btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* ─── Detail card ───────────────────────────────────────── */
.wish-detail-card {
  position: relative;
  width: 380px;
  background: rgba(25, 20, 55, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px 28px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}

.wish-detail-emoji {
  font-size: 56px;
  margin-bottom: 20px;
}

.wish-detail-content {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  line-height: 1.7;
  margin-bottom: 16px;
  word-break: break-word;
}

.wish-detail-date {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  margin-bottom: 4px;
}

.wish-detail-fulfilled {
  color: #ffd700;
  font-size: 14px;
  margin-bottom: 4px;
}

.wish-detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.wish-btn-fulfill {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #f7971e, #ffd200);
  color: #1a1a2e;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}

.wish-btn-fulfill:hover {
  transform: translateY(-1px);
}

.wish-btn-close {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.wish-btn-close:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* ─── Transitions ───────────────────────────────────────── */
.modal-enter-active {
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  animation: scaleIn 0.2s ease-in reverse;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
</style>
