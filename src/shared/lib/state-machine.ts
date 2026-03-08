interface StateConfig<S extends string, E extends string> {
  on?: Partial<Record<E, S>>
  onEnter?: () => void
  onExit?: () => void
}

export interface MachineConfig<S extends string, E extends string> {
  initial: S
  states: Record<S, StateConfig<S, E>>
}

export interface HistoryEntry<S extends string, E extends string> {
  from: S
  to: S
  event: E
  timestamp: string
}

// Alias for internal use
type TransitionRecord<S extends string, E extends string> = HistoryEntry<S, E>

type TransitionListener<S extends string, E extends string> = (state: S, event: E) => void

export class StateMachine<S extends string, E extends string> {
  private current: S
  private readonly config: MachineConfig<S, E>
  private readonly initial: S
  private readonly history: TransitionRecord<S, E>[] = []
  private readonly listeners = new Set<TransitionListener<S, E>>()

  constructor(config: MachineConfig<S, E>) {
    this.config = config
    this.initial = config.initial
    this.current = config.initial
    config.states[config.initial]?.onEnter?.()
  }

  getState(): S {
    return this.current
  }

  send(event: E): S {
    const stateConfig = this.config.states[this.current]
    const nextState = stateConfig?.on?.[event]
    if (!nextState) return this.current

    const from = this.current
    stateConfig.onExit?.()
    this.current = nextState
    this.config.states[nextState]?.onEnter?.()
    this.history.push({ from, to: nextState, event, timestamp: new Date().toISOString() })
    for (const listener of this.listeners) listener(nextState, event)
    return this.current
  }

  canTransition(event: E): boolean {
    return !!this.config.states[this.current]?.on?.[event]
  }

  getAvailableTransitions(): E[] {
    const on = this.config.states[this.current]?.on
    if (!on) return []
    // Filter out any undefined transitions
    return (Object.keys(on) as E[]).filter(event => on[event] !== undefined)
  }

  reset(): void {
    // Call onExit for current state
    const currentStateConfig = this.config.states[this.current]
    if (currentStateConfig?.onExit) {
      currentStateConfig.onExit()
    }

    // Reset to initial state
    this.current = this.initial

    // Call onEnter for initial state
    const initialStateConfig = this.config.states[this.current]
    if (initialStateConfig?.onEnter) {
      initialStateConfig.onEnter()
    }

    // Clear history
    this.history.length = 0
  }

  subscribe(cb: TransitionListener<S, E>): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  getHistory(): HistoryEntry<S, E>[] {
    return [...this.history]
  }
}

export function createMachine<S extends string, E extends string>(
  config: MachineConfig<S, E>,
): StateMachine<S, E> {
  return new StateMachine(config)
}
