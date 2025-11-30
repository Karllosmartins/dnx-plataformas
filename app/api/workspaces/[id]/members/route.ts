import { NextRequest } from 'next/server'
import { supabase } from '../../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../../lib/api-utils'
import bcrypt from 'bcrypt'

export const dynamic = 'force-dynamic'

// GET - Listar membros do workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: membros, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        users:user_id (
          id,
          name,
          email,
          role,
          active
        )
      `)
      .eq('workspace_id', id)
      .order('joined_at')

    if (error) throw error

    // Transformar para o formato esperado pelo MembersDialog
    const membersFormatted = (membros || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      name: m.users?.name || '',
      email: m.users?.email || '',
      role: m.role,
      created_at: m.joined_at
    }))

    return ApiResponse.success(membersFormatted)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Adicionar membro ao workspace (com opção de criar usuário)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { email, role = 'member', name, password } = body

    if (!email) {
      throw ApiError.badRequest('Email é obrigatório', 'MISSING_EMAIL')
    }

    // Verificar se workspace existe
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', id)
      .single()

    if (wsError || !workspace) {
      throw ApiError.notFound('Workspace não encontrado', 'WORKSPACE_NOT_FOUND')
    }

    // Verificar se usuário já existe
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    // Se usuário não existe e temos name e password, criar novo usuário
    if (!user && name && password) {
      const hashedPassword = await bcrypt.hash(password, 10)

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password: hashedPassword,
          role: 'user',
          active: true
        })
        .select('id')
        .single()

      if (createError) {
        throw ApiError.badRequest('Erro ao criar usuário: ' + createError.message, 'CREATE_USER_ERROR')
      }

      user = newUser
    } else if (!user) {
      throw ApiError.notFound('Usuário não encontrado. Forneça nome e senha para criar novo usuário.', 'USER_NOT_FOUND')
    }

    // Verificar se já é membro
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      throw ApiError.badRequest('Usuário já é membro deste workspace', 'ALREADY_MEMBER')
    }

    // Adicionar membro
    const { data: newMember, error: addError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id: user.id,
        role
      })
      .select(`
        id,
        user_id,
        role,
        joined_at,
        users:user_id (
          id,
          name,
          email
        )
      `)
      .single()

    if (addError) throw addError

    // Formatar resposta
    const memberFormatted = {
      id: newMember.id,
      user_id: newMember.user_id,
      name: (newMember as any).users?.name || '',
      email: (newMember as any).users?.email || '',
      role: newMember.role,
      created_at: newMember.joined_at
    }

    return ApiResponse.created(memberFormatted)
  } catch (error) {
    return handleApiError(error)
  }
}
