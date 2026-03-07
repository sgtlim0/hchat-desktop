import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSoundscapeStore } from '../soundscape.store'
vi.mock('@/shared/lib/db', () => ({ getAllFocusSessions: vi.fn().mockResolvedValue([]), putFocusSession: vi.fn().mockResolvedValue(undefined) }))
describe('SoundscapeStore', () => {
  beforeEach(() => { useSoundscapeStore.setState({ layers: [], pomodoroState: { isRunning: false, timeLeft: 25 * 60, isBreak: false }, focusSessions: [] }) })
  it('should add layer', () => { useSoundscapeStore.getState().addLayer('nature', 'Rain'); expect(useSoundscapeStore.getState().layers).toHaveLength(1) })
  it('should toggle play', () => { useSoundscapeStore.getState().addLayer('lofi', 'Beats'); useSoundscapeStore.getState().togglePlay(useSoundscapeStore.getState().layers[0].id); expect(useSoundscapeStore.getState().layers[0].isPlaying).toBe(true) })
  it('should set volume', () => { useSoundscapeStore.getState().addLayer('cafe', 'Cafe'); useSoundscapeStore.getState().setVolume(useSoundscapeStore.getState().layers[0].id, 80); expect(useSoundscapeStore.getState().layers[0].volume).toBe(80) })
  it('should start pomodoro', () => { useSoundscapeStore.getState().startPomodoro(); expect(useSoundscapeStore.getState().pomodoroState.isRunning).toBe(true) })
  it('should tick', () => { useSoundscapeStore.getState().startPomodoro(); useSoundscapeStore.getState().tick(); expect(useSoundscapeStore.getState().pomodoroState.timeLeft).toBe(25 * 60 - 1) })
})
