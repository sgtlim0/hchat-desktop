import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSmartContractStore } from '../smart-contract.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('SmartContractStore', () => {
  beforeEach(() => { useSmartContractStore.setState({ contracts: [], selectedId: null }) })
  it('should create with boilerplate', () => { useSmartContractStore.getState().createContract('Token', 'ERC-20'); expect(useSmartContractStore.getState().contracts[0].code).toContain('pragma solidity') })
  it('should update code and estimate gas', () => { useSmartContractStore.getState().createContract('T', 'custom'); useSmartContractStore.getState().updateCode(useSmartContractStore.getState().contracts[0].id, 'contract X { }'); expect(useSmartContractStore.getState().contracts[0].gasEstimate).toBeGreaterThan(0) })
  it('should add vulnerability', () => { useSmartContractStore.getState().createContract('T', 'ERC-721'); useSmartContractStore.getState().addVulnerability(useSmartContractStore.getState().contracts[0].id, 'Reentrancy'); expect(useSmartContractStore.getState().contracts[0].vulnerabilities).toContain('Reentrancy') })
  it('should delete', () => { useSmartContractStore.getState().createContract('T', 'custom'); useSmartContractStore.getState().deleteContract(useSmartContractStore.getState().contracts[0].id); expect(useSmartContractStore.getState().contracts).toHaveLength(0) })
})
