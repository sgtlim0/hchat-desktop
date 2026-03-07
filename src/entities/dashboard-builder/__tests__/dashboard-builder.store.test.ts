import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardBuilderStore } from '../dashboard-builder.store'
import type { CustomDashboard } from '@/shared/types'

vi.mock('@/shared/lib/db', () => ({
  getAllCustomDashboards: vi.fn(() => Promise.resolve([])),
  putCustomDashboard: vi.fn(() => Promise.resolve()),
  deleteCustomDashboardFromDb: vi.fn(() => Promise.resolve()),
}))

describe('DashboardBuilderStore', () => {
  beforeEach(() => {
    useDashboardBuilderStore.setState({
      dashboards: [],
      selectedDashboardId: null,
    })
  })

  it('should create a dashboard', () => {
    useDashboardBuilderStore.getState().createDashboard('Sales Dashboard')

    const dashboards = useDashboardBuilderStore.getState().dashboards
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0].title).toBe('Sales Dashboard')
    expect(dashboards[0].widgets).toEqual([])
    expect(dashboards[0].isPublic).toBe(false)
  })

  it('should delete a dashboard', () => {
    const now = new Date().toISOString()
    useDashboardBuilderStore.setState({
      dashboards: [
        { id: 'db-1', title: 'A', widgets: [], isPublic: false, createdAt: now, updatedAt: now },
        { id: 'db-2', title: 'B', widgets: [], isPublic: false, createdAt: now, updatedAt: now },
      ],
      selectedDashboardId: 'db-1',
    })

    useDashboardBuilderStore.getState().deleteDashboard('db-1')

    const state = useDashboardBuilderStore.getState()
    expect(state.dashboards).toHaveLength(1)
    expect(state.dashboards[0].id).toBe('db-2')
    expect(state.selectedDashboardId).toBeNull()
  })

  it('should add a widget to a dashboard', () => {
    const now = new Date().toISOString()
    useDashboardBuilderStore.setState({
      dashboards: [
        { id: 'db-1', title: 'A', widgets: [], isPublic: false, createdAt: now, updatedAt: now },
      ],
    })

    useDashboardBuilderStore.getState().addWidget('db-1', 'chart', 'Revenue Chart', 0, 0)

    const dash = useDashboardBuilderStore.getState().dashboards[0]
    expect(dash.widgets).toHaveLength(1)
    expect(dash.widgets[0].type).toBe('chart')
    expect(dash.widgets[0].title).toBe('Revenue Chart')
    expect(dash.widgets[0].x).toBe(0)
    expect(dash.widgets[0].y).toBe(0)
    expect(dash.widgets[0].width).toBe(4)
    expect(dash.widgets[0].height).toBe(3)
  })

  it('should update a widget', () => {
    const now = new Date().toISOString()
    useDashboardBuilderStore.setState({
      dashboards: [{
        id: 'db-1',
        title: 'A',
        widgets: [{ id: 'w-1', type: 'kpi' as const, title: 'Old', x: 0, y: 0, width: 4, height: 3, config: {} }],
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      }],
    })

    useDashboardBuilderStore.getState().updateWidget('db-1', 'w-1', { title: 'New KPI', x: 2, y: 3 })

    const widget = useDashboardBuilderStore.getState().dashboards[0].widgets[0]
    expect(widget.title).toBe('New KPI')
    expect(widget.x).toBe(2)
    expect(widget.y).toBe(3)
  })

  it('should remove a widget', () => {
    const now = new Date().toISOString()
    useDashboardBuilderStore.setState({
      dashboards: [{
        id: 'db-1',
        title: 'A',
        widgets: [
          { id: 'w-1', type: 'kpi' as const, title: 'A', x: 0, y: 0, width: 4, height: 3, config: {} },
          { id: 'w-2', type: 'table' as const, title: 'B', x: 4, y: 0, width: 4, height: 3, config: {} },
        ],
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      }],
    })

    useDashboardBuilderStore.getState().removeWidget('db-1', 'w-1')

    const dash = useDashboardBuilderStore.getState().dashboards[0]
    expect(dash.widgets).toHaveLength(1)
    expect(dash.widgets[0].id).toBe('w-2')
  })

  it('should toggle public', () => {
    const now = new Date().toISOString()
    useDashboardBuilderStore.setState({
      dashboards: [
        { id: 'db-1', title: 'A', widgets: [], isPublic: false, createdAt: now, updatedAt: now },
      ],
    })

    useDashboardBuilderStore.getState().togglePublic('db-1')
    expect(useDashboardBuilderStore.getState().dashboards[0].isPublic).toBe(true)

    useDashboardBuilderStore.getState().togglePublic('db-1')
    expect(useDashboardBuilderStore.getState().dashboards[0].isPublic).toBe(false)
  })

  it('should select and deselect a dashboard', () => {
    useDashboardBuilderStore.getState().selectDashboard('db-1')
    expect(useDashboardBuilderStore.getState().selectedDashboardId).toBe('db-1')

    useDashboardBuilderStore.getState().selectDashboard(null)
    expect(useDashboardBuilderStore.getState().selectedDashboardId).toBeNull()
  })

  it('should hydrate from DB', async () => {
    const now = new Date().toISOString()
    const mockDashboards: CustomDashboard[] = [
      { id: 'db-1', title: 'From DB', widgets: [], isPublic: true, createdAt: now, updatedAt: now },
    ]

    const { getAllCustomDashboards } = await import('@/shared/lib/db')
    vi.mocked(getAllCustomDashboards).mockResolvedValueOnce(mockDashboards)

    useDashboardBuilderStore.getState().hydrate()

    await new Promise((resolve) => setTimeout(resolve, 10))

    const dashboards = useDashboardBuilderStore.getState().dashboards
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0].title).toBe('From DB')
  })
})
