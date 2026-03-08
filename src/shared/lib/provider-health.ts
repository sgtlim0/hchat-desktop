/**
 * Provider Health Check Utility
 *
 * Provides health checking and caching for AI provider endpoints
 * with configurable timeout and TTL settings.
 */

export interface HealthStatus {
  provider: string
  healthy: boolean
  latencyMs: number
  lastChecked: string  // ISO string
  error?: string
}

// Cache configuration
const CACHE_TTL_MS = 60 * 1000  // 60 seconds
const DEFAULT_TIMEOUT_MS = 5000  // 5 seconds

// In-memory cache for health statuses
const healthCache = new Map<string, HealthStatus>()

// Get the API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

/**
 * Check the health of a specific provider
 * @param provider - Provider name ('bedrock', 'openai', 'gemini')
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Health status with latency measurement
 */
export async function checkHealth(
  provider: string,
  timeout: number = DEFAULT_TIMEOUT_MS
): Promise<HealthStatus> {
  const startTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    // Use the general health endpoint for all providers
    // In a real implementation, you might want provider-specific endpoints
    const healthUrl = `${API_BASE_URL}/api/health`

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const latencyMs = Date.now() - startTime
    const healthy = response.ok

    const status: HealthStatus = {
      provider,
      healthy,
      latencyMs,
      lastChecked: new Date().toISOString(),
      error: healthy ? undefined : `HTTP ${response.status}`
    }

    // Cache the result
    healthCache.set(provider, status)

    return status
  } catch (error) {
    const latencyMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check if it's a timeout error
    const isTimeout = controller.signal.aborted || errorMessage.includes('abort')

    const status: HealthStatus = {
      provider,
      healthy: false,
      latencyMs,
      lastChecked: new Date().toISOString(),
      error: isTimeout ? `Health check timeout after ${timeout}ms` : errorMessage
    }

    // Cache the result even if unhealthy
    healthCache.set(provider, status)

    return status
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Check the health of all providers
 * @returns Map of provider names to their health statuses
 */
export async function checkAllProviders(): Promise<Record<string, HealthStatus>> {
  const providers = ['bedrock', 'openai', 'gemini']

  // Check all providers in parallel
  const results = await Promise.all(
    providers.map(provider => checkHealth(provider))
  )

  // Convert array to record
  const statusMap: Record<string, HealthStatus> = {}
  for (const status of results) {
    statusMap[status.provider] = status
  }

  return statusMap
}

/**
 * Get cached provider status if available and not expired
 * @param provider - Provider name
 * @returns Cached health status or null if not available/expired
 */
export function getProviderStatus(provider: string): HealthStatus | null {
  const cached = healthCache.get(provider)

  if (!cached) {
    return null
  }

  // Check if cache is expired
  const cacheAge = Date.now() - new Date(cached.lastChecked).getTime()
  if (cacheAge > CACHE_TTL_MS) {
    // Remove expired entry
    healthCache.delete(provider)
    return null
  }

  return cached
}

/**
 * Check if a provider is currently healthy (based on cache)
 * @param provider - Provider name
 * @returns true if provider is healthy, false if unhealthy or unknown
 */
export function isProviderHealthy(provider: string): boolean {
  const status = getProviderStatus(provider)
  // Default to false for unknown providers (pessimistic approach)
  return status?.healthy ?? false
}

/**
 * Clear all cached health statuses
 */
export function clearHealthCache(): void {
  healthCache.clear()
}