import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePresentationStore } from '../presentation.store'
import type { Presentation } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllPresentations: vi.fn(() => Promise.resolve([])),
  putPresentation: vi.fn(() => Promise.resolve()),
  deletePresentationFromDb: vi.fn(() => Promise.resolve()),
}))

describe('PresentationStore', () => {
  beforeEach(() => {
    usePresentationStore.setState({
      presentations: [],
      selectedPresentationId: null,
    })
  })

  it('should create a presentation with a default slide', () => {
    const { createPresentation } = usePresentationStore.getState()

    createPresentation('My Deck', 'business')

    const presentations = usePresentationStore.getState().presentations
    expect(presentations).toHaveLength(1)
    expect(presentations[0].title).toBe('My Deck')
    expect(presentations[0].template).toBe('business')
    expect(presentations[0].slides).toHaveLength(1)
    expect(presentations[0].slides[0].title).toBe('Title Slide')
    expect(usePresentationStore.getState().selectedPresentationId).toBe(presentations[0].id)
  })

  it('should delete a presentation', () => {
    const now = new Date().toISOString()
    usePresentationStore.setState({
      presentations: [
        { id: 'p-1', title: 'A', slides: [], template: 'tech', createdAt: now, updatedAt: now },
        { id: 'p-2', title: 'B', slides: [], template: 'tech', createdAt: now, updatedAt: now },
      ],
      selectedPresentationId: 'p-1',
    })

    const { deletePresentation } = usePresentationStore.getState()
    deletePresentation('p-1')

    const state = usePresentationStore.getState()
    expect(state.presentations).toHaveLength(1)
    expect(state.presentations[0].id).toBe('p-2')
    expect(state.selectedPresentationId).toBeNull()
  })

  it('should add a slide to a presentation', () => {
    const now = new Date().toISOString()
    usePresentationStore.setState({
      presentations: [
        { id: 'p-1', title: 'Deck', slides: [{ id: 's-0', title: 'Intro', content: '', notes: '', order: 0 }], template: 'business', createdAt: now, updatedAt: now },
      ],
    })

    const { addSlide } = usePresentationStore.getState()
    addSlide('p-1', 'Agenda', 'agenda content', 'speaker notes')

    const pres = usePresentationStore.getState().presentations[0]
    expect(pres.slides).toHaveLength(2)
    expect(pres.slides[1].title).toBe('Agenda')
    expect(pres.slides[1].content).toBe('agenda content')
    expect(pres.slides[1].notes).toBe('speaker notes')
    expect(pres.slides[1].order).toBe(1)
  })

  it('should update a slide', () => {
    const now = new Date().toISOString()
    usePresentationStore.setState({
      presentations: [
        { id: 'p-1', title: 'Deck', slides: [{ id: 's-1', title: 'Old', content: 'old', notes: '', order: 0 }], template: 'tech', createdAt: now, updatedAt: now },
      ],
    })

    const { updateSlide } = usePresentationStore.getState()
    updateSlide('p-1', 's-1', { title: 'New Title', content: 'new content' })

    const slide = usePresentationStore.getState().presentations[0].slides[0]
    expect(slide.title).toBe('New Title')
    expect(slide.content).toBe('new content')
  })

  it('should remove a slide and reorder remaining', () => {
    const now = new Date().toISOString()
    usePresentationStore.setState({
      presentations: [
        {
          id: 'p-1', title: 'Deck', template: 'tech', createdAt: now, updatedAt: now,
          slides: [
            { id: 's-0', title: 'A', content: '', notes: '', order: 0 },
            { id: 's-1', title: 'B', content: '', notes: '', order: 1 },
            { id: 's-2', title: 'C', content: '', notes: '', order: 2 },
          ],
        },
      ],
    })

    const { removeSlide } = usePresentationStore.getState()
    removeSlide('p-1', 's-1')

    const slides = usePresentationStore.getState().presentations[0].slides
    expect(slides).toHaveLength(2)
    expect(slides[0].id).toBe('s-0')
    expect(slides[0].order).toBe(0)
    expect(slides[1].id).toBe('s-2')
    expect(slides[1].order).toBe(1)
  })

  it('should reorder slides', () => {
    const now = new Date().toISOString()
    usePresentationStore.setState({
      presentations: [
        {
          id: 'p-1', title: 'Deck', template: 'tech', createdAt: now, updatedAt: now,
          slides: [
            { id: 's-a', title: 'A', content: '', notes: '', order: 0 },
            { id: 's-b', title: 'B', content: '', notes: '', order: 1 },
            { id: 's-c', title: 'C', content: '', notes: '', order: 2 },
          ],
        },
      ],
    })

    const { reorderSlides } = usePresentationStore.getState()
    reorderSlides('p-1', ['s-c', 's-a', 's-b'])

    const slides = usePresentationStore.getState().presentations[0].slides
    expect(slides[0].id).toBe('s-c')
    expect(slides[0].order).toBe(0)
    expect(slides[1].id).toBe('s-a')
    expect(slides[1].order).toBe(1)
    expect(slides[2].id).toBe('s-b')
    expect(slides[2].order).toBe(2)
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockData: Presentation[] = [
      { id: 'p-1', title: 'From DB', slides: [], template: 'education', createdAt: now, updatedAt: now },
    ]

    const { getAllPresentations } = await import('@/shared/lib/db')
    vi.mocked(getAllPresentations).mockResolvedValueOnce(mockData)

    const { hydrate } = usePresentationStore.getState()
    hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const presentations = usePresentationStore.getState().presentations
    expect(presentations).toHaveLength(1)
    expect(presentations[0].title).toBe('From DB')
  })
})
