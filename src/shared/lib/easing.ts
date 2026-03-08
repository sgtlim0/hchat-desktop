export type EasingFn = (t: number) => number

export const linear: EasingFn = (t) => t
export const easeInQuad: EasingFn = (t) => t * t
export const easeOutQuad: EasingFn = (t) => t * (2 - t)
export const easeInOutQuad: EasingFn = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
export const easeInCubic: EasingFn = (t) => t * t * t
export const easeOutCubic: EasingFn = (t) => --t * t * t + 1
export const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

const EASINGS: Record<string, EasingFn> = {
  linear, easeInQuad, easeOutQuad, easeInOutQuad, easeInCubic, easeOutCubic, easeInOutCubic,
}

export function getEasingFunction(name: string): EasingFn {
  return EASINGS[name] ?? linear
}
