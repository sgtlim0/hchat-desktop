import { create } from 'zustand'
import type { DashboardLayout, DashboardWidget, DashboardWidgetType } from '@/shared/types'
import { getAllDashboardLayouts, putDashboardLayout, deleteDashboardLayoutFromDb } from '@/shared/lib/db'

interface DashboardState {
  layouts: DashboardLayout[]
  activeLayoutId: string | null

  hydrate: () => void
  addLayout: (name: string) => void
  deleteLayout: (id: string) => void
  selectLayout: (id: string) => void
  addWidget: (layoutId: string, type: DashboardWidgetType, title: string) => void
  removeWidget: (layoutId: string, widgetId: string) => void
  updateWidget: (layoutId: string, widgetId: string, updates: Partial<DashboardWidget>) => void
  reorderWidgets: (layoutId: string, widgetIds: string[]) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  layouts: [],
  activeLayoutId: null,

  hydrate: () => {
    getAllDashboardLayouts()
      .then((layouts) => {
        if (layouts.length === 0) {
          const defaultLayout: DashboardLayout = {
            id: crypto.randomUUID(),
            name: 'Default',
            widgets: [
              {
                id: crypto.randomUUID(),
                type: 'recentChats',
                title: 'Recent Chats',
                x: 0,
                y: 0,
                w: 2,
                h: 2,
                visible: true,
              },
              {
                id: crypto.randomUUID(),
                type: 'usageSummary',
                title: 'Usage Summary',
                x: 2,
                y: 0,
                w: 1,
                h: 1,
                visible: true,
              },
              {
                id: crypto.randomUUID(),
                type: 'quickAssistants',
                title: 'Quick Assistants',
                x: 0,
                y: 2,
                w: 1,
                h: 1,
                visible: true,
              },
              {
                id: crypto.randomUUID(),
                type: 'knowledgeSummary',
                title: 'Knowledge Base',
                x: 1,
                y: 2,
                w: 1,
                h: 1,
                visible: true,
              },
              {
                id: crypto.randomUUID(),
                type: 'schedule',
                title: 'Scheduled Tasks',
                x: 2,
                y: 1,
                w: 1,
                h: 2,
                visible: true,
              },
              {
                id: crypto.randomUUID(),
                type: 'favorites',
                title: 'Favorites',
                x: 0,
                y: 3,
                w: 2,
                h: 1,
                visible: true,
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          putDashboardLayout(defaultLayout).catch(console.error)
          set({ layouts: [defaultLayout], activeLayoutId: defaultLayout.id })
        } else {
          set({ layouts, activeLayoutId: layouts[0].id })
        }
      })
      .catch(console.error)
  },

  addLayout: (name) => {
    const layout: DashboardLayout = {
      id: crypto.randomUUID(),
      name,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      layouts: [layout, ...state.layouts],
    }))

    putDashboardLayout(layout).catch(console.error)
  },

  deleteLayout: (id) => {
    set((state) => ({
      layouts: state.layouts.filter((l) => l.id !== id),
      activeLayoutId: state.activeLayoutId === id ? state.layouts[0]?.id || null : state.activeLayoutId,
    }))

    deleteDashboardLayoutFromDb(id).catch(console.error)
  },

  selectLayout: (id) => {
    set({ activeLayoutId: id })
  },

  addWidget: (layoutId, type, title) => {
    set((state) => ({
      layouts: state.layouts.map((layout) => {
        if (layout.id !== layoutId) return layout

        const widget: DashboardWidget = {
          id: crypto.randomUUID(),
          type,
          title,
          x: 0,
          y: 0,
          w: 1,
          h: 1,
          visible: true,
        }

        const updatedLayout = {
          ...layout,
          widgets: [...layout.widgets, widget],
          updatedAt: new Date().toISOString(),
        }

        putDashboardLayout(updatedLayout).catch(console.error)
        return updatedLayout
      }),
    }))
  },

  removeWidget: (layoutId, widgetId) => {
    set((state) => ({
      layouts: state.layouts.map((layout) => {
        if (layout.id !== layoutId) return layout

        const updatedLayout = {
          ...layout,
          widgets: layout.widgets.filter((w) => w.id !== widgetId),
          updatedAt: new Date().toISOString(),
        }

        putDashboardLayout(updatedLayout).catch(console.error)
        return updatedLayout
      }),
    }))
  },

  updateWidget: (layoutId, widgetId, updates) => {
    set((state) => ({
      layouts: state.layouts.map((layout) => {
        if (layout.id !== layoutId) return layout

        const updatedLayout = {
          ...layout,
          widgets: layout.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)),
          updatedAt: new Date().toISOString(),
        }

        putDashboardLayout(updatedLayout).catch(console.error)
        return updatedLayout
      }),
    }))
  },

  reorderWidgets: (layoutId, widgetIds) => {
    set((state) => ({
      layouts: state.layouts.map((layout) => {
        if (layout.id !== layoutId) return layout

        const widgetMap = new Map(layout.widgets.map((w) => [w.id, w]))
        const reordered = widgetIds.map((id) => widgetMap.get(id)!).filter(Boolean)

        const updatedLayout = {
          ...layout,
          widgets: reordered,
          updatedAt: new Date().toISOString(),
        }

        putDashboardLayout(updatedLayout).catch(console.error)
        return updatedLayout
      }),
    }))
  },
}))
