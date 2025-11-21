import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { supabase } from '../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

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

    // Retornar dados do usuario (sem a senha)
    const user = {
      id: userData.id.toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      created_at: userData.created_at,
      active: userData.active
    }

    return ApiResponse.success({ user })

  } catch (error) {
    return handleApiError(error)
  }
}
