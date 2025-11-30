import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../lib/api-utils'

const SALT_ROUNDS = 10

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password) {
      throw ApiError.badRequest('Nome, email e senha sao obrigatorios', 'MISSING_FIELDS')
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Criar usuario
    const { data, error } = await getSupabaseAdmin()
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        active: true
      }])
      .select('id, name, email, role, created_at, active')
      .single()

    if (error) {
      if (error.code === '23505') {
        throw ApiError.badRequest('Email ja cadastrado', 'EMAIL_EXISTS')
      }
      throw ApiError.internal(error.message, 'DB_ERROR')
    }

    return ApiResponse.created(data)

  } catch (error) {
    return handleApiError(error)
  }
}
