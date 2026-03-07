import { create } from 'zustand'
import type { PhilosophyDialogue, PhilosophyTopic } from '@/shared/types'
import { getAllPhilosophyDialogues, putPhilosophyDialogue, deletePhilosophyDialogueFromDb } from '@/shared/lib/db'
interface PhilosopherState { dialogues: PhilosophyDialogue[]; selectedId: string | null; hydrate: () => void; createDialogue: (topic: PhilosophyTopic) => void; deleteDialogue: (id: string) => void; addMessage: (dialogueId: string, role: 'user' | 'socrates', content: string) => void; setExperiment: (dialogueId: string, experiment: string) => void; selectDialogue: (id: string | null) => void }
export const usePhilosopherStore = create<PhilosopherState>((set) => ({
  dialogues: [], selectedId: null,
  hydrate: () => { getAllPhilosophyDialogues().then((dialogues) => set({ dialogues })) },
  createDialogue: (topic) => { const d: PhilosophyDialogue = { id: crypto.randomUUID(), topic, messages: [{ role: 'socrates', content: 'What do you think is the nature of knowledge?' }], createdAt: new Date().toISOString() }; set((s) => ({ dialogues: [d, ...s.dialogues], selectedId: d.id })); putPhilosophyDialogue(d) },
  deleteDialogue: (id) => { set((s) => ({ dialogues: s.dialogues.filter((d) => d.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deletePhilosophyDialogueFromDb(id) },
  addMessage: (dialogueId, role, content) => { set((s) => ({ dialogues: s.dialogues.map((d) => d.id === dialogueId ? { ...d, messages: [...d.messages, { role, content }] } : d) })) },
  setExperiment: (dialogueId, experiment) => { set((s) => ({ dialogues: s.dialogues.map((d) => d.id === dialogueId ? { ...d, experiment } : d) })) },
  selectDialogue: (id) => set({ selectedId: id }),
}))
