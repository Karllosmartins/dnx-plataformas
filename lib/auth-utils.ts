import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

interface TokenPayload {
  userId: string
  role: string
  email?: string
  name?: string
}

/**
 * Verifica o token JWT do cookie e retorna o payload
 */
export async function verifyAuthToken(request: NextRequest): Promise<TokenPayload | null> {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const jwtSecret = process.env.JWT_SECRET

    // JWT_SECRET é obrigatório em produção
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      console.error('❌ JWT_SECRET não está configurada em produção')
      return null
    }

    const secret = new TextEncoder().encode(jwtSecret || 'dev-secret-only-for-development')
    const { payload } = await jwtVerify(token, secret)

    return {
      userId: payload.userId as string,
      role: payload.role as string,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined
    }
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return null
  }
}

/**
 * Verifica se o usuário é admin
 * Retorna NextResponse com erro se não for admin, ou null se for admin
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const payload = await verifyAuthToken(request)

  if (!payload) {
    return NextResponse.json(
      { error: 'Não autorizado. Faça login novamente.' },
      { status: 401 }
    )
  }

  if (payload.role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
      { status: 403 }
    )
  }

  return null // Usuário é admin, pode continuar
}

/**
 * Verifica se o usuário está autenticado
 * Retorna NextResponse com erro se não estiver, ou o payload se estiver
 */
export async function requireAuth(request: NextRequest): Promise<{ payload: TokenPayload } | { error: NextResponse }> {
  const payload = await verifyAuthToken(request)

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      )
    }
  }

  return { payload }
}
