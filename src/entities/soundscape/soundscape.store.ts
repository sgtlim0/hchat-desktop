import { create } from 'zustand'
import type { SoundLayer, SoundType, FocusSession } from '@/shared/types'
import { getAllFocusSessions, putFocusSession } from '@/shared/lib/db'

interface PomodoroState {
  isRunning: boolean
  timeLeft: number
  isBreak: boolean
}

interface SoundscapeState {
  layers: SoundLayer[]
  pomodoroState: PomodoroState
  focusSessions: FocusSession[]

  addLayer: (type: SoundType, label: string) => void
  removeLayer: (id: string) => void
  setVolume: (id: string, volume: number) => void
  togglePlay: (id: string) => void
  startPomodoro: () => void
  pausePomodoro: () => void
  tick: () => void
  completeFocus: () => void
  hydrate: () => void
}

const POMODORO_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60

export const useSoundscapeStore = create<SoundscapeState>((set, get) => ({
  layers: [],
  pomodoroState: { isRunning: false, timeLeft: POMODORO_DURATION, isBreak: false },
  focusSessions: [],

  addLayer: (type, label) => {
    const layer: SoundLayer = {
      id: crypto.randomUUID(),
      type,
      label,
      volume: 0.5,
      isPlaying: false,
    }
    set((state) => ({ layers: [...state.layers, layer] }))
  },

  removeLayer: (id) => {
    set((state) => ({ layers: state.layers.filter((l) => l.id !== id) }))
  },

  setVolume: (id, volume) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, volume } : l)),
    }))
  },

  togglePlay: (id) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, isPlaying: !l.isPlaying } : l)),
    }))
  },

  startPomodoro: () => {
    set((state) => ({
      pomodoroState: { ...state.pomodoroState, isRunning: true },
    }))
  },

  pausePomodoro: () => {
    set((state) => ({
      pomodoroState: { ...state.pomodoroState, isRunning: false },
    }))
  },

  tick: () => {
    const { pomodoroState } = get()
    if (!pomodoroState.isRunning) return

    if (pomodoroState.timeLeft <= 1) {
      if (pomodoroState.isBreak) {
        set({
          pomodoroState: { isRunning: false, timeLeft: POMODORO_DURATION, isBreak: false },
        })
      } else {
        set({
          pomodoroState: { isRunning: false, timeLeft: BREAK_DURATION, isBreak: true },
        })
      }
      return
    }

    set((state) => ({
      pomodoroState: { ...state.pomodoroState, timeLeft: state.pomodoroState.timeLeft - 1 },
    }))
  },

  completeFocus: () => {
    const session: FocusSession = {
      id: crypto.randomUUID(),
      duration: POMODORO_DURATION,
      completedAt: new Date().toISOString(),
    }

    set((state) => ({
      focusSessions: [session, ...state.focusSessions],
    }))
    putFocusSession(session).catch(console.error)
  },

  hydrate: () => {
    getAllFocusSessions()
      .then((focusSessions) => set({ focusSessions }))
      .catch(console.error)
  },
}))
