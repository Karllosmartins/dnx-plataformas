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

    // Buscar dados completos do novo workspace para retornar ao cliente
    // Isso evita race condition de replicação no banco
    const { data: workspace, error: workspaceError } = await getSupabaseAdmin()
      .from('workspaces')
      .select(`
        id,
        name,
        slug,
        plano_id,
        plano_customizado,
        planos (
          id,
          nome,
          acesso_dashboard,
          acesso_crm,
          acesso_whatsapp,
          acesso_disparo_simples,
          acesso_disparo_ia,
          acesso_agentes_ia,
          acesso_extracao_leads,
          acesso_enriquecimento,
          acesso_usuarios,
          acesso_consulta,
          acesso_integracoes,
          acesso_arquivos
        )
      `)
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      console.log(`[${timestamp}] 🔴 [workspace-switch] Erro ao buscar workspace: ${workspaceError?.message}`)
      return NextResponse.json({
        success: true,
        message: 'Workspace alterado com sucesso',
        data: null
      })
    }

    const planoData = Array.isArray(workspace.planos)
      ? workspace.planos[0]
      : workspace.planos

    const workspaceData = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plano_id: workspace.plano_id,
      plano_nome: planoData?.nome || 'Sem plano',
      acesso_dashboard: planoData?.acesso_dashboard || false,
      acesso_crm: planoData?.acesso_crm || false,
      acesso_whatsapp: planoData?.acesso_whatsapp || false,
      acesso_disparo_simples: planoData?.acesso_disparo_simples || false,
      acesso_disparo_ia: planoData?.acesso_disparo_ia || false,
      acesso_agentes_ia: planoData?.acesso_agentes_ia || false,
      acesso_extracao_leads: planoData?.acesso_extracao_leads || false,
      acesso_enriquecimento: planoData?.acesso_enriquecimento || false,
      acesso_usuarios: planoData?.acesso_usuarios || false,
      acesso_consulta: planoData?.acesso_consulta || false,
      acesso_integracoes: planoData?.acesso_integracoes || false,
      acesso_arquivos: planoData?.acesso_arquivos || false,
      plano_customizado: workspace.plano_customizado
    }

    // Aplicar customizações se existirem
    if (workspace.plano_customizado && typeof workspace.plano_customizado === 'object') {
      const custom = workspace.plano_customizado as Record<string, boolean>
      Object.keys(custom).forEach(key => {
        if (key.startsWith('acesso_') && key in workspaceData) {
          (workspaceData as any)[key] = custom[key]
        }
      })
    }

    console.log(`[${timestamp}] 🟢 [workspace-switch] Retornando dados do novo workspace`)

    return NextResponse.json({
      success: true,
      message: 'Workspace alterado com sucesso',
      data: workspaceData
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
