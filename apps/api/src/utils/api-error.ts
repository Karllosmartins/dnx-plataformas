import { Response } from 'express'
import { logger } from './logger.js'

/**
 * Custom API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code || 'BAD_REQUEST')
  }

  static unauthorized(message: string = 'Unauthorized', code?: string): ApiError {
    return new ApiError(401, message, code || 'UNAUTHORIZED')
  }

  static forbidden(message: string = 'Forbidden', code?: string): ApiError {
    return new ApiError(403, message, code || 'FORBIDDEN')
  }

  static notFound(message: string = 'Not found', code?: string): ApiError {
    return new ApiError(404, message, code || 'NOT_FOUND')
  }

  static internal(message: string = 'Internal server error', code?: string): ApiError {
    return new ApiError(500, message, code || 'INTERNAL_ERROR')
  }
}

/**
 * Handle API errors and send appropriate response
 */
export function handleApiError(error: unknown, res: Response): void {
  // Handle known ApiError instances
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    })
    return
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    logger.error({ err: error, stack: error.stack }, 'Unexpected error occurred')

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
    return
  }

  // Handle unknown error types
  logger.error({ error }, 'Unknown error type encountered')

  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  })
}
