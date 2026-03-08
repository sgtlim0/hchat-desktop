import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMachine } from '../state-machine'

describe('StateMachine', () => {
  // Test states and events for a simple traffic light
  type States = 'red' | 'yellow' | 'green'
  type Events = 'TIMER' | 'EMERGENCY' | 'RESET'

  const config = {
    initial: 'red' as States,
    states: {
      red: {
        on: { TIMER: 'green' as States },
        onEnter: vi.fn(),
        onExit: vi.fn()
      },
      yellow: {
        on: { TIMER: 'red' as States },
        onEnter: vi.fn(),
        onExit: vi.fn()
      },
      green: {
        on: { TIMER: 'yellow' as States, EMERGENCY: 'red' as States },
        onEnter: vi.fn(),
        onExit: vi.fn()
      }
    }
  }

  beforeEach(() => {
    // Reset all mocks before each test
    Object.values(config.states).forEach(state => {
      if (state.onEnter) (state.onEnter as any).mockClear()
      if (state.onExit) (state.onExit as any).mockClear()
    })
  })

  it('creates machine with initial state', () => {
    const machine = createMachine(config)
    expect(machine.getState()).toBe('red')
  })

  it('transitions to valid state', () => {
    const machine = createMachine(config)
    const newState = machine.send('TIMER')
    expect(newState).toBe('green')
    expect(machine.getState()).toBe('green')
  })

  it('rejects invalid transition', () => {
    const machine = createMachine(config)
    // Red state doesn't have EMERGENCY event
    const state = machine.send('EMERGENCY')
    expect(state).toBe('red') // Should stay in red
    expect(machine.getState()).toBe('red')
  })

  it('fires onEnter/onExit callbacks', () => {
    const machine = createMachine(config)

    // Initial state should have called onEnter for red
    expect(config.states.red.onEnter).toHaveBeenCalledTimes(1)

    // Transition from red to green
    machine.send('TIMER')

    expect(config.states.red.onExit).toHaveBeenCalledTimes(1)
    expect(config.states.green.onEnter).toHaveBeenCalledTimes(1)
  })

  it('getState returns current state', () => {
    const machine = createMachine(config)
    expect(machine.getState()).toBe('red')

    machine.send('TIMER')
    expect(machine.getState()).toBe('green')

    machine.send('TIMER')
    expect(machine.getState()).toBe('yellow')
  })

  it('canTransition checks validity', () => {
    const machine = createMachine(config)

    // From red state
    expect(machine.canTransition('TIMER')).toBe(true)
    expect(machine.canTransition('EMERGENCY')).toBe(false)
    expect(machine.canTransition('RESET')).toBe(false)

    // Move to green state
    machine.send('TIMER')
    expect(machine.canTransition('TIMER')).toBe(true)
    expect(machine.canTransition('EMERGENCY')).toBe(true)
    expect(machine.canTransition('RESET')).toBe(false)
  })

  it('getAvailableTransitions lists valid events', () => {
    const machine = createMachine(config)

    // From red state
    expect(machine.getAvailableTransitions()).toEqual(['TIMER'])

    // Move to green state
    machine.send('TIMER')
    expect(machine.getAvailableTransitions()).toEqual(['TIMER', 'EMERGENCY'])

    // Move to yellow state
    machine.send('TIMER')
    expect(machine.getAvailableTransitions()).toEqual(['TIMER'])
  })

  it('reset returns to initial state', () => {
    const machine = createMachine(config)

    // Move through states
    machine.send('TIMER') // red -> green
    machine.send('TIMER') // green -> yellow
    expect(machine.getState()).toBe('yellow')

    // Reset to initial
    machine.reset()
    expect(machine.getState()).toBe('red')
  })

  it('subscribe notifies on transition', () => {
    const machine = createMachine(config)
    const callback = vi.fn()

    machine.subscribe(callback)

    machine.send('TIMER')
    expect(callback).toHaveBeenCalledWith('green', 'TIMER')

    machine.send('EMERGENCY')
    expect(callback).toHaveBeenCalledWith('red', 'EMERGENCY')

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('unsubscribe stops notifications', () => {
    const machine = createMachine(config)
    const callback = vi.fn()

    const unsubscribe = machine.subscribe(callback)

    machine.send('TIMER')
    expect(callback).toHaveBeenCalledTimes(1)

    unsubscribe()

    machine.send('TIMER')
    expect(callback).toHaveBeenCalledTimes(1) // Should not be called again
  })

  it('history tracks transitions', () => {
    const machine = createMachine(config)

    // Make some transitions
    machine.send('TIMER') // red -> green
    machine.send('EMERGENCY') // green -> red
    machine.send('TIMER') // red -> green
    machine.send('TIMER') // green -> yellow

    const history = machine.getHistory()

    expect(history).toHaveLength(4)
    expect(history[0]).toMatchObject({
      from: 'red',
      to: 'green',
      event: 'TIMER'
    })
    expect(history[1]).toMatchObject({
      from: 'green',
      to: 'red',
      event: 'EMERGENCY'
    })
    expect(history[2]).toMatchObject({
      from: 'red',
      to: 'green',
      event: 'TIMER'
    })
    expect(history[3]).toMatchObject({
      from: 'green',
      to: 'yellow',
      event: 'TIMER'
    })

    // Check timestamps exist and are ISO strings
    history.forEach(entry => {
      expect(entry.timestamp).toBeDefined()
      expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp)
    })
  })

  it('getHistory returns ordered list', () => {
    const machine = createMachine(config)

    // Make transitions with small delays to ensure different timestamps
    machine.send('TIMER') // red -> green
    machine.send('TIMER') // green -> yellow
    machine.send('TIMER') // yellow -> red

    const history = machine.getHistory()

    // History should be in chronological order
    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i - 1].timestamp).getTime()
      const curr = new Date(history[i].timestamp).getTime()
      expect(curr).toBeGreaterThanOrEqual(prev)
    }
  })

  it('handles states with no transitions', () => {
    const terminalConfig = {
      initial: 'idle' as 'idle' | 'done',
      states: {
        idle: {
          on: { FINISH: 'done' as 'done' }
        },
        done: {
          // Terminal state with no transitions
        }
      }
    }

    const machine = createMachine(terminalConfig)

    machine.send('FINISH')
    expect(machine.getState()).toBe('done')

    // Should stay in done state
    machine.send('FINISH')
    expect(machine.getState()).toBe('done')

    expect(machine.canTransition('FINISH')).toBe(false)
    expect(machine.getAvailableTransitions()).toEqual([])
  })

  it('supports multiple subscribers', () => {
    const machine = createMachine(config)
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    machine.subscribe(callback1)
    machine.subscribe(callback2)

    machine.send('TIMER')

    expect(callback1).toHaveBeenCalledWith('green', 'TIMER')
    expect(callback2).toHaveBeenCalledWith('green', 'TIMER')
  })

  it('reset clears history', () => {
    const machine = createMachine(config)

    // Make some transitions
    machine.send('TIMER') // red -> green
    machine.send('TIMER') // green -> yellow

    expect(machine.getHistory()).toHaveLength(2)

    // Reset should clear history
    machine.reset()
    expect(machine.getHistory()).toHaveLength(0)
    expect(machine.getState()).toBe('red')
  })
})