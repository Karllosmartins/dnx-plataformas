import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '@/lib/api-utils'

// Cliente Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Cliente Supabase normal para enviar email
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      throw ApiError.badRequest('Email é obrigatório', 'MISSING_EMAIL')
    }

    // Verificar se usuário existe na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, auth_id, active')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      // Não revelar se o email existe ou não por segurança
      // Retornar sucesso mesmo assim
      return ApiResponse.success({
        message: 'Se o email existir, você receberá um link de recuperação.'
      })
    }

    if (!userData.active) {
      return ApiResponse.success({
        message: 'Se o email existir, você receberá um link de recuperação.'
      })
    }

    // Se usuário não tem auth_id, precisa criar no Supabase Auth primeiro
    if (!userData.auth_id) {
      // Criar usuário no Supabase Auth com senha temporária
      // Ele vai redefinir a senha pelo link
      const tempPassword = crypto.randomUUID()

      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: userData.name
        }
      })

      if (createError) {
        // Se o usuário já existe no auth mas não temos o auth_id
        // Tentar buscar pelo email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (!listError && users) {
          const existingAuthUser = users.find(u => u.email === email)
          if (existingAuthUser) {
            // Atualizar auth_id na tabela users
            await supabase
              .from('users')
              .update({ auth_id: existingAuthUser.id })
              .eq('id', userData.id)
          }
        }
      } else if (newAuthUser?.user) {
        // Atualizar auth_id na tabela users
        await supabase
          .from('users')
          .update({ auth_id: newAuthUser.user.id })
          .eq('id', userData.id)
      }
    }

    // Agora enviar email de recuperação
    const { error: resetError } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback?type=recovery`,
    })

    if (resetError) {
      // Não expor erro específico
      return ApiResponse.success({
        message: 'Se o email existir, você receberá um link de recuperação.'
      })
    }

    return ApiResponse.success({
      message: 'Email de recuperação enviado com sucesso!'
    })

  } catch (error) {
    return handleApiError(error)
  }
}
