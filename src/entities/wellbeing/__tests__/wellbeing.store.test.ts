import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWellbeingStore } from '../wellbeing.store'
import type { MoodEntry } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllMoodEntries: vi.fn(() => Promise.resolve([])),
  putMoodEntry: vi.fn(() => Promise.resolve()),
  deleteMoodEntryFromDb: vi.fn(() => Promise.resolve()),
  getAllWellbeingReports: vi.fn(() => Promise.resolve([])),
  putWellbeingReport: vi.fn(() => Promise.resolve()),
  deleteWellbeingReportFromDb: vi.fn(() => Promise.resolve()),
}))

const makeMoodEntry = (overrides: Partial<MoodEntry> = {}): MoodEntry => ({
  id: 'me-1',
  date: '2026-03-07',
  mood: 'good',
  note: 'Productive day',
  sessionCount: 5,
  topEmotions: ['focused', 'calm'],
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('WellbeingStore', () => {
  beforeEach(() => {
    useWellbeingStore.setState({
      entries: [],
      reports: [],
    })
  })

  it('should add a mood entry', () => {
    useWellbeingStore.getState().addMoodEntry('good', 'Great day', 5, ['happy', 'focused'])

    const entries = useWellbeingStore.getState().entries
    expect(entries).toHaveLength(1)
    expect(entries[0].mood).toBe('good')
    expect(entries[0].note).toBe('Great day')
    expect(entries[0].sessionCount).toBe(5)
    expect(entries[0].topEmotions).toEqual(['happy', 'focused'])
  })

  it('should delete a mood entry', () => {
    useWellbeingStore.setState({
      entries: [makeMoodEntry({ id: 'me-1' }), makeMoodEntry({ id: 'me-2' })],
    })

    useWellbeingStore.getState().deleteMoodEntry('me-1')

    expect(useWellbeingStore.getState().entries).toHaveLength(1)
    expect(useWellbeingStore.getState().entries[0].id).toBe('me-2')
  })

  it('should calculate average mood', () => {
    useWellbeingStore.setState({
      entries: [
        makeMoodEntry({ id: 'me-1', mood: 'great' }),   // 5
        makeMoodEntry({ id: 'me-2', mood: 'good' }),    // 4
        makeMoodEntry({ id: 'me-3', mood: 'neutral' }), // 3
      ],
    })

    const avg = useWellbeingStore.getState().getAverageMood()
    expect(avg).toBe(4) // (5+4+3)/3 = 4
  })

  it('should return 0 for average mood with no entries', () => {
    expect(useWellbeingStore.getState().getAverageMood()).toBe(0)
  })

  it('should generate a weekly report', () => {
    const recent = new Date().toISOString()
    useWellbeingStore.setState({
      entries: [
        makeMoodEntry({ id: 'me-1', mood: 'good', createdAt: recent }),
        makeMoodEntry({ id: 'me-2', mood: 'stressed', createdAt: recent }),
        makeMoodEntry({ id: 'me-3', mood: 'neutral', createdAt: recent }),
      ],
    })

    useWellbeingStore.getState().generateReport('weekly')

    const reports = useWellbeingStore.getState().reports
    expect(reports).toHaveLength(1)
    expect(reports[0].period).toBe('weekly')
    expect(reports[0].moodTrend).toEqual(['good', 'stressed', 'neutral'])
    expect(reports[0].stressIndex).toBe(33) // 1/3 * 100 = 33
    expect(reports[0].productivityScore).toBeGreaterThan(0)
  })

  it('should generate report with suggestions for high stress', () => {
    const recent = new Date().toISOString()
    useWellbeingStore.setState({
      entries: [
        makeMoodEntry({ id: 'me-1', mood: 'stressed', createdAt: recent }),
        makeMoodEntry({ id: 'me-2', mood: 'low', createdAt: recent }),
        makeMoodEntry({ id: 'me-3', mood: 'stressed', createdAt: recent }),
      ],
    })

    useWellbeingStore.getState().generateReport('monthly')

    const report = useWellbeingStore.getState().reports[0]
    expect(report.stressIndex).toBe(100)
    expect(report.suggestions).toContain('Consider taking more breaks between sessions')
    expect(report.suggestions).toContain('Try shorter, focused work sessions')
  })

  it('should delete a report', () => {
    useWellbeingStore.setState({
      reports: [
        { id: 'wr-1', period: 'weekly', stressIndex: 20, productivityScore: 80, moodTrend: ['good'], suggestions: [], createdAt: new Date().toISOString() },
        { id: 'wr-2', period: 'monthly', stressIndex: 30, productivityScore: 70, moodTrend: ['neutral'], suggestions: [], createdAt: new Date().toISOString() },
      ],
    })

    useWellbeingStore.getState().deleteReport('wr-1')

    expect(useWellbeingStore.getState().reports).toHaveLength(1)
    expect(useWellbeingStore.getState().reports[0].id).toBe('wr-2')
  })

  it('should hydrate entries and reports from db', async () => {
    const { getAllMoodEntries, getAllWellbeingReports } = await import('@/shared/lib/db')
    vi.mocked(getAllMoodEntries).mockResolvedValueOnce([makeMoodEntry({ id: 'me-db-1' })])
    vi.mocked(getAllWellbeingReports).mockResolvedValueOnce([
      { id: 'wr-db-1', period: 'weekly', stressIndex: 10, productivityScore: 90, moodTrend: ['great'], suggestions: [], createdAt: new Date().toISOString() },
    ])

    useWellbeingStore.getState().hydrate()
    await vi.waitFor(() => {
      expect(useWellbeingStore.getState().entries).toHaveLength(1)
      expect(useWellbeingStore.getState().entries[0].id).toBe('me-db-1')
      expect(useWellbeingStore.getState().reports).toHaveLength(1)
      expect(useWellbeingStore.getState().reports[0].id).toBe('wr-db-1')
    })
  })
})
