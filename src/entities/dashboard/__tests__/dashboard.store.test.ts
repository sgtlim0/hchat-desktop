import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDashboardStore } from '../dashboard.store'

// Mock the db module
vi.mock('@/shared/lib/db', () => ({
  getAllDashboardLayouts: vi.fn(() => Promise.resolve([])),
  putDashboardLayout: vi.fn(() => Promise.resolve()),
  deleteDashboardLayoutFromDb: vi.fn(() => Promise.resolve()),
}))

describe('DashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      layouts: [],
      activeLayoutId: null,
    })
  })

  it('should hydrate and load layouts from db', async () => {
    const { hydrate } = useDashboardStore.getState()

    await hydrate()

    const { layouts, activeLayoutId } = useDashboardStore.getState()
    expect(layouts).toHaveLength(1) // default layout created
    expect(layouts[0].name).toBe('Default')
    expect(layouts[0].widgets).toHaveLength(6) // default 6 widgets
    expect(activeLayoutId).toBe(layouts[0].id)
  })

  it('should add a layout', () => {
    const { addLayout } = useDashboardStore.getState()

    addLayout('My Custom Layout')

    const { layouts } = useDashboardStore.getState()
    expect(layouts).toHaveLength(1)
    expect(layouts[0].name).toBe('My Custom Layout')
    expect(layouts[0].widgets).toHaveLength(0) // new layout starts empty
  })

  it('should delete a layout', () => {
    const { addLayout, deleteLayout } = useDashboardStore.getState()

    addLayout('Layout 1')
    addLayout('Layout 2')

    const layoutId = useDashboardStore.getState().layouts[0].id

    deleteLayout(layoutId)

    const { layouts } = useDashboardStore.getState()
    expect(layouts).toHaveLength(1)
    expect(layouts[0].name).toBe('Layout 1')
  })

  it('should select a layout', () => {
    const { addLayout, selectLayout } = useDashboardStore.getState()

    addLayout('Layout 1')
    const layoutId = useDashboardStore.getState().layouts[0].id

    selectLayout(layoutId)

    const { activeLayoutId } = useDashboardStore.getState()
    expect(activeLayoutId).toBe(layoutId)
  })

  it('should add a widget to layout', () => {
    const { addLayout, addWidget } = useDashboardStore.getState()

    addLayout('My Layout')
    const layoutId = useDashboardStore.getState().layouts[0].id

    addWidget(layoutId, 'recentChats', 'Recent Chats')

    const { layouts } = useDashboardStore.getState()
    expect(layouts[0].widgets).toHaveLength(1)
    expect(layouts[0].widgets[0].type).toBe('recentChats')
    expect(layouts[0].widgets[0].title).toBe('Recent Chats')
  })

  it('should remove a widget from layout', () => {
    const { addLayout, addWidget, removeWidget } = useDashboardStore.getState()

    addLayout('My Layout')
    const layoutId = useDashboardStore.getState().layouts[0].id

    addWidget(layoutId, 'recentChats', 'Recent Chats')
    addWidget(layoutId, 'usageSummary', 'Usage')

    const widgetId = useDashboardStore.getState().layouts[0].widgets[0].id

    removeWidget(layoutId, widgetId)

    const { layouts } = useDashboardStore.getState()
    expect(layouts[0].widgets).toHaveLength(1)
    expect(layouts[0].widgets[0].type).toBe('usageSummary')
  })

  it('should update widget properties', () => {
    const { addLayout, addWidget, updateWidget } = useDashboardStore.getState()

    addLayout('My Layout')
    const layoutId = useDashboardStore.getState().layouts[0].id

    addWidget(layoutId, 'recentChats', 'Recent Chats')
    const widgetId = useDashboardStore.getState().layouts[0].widgets[0].id

    updateWidget(layoutId, widgetId, { title: 'Updated Title', w: 2, h: 3 })

    const { layouts } = useDashboardStore.getState()
    expect(layouts[0].widgets[0].title).toBe('Updated Title')
    expect(layouts[0].widgets[0].w).toBe(2)
    expect(layouts[0].widgets[0].h).toBe(3)
  })

  it('should reorder widgets', () => {
    const { addLayout, addWidget, reorderWidgets } = useDashboardStore.getState()

    addLayout('My Layout')
    const layoutId = useDashboardStore.getState().layouts[0].id

    addWidget(layoutId, 'recentChats', 'Widget A')
    addWidget(layoutId, 'usageSummary', 'Widget B')
    addWidget(layoutId, 'quickAssistants', 'Widget C')

    const widgets = useDashboardStore.getState().layouts[0].widgets
    const [widgetA, widgetB, widgetC] = widgets.map(w => w.id)

    // Reverse order: C, B, A
    reorderWidgets(layoutId, [widgetC, widgetB, widgetA])

    const { layouts } = useDashboardStore.getState()
    expect(layouts[0].widgets[0].title).toBe('Widget C')
    expect(layouts[0].widgets[1].title).toBe('Widget B')
    expect(layouts[0].widgets[2].title).toBe('Widget A')
  })

  it('should update activeLayoutId when deleting non-active layout', () => {
    const { addLayout, selectLayout, deleteLayout } = useDashboardStore.getState()

    addLayout('Layout 1')
    addLayout('Layout 2')

    const layouts = useDashboardStore.getState().layouts
    const layout1Id = layouts[1].id
    const layout2Id = layouts[0].id

    // Select Layout 1 (not the first in array)
    selectLayout(layout1Id)
    expect(useDashboardStore.getState().activeLayoutId).toBe(layout1Id)

    // Delete Layout 2 (not the active one)
    deleteLayout(layout2Id)

    const { activeLayoutId, layouts: updatedLayouts } = useDashboardStore.getState()
    // ActiveLayoutId should remain unchanged since we deleted a non-active layout
    expect(activeLayoutId).toBe(layout1Id)
    expect(updatedLayouts).toHaveLength(1)
    expect(updatedLayouts[0].id).toBe(layout1Id)
  })

  it('should handle deleting layout when multiple layouts exist', () => {
    const { addLayout, selectLayout, deleteLayout } = useDashboardStore.getState()

    addLayout('Layout 1')
    addLayout('Layout 2')
    addLayout('Layout 3')

    const layouts = useDashboardStore.getState().layouts
    const layout2Id = layouts[1].id

    // Select the middle layout
    selectLayout(layout2Id)

    // Delete the selected layout
    deleteLayout(layout2Id)

    const { layouts: updatedLayouts } = useDashboardStore.getState()
    // Should have 2 layouts remaining
    expect(updatedLayouts).toHaveLength(2)
    expect(updatedLayouts.find(l => l.id === layout2Id)).toBeUndefined()
  })
})
