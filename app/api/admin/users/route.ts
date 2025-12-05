import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../../lib/supabase'
import { requireAdmin } from '../../../../lib/auth-utils'

export const dynamic = 'force-dynamic'

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
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar usuários' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminError = await requireAdmin(request)
    if (adminError) return adminError

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
      skip_workspace = false
    } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Nome, email e senha são obrigatórios' },
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

    return NextResponse.json({
      success: true,
      data: {
        ...userWithoutPassword,
        workspace_id: workspace_id || null,
        workspace_role: workspace_id ? workspace_role : null
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
