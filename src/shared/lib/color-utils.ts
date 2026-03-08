export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }

export function isValidHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

function normalizeHex(hex: string): string {
  if (!isValidHex(hex)) throw new Error(`Invalid hex color: ${hex}`)
  const h = hex.replace('#', '')
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
  return `#${h}`
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex)
  const h = normalized.replace('#', '')
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
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) / 100 }
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
  const hn = h % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1))
  const m = l - c / 2
  let rn = 0, gn = 0, bn = 0
  if (hn < 60) { rn = c; gn = x; bn = 0 }
  else if (hn < 120) { rn = x; gn = c; bn = 0 }
  else if (hn < 180) { rn = 0; gn = c; bn = x }
  else if (hn < 240) { rn = 0; gn = x; bn = c }
  else if (hn < 300) { rn = x; gn = 0; bn = c }
  else { rn = c; gn = 0; bn = x }
  return rgbToHex({ r: Math.round((rn + m) * 255), g: Math.round((gn + m) * 255), b: Math.round((bn + m) * 255) })
}

export function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  const newL = Math.min(1, hsl.l + amount)
  return hslToHex({ ...hsl, l: newL })
}

export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  const newL = Math.max(0, hsl.l - amount)
  return hslToHex({ ...hsl, l: newL })
}

export function opacity(hex: string, alpha: number): string {
  const normalized = normalizeHex(hex)
  const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0')
  return `${normalized}${alphaHex}`
}

export function randomColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`
}

export function contrastRatio(hex1: string, hex2: string): number {
  const luminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    )
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

export function getContrastColor(hex: string): '#000000' | '#ffffff' {
  const whiteContrast = contrastRatio(hex, '#ffffff')
  const blackContrast = contrastRatio(hex, '#000000')
  return whiteContrast > blackContrast ? '#ffffff' : '#000000'
}
