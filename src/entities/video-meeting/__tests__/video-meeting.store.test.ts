import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVideoMeetingStore } from '../video-meeting.store'
vi.mock('@/shared/lib/db', () => ({ getAllVideoMeetings: vi.fn().mockResolvedValue([]), putVideoMeeting: vi.fn(), deleteVideoMeetingFromDb: vi.fn() }))
describe('VideoMeetingStore', () => {
  beforeEach(() => { useVideoMeetingStore.setState({ meetings: [], selectedId: null }) })
  it('should create meeting', () => { useVideoMeetingStore.getState().createMeeting('Standup'); expect(useVideoMeetingStore.getState().meetings).toHaveLength(1) })
  it('should add transcript', () => { useVideoMeetingStore.getState().createMeeting('T'); const id = useVideoMeetingStore.getState().meetings[0].id; useVideoMeetingStore.getState().addTranscript(id, { id: 't1', speaker: 'Alice', text: 'Hello', timestamp: '' }); expect(useVideoMeetingStore.getState().meetings[0].transcripts).toHaveLength(1) })
  it('should toggle recording', () => { useVideoMeetingStore.getState().createMeeting('T'); const id = useVideoMeetingStore.getState().meetings[0].id; useVideoMeetingStore.getState().toggleRecording(id); expect(useVideoMeetingStore.getState().meetings[0].isRecording).toBe(true) })
  it('should delete', () => { useVideoMeetingStore.getState().createMeeting('T'); useVideoMeetingStore.getState().deleteMeeting(useVideoMeetingStore.getState().meetings[0].id); expect(useVideoMeetingStore.getState().meetings).toHaveLength(0) })
})
