import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

// GET - Listar todos os usuários (admin only)
export async function GET(request: NextRequest) {
  try {
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

    return ApiResponse.success(usuariosComWorkspaces)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      role = 'user',
      workspace_id,
      workspace_role = 'member',
      cpf,
      telefone,
      active = true,
      skip_workspace = false // Permitir criar usuário sem workspace (para donos de novos workspaces)
    } = body

    if (!name || !email || !password) {
      throw ApiError.badRequest('Nome, email e senha são obrigatórios', 'MISSING_FIELDS')
    }

    // Workspace só é obrigatório se não for skip_workspace
    if (!workspace_id && !skip_workspace) {
      throw ApiError.badRequest('Workspace é obrigatório', 'MISSING_WORKSPACE')
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw ApiError.badRequest('Email já cadastrado', 'EMAIL_EXISTS')
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        active,
        cpf: cpf || null,
        telefone: telefone || null,
        current_workspace_id: workspace_id || null
      })
      .select()
      .single()

    if (userError) throw userError

    // Adicionar usuário ao workspace (se workspace_id foi fornecido)
    if (workspace_id) {
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id,
          user_id: newUser.id,
          role: workspace_role
        })

      if (memberError) {
        // Se falhar ao adicionar membro, excluir usuário criado
        await supabase.from('users').delete().eq('id', newUser.id)
        throw memberError
      }
    }

    // Retornar usuário sem a senha
    const { password: _, ...userWithoutPassword } = newUser

    return ApiResponse.created({
      ...userWithoutPassword,
      workspace_id: workspace_id || null,
      workspace_role: workspace_id ? workspace_role : null
    })
  } catch (error) {
    return handleApiError(error)
  }
}
