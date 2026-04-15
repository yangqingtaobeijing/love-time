import { reactive, watch, computed } from 'vue'
import type {
  AppSettings,
  TimelineEvent,
  TimelineTag,
  WishStar,
  Anniversary,
  BucketItem,
  WheelOption,
  ExportData,
  GitHubCloudSettings,
} from '../types'
import { today, uuid, daysBetween, formatDate } from '../utils/date'
import { loadDataFromGitHub, saveDataToGitHub, testGitHubAccess } from '../utils/githubSync'
import type { AnniversaryDisplay, BucketStats } from '../types'

// ─── localStorage helpers ─────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* corrupted – fall back */
  }
  return fallback
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Default data ─────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  startDate: '',
  nicknameA: '',
  nicknameB: '',
  theme: 'light',
  onboardingCompleted: false,
}

const DEFAULT_CLOUD_SYNC: GitHubCloudSettings = {
  enabled: false,
  owner: 'yangqingtaobeijing',
  repo: 'love-time-data',
  branch: 'main',
  path: 'love-time-data.json',
  token: '',
  lastSyncAt: '',
  lastSyncError: '',
}

const DEFAULT_TAGS: TimelineTag[] = [
  { id: 'tag-first', name: '第一次', color: '#FF6B6B', isPreset: true },
  { id: 'tag-travel', name: '旅行', color: '#4ECDC4', isPreset: true },
  { id: 'tag-daily', name: '日常', color: '#FFB347', isPreset: true },
  { id: 'tag-anniversary', name: '纪念日', color: '#FF69B4', isPreset: true },
  { id: 'tag-food', name: '美食', color: '#F7DC6F', isPreset: true },
  { id: 'tag-surprise', name: '惊喜', color: '#BB8FCE', isPreset: true },
]

const DEFAULT_WHEEL_OPTIONS: WheelOption[] = [
  { id: 'w-hotpot', name: '火锅', emoji: '🍲', isPreset: true },
  { id: 'w-bbq', name: '烧烤', emoji: '🔥', isPreset: true },
  { id: 'w-japanese', name: '日料', emoji: '🍣', isPreset: true },
  { id: 'w-western', name: '西餐', emoji: '🥩', isPreset: true },
  { id: 'w-sichuan', name: '川菜', emoji: '🌶️', isPreset: true },
  { id: 'w-cantonese', name: '粤菜', emoji: '🥘', isPreset: true },
  { id: 'w-noodles', name: '面食', emoji: '🍜', isPreset: true },
  { id: 'w-fastfood', name: '快餐', emoji: '🍔', isPreset: true },
  { id: 'w-korean', name: '韩餐', emoji: '🥢', isPreset: true },
  { id: 'w-dessert', name: '甜品', emoji: '🍰', isPreset: true },
]

// ─── Reactive state ───────────────────────────────────────

export const settings = reactive<AppSettings>(
  load('love_settings', { ...DEFAULT_SETTINGS }),
)

export const timelineEvents = reactive<TimelineEvent[]>(
  load('love_timeline_events', []),
)

export const timelineTags = reactive<TimelineTag[]>(
  load('love_timeline_tags', [...DEFAULT_TAGS]),
)

export const wishStars = reactive<WishStar[]>(
  load('love_wish_stars', []),
)

export const anniversaries = reactive<Anniversary[]>(
  load('love_anniversaries', []),
)

export const bucketList = reactive<BucketItem[]>(
  load('love_bucket_list', []),
)

export const wheelOptions = reactive<WheelOption[]>(
  load('love_wheel_options', [...DEFAULT_WHEEL_OPTIONS]),
)

export const cloudSyncSettings = reactive<GitHubCloudSettings>({
  ...DEFAULT_CLOUD_SYNC,
  ...load('love_cloud_sync_settings', { ...DEFAULT_CLOUD_SYNC }),
})

export const cloudSyncStatus = reactive({
  uploading: false,
  downloading: false,
  testing: false,
  message: '',
})

// ─── Auto-persist watchers ────────────────────────────────

function persistAndSchedule(key: string, value: unknown): void {
  save(key, value)
  scheduleCloudUpload()
}

watch(() => ({ ...settings }), () => persistAndSchedule('love_settings', settings), { deep: true })
watch(timelineEvents, () => persistAndSchedule('love_timeline_events', timelineEvents), { deep: true })
watch(timelineTags, () => persistAndSchedule('love_timeline_tags', timelineTags), { deep: true })
watch(wishStars, () => persistAndSchedule('love_wish_stars', wishStars), { deep: true })
watch(anniversaries, () => persistAndSchedule('love_anniversaries', anniversaries), { deep: true })
watch(bucketList, () => persistAndSchedule('love_bucket_list', bucketList), { deep: true })
watch(wheelOptions, () => persistAndSchedule('love_wheel_options', wheelOptions), { deep: true })
watch(() => ({ ...cloudSyncSettings }), () => save('love_cloud_sync_settings', cloudSyncSettings), { deep: true })

// ─── GitHub cloud sync ────────────────────────────────────

let cloudUploadTimer: number | undefined
let cloudUploadInFlight = false
let cloudUploadPending = false
let cloudSyncSuppressed = false

function cloudSyncReady(): boolean {
  return Boolean(
    cloudSyncSettings.enabled &&
    cloudSyncSettings.owner.trim() &&
    cloudSyncSettings.repo.trim() &&
    cloudSyncSettings.token.trim(),
  )
}

function scheduleCloudUpload(): void {
  if (!cloudSyncReady() || cloudSyncSuppressed) return
  window.clearTimeout(cloudUploadTimer)
  cloudUploadTimer = window.setTimeout(() => {
    void uploadCloudData()
  }, 1200)
}

function setCloudError(error: unknown): void {
  const message = error instanceof Error ? error.message : '云同步失败'
  cloudSyncSettings.lastSyncError = message
  cloudSyncStatus.message = message
}

export async function testCloudConnection(): Promise<boolean> {
  cloudSyncStatus.testing = true
  cloudSyncStatus.message = '正在检查 GitHub 连接...'
  try {
    await testGitHubAccess(cloudSyncSettings)
    cloudSyncSettings.lastSyncError = ''
    cloudSyncStatus.message = 'GitHub 连接正常'
    return true
  } catch (error) {
    setCloudError(error)
    return false
  } finally {
    cloudSyncStatus.testing = false
  }
}

export async function uploadCloudData(): Promise<boolean> {
  if (!cloudSyncReady()) {
    cloudSyncStatus.message = '云同步未启用或配置不完整'
    return false
  }

  if (cloudUploadInFlight) {
    cloudUploadPending = true
    return false
  }

  cloudUploadInFlight = true
  cloudSyncStatus.uploading = true
  cloudSyncStatus.message = '正在上传到 GitHub...'

  try {
    await saveDataToGitHub(cloudSyncSettings, exportAllData())
    cloudSyncSettings.lastSyncAt = new Date().toISOString()
    cloudSyncSettings.lastSyncError = ''
    cloudSyncStatus.message = '已上传到 GitHub'
    return true
  } catch (error) {
    setCloudError(error)
    return false
  } finally {
    cloudSyncStatus.uploading = false
    cloudUploadInFlight = false
    if (cloudUploadPending) {
      cloudUploadPending = false
      scheduleCloudUpload()
    }
  }
}

export async function downloadCloudData(): Promise<boolean> {
  if (!cloudSyncReady()) {
    cloudSyncStatus.message = '云同步未启用或配置不完整'
    return false
  }

  cloudSyncStatus.downloading = true
  cloudSyncStatus.message = '正在从 GitHub 下载...'

  try {
    const data = await loadDataFromGitHub(cloudSyncSettings)
    if (!data) {
      cloudSyncStatus.message = '云端还没有数据，请先上传当前数据'
      return false
    }

    cloudSyncSuppressed = true
    const ok = importAllData(data)
    window.setTimeout(() => {
      cloudSyncSuppressed = false
    }, 0)

    if (!ok) throw new Error('云端数据格式不正确')
    cloudSyncSettings.lastSyncAt = new Date().toISOString()
    cloudSyncSettings.lastSyncError = ''
    cloudSyncStatus.message = '已从 GitHub 恢复数据'
    return true
  } catch (error) {
    cloudSyncSuppressed = false
    setCloudError(error)
    return false
  } finally {
    cloudSyncStatus.downloading = false
  }
}

// ─── Computed ─────────────────────────────────────────────

/** 在一起天数 */
export const daysTogether = computed<number>(() => {
  if (!settings.startDate) return 0
  return daysBetween(settings.startDate, today()) + 1
})

/** 是否首次使用 */
export const isFirstUse = computed<boolean>(() => !settings.onboardingCompleted)

/** 时间轴按日期从新到旧排序 */
export const sortedTimeline = computed<TimelineEvent[]>(() =>
  [...timelineEvents].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.createdAt - a.createdAt)),
)

/** 纪念日显示列表 */
export const anniversaryDisplays = computed<AnniversaryDisplay[]>(() => {
  const todayStr = today()
  return anniversaries.map((a) => {
    let targetDate = a.date
    let yearCount: number | undefined

    if (a.isYearlyRepeat) {
      const orig = new Date(a.date + 'T00:00:00')
      const now = new Date(todayStr + 'T00:00:00')
      let y = now.getFullYear()
      const thisYear = new Date(y, orig.getMonth(), orig.getDate())
      if (thisYear.getTime() < now.getTime()) {
        y += 1
      }
      targetDate = formatDate(new Date(y, orig.getMonth(), orig.getDate()))
      yearCount = y - orig.getFullYear()
    }

    const diff = daysBetween(todayStr, targetDate)
    const displayText = diff > 0 ? `还有 ${diff} 天` : diff === 0 ? '就是今天 🎉' : `已过 ${Math.abs(diff)} 天`

    return { ...a, targetDate, daysFromToday: diff, yearCount, displayText }
  })
})

/** 即将到来的纪念日（按天数升序） */
export const upcomingAnniversaries = computed<AnniversaryDisplay[]>(() =>
  anniversaryDisplays.value.filter((a) => a.daysFromToday >= 0).sort((a, b) => a.daysFromToday - b.daysFromToday),
)

/** 已过去的纪念日 */
export const pastAnniversaries = computed<AnniversaryDisplay[]>(() =>
  anniversaryDisplays.value.filter((a) => a.daysFromToday < 0).sort((a, b) => a.daysFromToday - b.daysFromToday),
)

/** 心愿统计 */
export const bucketStats = computed<BucketStats>(() => {
  const total = bucketList.length
  const completed = bucketList.filter((i) => i.completed).length
  return { total, completed, percentage: total ? Math.round((completed / total) * 100) : 0 }
})

// ─── Timeline CRUD ────────────────────────────────────────

export function addTimelineEvent(data: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>): TimelineEvent {
  const ev: TimelineEvent = { ...data, id: uuid(), createdAt: Date.now(), updatedAt: Date.now() }
  timelineEvents.push(ev)
  return ev
}

export function updateTimelineEvent(id: string, data: Partial<TimelineEvent>): void {
  const idx = timelineEvents.findIndex((e) => e.id === id)
  if (idx !== -1) Object.assign(timelineEvents[idx], data, { updatedAt: Date.now() })
}

export function deleteTimelineEvent(id: string): void {
  const idx = timelineEvents.findIndex((e) => e.id === id)
  if (idx !== -1) timelineEvents.splice(idx, 1)
}

// ─── Anniversary CRUD ─────────────────────────────────────

export function addAnniversary(data: Omit<Anniversary, 'id' | 'createdAt'>): Anniversary {
  const a: Anniversary = { ...data, id: uuid(), createdAt: Date.now() }
  anniversaries.push(a)
  return a
}

export function deleteAnniversary(id: string): void {
  const idx = anniversaries.findIndex((a) => a.id === id)
  if (idx !== -1) anniversaries.splice(idx, 1)
}

// ─── Theme ────────────────────────────────────────────────

export function applyTheme(theme?: 'light' | 'dark'): void {
  const t = theme ?? settings.theme
  document.documentElement.classList.toggle('dark', t === 'dark')
  settings.theme = t
}

export function toggleTheme(): void {
  applyTheme(settings.theme === 'light' ? 'dark' : 'light')
}

// ─── Data import / export ─────────────────────────────────

export function exportAllData(): ExportData {
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    app: 'love-timeline',
    data: {
      settings: { ...settings },
      timelineEvents: [...timelineEvents],
      timelineTags: [...timelineTags],
      wishStars: [...wishStars],
      anniversaries: [...anniversaries],
      bucketList: [...bucketList],
      wheelOptions: [...wheelOptions],
    },
  }
}

export function importAllData(raw: ExportData): boolean {
  if (raw.app !== 'love-timeline' || typeof raw.version !== 'number' || !raw.data) return false

  const d = raw.data
  Object.assign(settings, d.settings)

  timelineEvents.splice(0, timelineEvents.length, ...d.timelineEvents)
  timelineTags.splice(0, timelineTags.length, ...d.timelineTags)
  wishStars.splice(0, wishStars.length, ...d.wishStars)
  anniversaries.splice(0, anniversaries.length, ...d.anniversaries)
  bucketList.splice(0, bucketList.length, ...d.bucketList)
  wheelOptions.splice(0, wheelOptions.length, ...d.wheelOptions)

  applyTheme()
  return true
}

export function clearAllData(): void {
  Object.assign(settings, { ...DEFAULT_SETTINGS })
  timelineEvents.splice(0, timelineEvents.length)
  timelineTags.splice(0, timelineTags.length, ...DEFAULT_TAGS)
  wishStars.splice(0, wishStars.length)
  anniversaries.splice(0, anniversaries.length)
  bucketList.splice(0, bucketList.length)
  wheelOptions.splice(0, wheelOptions.length, ...DEFAULT_WHEEL_OPTIONS)
  applyTheme('light')
}
