/** 时间轴照片 */
export interface TimelinePhoto {
  id: string
  type: 'base64' | 'url'
  src: string
}

/** 时间轴分类标签 */
export interface TimelineTag {
  id: string
  name: string
  color: string
  isPreset: boolean
}

/** 时间轴节点 */
export interface TimelineEvent {
  id: string
  date: string
  title: string
  description?: string
  photos: TimelinePhoto[]
  tagId?: string
  createdAt: number
  updatedAt: number
}

/** 许愿星星 */
export interface WishStar {
  id: string
  content: string
  x: number
  y: number
  fulfilled: boolean
  createdDate: string
  fulfilledDate?: string
  createdAt: number
}

/** 纪念日 */
export interface Anniversary {
  id: string
  name: string
  date: string
  emoji: string
  isYearlyRepeat: boolean
  createdAt: number
}

/** 纪念日显示计算结果（运行时使用） */
export interface AnniversaryDisplay extends Anniversary {
  targetDate: string
  daysFromToday: number
  yearCount?: number
  displayText: string
}

/** 心愿分类 */
export type BucketCategory = 'travel' | 'food' | 'experience' | 'shopping' | 'other'

/** 心愿分类配置 */
export interface BucketCategoryConfig {
  key: BucketCategory
  label: string
  emoji: string
}

/** 心愿清单项 */
export interface BucketItem {
  id: string
  title: string
  description?: string
  category: BucketCategory
  completed: boolean
  completedDate?: string
  completedPhoto?: TimelinePhoto
  createdAt: number
  updatedAt: number
}

/** 心愿清单统计 */
export interface BucketStats {
  total: number
  completed: number
  percentage: number
}

/** 转盘选项 */
export interface WheelOption {
  id: string
  name: string
  emoji: string
  isPreset: boolean
}

/** 全局设置 */
export interface AppSettings {
  startDate: string
  nicknameA: string
  nicknameB: string
  theme: 'light' | 'dark'
  onboardingCompleted: boolean
}

/** GitHub 云同步设置 */
export interface GitHubCloudSettings {
  enabled: boolean
  owner: string
  repo: string
  branch: string
  path: string
  token: string
  lastSyncAt: string
  lastSyncError: string
}

/** 导出数据格式 */
export interface ExportData {
  version: number
  exportDate: string
  app: string
  data: {
    settings: AppSettings
    timelineEvents: TimelineEvent[]
    timelineTags: TimelineTag[]
    wishStars: WishStar[]
    anniversaries: Anniversary[]
    bucketList: BucketItem[]
    wheelOptions: WheelOption[]
  }
}
