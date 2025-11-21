import { NextResponse } from 'next/server'

/**
 * Standardized API response helper
 */
export class ApiResponse {
  /**
   * Return a successful response with data
   */
  static success<T>(data: T, statusCode: number = 200): NextResponse {
    return NextResponse.json(
      { success: true, data },
      { status: statusCode }
    )
  }

  /**
   * Return a successful response with a message
   */
  static message(message: string, statusCode: number = 200): NextResponse {
    return NextResponse.json(
      { success: true, message },
      { status: statusCode }
    )
  }

  /**
   * Return an error response
   */
  static error(message: string, statusCode: number = 400, code?: string): NextResponse {
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    )
  }

  /**
   * Return a created response (201)
   */
  static created<T>(data: T): NextResponse {
    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    )
  }

  /**
   * Return a no content response (204)
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }

  /**
   * Return a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  }
}
