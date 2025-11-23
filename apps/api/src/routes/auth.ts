import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { supabase } from '../lib/supabase.js'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils/index.js'
import { generateToken, generateRefreshToken, verifyToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw ApiError.badRequest('Email e senha sao obrigatorios', 'MISSING_CREDENTIALS')
    }

    // Buscar usuario no banco
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .single()

    if (userError || !userData) {
      throw ApiError.unauthorized('Usuario nao encontrado ou inativo', 'USER_NOT_FOUND')
    }

    // Verificar senha com bcrypt
    const passwordValid = await bcrypt.compare(password, userData.password)

    if (!passwordValid) {
      throw ApiError.unauthorized('Senha incorreta', 'INVALID_PASSWORD')
    }

    // Gerar tokens JWT
    const tokenPayload = {
      userId: userData.id.toString(),
      email: userData.email,
      role: userData.role
    }

    const [accessToken, refreshToken] = await Promise.all([
      generateToken(tokenPayload),
      generateRefreshToken(tokenPayload)
    ])

    // Retornar dados do usuario (sem a senha)
    const user = {
      id: userData.id.toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      created_at: userData.created_at,
      active: userData.active
    }

    logger.info({ userId: user.id, email: user.email }, 'User logged in successfully')

    ApiResponse.success(res, {
      user,
      token: accessToken,
      refreshToken
    })

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      throw ApiError.badRequest('Email, senha e nome sao obrigatorios', 'MISSING_FIELDS')
    }

    // Verificar se usuario ja existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw ApiError.badRequest('Email ja esta em uso', 'EMAIL_EXISTS')
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuario
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        name,
        role: 'user',
        active: true
      })
      .select()
      .single()

    if (createError || !newUser) {
      logger.error({ error: createError }, 'Failed to create user')
      throw ApiError.internal('Erro ao criar usuario', 'CREATE_USER_ERROR')
    }

    // Gerar tokens
    const tokenPayload = {
      userId: newUser.id.toString(),
      email: newUser.email,
      role: newUser.role
    }

    const [accessToken, refreshToken] = await Promise.all([
      generateToken(tokenPayload),
      generateRefreshToken(tokenPayload)
    ])

    const user = {
      id: newUser.id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      created_at: newUser.created_at,
      active: newUser.active
    }

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully')

    ApiResponse.created(res, {
      user,
      accessToken,
      refreshToken
    })

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token e obrigatorio', 'MISSING_TOKEN')
    }

    // Verificar refresh token
    const payload = await verifyToken(refreshToken)

    // Gerar novo access token
    const newAccessToken = await generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    })

    ApiResponse.success(res, { accessToken: newAccessToken })

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/auth/me - Retorna dados do usuario autenticado
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, active')
      .eq('id', parseInt(userId || '0'))
      .single()

    if (error || !userData) {
      throw ApiError.notFound('Usuario nao encontrado', 'USER_NOT_FOUND')
    }

    ApiResponse.success(res, { user: userData })

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // Com JWT stateless, o logout é feito no cliente removendo o token
  // Aqui podemos apenas registrar o logout
  logger.info({ userId: req.user?.userId }, 'User logged out')
  ApiResponse.message(res, 'Logout realizado com sucesso')
})

export default router
