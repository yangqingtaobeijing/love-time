<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { wheelOptions } from '../store'
import { uuid } from '../utils/date'
import type { WheelOption } from '../types'

// ─── Wheel colors (warm alternating) ───────────────────────
const WHEEL_COLORS = [
  '#FF7B7B', '#FFB347', '#F7DC6F', '#82C596',
  '#74B9FF', '#A29BFE', '#FD79A8', '#E8A87C',
  '#55EFC4', '#DFE6E9',
]

function getColor(index: number): string {
  return WHEEL_COLORS[index % WHEEL_COLORS.length]
}

// ─── Spin state ────────────────────────────────────────────
const spinning = ref(false)
const currentRotation = ref(0)
const showResult = ref(false)
const resultItem = ref<WheelOption | null>(null)
const showConfetti = ref(false)

const wheelStyle = computed(() => ({
  transform: `rotate(${currentRotation.value}deg)`,
  transition: spinning.value
    ? 'transform 4s cubic-bezier(0.2, 0.8, 0.3, 1)'
    : 'none',
}))

function spin() {
  if (spinning.value || wheelOptions.length < 2) return
  showResult.value = false
  showConfetti.value = false
  spinning.value = true

  const targetIndex = Math.floor(Math.random() * wheelOptions.length)
  const sliceAngle = 360 / wheelOptions.length
  const baseSpins = (3 + Math.floor(Math.random() * 3)) * 360
  const targetOffset = targetIndex * sliceAngle + sliceAngle / 2
  const newRotation = currentRotation.value + baseSpins + (360 - targetOffset) - (currentRotation.value % 360)

  currentRotation.value = newRotation

  setTimeout(() => {
    spinning.value = false
    resultItem.value = wheelOptions[targetIndex]
    showResult.value = true
    nextTick(() => {
      showConfetti.value = true
      setTimeout(() => { showConfetti.value = false }, 2000)
    })
  }, 4100)
}

function closeResult() {
  showResult.value = false
}

function spinAgain() {
  showResult.value = false
  showConfetti.value = false
  nextTick(() => spin())
}

// ─── Option management ─────────────────────────────────────
const newName = ref('')
const newEmoji = ref('🍽️')

function addOption() {
  const name = newName.value.trim()
  if (!name) return
  const opt: WheelOption = {
    id: uuid(),
    name,
    emoji: newEmoji.value || '🍽️',
    isPreset: false,
  }
  wheelOptions.push(opt)
  newName.value = ''
  newEmoji.value = '🍽️'
}

function removeOption(id: string) {
  if (wheelOptions.length <= 2) return
  const idx = wheelOptions.findIndex((o) => o.id === id)
  if (idx !== -1) wheelOptions.splice(idx, 1)
}

// ─── SVG wheel segments ────────────────────────────────────
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle - 90) * Math.PI / 180
  const endRad = (endAngle - 90) * Math.PI / 180
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

function textTransform(index: number): string {
  const sliceAngle = 360 / wheelOptions.length
  const angle = index * sliceAngle + sliceAngle / 2
  return `rotate(${angle}, 150, 150) translate(0, -70)`
}
</script>

<template>
  <div class="wheel-page">
    <div class="wheel-container">
      <!-- Page header -->
      <div class="wheel-header">
        <h1 class="wheel-page-title">🍽️ 今天吃什么？</h1>
        <p class="wheel-page-desc">选择困难症终结者</p>
      </div>

      <!-- Left-right layout -->
      <div class="wheel-layout">
        <!-- Left: Wheel -->
        <div class="wheel-left">
          <!-- Pointer -->
          <div class="wheel-pointer">▼</div>

          <!-- Wheel SVG -->
          <div class="wheel-svg-container">
            <div class="wheel-svg-wrap" :style="wheelStyle">
              <svg viewBox="0 0 300 300" class="wheel-svg">
                <g v-for="(opt, i) in wheelOptions" :key="opt.id">
                  <path
                    :d="describeArc(150, 150, 145, i * (360 / wheelOptions.length), (i + 1) * (360 / wheelOptions.length))"
                    :fill="getColor(i)"
                    stroke="#fff"
                    stroke-width="1.5"
                  />
                  <text
                    x="150"
                    y="150"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    :transform="textTransform(i)"
                    class="wheel-text"
                  >
                    {{ opt.emoji }} {{ opt.name }}
                  </text>
                </g>
                <circle cx="150" cy="150" r="22" fill="var(--color-card)" stroke="#fff" stroke-width="2" />
                <text x="150" y="153" text-anchor="middle" dominant-baseline="middle" class="wheel-center-text">GO</text>
              </svg>
            </div>
          </div>

          <!-- Spin button -->
          <button class="wheel-spin-btn" :disabled="spinning || wheelOptions.length < 2" @click="spin">
            {{ spinning ? '转动中...' : '🎰 开转！' }}
          </button>
        </div>

        <!-- Right: Options management -->
        <div class="wheel-right">
          <div class="wheel-editor card">
            <h3 class="wheel-editor-title">管理选项 ✏️</h3>

            <div class="wheel-editor-list">
              <div v-for="opt in wheelOptions" :key="opt.id" class="wheel-editor-item">
                <span class="wheel-editor-item-text">{{ opt.emoji }} {{ opt.name }}</span>
                <button
                  class="wheel-editor-remove"
                  :disabled="wheelOptions.length <= 2"
                  @click="removeOption(opt.id)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div class="wheel-editor-add">
              <input v-model="newEmoji" class="wheel-editor-emoji-input" placeholder="🍽️" maxlength="4" />
              <input
                v-model="newName"
                class="wheel-editor-name-input"
                placeholder="添加新选项..."
                maxlength="20"
                @keyup.enter="addOption"
              />
              <button class="wheel-editor-add-btn" :disabled="!newName.trim()" @click="addOption">+</button>
            </div>

            <p v-if="wheelOptions.length <= 2" class="wheel-editor-hint">至少保留 2 个选项哦</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Confetti -->
    <div v-if="showConfetti" class="confetti-container">
      <span v-for="n in 20" :key="n" class="confetti-piece" :style="{
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 0.5 + 's',
        '--x-end': (Math.random() - 0.5) * 200 + 'px',
        '--r-end': Math.random() * 720 - 360 + 'deg',
        background: WHEEL_COLORS[n % WHEEL_COLORS.length],
      }" />
    </div>

    <!-- Result modal -->
    <Teleport to="body">
      <Transition name="result">
        <div v-if="showResult && resultItem" class="modal-overlay" @click="closeResult">
          <div class="modal-backdrop" />
          <div class="wheel-result-card card animate-scale-in" @click.stop>
            <p class="wheel-result-emoji">{{ resultItem.emoji }}</p>
            <p class="wheel-result-text">今天吃</p>
            <p class="wheel-result-name">{{ resultItem.name }}！</p>
            <p class="wheel-result-celebrate">🎉🎉🎉</p>
            <div class="wheel-result-actions">
              <button class="wheel-result-ok" @click="closeResult">就它了！👍</button>
              <button class="wheel-result-retry" @click="spinAgain">再转一次 🔄</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.wheel-page {
  min-height: 100vh;
  padding: 40px 48px 80px;
  background-color: var(--color-bg);
  position: relative;
}

.wheel-container {
  max-width: 1100px;
  margin: 0 auto;
}

.wheel-header {
  text-align: center;
  margin-bottom: 40px;
}

.wheel-page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.wheel-page-desc {
  font-size: 16px;
  color: var(--color-text-secondary);
}

/* ─── Left-right layout ─────────────────────────────────── */
.wheel-layout {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 48px;
}

.wheel-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.wheel-right {
  flex: 1;
  max-width: 400px;
  min-width: 320px;
}

/* ─── Pointer ───────────────────────────────────────────── */
.wheel-pointer {
  font-size: 32px;
  color: var(--color-primary);
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  line-height: 1;
  margin-bottom: -8px;
}

/* ─── Wheel ─────────────────────────────────────────────── */
.wheel-svg-container {
  width: 400px;
  height: 400px;
  margin-bottom: 28px;
}

.wheel-svg-wrap {
  width: 100%;
  height: 100%;
  will-change: transform;
}

.wheel-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.12));
}

.wheel-text {
  font-size: 11px;
  font-weight: 600;
  fill: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.wheel-center-text {
  font-size: 13px;
  font-weight: 700;
  fill: var(--color-primary);
}

/* ─── Spin button ───────────────────────────────────────── */
.wheel-spin-btn {
  padding: 16px 56px;
  border-radius: 28px;
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
  transition: transform 0.15s, box-shadow 0.3s;
}

.wheel-spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(255, 107, 107, 0.4);
}

.wheel-spin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Editor panel ──────────────────────────────────────── */
.wheel-editor {
  padding: 24px;
}

.wheel-editor-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 20px;
}

.wheel-editor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 320px;
  overflow-y: auto;
}

.wheel-editor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--color-bg-secondary);
  border-radius: 10px;
  transition: background-color 0.2s;
}

.wheel-editor-item:hover {
  background: var(--color-bg);
}

.wheel-editor-item-text {
  font-size: 15px;
  color: var(--color-text);
}

.wheel-editor-remove {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.wheel-editor-remove:hover {
  background: rgba(255, 71, 87, 0.2);
}

.wheel-editor-remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.wheel-editor-add {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.wheel-editor-emoji-input {
  width: 52px;
  padding: 10px 6px;
  text-align: center;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 20px;
  outline: none;
  color: var(--color-text);
  transition: border-color 0.2s;
}

.wheel-editor-emoji-input:focus {
  border-color: var(--color-primary);
}

.wheel-editor-name-input {
  flex: 1;
  padding: 10px 14px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  color: var(--color-text);
  font-family: inherit;
  transition: border-color 0.2s;
}

.wheel-editor-name-input:focus {
  border-color: var(--color-primary);
}

.wheel-editor-name-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.5;
}

.wheel-editor-add-btn {
  width: 48px;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 22px;
  font-weight: 300;
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.wheel-editor-add-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.wheel-editor-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wheel-editor-hint {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* ─── Confetti ──────────────────────────────────────────── */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: 40%;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confettiFall 1.5s ease-out forwards;
}

@keyframes confettiFall {
  0% {
    opacity: 1;
    transform: translateY(0) translateX(0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(300px) translateX(var(--x-end, 50px)) rotate(var(--r-end, 360deg)) scale(0.5);
  }
}

/* ─── Result modal ──────────────────────────────────────── */
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

.wheel-result-card {
  position: relative;
  width: 380px;
  padding: 40px 32px;
  text-align: center;
}

.wheel-result-emoji {
  font-size: 64px;
  margin-bottom: 16px;
  animation: bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.wheel-result-text {
  font-size: 18px;
  color: var(--color-text-secondary);
}

.wheel-result-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 4px 0 12px;
}

.wheel-result-celebrate {
  font-size: 28px;
  margin-bottom: 28px;
}

.wheel-result-actions {
  display: flex;
  gap: 12px;
}

.wheel-result-ok {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
}

.wheel-result-ok:hover {
  transform: translateY(-1px);
}

.wheel-result-retry {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.wheel-result-retry:hover {
  background-color: var(--color-bg-secondary);
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* ─── Transitions ───────────────────────────────────────── */
.result-enter-active { animation: resultIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.result-leave-active { animation: resultIn 0.2s ease-in reverse; }

@keyframes resultIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
</style>
