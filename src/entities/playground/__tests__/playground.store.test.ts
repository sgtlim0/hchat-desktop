import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlaygroundStore } from '../playground.store'
vi.mock('@/shared/lib/db', () => ({ getAllCodePlaygrounds: vi.fn().mockResolvedValue([]), putCodePlayground: vi.fn(), deleteCodePlaygroundFromDb: vi.fn() }))
describe('PlaygroundStore', () => {
  beforeEach(() => { usePlaygroundStore.setState({ playgrounds: [], selectedId: null }) })
  it('should create playground with 3 tabs', () => { usePlaygroundStore.getState().createPlayground('Demo'); expect(usePlaygroundStore.getState().playgrounds[0].tabs).toHaveLength(3) })
  it('should update tab code', () => { usePlaygroundStore.getState().createPlayground('T'); const id = usePlaygroundStore.getState().playgrounds[0].id; usePlaygroundStore.getState().updateTab(id, 'html', '<p>Hi</p>'); expect(usePlaygroundStore.getState().playgrounds[0].tabs[0].code).toBe('<p>Hi</p>') })
  it('should generate preview', () => { usePlaygroundStore.getState().createPlayground('T'); const id = usePlaygroundStore.getState().playgrounds[0].id; usePlaygroundStore.getState().generatePreview(id); expect(usePlaygroundStore.getState().playgrounds[0].previewHtml).toContain('<html>') })
  it('should delete', () => { usePlaygroundStore.getState().createPlayground('T'); usePlaygroundStore.getState().deletePlayground(usePlaygroundStore.getState().playgrounds[0].id); expect(usePlaygroundStore.getState().playgrounds).toHaveLength(0) })
})
