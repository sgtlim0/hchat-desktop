/**
 * Token bucket rate limiter for API calls.
 * Manages rate limiting per provider to prevent hitting API limits.
 */

export interface RateLimiterConfig {
  /** Maximum number of tokens in the bucket */
  capacity: number
  /** Number of tokens to refill per interval */
  refillRate: number
  /** Refill interval in milliseconds */
  refillInterval: number
}

export class RateLimiter {
  private tokens: number
  private capacity: number
  private refillRate: number
  private refillInterval: number
  private lastRefill: number

  constructor(config: RateLimiterConfig) {
    this.capacity = config.capacity
    this.tokens = config.capacity
    this.refillRate = config.refillRate
    this.refillInterval = config.refillInterval
    this.lastRefill = Date.now()
  }

  /**
   * Try to acquire a token for making an API call.
   * Returns true if successful, false if rate limited.
   */
  async acquire(): Promise<boolean> {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Get the wait time in milliseconds until the specified number of tokens are available.
   * @param tokensNeeded - Number of tokens needed (default: 1)
   */
  getWaitTime(tokensNeeded: number = 1): number {
    this.refill()

    if (this.tokens >= tokensNeeded) {
      return 0
    }

    const tokensShort = tokensNeeded - this.tokens
    const intervalsNeeded = Math.ceil(tokensShort / this.refillRate)
    const timeSinceLastRefill = Date.now() - this.lastRefill
    const timeUntilNextRefill = Math.max(0, this.refillInterval - timeSinceLastRefill)

    return timeUntilNextRefill + (intervalsNeeded - 1) * this.refillInterval
  }

  /**
   * Reset the rate limiter to full capacity.
   */
  reset(): void {
    this.tokens = this.capacity
    this.lastRefill = Date.now()
  }

  /**
   * Refill tokens based on elapsed time.
   */
  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const intervalsElapsed = Math.floor(timePassed / this.refillInterval)

    if (intervalsElapsed > 0) {
      const tokensToAdd = intervalsElapsed * this.refillRate
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefill = now - (timePassed % this.refillInterval)
    }
  }
}

/**
 * Provider-specific rate limiting configurations.
 * Limits are per minute.
 */
const PROVIDER_CONFIGS: Record<string, RateLimiterConfig> = {
  bedrock: {
    capacity: 10,
    refillRate: 10,
    refillInterval: 60000, // 1 minute
  },
  openai: {
    capacity: 20,
    refillRate: 20,
    refillInterval: 60000, // 1 minute
  },
  gemini: {
    capacity: 15,
    refillRate: 15,
    refillInterval: 60000, // 1 minute
  },
}

// Singleton instances per provider
const rateLimiters = new Map<string, RateLimiter>()

/**
 * Get or create a rate limiter for the specified provider.
 * Returns a singleton instance per provider.
 */
export function getRateLimiter(provider: string): RateLimiter {
  if (!rateLimiters.has(provider)) {
    const config = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.bedrock
    rateLimiters.set(provider, new RateLimiter(config))
  }

  return rateLimiters.get(provider)!
}

// Add clearAll method for testing
getRateLimiter.clearAll = () => {
  rateLimiters.clear()
}