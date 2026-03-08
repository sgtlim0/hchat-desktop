# API Rate Limiter

## Overview

The API Rate Limiter is a client-side rate limiting solution that prevents hitting provider API limits by implementing a token bucket algorithm. It automatically manages request rates for each AI provider (Bedrock, OpenAI, Gemini).

## Features

- **Token Bucket Algorithm**: Efficient rate limiting with burst support
- **Per-Provider Configurations**: Different limits for each provider
  - Bedrock: 10 requests/minute
  - OpenAI: 20 requests/minute
  - Gemini: 15 requests/minute
- **Singleton Pattern**: One rate limiter instance per provider
- **Automatic Refill**: Tokens refill automatically over time
- **Wait Time Calculation**: Shows exact wait time when rate limited
- **Zero Dependencies**: Pure TypeScript implementation

## Usage

### Basic Usage

```typescript
import { getRateLimiter } from '@/shared/lib/rate-limiter'

// Get rate limiter for a provider
const limiter = getRateLimiter('bedrock')

// Try to acquire a token before making API call
const canProceed = await limiter.acquire()

if (!canProceed) {
  const waitTime = limiter.getWaitTime()
  console.log(`Rate limited! Wait ${Math.ceil(waitTime / 1000)} seconds`)
  return
}

// Make API call...
```

### Integration with Factory

The rate limiter is automatically integrated with the provider factory:

```typescript
// In factory.ts
const rateLimiter = getRateLimiter(config.provider)
const canProceed = await rateLimiter.acquire()

if (!canProceed) {
  const waitTime = rateLimiter.getWaitTime()
  yield {
    type: 'error',
    error: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
  }
  return
}
```

## API Reference

### `RateLimiter` Class

```typescript
class RateLimiter {
  constructor(config: RateLimiterConfig)
  async acquire(): Promise<boolean>  // Try to acquire a token
  getWaitTime(tokensNeeded?: number): number  // Get wait time in ms
  reset(): void  // Reset to full capacity
}
```

### `getRateLimiter(provider: string)`

Returns a singleton rate limiter instance for the specified provider.

## Configuration

Provider limits are configured in `PROVIDER_CONFIGS`:

```typescript
const PROVIDER_CONFIGS = {
  bedrock: {
    capacity: 10,      // Max tokens
    refillRate: 10,    // Tokens per interval
    refillInterval: 60000  // 1 minute
  },
  openai: {
    capacity: 20,
    refillRate: 20,
    refillInterval: 60000
  },
  gemini: {
    capacity: 15,
    refillRate: 15,
    refillInterval: 60000
  }
}
```

## Testing

Comprehensive test coverage with 17+ test cases:

```bash
# Run rate limiter tests
npm test -- rate-limiter.test.ts

# Run integration tests
npm test -- factory.test.ts

# Run all tests
npm test
```

## Benefits

1. **Prevents API Errors**: Avoids 429 (Too Many Requests) errors
2. **Better UX**: Shows clear wait times instead of cryptic errors
3. **Cost Savings**: Prevents accidental API limit breaches
4. **Provider Agnostic**: Works with all AI providers
5. **Zero Runtime Dependencies**: No external libraries needed

## Implementation Details

The rate limiter uses a token bucket algorithm:

1. Each provider gets a bucket with a fixed capacity
2. Each API call consumes one token
3. Tokens refill at a configured rate
4. If no tokens available, request is blocked
5. Wait time is calculated based on refill rate

This approach allows for burst requests while maintaining the overall rate limit.