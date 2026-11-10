export function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatSize(bytes: number): string {
  if (!bytes) return '—'

  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(1)} MB`

  return `${Math.max(bytes / 1024, 0.1).toFixed(1)} KB`
}

export function relativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return '刚刚'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`
  if (seconds < 172800) return '昨天'
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`

  return formatDate(value)
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? 'K'
}

export function toneFromId(id: string): number {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return (hash % 6) + 1
}
