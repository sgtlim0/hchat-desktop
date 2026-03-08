/**
 * 2D geometry utilities for spatial calculations.
 * All angles are in degrees unless otherwise specified.
 */

export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }

/**
 * Calculate the Euclidean distance between two points.
 */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

/**
 * Calculate the angle from point a to point b in degrees.
 * 0° is to the right (positive x-axis), 90° is down (positive y-axis).
 */
export function angle(a: Point, b: Point): number {
  return radToDeg(Math.atan2(b.y - a.y, b.x - a.x))
}

/**
 * Calculate the midpoint between two points.
 */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Check if a point is inside or on the boundary of a rectangle.
 */
export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x && point.x <= rect.x + rect.width &&
    point.y >= rect.y && point.y <= rect.y + rect.height
  )
}

/**
 * Constrain a point to be within a rectangle.
 * If the point is outside, it will be moved to the nearest edge or corner.
 */
export function clampToRect(point: Point, rect: Rect): Point {
  return {
    x: Math.max(rect.x, Math.min(rect.x + rect.width, point.x)),
    y: Math.max(rect.y, Math.min(rect.y + rect.height, point.y)),
  }
}

/**
 * Check if two rectangles intersect (overlap).
 * Adjacent rectangles (touching edges) are not considered intersecting.
 */
export function rectIntersects(a: Rect, b: Rect): boolean {
  // Handle zero-dimension rectangles
  if (a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) {
    return false
  }

  // Use <= to properly handle adjacent rectangles (touching edges don't intersect)
  return !(
    a.x + a.width <= b.x || b.x + b.width <= a.x ||
    a.y + a.height <= b.y || b.y + b.height <= a.y
  )
}

/**
 * Normalize a vector to unit length (magnitude = 1).
 * Returns zero vector if input is zero vector.
 */
export function normalize(point: Point): Point {
  const len = Math.sqrt(point.x ** 2 + point.y ** 2)
  if (len === 0) return { x: 0, y: 0 }
  return { x: point.x / len, y: point.y / len }
}

/**
 * Convert degrees to radians.
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Convert radians to degrees.
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}
