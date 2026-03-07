import { create } from 'zustand'
import type { Contract, ContractClause, ContractTemplate } from '@/shared/types'
import { getAllContracts, putContract, deleteContractFromDb } from '@/shared/lib/db'

interface ContractState {
  contracts: Contract[]
  selectedContractId: string | null

  hydrate: () => void
  createContract: (title: string, template: ContractTemplate) => void
  deleteContract: (id: string) => void
  addClause: (contractId: string, clause: ContractClause) => void
  removeClause: (contractId: string, clauseId: string) => void
  addParty: (contractId: string, name: string, role: string) => void
  selectContract: (id: string | null) => void
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  selectedContractId: null,

  hydrate: () => {
    getAllContracts()
      .then((contracts) => set({ contracts }))
      .catch(console.error)
  },

  createContract: (title, template) => {
    const now = new Date().toISOString()
    const contract: Contract = {
      id: crypto.randomUUID(),
      title,
      template,
      parties: [],
      clauses: [],
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ contracts: [contract, ...state.contracts] }))
    putContract(contract).catch(console.error)
  },

  deleteContract: (id) => {
    set((state) => ({
      contracts: state.contracts.filter((c) => c.id !== id),
      selectedContractId: state.selectedContractId === id ? null : state.selectedContractId,
    }))
    deleteContractFromDb(id).catch(console.error)
  },

  addClause: (contractId, clause) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id !== contractId) return c
        const updated = { ...c, clauses: [...c.clauses, clause], updatedAt: new Date().toISOString() }
        putContract(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeClause: (contractId, clauseId) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id !== contractId) return c
        const updated = {
          ...c,
          clauses: c.clauses.filter((cl) => cl.id !== clauseId),
          updatedAt: new Date().toISOString(),
        }
        putContract(updated).catch(console.error)
        return updated
      }),
    }))
  },

  addParty: (contractId, name, role) => {
    set((state) => ({
      contracts: state.contracts.map((c) => {
        if (c.id !== contractId) return c
        const updated = {
          ...c,
          parties: [...c.parties, { name, role }],
          updatedAt: new Date().toISOString(),
        }
        putContract(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectContract: (id) => {
    set({ selectedContractId: id })
  },
}))
