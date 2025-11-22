import { Response } from 'express'

/**
 * Standardized API response helper
 */
export class ApiResponse {
  /**
   * Return a successful response with data
   */
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({ success: true, data })
  }

  /**
   * Return a successful response with a message
   */
  static message(res: Response, message: string, statusCode: number = 200): void {
    res.status(statusCode).json({ success: true, message })
  }

  /**
   * Return an error response
   */
  static error(res: Response, message: string, statusCode: number = 400, code?: string): void {
    res.status(statusCode).json({ success: false, error: message, code })
  }

  /**
   * Return a created response (201)
   */
  static created<T>(res: Response, data: T): void {
    res.status(201).json({ success: true, data })
  }

  /**
   * Return a no content response (204)
   */
  static noContent(res: Response): void {
    res.status(204).send()
  }

  /**
   * Return a paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number
  ): void {
    res.json({
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
