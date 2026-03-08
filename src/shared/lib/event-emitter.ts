type Listener<T = unknown> = (data: T) => void

export class EventEmitter {
  private listeners = new Map<string, Set<Listener>>()

  on<T = unknown>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener as Listener)
    return () => this.off(event, listener)
  }

  off<T = unknown>(event: string, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener)
  }

  emit<T = unknown>(event: string, data?: T): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of set) {
      listener(data)
    }
  }

  once<T = unknown>(event: string, listener: Listener<T>): () => void {
    const wrapper: Listener<T> = (data) => {
      this.off(event, wrapper)
      listener(data)
    }
    return this.on(event, wrapper)
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0
  }
}

export const appEvents = new EventEmitter()
