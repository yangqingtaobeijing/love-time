<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { settings } from '../store'
import { today } from '../utils/date'

const router = useRouter()

const startDate = ref(today())
const nicknameA = ref('')
const nicknameB = ref('')

function submit() {
  if (!startDate.value) return
  settings.startDate = startDate.value
  settings.nicknameA = nicknameA.value || '我'
  settings.nicknameB = nicknameB.value || 'TA'
  settings.onboardingCompleted = true
  router.replace('/')
}
</script>

<template>
  <div class="welcome-page">
    <!-- Decorative background -->
    <div class="welcome-bg" />

    <!-- Main card -->
    <div class="welcome-card-wrapper animate-fade-in-up">
      <!-- Decorative top -->
      <div class="welcome-hero">
        <div class="welcome-emoji">💕</div>
        <h1 class="welcome-title">欢迎来到恋爱时光</h1>
        <p class="welcome-subtitle">记录属于你们的每一个珍贵瞬间</p>
      </div>

      <!-- Form -->
      <div class="welcome-form card">
        <!-- Start date -->
        <div class="form-group">
          <label class="form-label">💗 恋爱开始日期</label>
          <input
            v-model="startDate"
            type="date"
            class="form-input"
          />
        </div>

        <!-- Nickname A -->
        <div class="form-group">
          <label class="form-label">🧑 你的昵称</label>
          <input
            v-model="nicknameA"
            type="text"
            placeholder="比如：涛哥"
            class="form-input"
          />
        </div>

        <!-- Nickname B -->
        <div class="form-group">
          <label class="form-label">👧 TA 的昵称</label>
          <input
            v-model="nicknameB"
            type="text"
            placeholder="比如：宝宝"
            class="form-input"
          />
        </div>

        <!-- Submit -->
        <button class="welcome-submit" @click="submit">
          开始记录我们的故事 ✨
        </button>
      </div>

      <p class="welcome-footer">Made with ❤️ by 涛哥</p>
    </div>
  </div>
</template>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  position: relative;
  overflow: hidden;
}

.welcome-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 107, 107, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(183, 110, 121, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(255, 107, 107, 0.05) 0%, transparent 50%);
  pointer-events: none;
}

.welcome-card-wrapper {
  position: relative;
  width: 480px;
  z-index: 1;
}

.welcome-hero {
  text-align: center;
  margin-bottom: 32px;
}

.welcome-emoji {
  font-size: 72px;
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.welcome-form {
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.form-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.welcome-submit {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.3s;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.25);
  margin-top: 8px;
}

.welcome-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(255, 107, 107, 0.35);
}

.welcome-submit:active {
  transform: translateY(0);
}

.welcome-footer {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 28px;
}
</style>
