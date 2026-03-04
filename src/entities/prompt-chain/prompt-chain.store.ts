import { create } from 'zustand'
import type { PromptChain, ChainStep, ChainStatus } from '@/shared/types'

interface PromptChainState {
  chains: PromptChain[]
  currentChainId: string | null
  isRunning: boolean

  createChain: (name: string, description: string) => string
  updateChain: (id: string, updates: Partial<PromptChain>) => void
  deleteChain: (id: string) => void
  addStep: (chainId: string, step: Omit<ChainStep, 'id'>) => void
  removeStep: (chainId: string, stepId: string) => void
  updateStep: (chainId: string, stepId: string, updates: Partial<ChainStep>) => void
  runChain: (chainId: string) => void
  stopChain: () => void
  setStepResult: (chainId: string, stepId: string, result: string) => void
  selectChain: (id: string | null) => void
  hydrate: () => void
}

export const usePromptChainStore = create<PromptChainState>((set) => ({
  chains: [],
  currentChainId: null,
  isRunning: false,

  createChain: (name, description) => {
    const id = `chain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const newChain: PromptChain = {
      id,
      name,
      description,
      steps: [],
      variables: {},
      status: 'idle',
      currentStepIndex: 0,
      results: {},
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      chains: [...state.chains, newChain],
      currentChainId: id,
    }))
    return id
  },

  updateChain: (id, updates) =>
    set((state) => ({
      chains: state.chains.map((chain) =>
        chain.id === id
          ? { ...chain, ...updates, updatedAt: new Date().toISOString() }
          : chain
      ),
    })),

  deleteChain: (id) =>
    set((state) => ({
      chains: state.chains.filter((chain) => chain.id !== id),
      currentChainId: state.currentChainId === id ? null : state.currentChainId,
    })),

  addStep: (chainId, stepData) =>
    set((state) => ({
      chains: state.chains.map((chain) => {
        if (chain.id !== chainId) return chain
        const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const newStep: ChainStep = { ...stepData, id: stepId }
        return {
          ...chain,
          steps: [...chain.steps, newStep],
          updatedAt: new Date().toISOString(),
        }
      }),
    })),

  removeStep: (chainId, stepId) =>
    set((state) => ({
      chains: state.chains.map((chain) => {
        if (chain.id !== chainId) return chain
        return {
          ...chain,
          steps: chain.steps.filter((s) => s.id !== stepId),
          updatedAt: new Date().toISOString(),
        }
      }),
    })),

  updateStep: (chainId, stepId, updates) =>
    set((state) => ({
      chains: state.chains.map((chain) => {
        if (chain.id !== chainId) return chain
        return {
          ...chain,
          steps: chain.steps.map((s) =>
            s.id === stepId ? { ...s, ...updates } : s
          ),
          updatedAt: new Date().toISOString(),
        }
      }),
    })),

  runChain: (chainId) => {
    set({ isRunning: true })
    const chain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    if (!chain) {
      set({ isRunning: false })
      return
    }

    set((state) => ({
      chains: state.chains.map((c) =>
        c.id === chainId
          ? { ...c, status: 'running' as ChainStatus, currentStepIndex: 0, results: {} }
          : c
      ),
    }))

    // Simulate chain execution
    chain.steps.forEach((step, index) => {
      setTimeout(() => {
        const state = usePromptChainStore.getState()
        const currentChain = state.chains.find((c) => c.id === chainId)
        if (!currentChain || !state.isRunning) return

        const result = `Result of ${step.label} (simulated)`
        state.setStepResult(chainId, step.id, result)

        if (index === chain.steps.length - 1) {
          set((s) => ({
            chains: s.chains.map((c) =>
              c.id === chainId
                ? { ...c, status: 'done' as ChainStatus }
                : c
            ),
            isRunning: false,
          }))
        } else {
          set((s) => ({
            chains: s.chains.map((c) =>
              c.id === chainId
                ? { ...c, currentStepIndex: index + 1 }
                : c
            ),
          }))
        }
      }, (index + 1) * 2000)
    })
  },

  stopChain: () =>
    set((state) => ({
      chains: state.chains.map((c) =>
        c.status === 'running' ? { ...c, status: 'paused' as ChainStatus } : c
      ),
      isRunning: false,
    })),

  setStepResult: (chainId, stepId, result) =>
    set((state) => ({
      chains: state.chains.map((chain) => {
        if (chain.id !== chainId) return chain
        return {
          ...chain,
          results: { ...chain.results, [stepId]: result },
          updatedAt: new Date().toISOString(),
        }
      }),
    })),

  selectChain: (id) => set({ currentChainId: id }),

  hydrate: () => {
    // Future: Load from IndexedDB
  },
}))
