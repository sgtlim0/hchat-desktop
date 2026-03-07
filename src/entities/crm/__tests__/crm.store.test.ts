import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCrmStore } from '../crm.store'
vi.mock('@/shared/lib/db', () => ({ getAllCrmContacts: vi.fn().mockResolvedValue([]), putCrmContact: vi.fn(), deleteCrmContactFromDb: vi.fn() }))
describe('CrmStore', () => {
  beforeEach(() => { useCrmStore.setState({ contacts: [], selectedId: null }) })
  it('should add contact', () => { useCrmStore.getState().addContact('Alice', 'Corp', 'a@b.com', '010'); expect(useCrmStore.getState().contacts).toHaveLength(1) })
  it('should add interaction and increase score', () => { useCrmStore.getState().addContact('Bob', 'Inc', '', ''); const id = useCrmStore.getState().contacts[0].id; useCrmStore.getState().addInteraction(id, { id: 'i1', type: 'meeting', content: 'Discussed project', date: '2026-03-07' }); expect(useCrmStore.getState().contacts[0].score).toBe(10); expect(useCrmStore.getState().contacts[0].interactions).toHaveLength(1) })
  it('should add tag', () => { useCrmStore.getState().addContact('C', '', '', ''); useCrmStore.getState().addTag(useCrmStore.getState().contacts[0].id, 'VIP'); expect(useCrmStore.getState().contacts[0].tags).toContain('VIP') })
  it('should delete', () => { useCrmStore.getState().addContact('D', '', '', ''); useCrmStore.getState().deleteContact(useCrmStore.getState().contacts[0].id); expect(useCrmStore.getState().contacts).toHaveLength(0) })
})
