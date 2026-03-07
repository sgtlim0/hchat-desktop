import { create } from 'zustand'
import type { SmartContractTemplate } from '@/shared/types'
import { getAllSmartContracts, putSmartContract, deleteSmartContractFromDb } from '@/shared/lib/db'
interface SmartContractState { contracts: SmartContractTemplate[]; selectedId: string | null; hydrate: () => void; createContract: (name: string, standard: SmartContractTemplate['standard']) => void; deleteContract: (id: string) => void; updateCode: (id: string, code: string) => void; addVulnerability: (id: string, vuln: string) => void; selectContract: (id: string | null) => void }
export const useSmartContractStore = create<SmartContractState>((set) => ({
  contracts: [], selectedId: null,
  hydrate: () => { getAllSmartContracts().then((contracts) => set({ contracts })) },
  createContract: (name, standard) => { const c: SmartContractTemplate = { id: crypto.randomUUID(), name, standard, code: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n', vulnerabilities: [], gasEstimate: 0, createdAt: new Date().toISOString() }; set((s) => ({ contracts: [c, ...s.contracts], selectedId: c.id })); putSmartContract(c) },
  deleteContract: (id) => { set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })); deleteSmartContractFromDb(id) },
  updateCode: (id, code) => { set((s) => ({ contracts: s.contracts.map((c) => c.id === id ? { ...c, code, gasEstimate: Math.round(code.length * 0.5) } : c) })) },
  addVulnerability: (id, vuln) => { set((s) => ({ contracts: s.contracts.map((c) => c.id === id ? { ...c, vulnerabilities: [...c.vulnerabilities, vuln] } : c) })) },
  selectContract: (id) => set({ selectedId: id }),
}))
