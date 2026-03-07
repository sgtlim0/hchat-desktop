import { create } from 'zustand'
import type { CustomDashboard, BuilderWidgetType, BuilderWidget } from '@/shared/types'
import { getAllCustomDashboards, putCustomDashboard, deleteCustomDashboardFromDb } from '@/shared/lib/db'

interface DashboardBuilderState {
  dashboards: CustomDashboard[]
  selectedDashboardId: string | null

  hydrate: () => void
  createDashboard: (title: string) => void
  deleteDashboard: (id: string) => void
  addWidget: (dashId: string, type: BuilderWidgetType, title: string, x: number, y: number) => void
  updateWidget: (dashId: string, widgetId: string, updates: Partial<Pick<BuilderWidget, 'title' | 'x' | 'y' | 'width' | 'height' | 'config'>>) => void
  removeWidget: (dashId: string, widgetId: string) => void
  togglePublic: (id: string) => void
  selectDashboard: (id: string | null) => void
}

export const useDashboardBuilderStore = create<DashboardBuilderState>((set) => ({
  dashboards: [],
  selectedDashboardId: null,

  hydrate: () => {
    getAllCustomDashboards()
      .then((dashboards) => set({ dashboards }))
      .catch(console.error)
  },

  createDashboard: (title) => {
    const now = new Date().toISOString()
    const dashboard: CustomDashboard = {
      id: crypto.randomUUID(),
      title,
      widgets: [],
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => ({ dashboards: [dashboard, ...state.dashboards] }))
    putCustomDashboard(dashboard).catch(console.error)
  },

  deleteDashboard: (id) => {
    set((state) => ({
      dashboards: state.dashboards.filter((d) => d.id !== id),
      selectedDashboardId: state.selectedDashboardId === id ? null : state.selectedDashboardId,
    }))
    deleteCustomDashboardFromDb(id).catch(console.error)
  },

  addWidget: (dashId, type, title, x, y) => {
    const widget: BuilderWidget = {
      id: crypto.randomUUID(),
      type,
      title,
      x,
      y,
      width: 4,
      height: 3,
      config: {},
    }

    set((state) => ({
      dashboards: state.dashboards.map((d) => {
        if (d.id !== dashId) return d
        const updated = {
          ...d,
          widgets: [...d.widgets, widget],
          updatedAt: new Date().toISOString(),
        }
        putCustomDashboard(updated).catch(console.error)
        return updated
      }),
    }))
  },

  updateWidget: (dashId, widgetId, updates) => {
    set((state) => ({
      dashboards: state.dashboards.map((d) => {
        if (d.id !== dashId) return d
        const updated = {
          ...d,
          widgets: d.widgets.map((w) =>
            w.id === widgetId ? { ...w, ...updates } : w
          ),
          updatedAt: new Date().toISOString(),
        }
        putCustomDashboard(updated).catch(console.error)
        return updated
      }),
    }))
  },

  removeWidget: (dashId, widgetId) => {
    set((state) => ({
      dashboards: state.dashboards.map((d) => {
        if (d.id !== dashId) return d
        const updated = {
          ...d,
          widgets: d.widgets.filter((w) => w.id !== widgetId),
          updatedAt: new Date().toISOString(),
        }
        putCustomDashboard(updated).catch(console.error)
        return updated
      }),
    }))
  },

  togglePublic: (id) => {
    set((state) => ({
      dashboards: state.dashboards.map((d) => {
        if (d.id !== id) return d
        const updated = {
          ...d,
          isPublic: !d.isPublic,
          updatedAt: new Date().toISOString(),
        }
        putCustomDashboard(updated).catch(console.error)
        return updated
      }),
    }))
  },

  selectDashboard: (id) => {
    set({ selectedDashboardId: id })
  },
}))
