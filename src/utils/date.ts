/** 计算两个日期之间的天数差 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00')
  const b = new Date(dateB + 'T00:00:00')
  const diff = b.getTime() - a.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

/** 获取今天的日期字符串 YYYY-MM-DD */
export function today(): string {
  const d = new Date()
  return formatDate(d)
}

/** 格式化 Date 为 YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 生成简单 UUID */
export function uuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}
