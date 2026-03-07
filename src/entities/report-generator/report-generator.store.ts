import { create } from 'zustand'
import type { Report, ReportTemplate } from '@/shared/types'
import { getAllReports, putReport, deleteReportFromDb } from '@/shared/lib/db'

interface ReportGeneratorState {
  reports: Report[]

  hydrate: () => Promise<void>
  createReport: (title: string, template: ReportTemplate) => Promise<void>
  deleteReport: (id: string) => Promise<void>
  updateContent: (id: string, content: string) => Promise<void>
  incrementVersion: (id: string) => Promise<void>
}

export const useReportGeneratorStore = create<ReportGeneratorState>()((set, get) => ({
  reports: [],

  hydrate: async () => {
    const reports = await getAllReports()
    set({ reports })
  },

  createReport: async (title, template) => {
    const now = new Date().toISOString()
    const report: Report = {
      id: crypto.randomUUID(), title, template,
      content: '', version: 1,
      createdAt: now, updatedAt: now,
    }
    await putReport(report)
    set((s) => ({ reports: [report, ...s.reports] }))
  },

  deleteReport: async (id) => {
    await deleteReportFromDb(id)
    set((s) => ({ reports: s.reports.filter((r) => r.id !== id) }))
  },

  updateContent: async (id, content) => {
    const report = get().reports.find((r) => r.id === id)
    if (!report) return
    const updated = { ...report, content, updatedAt: new Date().toISOString() }
    await putReport(updated)
    set((s) => ({ reports: s.reports.map((r) => (r.id === id ? updated : r)) }))
  },

  incrementVersion: async (id) => {
    const report = get().reports.find((r) => r.id === id)
    if (!report) return
    const updated = { ...report, version: report.version + 1, updatedAt: new Date().toISOString() }
    await putReport(updated)
    set((s) => ({ reports: s.reports.map((r) => (r.id === id ? updated : r)) }))
  },
}))
