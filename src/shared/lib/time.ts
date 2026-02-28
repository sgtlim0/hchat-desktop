export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`
  return `${Math.floor(diffDay / 365)}년 전`
}

export function getGreeting(): { title: string; subtitle: string } {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) {
    return { title: '좋은 아침이에요 ☀️', subtitle: '무엇이든 물어보세요' }
  }
  if (hour >= 12 && hour < 18) {
    return { title: '좋은 오후예요 🌤️', subtitle: '무엇이든 물어보세요' }
  }
  return { title: '좋은 저녁이에요 🌙', subtitle: '무엇이든 물어보세요' }
}

export function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDay = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDay === 0) return '오늘'
  if (diffDay === 1) return '어제'
  if (diffDay < 7) return '이번 주'
  if (diffDay < 30) return '이번 달'
  return '이전'
}
