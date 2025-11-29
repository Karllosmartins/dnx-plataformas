import { NextRequest } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../../../lib/api-utils'

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
        role,
        joined_at,
        users (
          id,
          name,
          email,
          role,
          active,
          cpf,
          telefone
        )
      `)
      .eq('workspace_id', id)
      .order('joined_at')

    if (error) throw error

    return ApiResponse.success(membros || [])
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Adicionar membro ao workspace
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_id, role = 'member' } = body

    if (!user_id) {
      throw ApiError.badRequest('user_id é obrigatório', 'MISSING_USER_ID')
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

    // Verificar se usuário existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      throw ApiError.notFound('Usuário não encontrado', 'USER_NOT_FOUND')
    }

    // Verificar se já é membro
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', id)
      .eq('user_id', user_id)
      .single()

    if (existingMember) {
      throw ApiError.badRequest('Usuário já é membro deste workspace', 'ALREADY_MEMBER')
    }

    // Adicionar membro
    const { data: newMember, error: addError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id,
        role
      })
      .select(`
        id,
        role,
        joined_at,
        users (
          id,
          name,
          email
        )
      `)
      .single()

    if (addError) throw addError

    return ApiResponse.created(newMember)
  } catch (error) {
    return handleApiError(error)
  }
}
