import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFinanceStore } from '../finance.store'
vi.mock('@/shared/lib/db', () => ({ getAllTransactions: vi.fn().mockResolvedValue([]), putTransaction: vi.fn().mockResolvedValue(undefined), deleteTransactionFromDb: vi.fn().mockResolvedValue(undefined), getAllBudgets: vi.fn().mockResolvedValue([]), putBudget: vi.fn().mockResolvedValue(undefined), deleteBudgetFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('FinanceStore', () => {
  beforeEach(() => { useFinanceStore.setState({ transactions: [], budgets: [] }) })
  it('should add transaction', () => { useFinanceStore.getState().addTransaction('income', 5000, 'Salary', 'Monthly', '2026-03-01'); expect(useFinanceStore.getState().transactions).toHaveLength(1) })
  it('should compute totals', () => { useFinanceStore.getState().addTransaction('income', 5000, 'Salary', '', ''); useFinanceStore.getState().addTransaction('expense', 1000, 'Rent', '', ''); expect(useFinanceStore.getState().totalIncome()).toBe(5000); expect(useFinanceStore.getState().totalExpense()).toBe(1000) })
  it('should add budget', () => { useFinanceStore.getState().addBudget('Food', 500, '2026-03'); expect(useFinanceStore.getState().budgets).toHaveLength(1) })
  it('should delete transaction', () => { useFinanceStore.getState().addTransaction('expense', 100, 'X', '', ''); useFinanceStore.getState().deleteTransaction(useFinanceStore.getState().transactions[0].id); expect(useFinanceStore.getState().transactions).toHaveLength(0) })
})
