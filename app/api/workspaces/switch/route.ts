import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()

  try {
    const body = await request.json()
    const { userId, workspaceId } = body

    console.log(`[${timestamp}] 🔵 [workspace-switch] Recebido: userId=${userId}, workspaceId=${workspaceId}`)

    if (!userId || !workspaceId) {
      console.log(`[${timestamp}] 🔴 [workspace-switch] Parâmetros faltando`)
      return NextResponse.json(
        { error: 'userId e workspaceId são obrigatórios' },
        { status: 400 }
      )
    }

    // Converter userId para número se necessário (tabela users.id é INTEGER)
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId

    console.log(`[${timestamp}] 🔵 [workspace-switch] userId convertido: ${userIdNum}`)

    // Verificar se o usuário é membro do workspace
    const { data: membership, error: memberError } = await getSupabaseAdmin()
      .from('workspace_members')
      .select('id')
      .eq('user_id', userIdNum)
      .eq('workspace_id', workspaceId)
      .single()

    console.log(`[${timestamp}] 🔵 [workspace-switch] Membership check: data=${JSON.stringify(membership)}, error=${memberError?.message || 'none'}`)

    if (memberError || !membership) {
      console.log(`[${timestamp}] 🔴 [workspace-switch] Usuário não é membro do workspace`)
      return NextResponse.json(
        { error: 'Usuário não é membro deste workspace' },
        { status: 403 }
      )
    }

    // Atualizar current_workspace_id do usuário
    const { data: updateData, error: updateError } = await getSupabaseAdmin()
      .from('users')
      .update({ current_workspace_id: workspaceId })
      .eq('id', userIdNum)
      .select('id, current_workspace_id')

    console.log(`[${timestamp}] 🔵 [workspace-switch] Update result: data=${JSON.stringify(updateData)}, error=${updateError?.message || 'none'}`)

    if (updateError) {
      console.log(`[${timestamp}] 🔴 [workspace-switch] Erro no update: ${updateError.message}`)
      return NextResponse.json(
        { error: 'Erro ao trocar workspace' },
        { status: 500 }
      )
    }

    console.log(`[${timestamp}] 🟢 [workspace-switch] Workspace alterado com sucesso`)

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
