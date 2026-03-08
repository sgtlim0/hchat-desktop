import { describe, it, expect } from 'vitest'
import {
  distance,
  angle,
  midpoint,
  isPointInRect,
  clampToRect,
  rectIntersects,
  normalize,
  degToRad,
  radToDeg,
  type Point,
  type Rect
} from '../geometry'

describe('geometry utilities', () => {
  describe('distance', () => {
    it('calculates distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
      expect(distance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5)
    })

    it('returns 0 for same point', () => {
      expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
    })

    it('handles negative coordinates', () => {
      expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5)
      expect(distance({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5)
    })
  })

  describe('angle', () => {
    it('calculates angle between two points in degrees', () => {
      expect(angle({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0)
      expect(angle({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe(90)
      expect(angle({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe(180)
      expect(angle({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe(-90)
    })

    it('handles diagonal angles', () => {
      expect(angle({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45, 5)
      expect(angle({ x: 0, y: 0 }, { x: -1, y: 1 })).toBeCloseTo(135, 5)
      expect(angle({ x: 0, y: 0 }, { x: -1, y: -1 })).toBeCloseTo(-135, 5)
      expect(angle({ x: 0, y: 0 }, { x: 1, y: -1 })).toBeCloseTo(-45, 5)
    })

    it('works with non-origin starting point', () => {
      expect(angle({ x: 5, y: 5 }, { x: 6, y: 5 })).toBe(0)
      expect(angle({ x: 10, y: 10 }, { x: 10, y: 15 })).toBe(90)
    })
  })

  describe('midpoint', () => {
    it('calculates midpoint between two points', () => {
      const mid = midpoint({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(mid).toEqual({ x: 5, y: 5 })
    })

    it('handles negative coordinates', () => {
      const mid = midpoint({ x: -10, y: -10 }, { x: 10, y: 10 })
      expect(mid).toEqual({ x: 0, y: 0 })
    })

    it('handles decimal values', () => {
      const mid = midpoint({ x: 1, y: 1 }, { x: 2, y: 2 })
      expect(mid).toEqual({ x: 1.5, y: 1.5 })
    })

    it('returns same point when both inputs are identical', () => {
      const mid = midpoint({ x: 5, y: 7 }, { x: 5, y: 7 })
      expect(mid).toEqual({ x: 5, y: 7 })
    })
  })

  describe('isPointInRect', () => {
    const rect: Rect = { x: 10, y: 10, width: 20, height: 20 }

    it('returns true for point inside rect', () => {
      expect(isPointInRect({ x: 15, y: 15 }, rect)).toBe(true)
      expect(isPointInRect({ x: 20, y: 20 }, rect)).toBe(true)
    })

    it('returns true for point on rect boundary', () => {
      expect(isPointInRect({ x: 10, y: 10 }, rect)).toBe(true)
      expect(isPointInRect({ x: 30, y: 30 }, rect)).toBe(true)
      expect(isPointInRect({ x: 10, y: 20 }, rect)).toBe(true)
      expect(isPointInRect({ x: 20, y: 10 }, rect)).toBe(true)
    })

    it('returns false for point outside rect', () => {
      expect(isPointInRect({ x: 5, y: 15 }, rect)).toBe(false)
      expect(isPointInRect({ x: 35, y: 20 }, rect)).toBe(false)
      expect(isPointInRect({ x: 20, y: 35 }, rect)).toBe(false)
      expect(isPointInRect({ x: 9, y: 9 }, rect)).toBe(false)
    })

    it('handles rect with zero dimensions', () => {
      const zeroRect: Rect = { x: 5, y: 5, width: 0, height: 0 }
      expect(isPointInRect({ x: 5, y: 5 }, zeroRect)).toBe(true)
      expect(isPointInRect({ x: 5.1, y: 5 }, zeroRect)).toBe(false)
    })
  })

  describe('clampToRect', () => {
    const rect: Rect = { x: 10, y: 10, width: 20, height: 20 }

    it('returns point unchanged if inside rect', () => {
      expect(clampToRect({ x: 15, y: 15 }, rect)).toEqual({ x: 15, y: 15 })
      expect(clampToRect({ x: 20, y: 25 }, rect)).toEqual({ x: 20, y: 25 })
    })

    it('clamps point to nearest edge if outside', () => {
      expect(clampToRect({ x: 5, y: 15 }, rect)).toEqual({ x: 10, y: 15 })
      expect(clampToRect({ x: 35, y: 20 }, rect)).toEqual({ x: 30, y: 20 })
      expect(clampToRect({ x: 20, y: 35 }, rect)).toEqual({ x: 20, y: 30 })
      expect(clampToRect({ x: 20, y: 5 }, rect)).toEqual({ x: 20, y: 10 })
    })

    it('clamps to corner if outside diagonally', () => {
      expect(clampToRect({ x: 5, y: 5 }, rect)).toEqual({ x: 10, y: 10 })
      expect(clampToRect({ x: 35, y: 35 }, rect)).toEqual({ x: 30, y: 30 })
      expect(clampToRect({ x: 5, y: 35 }, rect)).toEqual({ x: 10, y: 30 })
      expect(clampToRect({ x: 35, y: 5 }, rect)).toEqual({ x: 30, y: 10 })
    })

    it('handles rect at origin', () => {
      const originRect: Rect = { x: 0, y: 0, width: 10, height: 10 }
      expect(clampToRect({ x: -5, y: 5 }, originRect)).toEqual({ x: 0, y: 5 })
      expect(clampToRect({ x: 15, y: 5 }, originRect)).toEqual({ x: 10, y: 5 })
    })
  })

  describe('rectIntersects', () => {
    it('returns true for overlapping rects', () => {
      const rect1: Rect = { x: 10, y: 10, width: 20, height: 20 }
      const rect2: Rect = { x: 20, y: 20, width: 20, height: 20 }
      expect(rectIntersects(rect1, rect2)).toBe(true)
    })

    it('returns true for fully contained rect', () => {
      const rect1: Rect = { x: 10, y: 10, width: 40, height: 40 }
      const rect2: Rect = { x: 20, y: 20, width: 10, height: 10 }
      expect(rectIntersects(rect1, rect2)).toBe(true)
      expect(rectIntersects(rect2, rect1)).toBe(true)
    })

    it('returns true for identical rects', () => {
      const rect: Rect = { x: 10, y: 10, width: 20, height: 20 }
      expect(rectIntersects(rect, rect)).toBe(true)
    })

    it('returns false for non-overlapping rects', () => {
      const rect1: Rect = { x: 10, y: 10, width: 10, height: 10 }
      const rect2: Rect = { x: 30, y: 30, width: 10, height: 10 }
      expect(rectIntersects(rect1, rect2)).toBe(false)
    })

    it('returns false for adjacent rects', () => {
      const rect1: Rect = { x: 10, y: 10, width: 10, height: 10 }
      const rect2: Rect = { x: 20, y: 10, width: 10, height: 10 }
      expect(rectIntersects(rect1, rect2)).toBe(false)
    })

    it('handles zero-dimension rects', () => {
      const rect1: Rect = { x: 10, y: 10, width: 0, height: 0 }
      const rect2: Rect = { x: 10, y: 10, width: 10, height: 10 }
      expect(rectIntersects(rect1, rect2)).toBe(false)
    })
  })

  describe('normalize', () => {
    it('normalizes vector to unit length', () => {
      const result = normalize({ x: 3, y: 4 })
      expect(result.x).toBeCloseTo(0.6, 5)
      expect(result.y).toBeCloseTo(0.8, 5)

      const length = Math.sqrt(result.x * result.x + result.y * result.y)
      expect(length).toBeCloseTo(1, 5)
    })

    it('handles negative values', () => {
      const result = normalize({ x: -3, y: -4 })
      expect(result.x).toBeCloseTo(-0.6, 5)
      expect(result.y).toBeCloseTo(-0.8, 5)

      const length = Math.sqrt(result.x * result.x + result.y * result.y)
      expect(length).toBeCloseTo(1, 5)
    })

    it('returns zero vector for zero input', () => {
      const result = normalize({ x: 0, y: 0 })
      expect(result).toEqual({ x: 0, y: 0 })
    })

    it('handles axis-aligned vectors', () => {
      expect(normalize({ x: 5, y: 0 })).toEqual({ x: 1, y: 0 })
      expect(normalize({ x: 0, y: 5 })).toEqual({ x: 0, y: 1 })
      expect(normalize({ x: -5, y: 0 })).toEqual({ x: -1, y: 0 })
      expect(normalize({ x: 0, y: -5 })).toEqual({ x: 0, y: -1 })
    })
  })

  describe('degToRad', () => {
    it('converts degrees to radians', () => {
      expect(degToRad(0)).toBe(0)
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 5)
      expect(degToRad(180)).toBeCloseTo(Math.PI, 5)
      expect(degToRad(270)).toBeCloseTo(Math.PI * 1.5, 5)
      expect(degToRad(360)).toBeCloseTo(Math.PI * 2, 5)
    })

    it('handles negative degrees', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2, 5)
      expect(degToRad(-180)).toBeCloseTo(-Math.PI, 5)
    })

    it('handles values over 360', () => {
      expect(degToRad(720)).toBeCloseTo(Math.PI * 4, 5)
    })
  })

  describe('radToDeg', () => {
    it('converts radians to degrees', () => {
      expect(radToDeg(0)).toBe(0)
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 5)
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 5)
      expect(radToDeg(Math.PI * 1.5)).toBeCloseTo(270, 5)
      expect(radToDeg(Math.PI * 2)).toBeCloseTo(360, 5)
    })

    it('handles negative radians', () => {
      expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90, 5)
      expect(radToDeg(-Math.PI)).toBeCloseTo(-180, 5)
    })

    it('handles values over 2π', () => {
      expect(radToDeg(Math.PI * 4)).toBeCloseTo(720, 5)
    })
  })
})
