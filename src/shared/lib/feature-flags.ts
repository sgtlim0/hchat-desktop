/**
 * Feature flag configuration
 */
export interface FeatureFlag {
  id: string
  enabled: boolean
  percentage?: number
  description?: string
}

type FlagChangeListener = (flagId: string, enabled: boolean) => void

/**
 * Feature Flag Manager
 *
 * Provides runtime feature flag management with percentage-based rollout support.
 * Features are deterministically rolled out based on flag ID hash.
 */
class FeatureFlagManager {
  private flags = new Map<string, FeatureFlag>()
  private listeners = new Set<FlagChangeListener>()

  isEnabled(flagId: string): boolean {
    const flag = this.flags.get(flagId)
    if (!flag) return false

    // If disabled at flag level, always return false
    if (!flag.enabled) return false

    // If no percentage rollout, return the enabled state
    if (flag.percentage === undefined) return true

    // Handle percentage rollout with deterministic hash
    if (flag.percentage <= 0) return false
    if (flag.percentage >= 100) return true

    // Deterministic hash for consistent rollout per flag ID
    let hash = 0
    for (let i = 0; i < flagId.length; i++) {
      hash = ((hash << 5) - hash + flagId.charCodeAt(i)) | 0
    }
    const bucket = Math.abs(hash) % 100
    return bucket < flag.percentage
  }

  setFlag(flagId: string, enabled: boolean, options?: { percentage?: number; description?: string }): void {
    const percentage = options?.percentage !== undefined
      ? Math.max(0, Math.min(100, options.percentage))
      : undefined
    this.flags.set(flagId, { id: flagId, enabled, description: options?.description, percentage })
    this.notify(flagId, this.isEnabled(flagId))
  }

  /**
   * Toggle a feature flag
   * Creates flag as enabled if it doesn't exist
   */
  toggleFlag(flagId: string): void {
    const flag = this.flags.get(flagId)
    const newEnabled = !(flag?.enabled ?? false)
    this.setFlag(flagId, newEnabled, flag ? { percentage: flag.percentage, description: flag.description } : undefined)
  }

  /**
   * Bulk set multiple flags
   */
  setFlags(flags: Record<string, boolean>): void {
    for (const [id, enabled] of Object.entries(flags)) {
      this.setFlag(id, enabled)
    }
  }

  /**
   * Get all flags
   */
  getFlags(): readonly FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * Get only enabled flags (considers percentage rollout)
   */
  getEnabledFlags(): readonly FeatureFlag[] {
    return this.getFlags().filter((f) => this.isEnabled(f.id))
  }

  /**
   * Clear all flags
   */
  clearFlags(): void {
    this.flags.clear()
  }

  /**
   * Export flags to JSON string
   */
  exportFlags(): string {
    return JSON.stringify(Array.from(this.flags.values()), null, 2)
  }

  /**
   * Import flags from JSON string
   * Clears existing flags before importing
   */
  importFlags(json: string): void {
    const arr: FeatureFlag[] = JSON.parse(json)
    this.clearFlags()
    for (const flag of arr) {
      this.setFlag(flag.id, flag.enabled, {
        percentage: flag.percentage,
        description: flag.description
      })
    }
  }

  /**
   * Subscribe to flag changes
   * Returns unsubscribe function
   */
  onFlagChange(callback: FlagChangeListener): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notify(flagId: string, enabled: boolean): void {
    for (const listener of this.listeners) listener(flagId, enabled)
  }
}

export const featureFlags = new FeatureFlagManager()
