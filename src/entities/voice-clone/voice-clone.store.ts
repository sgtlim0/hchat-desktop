import { create } from 'zustand'
import type { VoiceNarration, VoicePreset } from '@/shared/types'
import { getAllVoiceNarrations, putVoiceNarration, deleteVoiceNarrationFromDb } from '@/shared/lib/db'
const PRESET_CONFIG: Record<VoicePreset, { pitch: number; rate: number }> = { anchor: { pitch: 0.9, rate: 1.0 }, professor: { pitch: 1.0, rate: 0.85 }, narrator: { pitch: 0.8, rate: 0.9 }, dj: { pitch: 1.2, rate: 1.1 } }
interface VoiceCloneState { narrations: VoiceNarration[]; hydrate: () => void; createNarration: (text: string, preset: VoicePreset) => void; deleteNarration: (id: string) => void; updateText: (id: string, text: string) => void }
export const useVoiceCloneStore = create<VoiceCloneState>((set) => ({
  narrations: [],
  hydrate: () => { getAllVoiceNarrations().then((narrations) => set({ narrations })) },
  createNarration: (text, preset) => { const cfg = PRESET_CONFIG[preset]; const n: VoiceNarration = { id: crypto.randomUUID(), text, preset, pitch: cfg.pitch, rate: cfg.rate, createdAt: new Date().toISOString() }; set((s) => ({ narrations: [n, ...s.narrations] })); putVoiceNarration(n) },
  deleteNarration: (id) => { set((s) => ({ narrations: s.narrations.filter((n) => n.id !== id) })); deleteVoiceNarrationFromDb(id) },
  updateText: (id, text) => { set((s) => ({ narrations: s.narrations.map((n) => n.id === id ? { ...n, text } : n) })) },
}))
