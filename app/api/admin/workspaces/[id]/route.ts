import { NextRequest } from 'next/server'
import { supabase } from '../../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

// GET - Buscar workspace por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        planos (
          id,
          nome,
          descricao,
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
          acesso_arquivos,
          limite_leads,
          limite_consultas,
          limite_instancias
        )
      `)
      .eq('id', id)
      .single()

    if (error || !workspace) {
      throw ApiError.notFound('Workspace não encontrado', 'WORKSPACE_NOT_FOUND')
    }

    // Buscar configurações de credenciais
    const { data: configCredenciais } = await supabase
      .from('configuracoes_credenciais')
      .select('*')
      .eq('workspace_id', id)
      .single()

    // Buscar credenciais diversas
    const { data: credenciaisDiversas } = await supabase
      .from('credencias_diversas')
      .select('*')
      .eq('workspace_id', id)
      .single()

    // Buscar membros
    const { data: membros } = await supabase
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
          active
        )
      `)
      .eq('workspace_id', id)

    return ApiResponse.success({
      ...workspace,
      config_credenciais: configCredenciais || null,
      credenciais_diversas: credenciaisDiversas || null,
      membros: membros || []
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT - Atualizar workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      slug,
      plano_id,
      ativo,
      owner_id,
      // Limites
      limite_leads,
      limite_consultas,
      limite_instancias,
      // Credenciais
      openai_api_token,
      gemini_api_key,
      elevenlabs_api_key,
      elevenlabs_voice_id,
      // Datecode
      datecode_username,
      datecode_password,
      // Permissões customizadas do plano
      plano_customizado
    } = body

    // Verificar se workspace existe
    const { data: existingWs, error: findError } = await supabase
      .from('workspaces')
      .select('id, slug')
      .eq('id', id)
      .single()

    if (findError || !existingWs) {
      throw ApiError.notFound('Workspace não encontrado', 'WORKSPACE_NOT_FOUND')
    }

    // Se mudou o slug, verificar se já existe
    if (slug && slug !== existingWs.slug) {
      const { data: slugCheck } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (slugCheck) {
        throw ApiError.badRequest('Slug já existe em outro workspace', 'SLUG_EXISTS')
      }
    }

    // Preparar dados para atualização do workspace
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (plano_id !== undefined) updateData.plano_id = plano_id
    if (ativo !== undefined) updateData.ativo = ativo
    if (owner_id !== undefined) updateData.owner_id = owner_id
    if (limite_leads !== undefined) updateData.limite_leads = limite_leads
    if (limite_consultas !== undefined) updateData.limite_consultas = limite_consultas
    if (limite_instancias !== undefined) updateData.limite_instancias = limite_instancias
    if (plano_customizado !== undefined) updateData.plano_customizado = plano_customizado

    // Atualizar workspace
    const { data: updatedWorkspace, error: updateError } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Atualizar configurações de credenciais se fornecidas
    const hasCredenciais = openai_api_token !== undefined ||
                          gemini_api_key !== undefined ||
                          elevenlabs_api_key !== undefined ||
                          elevenlabs_voice_id !== undefined

    if (hasCredenciais) {
      // Verificar se já existe configuração
      const { data: existingConfig } = await supabase
        .from('configuracoes_credenciais')
        .select('id')
        .eq('workspace_id', id)
        .single()

      const configData: Record<string, unknown> = {}
      if (openai_api_token !== undefined) configData.openai_api_token = openai_api_token || null
      if (gemini_api_key !== undefined) configData.gemini_api_key = gemini_api_key || null
      if (elevenlabs_api_key !== undefined) configData.apikey_elevenlabs = elevenlabs_api_key || null
      if (elevenlabs_voice_id !== undefined) configData.id_voz_elevenlabs = elevenlabs_voice_id || null

      if (existingConfig) {
        await supabase
          .from('configuracoes_credenciais')
          .update(configData)
          .eq('id', existingConfig.id)
      } else {
        await supabase
          .from('configuracoes_credenciais')
          .insert({
            workspace_id: id,
            cliente: name || updatedWorkspace.name,
            ...configData
          })
      }
    }

    // Atualizar credenciais datecode se fornecidas
    const hasDatecode = datecode_username !== undefined || datecode_password !== undefined

    if (hasDatecode) {
      const { data: existingCred } = await supabase
        .from('credencias_diversas')
        .select('id, datecode')
        .eq('workspace_id', id)
        .single()

      const datecodeData = {
        username: datecode_username ?? existingCred?.datecode?.username ?? '',
        password: datecode_password ?? existingCred?.datecode?.password ?? ''
      }

      if (existingCred) {
        await supabase
          .from('credencias_diversas')
          .update({ datecode: datecodeData })
          .eq('id', existingCred.id)
      } else {
        await supabase
          .from('credencias_diversas')
          .insert({
            workspace_id: id,
            datecode: datecodeData
          })
      }
    }

    return ApiResponse.success(updatedWorkspace)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Excluir workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar se workspace existe
    const { data: existingWs, error: findError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existingWs) {
      throw ApiError.notFound('Workspace não encontrado', 'WORKSPACE_NOT_FOUND')
    }

    // Remover membros primeiro
    await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', id)

    // Remover configurações
    await supabase
      .from('configuracoes_credenciais')
      .delete()
      .eq('workspace_id', id)

    // Remover credenciais diversas
    await supabase
      .from('credencias_diversas')
      .delete()
      .eq('workspace_id', id)

    // Excluir workspace
    const { error: deleteError } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return ApiResponse.noContent()
  } catch (error) {
    return handleApiError(error)
  }
}
