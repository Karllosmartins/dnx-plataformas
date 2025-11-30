import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workspaceId } = body

    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: 'userId e workspaceId são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o usuário é membro do workspace
    const { data: membership, error: memberError } = await getSupabaseAdmin()
      .from('workspace_members')
      .select('id')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single()

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Usuário não é membro deste workspace' },
        { status: 403 }
      )
    }

    // Atualizar current_workspace_id do usuário
    const { error: updateError } = await getSupabaseAdmin()
      .from('users')
      .update({ current_workspace_id: workspaceId })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao trocar workspace' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Workspace alterado com sucesso'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
