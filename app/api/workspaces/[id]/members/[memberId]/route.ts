import { NextRequest } from 'next/server'
import { supabase } from '../../../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

// PATCH - Atualizar role do membro
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: workspaceId, memberId } = await params
    const body = await request.json()
    const { role } = body

    if (!role) {
      throw ApiError.badRequest('Role é obrigatório', 'MISSING_ROLE')
    }

    // Verificar se membro existe
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .single()

    if (memberError || !member) {
      throw ApiError.notFound('Membro não encontrado', 'MEMBER_NOT_FOUND')
    }

    // Não permitir alterar role de owner
    if (member.role === 'owner') {
      throw ApiError.badRequest('Não é possível alterar o role do proprietário', 'CANNOT_CHANGE_OWNER')
    }

    // Atualizar role
    const { data: updatedMember, error: updateError } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('id', memberId)
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

    if (updateError) throw updateError

    // Formatar resposta
    const memberFormatted = {
      id: updatedMember.id,
      user_id: updatedMember.user_id,
      name: (updatedMember as any).users?.name || '',
      email: (updatedMember as any).users?.email || '',
      role: updatedMember.role,
      created_at: updatedMember.joined_at
    }

    return ApiResponse.success(memberFormatted)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Remover membro do workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: workspaceId, memberId } = await params

    // Verificar se membro existe
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .single()

    if (memberError || !member) {
      throw ApiError.notFound('Membro não encontrado', 'MEMBER_NOT_FOUND')
    }

    // Não permitir remover owner
    if (member.role === 'owner') {
      throw ApiError.badRequest('Não é possível remover o proprietário do workspace', 'CANNOT_REMOVE_OWNER')
    }

    // Remover membro
    const { error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) throw deleteError

    return ApiResponse.success({ message: 'Membro removido com sucesso' })
  } catch (error) {
    return handleApiError(error)
  }
}
