import { NextRequest } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

// GET - Listar todos os workspaces (admin only)
export async function GET(request: NextRequest) {
  try {
    // Buscar todos os workspaces com plano e configurações
    const { data: workspaces, error } = await supabase
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
      .order('name')

    if (error) throw error

    // Buscar configurações e credenciais de cada workspace
    const workspacesCompletos = await Promise.all(
      (workspaces || []).map(async (workspace) => {
        // Buscar configurações de credenciais
        const { data: configCredenciais } = await supabase
          .from('configuracoes_credenciais')
          .select(`
            openai_api_token,
            gemini_api_key,
            apikey_elevenlabs,
            id_voz_elevenlabs,
            model,
            type_tool_supabase,
            reasoning_effort
          `)
          .eq('workspace_id', workspace.id)
          .single()

        // Buscar credenciais diversas (datecode)
        const { data: credenciaisDiversas } = await supabase
          .from('credencias_diversas')
          .select('datecode')
          .eq('workspace_id', workspace.id)
          .single()

        // Buscar membros com dados do usuário
        const { data: membros } = await supabase
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
          .eq('workspace_id', workspace.id)

        // Buscar user_tools do workspace
        const { data: userTools } = await supabase
          .from('user_tools')
          .select(`
            id,
            workspace_id,
            tool_id,
            agente_id,
            is_active,
            tools (
              id,
              type,
              nome,
              descricao
            )
          `)
          .eq('workspace_id', workspace.id)

        return {
          ...workspace,
          config_credenciais: configCredenciais || null,
          credenciais_diversas: credenciaisDiversas || null,
          membros: membros || [],
          user_tools: userTools || [],
          total_membros: membros?.length || 0
        }
      })
    )

    return ApiResponse.success(workspacesCompletos)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST - Criar novo workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      plano_id,
      ativo = true,
      owner_id,
      // Limites customizados
      limite_leads,
      limite_consultas,
      limite_instancias,
      // Credenciais de API
      openai_api_token,
      gemini_api_key,
      elevenlabs_api_key,
      elevenlabs_voice_id,
      // Datecode
      datecode_username,
      datecode_password
    } = body

    if (!name || !slug) {
      throw ApiError.badRequest('Nome e slug são obrigatórios', 'MISSING_FIELDS')
    }

    // Verificar se slug já existe
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingWorkspace) {
      throw ApiError.badRequest('Slug já existe', 'SLUG_EXISTS')
    }

    // Criar workspace
    const { data: newWorkspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name,
        slug,
        plano_id: plano_id || null,
        ativo,
        owner_id: owner_id || null,
        limite_leads: limite_leads || 1000,
        limite_consultas: limite_consultas || 100,
        limite_instancias: limite_instancias || 1,
        leads_consumidos: 0,
        consultas_realizadas: 0,
        instancias_ativas: 0
      })
      .select()
      .single()

    if (wsError) throw wsError

    // Criar configurações de credenciais se fornecidas
    if (openai_api_token || gemini_api_key || elevenlabs_api_key) {
      const { error: configError } = await supabase
        .from('configuracoes_credenciais')
        .insert({
          workspace_id: newWorkspace.id,
          cliente: name,
          openai_api_token: openai_api_token || null,
          gemini_api_key: gemini_api_key || null,
          apikey_elevenlabs: elevenlabs_api_key || null,
          id_voz_elevenlabs: elevenlabs_voice_id || null
        })

      if (configError) {
        console.error('Erro ao criar configurações:', configError)
      }
    }

    // Criar credenciais diversas se datecode fornecido
    if (datecode_username || datecode_password) {
      const { error: credError } = await supabase
        .from('credencias_diversas')
        .insert({
          workspace_id: newWorkspace.id,
          datecode: {
            username: datecode_username || '',
            password: datecode_password || ''
          }
        })

      if (credError) {
        console.error('Erro ao criar credenciais diversas:', credError)
      }
    }

    // Se owner_id fornecido, adicionar como owner do workspace
    if (owner_id) {
      await supabase
        .from('workspace_members')
        .insert({
          workspace_id: newWorkspace.id,
          user_id: owner_id,
          role: 'owner'
        })
    }

    return ApiResponse.created(newWorkspace)
  } catch (error) {
    return handleApiError(error)
  }
}
