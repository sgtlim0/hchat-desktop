export interface FeatureFlag {
  id: string
  enabled: boolean
  percentage?: number
  description?: string
}

type FlagChangeListener = (flagId: string, enabled: boolean) => void

class FeatureFlagManager {
  private flags = new Map<string, FeatureFlag>()
  private listeners = new Set<FlagChangeListener>()

  isEnabled(flagId: string): boolean {
    const flag = this.flags.get(flagId)
    if (!flag) return false
    if (flag.percentage !== undefined) {
      // Deterministic hash for consistent rollout per flag ID
      let hash = 0
      for (let i = 0; i < flagId.length; i++) {
        hash = ((hash << 5) - hash + flagId.charCodeAt(i)) | 0
      }
      const bucket = Math.abs(hash) % 100
      return flag.enabled && bucket < flag.percentage
    }
    return flag.enabled
  }

  setFlag(flagId: string, enabled: boolean, options?: { percentage?: number; description?: string }): void {
    const percentage = options?.percentage !== undefined
      ? Math.max(0, Math.min(100, options.percentage))
      : undefined
    this.flags.set(flagId, { id: flagId, enabled, description: options?.description, percentage })
    this.notify(flagId, enabled)
  }

  toggleFlag(flagId: string): void {
    const flag = this.flags.get(flagId)
    const newEnabled = !(flag?.enabled ?? false)
    this.setFlag(flagId, newEnabled, flag ? { percentage: flag.percentage, description: flag.description } : undefined)
  }

  setFlags(flags: Record<string, boolean>): void {
    for (const [id, enabled] of Object.entries(flags)) {
      this.setFlag(id, enabled)
    }
  }

  getFlags(): readonly FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  getEnabledFlags(): readonly FeatureFlag[] {
    return this.getFlags().filter((f) => f.enabled)
  }

  clearFlags(): void {
    this.flags.clear()
  }

  exportFlags(): string {
    return JSON.stringify(Array.from(this.flags.values()), null, 2)
  }

  importFlags(json: string): void {
    const arr: FeatureFlag[] = JSON.parse(json)
    for (const flag of arr) {
      this.flags.set(flag.id, flag)
    }
  }

  onFlagChange(callback: FlagChangeListener): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notify(flagId: string, enabled: boolean): void {
    for (const listener of this.listeners) listener(flagId, enabled)
  }
}

export const featureFlags = new FeatureFlagManager()
