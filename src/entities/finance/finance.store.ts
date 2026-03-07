import { create } from 'zustand'
import type { Transaction, TransactionType, Budget } from '@/shared/types'
import { getAllTransactions, putTransaction, deleteTransactionFromDb, getAllBudgets, putBudget, deleteBudgetFromDb } from '@/shared/lib/db'
interface FinanceState { transactions: Transaction[]; budgets: Budget[]; hydrate: () => void; addTransaction: (type: TransactionType, amount: number, category: string, description: string, date: string) => void; deleteTransaction: (id: string) => void; addBudget: (category: string, limit: number, month: string) => void; deleteBudget: (id: string) => void; totalIncome: () => number; totalExpense: () => number }
export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [], budgets: [],
  hydrate: () => { Promise.all([getAllTransactions(), getAllBudgets()]).then(([transactions, budgets]) => set({ transactions, budgets })) },
  addTransaction: (type, amount, category, description, date) => { const t: Transaction = { id: crypto.randomUUID(), type, amount, category, description, date }; set((s) => ({ transactions: [t, ...s.transactions] })); putTransaction(t) },
  deleteTransaction: (id) => { set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })); deleteTransactionFromDb(id) },
  addBudget: (category, limit, month) => { const b: Budget = { id: crypto.randomUUID(), category, limit, spent: 0, month }; set((s) => ({ budgets: [...s.budgets, b] })); putBudget(b) },
  deleteBudget: (id) => { set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })); deleteBudgetFromDb(id) },
  totalIncome: () => get().transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0),
  totalExpense: () => get().transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
}))
