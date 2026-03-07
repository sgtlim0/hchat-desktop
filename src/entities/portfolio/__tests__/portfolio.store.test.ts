import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePortfolioStore } from '../portfolio.store'
import type { Portfolio, PortfolioProject } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllPortfolios: vi.fn(() => Promise.resolve([])),
  putPortfolio: vi.fn(() => Promise.resolve()),
  deletePortfolioFromDb: vi.fn(() => Promise.resolve()),
}))

describe('PortfolioStore', () => {
  beforeEach(() => {
    usePortfolioStore.setState({
      portfolios: [],
      selectedPortfolioId: null,
    })
  })

  it('should create a portfolio', () => {
    usePortfolioStore.getState().createPortfolio('John Doe', 'Senior Developer', 'I build things', 'modern')

    const portfolios = usePortfolioStore.getState().portfolios
    expect(portfolios).toHaveLength(1)
    expect(portfolios[0].name).toBe('John Doe')
    expect(portfolios[0].title).toBe('Senior Developer')
    expect(portfolios[0].bio).toBe('I build things')
    expect(portfolios[0].theme).toBe('modern')
    expect(portfolios[0].projects).toEqual([])
    expect(portfolios[0].generatedHtml).toBe('')
  })

  it('should delete a portfolio', () => {
    const now = new Date().toISOString()
    usePortfolioStore.setState({
      portfolios: [
        { id: 'pf-1', name: 'A', title: 'T', bio: 'B', theme: 'minimal', projects: [], generatedHtml: '', createdAt: now, updatedAt: now },
        { id: 'pf-2', name: 'B', title: 'T', bio: 'B', theme: 'modern', projects: [], generatedHtml: '', createdAt: now, updatedAt: now },
      ],
      selectedPortfolioId: 'pf-1',
    })

    usePortfolioStore.getState().deletePortfolio('pf-1')

    const state = usePortfolioStore.getState()
    expect(state.portfolios).toHaveLength(1)
    expect(state.portfolios[0].id).toBe('pf-2')
    expect(state.selectedPortfolioId).toBeNull()
  })

  it('should add a project to a portfolio', () => {
    const now = new Date().toISOString()
    usePortfolioStore.setState({
      portfolios: [
        { id: 'pf-1', name: 'A', title: 'T', bio: 'B', theme: 'minimal', projects: [], generatedHtml: '', createdAt: now, updatedAt: now },
      ],
    })

    const project: PortfolioProject = {
      id: 'proj-1',
      title: 'H Chat',
      description: 'AI chat app',
      techStack: ['React', 'TypeScript'],
      liveUrl: 'https://example.com',
    }

    usePortfolioStore.getState().addProject('pf-1', project)

    const portfolio = usePortfolioStore.getState().portfolios[0]
    expect(portfolio.projects).toHaveLength(1)
    expect(portfolio.projects[0].title).toBe('H Chat')
    expect(portfolio.projects[0].techStack).toEqual(['React', 'TypeScript'])
  })

  it('should remove a project from a portfolio', () => {
    const now = new Date().toISOString()
    const projects: PortfolioProject[] = [
      { id: 'proj-1', title: 'A', description: 'a', techStack: [] },
      { id: 'proj-2', title: 'B', description: 'b', techStack: [] },
    ]
    usePortfolioStore.setState({
      portfolios: [
        { id: 'pf-1', name: 'A', title: 'T', bio: 'B', theme: 'minimal', projects, generatedHtml: '', createdAt: now, updatedAt: now },
      ],
    })

    usePortfolioStore.getState().removeProject('pf-1', 'proj-1')

    const portfolio = usePortfolioStore.getState().portfolios[0]
    expect(portfolio.projects).toHaveLength(1)
    expect(portfolio.projects[0].id).toBe('proj-2')
  })

  it('should update generated HTML', () => {
    const now = new Date().toISOString()
    usePortfolioStore.setState({
      portfolios: [
        { id: 'pf-1', name: 'A', title: 'T', bio: 'B', theme: 'minimal', projects: [], generatedHtml: '', createdAt: now, updatedAt: now },
      ],
    })

    usePortfolioStore.getState().updateHtml('pf-1', '<html><body>Portfolio</body></html>')

    expect(usePortfolioStore.getState().portfolios[0].generatedHtml).toBe('<html><body>Portfolio</body></html>')
  })

  it('should select and deselect a portfolio', () => {
    usePortfolioStore.getState().selectPortfolio('pf-1')
    expect(usePortfolioStore.getState().selectedPortfolioId).toBe('pf-1')

    usePortfolioStore.getState().selectPortfolio(null)
    expect(usePortfolioStore.getState().selectedPortfolioId).toBeNull()
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockPortfolios: Portfolio[] = [
      { id: 'pf-1', name: 'From DB', title: 'T', bio: 'B', theme: 'developer', projects: [], generatedHtml: '<p>hi</p>', createdAt: now, updatedAt: now },
    ]

    const { getAllPortfolios } = await import('@/shared/lib/db')
    vi.mocked(getAllPortfolios).mockResolvedValueOnce(mockPortfolios)

    usePortfolioStore.getState().hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const portfolios = usePortfolioStore.getState().portfolios
    expect(portfolios).toHaveLength(1)
    expect(portfolios[0].name).toBe('From DB')
  })
})
