import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReportGeneratorStore } from '../report-generator.store'

vi.mock('@/shared/lib/db', () => ({
  getAllReports: vi.fn().mockResolvedValue([]),
  putReport: vi.fn().mockResolvedValue(undefined),
  deleteReportFromDb: vi.fn().mockResolvedValue(undefined),
}))

describe('ReportGeneratorStore', () => {
  beforeEach(() => { useReportGeneratorStore.setState({ reports: [] }) })

  it('should have empty initial state', () => {
    expect(useReportGeneratorStore.getState().reports).toEqual([])
  })

  it('should create a report', async () => {
    await useReportGeneratorStore.getState().createReport('Weekly Report', 'weekly')
    const reports = useReportGeneratorStore.getState().reports
    expect(reports).toHaveLength(1)
    expect(reports[0].title).toBe('Weekly Report')
    expect(reports[0].template).toBe('weekly')
    expect(reports[0].version).toBe(1)
  })

  it('should delete a report', async () => {
    await useReportGeneratorStore.getState().createReport('A', 'monthly')
    const id = useReportGeneratorStore.getState().reports[0].id
    await useReportGeneratorStore.getState().deleteReport(id)
    expect(useReportGeneratorStore.getState().reports).toHaveLength(0)
  })

  it('should update content', async () => {
    await useReportGeneratorStore.getState().createReport('B', 'project')
    const id = useReportGeneratorStore.getState().reports[0].id
    await useReportGeneratorStore.getState().updateContent(id, 'Report body')
    expect(useReportGeneratorStore.getState().reports[0].content).toBe('Report body')
  })

  it('should increment version', async () => {
    await useReportGeneratorStore.getState().createReport('C', 'custom')
    const id = useReportGeneratorStore.getState().reports[0].id
    await useReportGeneratorStore.getState().incrementVersion(id)
    expect(useReportGeneratorStore.getState().reports[0].version).toBe(2)
  })

  it('should increment version multiple times', async () => {
    await useReportGeneratorStore.getState().createReport('D', 'weekly')
    const id = useReportGeneratorStore.getState().reports[0].id
    await useReportGeneratorStore.getState().incrementVersion(id)
    await useReportGeneratorStore.getState().incrementVersion(id)
    expect(useReportGeneratorStore.getState().reports[0].version).toBe(3)
  })
})
