import pino from 'pino'

/**
 * Centralized logger configuration using pino
 *
 * Usage:
 *   import logger from '@/lib/logger'
 *
 *   logger.info('User logged in', { userId: 123 })
 *   logger.error('Failed to process request', { error, requestId })
 *   logger.warn('Rate limit approaching', { userId, remaining: 5 })
 *   logger.debug('Processing data', { data })
 */

const isServer = typeof window === 'undefined'
const isDev = process.env.NODE_ENV !== 'production'

// Create logger with appropriate configuration
const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

  // Base fields included in all logs
  base: {
    env: process.env.NODE_ENV || 'development',
    app: 'dnx-plataformas'
  },

  // Redact sensitive fields
  redact: {
    paths: ['password', 'apiKey', 'token', 'authorization', 'secret'],
    censor: '[REDACTED]'
  },

  // Use pino-pretty for development (server-side only)
  ...(isDev && isServer ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  } : {})
})

// Create child loggers for different modules
export const apiLogger = logger.child({ module: 'api' })
export const authLogger = logger.child({ module: 'auth' })
export const dbLogger = logger.child({ module: 'database' })
export const webhookLogger = logger.child({ module: 'webhook' })

// Export default logger
export default logger

/**
 * Log levels:
 * - fatal: Application crash imminent
 * - error: Error occurred, may require attention
 * - warn: Warning, something unexpected
 * - info: Normal operations, notable events
 * - debug: Debugging information
 * - trace: Very detailed debugging
 */
