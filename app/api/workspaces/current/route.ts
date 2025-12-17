import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log(`[${timestamp}] 🔵 [workspace-current] Recebido: userId=${userId}`)

    if (!userId) {
      console.log(`[${timestamp}] 🔴 [workspace-current] userId não fornecido`)
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Converter userId para número se necessário (tabela users.id é INTEGER)
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId

    console.log(`[${timestamp}] 🔵 [workspace-current] userId convertido: ${userIdNum}`)

    // Buscar usuário para obter current_workspace_id
    const { data: userData, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('current_workspace_id')
      .eq('id', userIdNum)
      .single()

    console.log(`[${timestamp}] 🔵 [workspace-current] User query: data=${JSON.stringify(userData)}, error=${userError?.message || 'none'}`)

    if (userError || !userData) {
      console.log(`[${timestamp}] 🔴 [workspace-current] Usuário não encontrado`)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const currentWorkspaceId = userData.current_workspace_id
    console.log(`[${timestamp}] 🔵 [workspace-current] current_workspace_id=${currentWorkspaceId}`)

    if (!currentWorkspaceId) {
      // Buscar primeiro workspace do usuário se não tiver um definido
      const { data: memberData } = await getSupabaseAdmin()
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1)
        .single()

      if (!memberData) {
        return NextResponse.json(
          { success: true, data: null, message: 'Usuário não possui workspace' }
        )
      }

      // Atualizar current_workspace_id do usuário
      await getSupabaseAdmin()
        .from('users')
        .update({ current_workspace_id: memberData.workspace_id })
        .eq('id', userId)

      return await getWorkspaceWithPermissions(memberData.workspace_id)
    }

    return await getWorkspaceWithPermissions(currentWorkspaceId)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function getWorkspaceWithPermissions(workspaceId: string) {
  // Buscar workspace com plano
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
    return NextResponse.json(
      { error: 'Workspace não encontrado' },
      { status: 404 }
    )
  }

  const planoData = Array.isArray(workspace.planos)
    ? workspace.planos[0]
    : workspace.planos

  // Combinar permissões do plano com customizações
  const permissions = {
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
      if (key.startsWith('acesso_') && key in permissions) {
        (permissions as any)[key] = custom[key]
      }
    })
  }

  return NextResponse.json({
    success: true,
    data: permissions
  })
}
