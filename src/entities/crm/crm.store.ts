import { create } from 'zustand'
import type { CrmContact, CrmInteraction } from '@/shared/types'
import { getAllCrmContacts, putCrmContact, deleteCrmContactFromDb } from '@/shared/lib/db'
interface CrmState { contacts: CrmContact[]; selectedId: string | null; hydrate: () => void; addContact: (name: string, company: string, email: string, phone: string) => void; deleteContact: (id: string) => void; addInteraction: (contactId: string, interaction: CrmInteraction) => void; addTag: (contactId: string, tag: string) => void; selectContact: (id: string | null) => void }
export const useCrmStore = create<CrmState>((set) => ({
  contacts: [], selectedId: null,
  hydrate: () => { getAllCrmContacts().then((contacts) => set({ contacts })) },
  addContact: (name, company, email, phone) => { const c: CrmContact = { id: crypto.randomUUID(), name, company, email, phone, tags: [], score: 0, interactions: [], createdAt: new Date().toISOString() }; set((s) => ({ contacts: [c, ...s.contacts] })); putCrmContact(c) },
  deleteContact: (id) => { set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteCrmContactFromDb(id) },
  addInteraction: (contactId, interaction) => { set((s) => ({ contacts: s.contacts.map((c) => { if (c.id !== contactId) return c; const u = { ...c, interactions: [interaction, ...c.interactions], score: Math.min(100, c.score + 10) }; putCrmContact(u); return u }) })) },
  addTag: (contactId, tag) => { set((s) => ({ contacts: s.contacts.map((c) => { if (c.id !== contactId || c.tags.includes(tag)) return c; const u = { ...c, tags: [...c.tags, tag] }; putCrmContact(u); return u }) })) },
  selectContact: (id) => set({ selectedId: id }),
}))
