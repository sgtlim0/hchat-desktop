import { create } from 'zustand'
import type { Portfolio, PortfolioTheme, PortfolioProject } from '@/shared/types'
import { getAllPortfolios, putPortfolio, deletePortfolioFromDb } from '@/shared/lib/db'

interface PortfolioState {
  portfolios: Portfolio[]
  selectedPortfolioId: string | null

  hydrate: () => void
  createPortfolio: (name: string, title: string, bio: string, theme: PortfolioTheme) => void
  deletePortfolio: (id: string) => void
  addProject: (portfolioId: string, project: PortfolioProject) => void
  removeProject: (portfolioId: string, projectId: string) => void
  updateHtml: (id: string, html: string) => void
  selectPortfolio: (id: string | null) => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolios: [],
  selectedPortfolioId: null,

  hydrate: () => {
    getAllPortfolios()
      .then((portfolios) => set({ portfolios }))
      .catch(console.error)
  },

  createPortfolio: (name, title, bio, theme) => {
    const now = new Date().toISOString()
    const portfolio: Portfolio = {
      id: crypto.randomUUID(),
      name,
      title,
      bio,
      theme,
      projects: [],
      generatedHtml: '',
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ portfolios: [portfolio, ...state.portfolios] }))
    putPortfolio(portfolio).catch(console.error)
  },

  deletePortfolio: (id) => {
    set((state) => ({
      portfolios: state.portfolios.filter((p) => p.id !== id),
      selectedPortfolioId: state.selectedPortfolioId === id ? null : state.selectedPortfolioId,
    }))
    deletePortfolioFromDb(id).catch(console.error)
  },

  addProject: (portfolioId, project) => {
    set((state) => ({
      portfolios: state.portfolios.map((p) => {
        if (p.id !== portfolioId) return p
        const updated = {
          ...p,
          projects: [...p.projects, project],
          updatedAt: new Date().toISOString(),
        }
        putPortfolio(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeProject: (portfolioId, projectId) => {
    set((state) => ({
      portfolios: state.portfolios.map((p) => {
        if (p.id !== portfolioId) return p
        const updated = {
          ...p,
          projects: p.projects.filter((proj) => proj.id !== projectId),
          updatedAt: new Date().toISOString(),
        }
        putPortfolio(updated).catch(console.error)
        return updated
      }),
    }))
  },

  updateHtml: (id, html) => {
    set((state) => ({
      portfolios: state.portfolios.map((p) => {
        if (p.id !== id) return p
        const updated = {
          ...p,
          generatedHtml: html,
          updatedAt: new Date().toISOString(),
        }
        putPortfolio(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectPortfolio: (id) => {
    set({ selectedPortfolioId: id })
  },
}))
