/**
 * Demo file to test error reporter functionality
 * Run in browser console:
 *
 * import { errorReporter } from '@/shared/lib/error-reporter'
 *
 * // Test basic error reporting
 * errorReporter.report(new Error('Test error'))
 *
 * // Test with different severities
 * errorReporter.report(new TypeError('Type error'), 'high')
 * errorReporter.report(new Error('Low priority'), 'low')
 *
 * // Test with context
 * errorReporter.report(new Error('Context error'), 'medium', {
 *   userId: 'user123',
 *   action: 'saveDocument',
 *   timestamp: Date.now()
 * })
 *
 * // Check reports
 * console.log('Report count:', errorReporter.getReportCount())
 * console.log('All reports:', errorReporter.getReports())
 *
 * // Export for analysis
 * console.log('Export:', errorReporter.exportReports())
 *
 * // Clear reports
 * errorReporter.clearReports()
 * console.log('After clear:', errorReporter.getReportCount())
 */

import { errorReporter } from './error-reporter'

// Demo function for testing
export function demoErrorReporter() {
  console.log('🚀 Error Reporter Demo')

  // Report different types of errors
  errorReporter.report(new Error('General error'))
  errorReporter.report(new TypeError('Type mismatch'))
  errorReporter.report(new ReferenceError('Variable not defined'))

  // Report with custom severity and context
  errorReporter.report(
    new Error('Critical system failure'),
    'critical',
    {
      component: 'PaymentProcessor',
      userId: 'usr_123',
      timestamp: new Date().toISOString(),
    }
  )

  // Display summary
  console.log(`📊 Total reports: ${errorReporter.getReportCount()}`)
  console.log('📋 Reports:', errorReporter.getReports())

  // Export for download
  const exportData = errorReporter.exportReports()
  console.log('💾 Export data (first 200 chars):', exportData.substring(0, 200) + '...')

  return {
    count: errorReporter.getReportCount(),
    reports: errorReporter.getReports(),
  }
}

// Auto-run if in development
if (import.meta.env.DEV) {
  // Uncomment to test in development
  // demoErrorReporter()
}