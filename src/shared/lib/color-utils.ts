export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }

export function isValidHex(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

function normalizeHex(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
  return `#${h}`
}

export function hexToRgb(hex: string): RGB {
  const h = normalizeHex(hex).replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

export function hexToHsl(hex: string): HSL {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100) / 100, l: Math.round(l * 100) / 100 }
}

export function hslToHex(hsl: HSL): string {
  const { h, s, l } = hsl
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let rn = 0, gn = 0, bn = 0
  if (h < 60) { rn = c; gn = x }
  else if (h < 120) { rn = x; gn = c }
  else if (h < 180) { gn = c; bn = x }
  else if (h < 240) { gn = x; bn = c }
  else if (h < 300) { rn = x; bn = c }
  else { rn = c; bn = x }
  return rgbToHex({ r: (rn + m) * 255, g: (gn + m) * 255, b: (bn + m) * 255 })
}

export function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: Math.min(1, hsl.l + amount) })
}

export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: Math.max(0, hsl.l - amount) })
}

export function opacity(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

export function randomColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`
}

export function getContrastColor(hex: string): '#000000' | '#ffffff' {
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
