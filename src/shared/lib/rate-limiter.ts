interface RateLimiterConfig {
  maxTokens: number
  refillRate: number
  refillIntervalMs: number
}

const PROVIDER_LIMITS: Record<string, RateLimiterConfig> = {
  bedrock: { maxTokens: 10, refillRate: 1, refillIntervalMs: 6000 },
  openai: { maxTokens: 20, refillRate: 2, refillIntervalMs: 6000 },
  gemini: { maxTokens: 15, refillRate: 1.5, refillIntervalMs: 6000 },
}

export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly config: RateLimiterConfig

  constructor(config: RateLimiterConfig) {
    this.config = config
    this.tokens = config.maxTokens
    this.lastRefill = Date.now()
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const intervals = Math.floor(elapsed / this.config.refillIntervalMs)
    if (intervals > 0) {
      this.tokens = Math.min(
        this.config.maxTokens,
        this.tokens + intervals * this.config.refillRate,
      )
      this.lastRefill = now
    }
  }

  acquire(): boolean {
    this.refill()
    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }
    return false
  }

  getWaitTimeMs(): number {
    this.refill()
    if (this.tokens >= 1) return 0
    const needed = 1 - this.tokens
    const intervalsNeeded = Math.ceil(needed / this.config.refillRate)
    const elapsed = Date.now() - this.lastRefill
    const remaining = this.config.refillIntervalMs - elapsed
    return remaining + (intervalsNeeded - 1) * this.config.refillIntervalMs
  }

  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }

  reset(): void {
    this.tokens = this.config.maxTokens
    this.lastRefill = Date.now()
  }
}

const instances = new Map<string, RateLimiter>()

export function getRateLimiter(provider: string): RateLimiter {
  const existing = instances.get(provider)
  if (existing) return existing

  const config = PROVIDER_LIMITS[provider] ?? PROVIDER_LIMITS.bedrock
  const limiter = new RateLimiter(config)
  instances.set(provider, limiter)
  return limiter
}

export function resetAllLimiters(): void {
  for (const limiter of instances.values()) {
    limiter.reset()
  }
}
