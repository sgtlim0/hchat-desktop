export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/.test(value)
}

export function isJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

export function isMinLength(value: string, min: number): boolean {
  return value.length >= min
}

export function isMaxLength(value: string, max: number): boolean {
  return value.length <= max
}

export function isNumericString(value: string): boolean {
  return /^\d+$/.test(value)
}

export function isPhoneNumber(value: string): boolean {
  const cleaned = value.replace(/[\s()-\.+]/g, '')
  return /^\d{10,15}$/.test(cleaned) && cleaned.length >= 10
}

export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}
