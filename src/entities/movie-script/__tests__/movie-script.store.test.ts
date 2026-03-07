import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMovieScriptStore } from '../movie-script.store'
vi.mock('@/shared/lib/db', () => new Proxy({}, { get: () => vi.fn().mockResolvedValue([]) }))
describe('MovieScriptStore', () => {
  beforeEach(() => { useMovieScriptStore.setState({ scripts: [], selectedId: null }) })
  it('should create', () => { useMovieScriptStore.getState().createScript('Inception', 'sci-fi'); expect(useMovieScriptStore.getState().scripts).toHaveLength(1) })
  it('should add character', () => { useMovieScriptStore.getState().createScript('T', 'drama'); const id = useMovieScriptStore.getState().scripts[0].id; useMovieScriptStore.getState().addCharacter(id, { id: 'c1', name: 'Hero', role: 'protagonist', arc: 'growth' }); expect(useMovieScriptStore.getState().scripts[0].characters).toHaveLength(1) })
  it('should add scene', () => { useMovieScriptStore.getState().createScript('T', 'action'); const id = useMovieScriptStore.getState().scripts[0].id; useMovieScriptStore.getState().addScene(id, { id: 's1', act: 1, title: 'Opening', description: 'Intro', dialogue: 'Hello', order: 0 }); expect(useMovieScriptStore.getState().scripts[0].scenes).toHaveLength(1) })
  it('should delete', () => { useMovieScriptStore.getState().createScript('T', 'g'); useMovieScriptStore.getState().deleteScript(useMovieScriptStore.getState().scripts[0].id); expect(useMovieScriptStore.getState().scripts).toHaveLength(0) })
})
