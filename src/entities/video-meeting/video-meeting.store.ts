import { create } from 'zustand'
import type { VideoMeeting, MeetingTranscript } from '@/shared/types'
import { getAllVideoMeetings, putVideoMeeting, deleteVideoMeetingFromDb } from '@/shared/lib/db'
interface VideoMeetingState { meetings: VideoMeeting[]; selectedId: string | null; hydrate: () => void; createMeeting: (title: string) => void; deleteMeeting: (id: string) => void; addTranscript: (meetingId: string, t: MeetingTranscript) => void; setSummary: (meetingId: string, summary: string) => void; addActionItem: (meetingId: string, item: string) => void; toggleRecording: (id: string) => void; selectMeeting: (id: string | null) => void }
export const useVideoMeetingStore = create<VideoMeetingState>((set) => ({
  meetings: [], selectedId: null,
  hydrate: () => { getAllVideoMeetings().then((meetings) => set({ meetings })) },
  createMeeting: (title) => { const m: VideoMeeting = { id: crypto.randomUUID(), title, transcripts: [], summary: '', actionItems: [], isRecording: false, createdAt: new Date().toISOString() }; set((s) => ({ meetings: [m, ...s.meetings], selectedId: m.id })); putVideoMeeting(m) },
  deleteMeeting: (id) => { set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteVideoMeetingFromDb(id) },
  addTranscript: (meetingId, t) => { set((s) => ({ meetings: s.meetings.map((m) => m.id === meetingId ? { ...m, transcripts: [...m.transcripts, t] } : m) })) },
  setSummary: (meetingId, summary) => { set((s) => ({ meetings: s.meetings.map((m) => m.id === meetingId ? { ...m, summary } : m) })) },
  addActionItem: (meetingId, item) => { set((s) => ({ meetings: s.meetings.map((m) => m.id === meetingId ? { ...m, actionItems: [...m.actionItems, item] } : m) })) },
  toggleRecording: (id) => { set((s) => ({ meetings: s.meetings.map((m) => m.id === id ? { ...m, isRecording: !m.isRecording } : m) })) },
  selectMeeting: (id) => set({ selectedId: id }),
}))
