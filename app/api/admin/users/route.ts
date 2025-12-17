import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { supabase, getSupabaseAdmin } from '../../../../lib/supabase'
import { requireAdmin } from '../../../../lib/auth-utils'

export const dynamic = 'force-dynamic'

// Cliente Supabase Admin para operações de autenticação
const supabaseAuthAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Listar todos os usuários (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminError = await requireAdmin(request)
    if (adminError) return adminError

    // Buscar todos os usuários com informações do workspace
    const { data: usuarios, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        active,
        cpf,
        telefone,
        created_at,
        updated_at,
        current_workspace_id,
        workspaces:current_workspace_id (
          id,
          name,
          slug
        )
      `)
      .order('name')

    if (error) throw error

    // Buscar membros de workspace para cada usuário
    const usuariosComWorkspaces = await Promise.all(
      (usuarios || []).map(async (usuario) => {
        const { data: memberships } = await supabase
          .from('workspace_members')
          .select(`
            workspace_id,
            role,
            workspaces (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', usuario.id)

        return {
          ...usuario,
          workspace_memberships: memberships || []
        }
      })
    )

    return NextResponse.json({ success: true, data: usuariosComWorkspaces })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao listar usuários' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário (admin only)
// Agora usa Supabase Auth para criar usuários e enviar email de convite
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminError = await requireAdmin(request)
    if (adminError) return adminError

    const body = await request.json()
    const {
      name,
      email,
      password, // Agora opcional - se não fornecido, usuário define própria senha
      role = 'user',
      workspace_id,
      workspace_role = 'member',
      cpf,
      telefone,
      active = true,
      skip_workspace = false,
      use_supabase_auth = true, // Novo: usar Supabase Auth por padrão
      send_invite = true // Novo: enviar email de convite
    } = body

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Workspace só é obrigatório se não for skip_workspace
    if (!workspace_id && !skip_workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    let newUser: any = null
    let authUserId: string | null = null

    // NOVO: Usar Supabase Auth para criar usuário
    if (use_supabase_auth) {
      try {
        // Criar usuário no Supabase Auth
        // Se send_invite = true e não tem password, envia email de convite
        // Se password fornecido, cria usuário com essa senha

        if (send_invite && !password) {
          // Enviar convite por email - usuário define própria senha
          const { data: inviteData, error: inviteError } = await supabaseAuthAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
              name,
              role
            },
            redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback?type=invite`
          })

          if (inviteError) {
            throw new Error(`Erro ao enviar convite: ${inviteError.message}`)
          }

          authUserId = inviteData.user?.id || null

          // Aguardar um pouco para o trigger sincronizar
          await new Promise(resolve => setTimeout(resolve, 500))

          // Buscar usuário criado pelo trigger
          const { data: syncedUser } = await getSupabaseAdmin()
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (syncedUser) {
            newUser = syncedUser
          }
        } else if (password) {
          // Criar usuário com senha definida (sem enviar convite)
          const { data: createData, error: createError } = await supabaseAuthAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Confirma email automaticamente
            user_metadata: {
              name,
              role
            }
          })

          if (createError) {
            throw new Error(`Erro ao criar usuário: ${createError.message}`)
          }

          authUserId = createData.user?.id || null

          // Aguardar trigger sincronizar
          await new Promise(resolve => setTimeout(resolve, 500))

          // Buscar usuário criado pelo trigger
          const { data: syncedUser } = await getSupabaseAdmin()
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (syncedUser) {
            newUser = syncedUser
          }
        }
      } catch (authError: any) {
        // Fallback para método legado se Supabase Auth falhar
        newUser = null
      }
    }

    // FALLBACK: Método legado com bcrypt (se Supabase Auth não foi usado ou falhou)
    if (!newUser) {
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Senha é obrigatória quando não usa Supabase Auth' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const { data: legacyUser, error: userError } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password: hashedPassword,
          role,
          active,
          cpf: cpf || null,
          telefone: telefone || null,
          current_workspace_id: workspace_id || null,
          auth_id: authUserId
        })
        .select()
        .single()

      if (userError) throw userError
      newUser = legacyUser
    }

    // Atualizar campos extras que o trigger não preenche
    if (newUser && (cpf || telefone || workspace_id || role !== 'user')) {
      const { error: updateError } = await getSupabaseAdmin()
        .from('users')
        .update({
          cpf: cpf || null,
          telefone: telefone || null,
          role,
          active,
          current_workspace_id: workspace_id || null
        })
        .eq('id', newUser.id)

      if (updateError) {
        // Erro ao atualizar campos extras - continuar mesmo assim
      }

      // Atualizar objeto local
      newUser = { ...newUser, cpf, telefone, role, active, current_workspace_id: workspace_id }
    }

    // Adicionar usuário ao workspace (se workspace_id foi fornecido)
    if (workspace_id && newUser) {
      // Verificar se já é membro
      const { data: existingMember } = await getSupabaseAdmin()
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('user_id', newUser.id)
        .single()

      if (!existingMember) {
        const { error: memberError } = await getSupabaseAdmin()
          .from('workspace_members')
          .insert({
            workspace_id,
            user_id: newUser.id,
            role: workspace_role
          })

        if (memberError) {
          // Erro ao adicionar membro - não falhar toda a operação
        }
      }
    }

    // Retornar usuário sem a senha
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        workspace_id: workspace_id || null,
        workspace_role: workspace_id ? workspace_role : null,
        invite_sent: use_supabase_auth && send_invite && !password
      },
      message: use_supabase_auth && send_invite && !password
        ? 'Usuário criado! Um email de convite foi enviado para definir a senha.'
        : 'Usuário criado com sucesso!'
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
