import { Request, Response, NextFunction } from 'express'
import { jwtVerify, SignJWT } from 'jose'
import { ApiError } from '../utils'
import { logger } from '../utils/logger'

const JWT_SECRET = process.env.JWT_SECRET || 'dnx-secret-key-change-in-production'
const JWT_ISSUER = 'dnx-plataformas'
const JWT_AUDIENCE = 'dnx-api'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  [key: string]: unknown // Index signature for jose compatibility
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

/**
 * Generate a new JWT token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('24h')
    .sign(secret)

  return token
}

/**
 * Generate a refresh token with longer expiration
 */
export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(JWT_SECRET)

  const { payload } = await jwtVerify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  })

  return {
    userId: payload.userId as string,
    email: payload.email as string,
    role: payload.role as string
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token not provided')
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    req.user = payload
    next()
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      })
      return
    }

    logger.error({ err: error }, 'Auth middleware error')
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    })
  }
}

/**
 * Admin only middleware
 */
export async function adminMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'FORBIDDEN'
    })
    return
  }
  next()
}
