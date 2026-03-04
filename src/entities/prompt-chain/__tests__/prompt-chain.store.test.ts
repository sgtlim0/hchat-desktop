import { describe, it, expect, beforeEach } from 'vitest'
import { usePromptChainStore } from '../prompt-chain.store'

describe('PromptChainStore', () => {
  beforeEach(() => {
    const store = usePromptChainStore.getState()
    store.chains.forEach((chain) => store.deleteChain(chain.id))
    store.selectChain(null)
  })

  it('should create a new chain', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('Test Chain', 'Test description')

    const state = usePromptChainStore.getState()
    expect(chainId).toBeDefined()
    expect(state.chains.length).toBe(1)
    expect(state.chains[0].name).toBe('Test Chain')
    expect(state.chains[0].description).toBe('Test description')
    expect(state.chains[0].status).toBe('idle')
    expect(state.chains[0].steps).toEqual([])
    expect(state.currentChainId).toBe(chainId)
  })

  it('should update a chain', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('Original', 'Original desc')

    store.updateChain(chainId, { name: 'Updated', description: 'Updated desc' })

    const chain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    expect(chain?.name).toBe('Updated')
    expect(chain?.description).toBe('Updated desc')
  })

  it('should delete a chain', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('To Delete', 'Will be deleted')

    store.deleteChain(chainId)

    expect(store.chains.length).toBe(0)
    expect(store.currentChainId).toBeNull()
  })

  it('should add a step to a chain', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('Chain with Steps', 'Test chain')

    store.addStep(chainId, {
      type: 'prompt',
      label: 'Step 1',
      promptContent: 'Generate a topic',
    })

    const chain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    expect(chain?.steps.length).toBe(1)
    expect(chain?.steps[0].label).toBe('Step 1')
    expect(chain?.steps[0].type).toBe('prompt')
    expect(chain?.steps[0].promptContent).toBe('Generate a topic')
  })

  it('should remove a step from a chain', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('Chain', 'Test')

    store.addStep(chainId, { type: 'prompt', label: 'Step 1' })
    store.addStep(chainId, { type: 'prompt', label: 'Step 2' })

    const chain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    const stepId = chain?.steps[0].id!

    store.removeStep(chainId, stepId)

    const updatedChain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    expect(updatedChain?.steps.length).toBe(1)
    expect(updatedChain?.steps[0].label).toBe('Step 2')
  })

  it('should update a step', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('Chain', 'Test')

    store.addStep(chainId, { type: 'prompt', label: 'Original Label' })

    const chain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    const stepId = chain?.steps[0].id!

    store.updateStep(chainId, stepId, { label: 'Updated Label' })

    const updatedChain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    expect(updatedChain?.steps[0].label).toBe('Updated Label')
  })

  it('should select a chain', () => {
    const store = usePromptChainStore.getState()
    const chain1Id = store.createChain('Chain 1', 'First')
    const chain2Id = store.createChain('Chain 2', 'Second')

    store.selectChain(chain2Id)
    expect(usePromptChainStore.getState().currentChainId).toBe(chain2Id)

    store.selectChain(chain1Id)
    expect(usePromptChainStore.getState().currentChainId).toBe(chain1Id)

    store.selectChain(null)
    expect(usePromptChainStore.getState().currentChainId).toBeNull()
  })

  it('should set step result', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('Chain', 'Test')

    store.addStep(chainId, { type: 'prompt', label: 'Step 1' })

    const chain = store.chains.find((c) => c.id === chainId)
    const stepId = chain?.steps[0].id!

    store.setStepResult(chainId, stepId, 'Test result')

    const updatedChain = usePromptChainStore.getState().chains.find((c) => c.id === chainId)
    expect(updatedChain?.results[stepId]).toBe('Test result')
  })

  it('should stop a running chain', () => {
    const store = usePromptChainStore.getState()
    const chainId = store.createChain('Chain', 'Test')

    store.addStep(chainId, { type: 'prompt', label: 'Step 1' })

    // Simulate running state
    store.updateChain(chainId, { status: 'running' })
    usePromptChainStore.setState({ isRunning: true })

    store.stopChain()

    const finalState = usePromptChainStore.getState()
    expect(finalState.isRunning).toBe(false)
    const chain = finalState.chains.find((c) => c.id === chainId)
    expect(chain?.status).toBe('paused')
  })
})
