import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useJournalStore } from '../journal.store'
vi.mock('@/shared/lib/db', () => ({ getAllJournalEntries: vi.fn().mockResolvedValue([]), putJournalEntry: vi.fn(), deleteJournalEntryFromDb: vi.fn() }))
describe('JournalStore', () => {
  beforeEach(() => { useJournalStore.setState({ entries: [] }) })
  it('should add entry', () => { useJournalStore.getState().addEntry('Great day', ['family', 'health'], 'happy'); expect(useJournalStore.getState().entries).toHaveLength(1); expect(useJournalStore.getState().entries[0].gratitude).toHaveLength(2) })
  it('should return today question', () => { expect(useJournalStore.getState().todayQuestion()).toBeTruthy() })
  it('should delete', () => { useJournalStore.getState().addEntry('X', [], ''); useJournalStore.getState().deleteEntry(useJournalStore.getState().entries[0].id); expect(useJournalStore.getState().entries).toHaveLength(0) })
})
