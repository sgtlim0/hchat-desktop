import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useContractStore } from '../contract.store'
vi.mock('@/shared/lib/db', () => ({ getAllContracts: vi.fn().mockResolvedValue([]), putContract: vi.fn().mockResolvedValue(undefined), deleteContractFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('ContractStore', () => {
  beforeEach(() => { useContractStore.setState({ contracts: [], selectedContractId: null }) })
  it('should create contract', async () => { await useContractStore.getState().createContract('NDA', 'nda'); expect(useContractStore.getState().contracts).toHaveLength(1) })
  it('should add clause', async () => { await useContractStore.getState().createContract('T', 'nda'); const id = useContractStore.getState().contracts[0].id; await useContractStore.getState().addClause(id, { id: 'c1', title: 'A', content: 'B', isRisky: false, order: 0 }); expect(useContractStore.getState().contracts[0].clauses).toHaveLength(1) })
  it('should add party', async () => { await useContractStore.getState().createContract('T', 'service'); const id = useContractStore.getState().contracts[0].id; await useContractStore.getState().addParty(id, 'Alice', 'Provider'); expect(useContractStore.getState().contracts[0].parties).toHaveLength(1) })
  it('should delete contract', async () => { await useContractStore.getState().createContract('T', 'lease'); await useContractStore.getState().deleteContract(useContractStore.getState().contracts[0].id); expect(useContractStore.getState().contracts).toHaveLength(0) })
})
