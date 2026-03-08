import { describe, it, expect } from 'vitest'
import { distance, angle, midpoint, isPointInRect, clampToRect, rectIntersects, normalize, degToRad, radToDeg } from '../geometry'

describe('geometry', () => {
  it('distance between points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0)
  })

  it('angle in degrees', () => {
    expect(angle({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0)
    expect(angle({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90)
  })

  it('midpoint', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 10 })).toEqual({ x: 5, y: 5 })
  })

  it('isPointInRect', () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 }
    expect(isPointInRect({ x: 50, y: 50 }, rect)).toBe(true)
    expect(isPointInRect({ x: 150, y: 50 }, rect)).toBe(false)
  })

  it('clampToRect', () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 }
    expect(clampToRect({ x: 150, y: -10 }, rect)).toEqual({ x: 100, y: 0 })
  })

  it('rectIntersects', () => {
    expect(rectIntersects(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 5, width: 10, height: 10 },
    )).toBe(true)
    expect(rectIntersects(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    )).toBe(false)
  })

  it('normalize vector', () => {
    const n = normalize({ x: 3, y: 4 })
    expect(Math.sqrt(n.x ** 2 + n.y ** 2)).toBeCloseTo(1)
  })

  it('degToRad / radToDeg', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI)
    expect(radToDeg(Math.PI)).toBeCloseTo(180)
  })
})
