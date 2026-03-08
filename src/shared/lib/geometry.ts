export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }

export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

export function angle(a: Point, b: Point): number {
  return radToDeg(Math.atan2(b.y - a.y, b.x - a.x))
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x && point.x <= rect.x + rect.width &&
    point.y >= rect.y && point.y <= rect.y + rect.height
  )
}

export function clampToRect(point: Point, rect: Rect): Point {
  return {
    x: Math.max(rect.x, Math.min(rect.x + rect.width, point.x)),
    y: Math.max(rect.y, Math.min(rect.y + rect.height, point.y)),
  }
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x || b.x + b.width < a.x ||
    a.y + a.height < b.y || b.y + b.height < a.y
  )
}

export function normalize(point: Point): Point {
  const len = Math.sqrt(point.x ** 2 + point.y ** 2)
  if (len === 0) return { x: 0, y: 0 }
  return { x: point.x / len, y: point.y / len }
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}
