/**
 * Demo script to show rate limiter in action.
 * Run with: npx tsx src/shared/lib/__tests__/rate-limiter.demo.ts
 */

import { getRateLimiter } from '../rate-limiter'

async function demoRateLimiter() {
  console.log('=== API Rate Limiter Demo ===\n')

  // Demo 1: Bedrock rate limiting (10 requests/minute)
  console.log('📊 Bedrock Provider (10 requests/minute):')
  const bedrockLimiter = getRateLimiter('bedrock')

  for (let i = 1; i <= 12; i++) {
    const canProceed = await bedrockLimiter.acquire()
    if (canProceed) {
      console.log(`  ✅ Request ${i}: Allowed`)
    } else {
      const waitTime = bedrockLimiter.getWaitTime()
      console.log(`  ❌ Request ${i}: Rate limited! Wait ${Math.ceil(waitTime / 1000)}s`)
    }
  }

  console.log('\n📊 OpenAI Provider (20 requests/minute):')
  const openaiLimiter = getRateLimiter('openai')

  for (let i = 1; i <= 22; i++) {
    const canProceed = await openaiLimiter.acquire()
    if (canProceed) {
      console.log(`  ✅ Request ${i}: Allowed`)
    } else {
      const waitTime = openaiLimiter.getWaitTime()
      console.log(`  ❌ Request ${i}: Rate limited! Wait ${Math.ceil(waitTime / 1000)}s`)
    }
  }

  console.log('\n📊 Gemini Provider (15 requests/minute):')
  const geminiLimiter = getRateLimiter('gemini')

  for (let i = 1; i <= 17; i++) {
    const canProceed = await geminiLimiter.acquire()
    if (canProceed) {
      console.log(`  ✅ Request ${i}: Allowed`)
    } else {
      const waitTime = geminiLimiter.getWaitTime()
      console.log(`  ❌ Request ${i}: Rate limited! Wait ${Math.ceil(waitTime / 1000)}s`)
    }
  }

  console.log('\n=== Demo Complete ===')
  console.log('Rate limiters are singleton instances per provider.')
  console.log('They automatically refill tokens over time.')
  console.log('Perfect for preventing API rate limit errors! 🚀')
}

// Run the demo
if (require.main === module) {
  demoRateLimiter()
}