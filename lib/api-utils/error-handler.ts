import { NextResponse } from 'next/server'

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
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    )
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Log unexpected errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unexpected error:', error.message, error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }

  // Handle unknown error types
  console.error('Unknown error type:', error)

  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    },
    { status: 500 }
  )
}

/**
 * Async handler wrapper that catches errors automatically
 */
export async function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    return handleApiError(error)
  }
}
