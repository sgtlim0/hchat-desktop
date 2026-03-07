import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWhiteboardStore } from '../whiteboard.store'
vi.mock('@/shared/lib/db', () => ({ getAllWhiteboards: vi.fn().mockResolvedValue([]), putWhiteboard: vi.fn().mockResolvedValue(undefined), deleteWhiteboardFromDb: vi.fn().mockResolvedValue(undefined) }))
describe('WhiteboardStore', () => {
  beforeEach(() => { useWhiteboardStore.setState({ boards: [], selectedBoardId: null }) })
  it('should create board', async () => { await useWhiteboardStore.getState().createBoard('T', 'blank'); expect(useWhiteboardStore.getState().boards).toHaveLength(1) })
  it('should add element', async () => { await useWhiteboardStore.getState().createBoard('T', 'blank'); const id = useWhiteboardStore.getState().boards[0].id; await useWhiteboardStore.getState().addElement(id, { id: 'e1', tool: 'pen', x: 0, y: 0, width: 10, height: 10, content: '', color: '#000', layer: 0 }); expect(useWhiteboardStore.getState().boards[0].elements).toHaveLength(1) })
  it('should remove element', async () => { await useWhiteboardStore.getState().createBoard('T', 'blank'); const id = useWhiteboardStore.getState().boards[0].id; await useWhiteboardStore.getState().addElement(id, { id: 'e1', tool: 'text', x: 0, y: 0, width: 10, height: 10, content: '', color: '#000', layer: 0 }); await useWhiteboardStore.getState().removeElement(id, 'e1'); expect(useWhiteboardStore.getState().boards[0].elements).toHaveLength(0) })
  it('should delete board', async () => { await useWhiteboardStore.getState().createBoard('T', 'blank'); await useWhiteboardStore.getState().deleteBoard(useWhiteboardStore.getState().boards[0].id); expect(useWhiteboardStore.getState().boards).toHaveLength(0) })
})
