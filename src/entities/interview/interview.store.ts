import { create } from 'zustand'
import type { InterviewSession, InterviewQuestion } from '@/shared/types'
import { getAllInterviewSessions, putInterviewSession, deleteInterviewSessionFromDb } from '@/shared/lib/db'
interface InterviewState { sessions: InterviewSession[]; selectedSessionId: string | null; hydrate: () => void; createSession: (title: string, jobTitle: string, questions: InterviewQuestion[]) => void; deleteSession: (id: string) => void; answerQuestion: (sessionId: string, questionId: string, answer: string) => void; selectSession: (id: string | null) => void }
export const useInterviewStore = create<InterviewState>((set) => ({
  sessions: [], selectedSessionId: null,
  hydrate: () => { getAllInterviewSessions().then((sessions) => set({ sessions })) },
  createSession: (title, jobTitle, questions) => { const s: InterviewSession = { id: crypto.randomUUID(), title, jobTitle, questions, overallScore: 0, createdAt: new Date().toISOString() }; set((st) => ({ sessions: [s, ...st.sessions], selectedSessionId: s.id })); putInterviewSession(s) },
  deleteSession: (id) => { set((s) => ({ sessions: s.sessions.filter((ss) => ss.id !== id), selectedSessionId: s.selectedSessionId === id ? null : s.selectedSessionId })); deleteInterviewSessionFromDb(id) },
  answerQuestion: (sessionId, questionId, answer) => { set((s) => ({ sessions: s.sessions.map((ss) => { if (ss.id !== sessionId) return ss; const qs = ss.questions.map((q) => q.id === questionId ? { ...q, userAnswer: answer } : q); const u = { ...ss, questions: qs }; putInterviewSession(u); return u }) })) },
  selectSession: (id) => set({ selectedSessionId: id }),
}))
