// =====================================================
// API ROUTES - INSTÂNCIAS WHATSAPP
// Gerenciamento de instâncias WhatsApp via UAZAPI
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '../../../../lib/supabase'
import { createUazapiClientFromDb, createUazapiAdmin, createUazapiInstance, DEFAULT_UAZAPI_CONFIG } from '../../../../lib/uazapi'
import type { ConfiguracaoCredenciais, InstanciaWhatsapp, User } from '../../../../lib/supabase'

// URL do webhook para receber mensagens
const WEBHOOK_URL = 'https://webhooks.dnmarketing.com.br/webhook/233c6d7a-0a0a-498e-8e47-1b47a3876b63uazapi'

// =====================================================
// GET - Listar instâncias do usuário
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar instâncias do workspace/usuário no banco
    let query = supabase
      .from('instancias_whatsapp')
      .select(`
        *,
        configuracoes_credenciais (
          instancia,
          apikey,
          baseurl
        )
      `)
      .eq('ativo', true)

    // Filtrar por workspace_id se disponível, senão por user_id
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data: instancias, error } = await query

    if (error) {
      throw error
    }

    // Para cada instância, verificar status na UAZAPI
    const instanciasComStatus = await Promise.all(
      (instancias || []).map(async (instancia) => {
        try {
          const config = instancia.configuracoes_credenciais
          const uazapiClient = createUazapiClientFromDb({
            baseurl: config?.baseurl || DEFAULT_UAZAPI_CONFIG.baseUrl,
            apikey: config?.apikey || '',
            instancia: config?.instancia || instancia.instancia
          })

          const status = await uazapiClient.getStatus()

          return {
            ...instancia,
            // UAZAPI retorna: disconnected, connecting, connected
            status_conexao_real: status.success ? status.data?.status : 'unknown'
          }
        } catch (error) {
          return {
            ...instancia,
            status_conexao_real: 'erro',
            error: (error as Error).message
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: instanciasComStatus
    })

  } catch (error) {

    return NextResponse.json(
      { error: 'Erro interno do servidor', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// POST - Criar nova instância
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      workspaceId,
      nomeInstancia,
      instanciaNome,
      apikey,
      baseurl
    } = body

    if (!userId || !nomeInstancia || !instanciaNome) {
      return NextResponse.json(
        { error: 'userId, nomeInstancia e instanciaNome são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe e tem limite disponível
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já tem instância (limite de 1 por workspace)
    let existingQuery = supabase
      .from('instancias_whatsapp')
      .select('id')
      .eq('ativo', true)

    // Filtrar por workspace_id se disponível, senão por user_id
    if (workspaceId) {
      existingQuery = existingQuery.eq('workspace_id', workspaceId)
    } else {
      existingQuery = existingQuery.eq('user_id', userId)
    }

    const { data: existingInstances, error: countError } = await existingQuery

    if (countError) {
      throw countError
    }

    if (existingInstances && existingInstances.length > 0) {
      return NextResponse.json(
        { error: 'Workspace já possui uma instância ativa. Limite: 1 instância por workspace.' },
        { status: 400 }
      )
    }

    // Criar instância na UAZAPI
    const uazapiAdmin = createUazapiAdmin(
      baseurl || DEFAULT_UAZAPI_CONFIG.baseUrl,
      DEFAULT_UAZAPI_CONFIG.adminToken
    )

    const uazapiResult = await uazapiAdmin.createInstance({
      name: instanciaNome,
      systemName: nomeInstancia,
      adminField01: userId,
      adminField02: workspaceId || ''
    })

    if (!uazapiResult.success) {
      return NextResponse.json(
        { error: 'Erro ao criar instância na UAZAPI', details: uazapiResult.error },
        { status: 400 }
      )
    }

    // Token da instância retornado pela UAZAPI
    const instanceToken = uazapiResult.data?.token || apikey

    // Criar configuração de credenciais
    const { data: configData, error: configError } = await getSupabaseAdmin()
      .from('configuracoes_credenciais')
      .insert({
        user_id: userId,
        workspace_id: workspaceId || null,
        baseurl: baseurl || DEFAULT_UAZAPI_CONFIG.baseUrl,
        instancia: instanciaNome,
        apikey: instanceToken,
        cliente: user.name,
        model: 'gpt-4o',
        type_tool_supabase: 'OpenAi',
        delay_entre_mensagens_em_segundos: 30,
        delay_apos_intervencao_humana_minutos: 0,
        inicio_expediente: 8,
        fim_expediente: 18
      })
      .select()
      .single()

    if (configError) {
      throw configError
    }

    // Criar instância no banco
    const { data: instanciaData, error: instanciaError } = await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .insert({
        user_id: userId,
        workspace_id: workspaceId || null,
        config_id: configData.id,
        nome_instancia: nomeInstancia,
        instancia: instanciaNome,
        apikey: instanceToken,
        baseurl: baseurl || DEFAULT_UAZAPI_CONFIG.baseUrl,
        status_conexao: 'desconectado',
        ativo: true
      })
      .select()
      .single()

    if (instanciaError) {
      throw instanciaError
    }

    // Configurar webhook da instância para receber mensagens
    let webhookConfigured = false
    if (instanceToken) {
      try {
        const uazapiInstance = createUazapiInstance(
          instanceToken,
          baseurl || DEFAULT_UAZAPI_CONFIG.baseUrl
        )

        const webhookResult = await uazapiInstance.setWebhook({
          url: WEBHOOK_URL,
          enabled: true,
          events: ['messages'],
          excludeMessages: ['isGroupYes', 'wasSentByApi'] // Excluir grupos e mensagens enviadas pela API (evita loop)
        })

        webhookConfigured = webhookResult.success
      } catch (webhookError) {
        console.error('Erro ao configurar webhook:', webhookError)
        // Continua mesmo se falhar - a instância foi criada
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Instância criada com sucesso',
      data: {
        instancia: instanciaData,
        uazapi_response: uazapiResult.data,
        webhook_configured: webhookConfigured
      }
    })

  } catch (error) {

    return NextResponse.json(
      { error: 'Erro ao criar instância', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT - Atualizar instância
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      instanceId,
      nomeInstancia,
      status_conexao 
    } = body

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId é obrigatório' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (nomeInstancia) updateData.nome_instancia = nomeInstancia
    if (status_conexao) updateData.status_conexao = status_conexao

    const { data, error } = await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .update(updateData)
      .eq('id', instanceId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Instância atualizada com sucesso',
      data
    })

  } catch (error) {

    return NextResponse.json(
      { error: 'Erro ao atualizar instância', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE - Remover instância
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados da instância
    const { data: instancia, error: fetchError } = await supabase
      .from('instancias_whatsapp')
      .select(`
        *,
        configuracoes_credenciais (
          baseurl,
          apikey
        )
      `)
      .eq('id', instanceId)
      .single()

    if (fetchError || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Deletar instância da UAZAPI
    try {
      const config = instancia.configuracoes_credenciais
      const uazapiClient = createUazapiClientFromDb({
        baseurl: config?.baseurl || DEFAULT_UAZAPI_CONFIG.baseUrl,
        apikey: config?.apikey || '',
        instancia: instancia.instancia
      })

      await uazapiClient.delete()
    } catch (error) {
      // Continua mesmo se falhar na UAZAPI
    }

    // Marcar como inativa no banco (não deletar para manter histórico)
    const { error: updateError } = await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .update({ ativo: false })
      .eq('id', instanceId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Instância removida com sucesso'
    })

  } catch (error) {

    return NextResponse.json(
      { error: 'Erro ao remover instância', details: (error as Error).message },
      { status: 500 }
    )
  }
}