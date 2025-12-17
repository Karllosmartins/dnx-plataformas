import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { supabase, getSupabaseAdmin } from '../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../lib/api-utils'

// Cliente Supabase para autenticação
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      throw ApiError.badRequest('Email e senha sao obrigatorios', 'MISSING_CREDENTIALS')
    }

    // Buscar usuario no banco primeiro para verificar se existe e está ativo
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .single()

    if (userError || !userData) {
      throw ApiError.unauthorized('Usuario nao encontrado ou inativo', 'USER_NOT_FOUND')
    }

    let loginSuccess = false
    let authSession = null

    // PRIMEIRO: Tentar login via Supabase Auth (para usuários migrados)
    if (userData.auth_id) {
      try {
        const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
          email,
          password
        })

        if (!authError && authData?.session) {
          loginSuccess = true
          authSession = authData.session
        }
      } catch (authError) {
        console.log('Supabase Auth falhou, tentando bcrypt...')
      }
    }

    // FALLBACK: Login com bcrypt (método legado)
    if (!loginSuccess && userData.password) {
      const passwordValid = await bcrypt.compare(password, userData.password)

      if (passwordValid) {
        loginSuccess = true

        // Se usuário não tem auth_id, tentar criar no Supabase Auth para migração futura
        if (!userData.auth_id) {
          try {
            const supabaseAdmin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              { auth: { autoRefreshToken: false, persistSession: false } }
            )

            // Criar usuário no auth.users
            const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                name: userData.name,
                role: userData.role
              }
            })

            if (!createError && newAuthUser?.user) {
              // Atualizar auth_id no public.users
              await getSupabaseAdmin()
                .from('users')
                .update({ auth_id: newAuthUser.user.id })
                .eq('id', userData.id)

              console.log(`Usuário ${email} migrado para Supabase Auth`)
            }
          } catch (migrationError) {
            // Não falhar o login se a migração falhar
            console.error('Erro ao migrar usuário para Supabase Auth:', migrationError)
          }
        }
      }
    }

    if (!loginSuccess) {
      throw ApiError.unauthorized('Senha incorreta', 'INVALID_PASSWORD')
    }

    // Retornar dados do usuario (sem a senha)
    const user = {
      id: userData.id.toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      created_at: userData.created_at,
      active: userData.active,
      auth_id: userData.auth_id
    }

    // Se tiver sessão do Supabase Auth, incluir tokens
    const response: any = { user }
    if (authSession) {
      response.access_token = authSession.access_token
      response.refresh_token = authSession.refresh_token
    }

    return ApiResponse.success(response)

  } catch (error) {
    return handleApiError(error)
  }
}
