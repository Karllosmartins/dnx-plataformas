// =====================================================
// API ROUTE - CRIAR INSTÂNCIA WHATSAPP
// Criar instância WhatsApp com configurações padrão via UAZAPI
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { createUazapiAdmin, createUazapiInstance, DEFAULT_UAZAPI_CONFIG } from '../../../../lib/uazapi'

// URL do webhook para receber mensagens
const WEBHOOK_URL = 'https://webhooks.dnmarketing.com.br/webhook/233c6d7a-0a0a-498e-8e47-1b47a3876b63uazapi'

// =====================================================
// POST - Criar instância WhatsApp simples
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, workspaceId, nomeInstancia } = body

    if (!userId || !nomeInstancia) {
      return NextResponse.json(
        { error: 'userId e nomeInstancia são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se usuário existe
    const { data: user, error: userError } = await getSupabaseAdmin()
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

    // Verificar se usuário já tem instância configurada
    let configQuery = getSupabaseAdmin()
      .from('configuracoes_credenciais')
      .select('id, instancia, apikey, baseurl')

    if (workspaceId) {
      configQuery = configQuery.eq('workspace_id', workspaceId)
    } else {
      configQuery = configQuery.eq('user_id', userId)
    }

    const { data: existingConfig, error: configError } = await configQuery.single()

    if (existingConfig && existingConfig.instancia && existingConfig.apikey && existingConfig.baseurl) {
      return NextResponse.json(
        { error: 'Usuário já possui uma instância WhatsApp configurada' },
        { status: 400 }
      )
    }

    // Usar o nome específico fornecido pelo usuário (sem timestamp)
    const instanceName = nomeInstancia.toLowerCase().replace(/\s+/g, '_')

    // Criar instância na UAZAPI
    const uazapiAdmin = createUazapiAdmin(
      DEFAULT_UAZAPI_CONFIG.baseUrl,
      DEFAULT_UAZAPI_CONFIG.adminToken
    )

    const uazapiResponse = await uazapiAdmin.createInstance({
      name: instanceName,
      systemName: nomeInstancia,
      adminField01: userId,
      adminField02: workspaceId || ''
    })

    if (!uazapiResponse.success) {
      return NextResponse.json(
        { error: 'Erro ao criar instância na UAZAPI', details: uazapiResponse.error },
        { status: 400 }
      )
    }

    // Token da instância retornado pela UAZAPI
    const instanceToken = uazapiResponse.data?.token || ''

    // Configurar webhook da instância para receber mensagens
    if (instanceToken) {
      try {
        const uazapiInstance = createUazapiInstance(instanceToken, DEFAULT_UAZAPI_CONFIG.baseUrl)

        await uazapiInstance.setWebhook({
          url: WEBHOOK_URL,
          enabled: true,
          events: ['messages'],
          excludeMessages: ['isGroupYes', 'wasSentByApi'] // Excluir grupos e mensagens enviadas pela API (evita loop)
        })
      } catch (webhookError) {
        console.error('Erro ao configurar webhook:', webhookError)
        // Continua mesmo se falhar a configuração do webhook
      }
    }

    // Se já existe configuração, apenas atualizar com dados da instância
    if (existingConfig) {
      const { data: updatedConfig, error: updateError } = await getSupabaseAdmin()
        .from('configuracoes_credenciais')
        .update({
          instancia: instanceName,
          apikey: instanceToken,
          baseurl: DEFAULT_UAZAPI_CONFIG.baseUrl
        })
        .eq('id', existingConfig.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      // Salvar também na tabela instancia_whtats
      await getSupabaseAdmin()
        .from('instancia_whtats')
        .upsert({
          user_id: parseInt(userId),
          workspace_id: workspaceId || null,
          instancia: instanceName,
          apikey: instanceToken,
          baseurl: DEFAULT_UAZAPI_CONFIG.baseUrl,
          is_official_api: false
        }, {
          onConflict: 'workspace_id,instancia'
        })

      return NextResponse.json({
        success: true,
        message: 'Instância WhatsApp criada e configuração atualizada',
        data: {
          instanceName: instanceName,
          instanceData: uazapiResponse.data,
          configData: updatedConfig
        }
      })
    } else {
      // Criar nova configuração completa
      const { data: newConfig, error: insertError } = await getSupabaseAdmin()
        .from('configuracoes_credenciais')
        .insert({
          user_id: userId,
          workspace_id: workspaceId || null,
          baseurl: DEFAULT_UAZAPI_CONFIG.baseUrl,
          instancia: instanceName,
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

      if (insertError) {
        throw insertError
      }

      // Salvar também na tabela instancia_whtats
      const { data: newInstancia, error: instanciaError } = await getSupabaseAdmin()
        .from('instancia_whtats')
        .insert({
          user_id: parseInt(userId),
          workspace_id: workspaceId || null,
          instancia: instanceName,
          apikey: instanceToken,
          baseurl: DEFAULT_UAZAPI_CONFIG.baseUrl,
          is_official_api: false
        })
        .select()
        .single()

      if (instanciaError) {
        console.error('Erro ao salvar em instancia_whtats:', instanciaError)
      }

      return NextResponse.json({
        success: true,
        message: 'Instância WhatsApp criada com sucesso',
        data: {
          instanceName: instanceName,
          instanceData: uazapiResponse.data,
          configData: newConfig,
          instanciaId: newInstancia?.id
        }
      })
    }

  } catch (error) {
    console.error('Erro ao criar instância WhatsApp:', error)

    return NextResponse.json(
      { error: 'Erro ao criar instância WhatsApp', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// GET - Listar instâncias do workspace
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

    // Buscar todas as instâncias da tabela instancia_whtats
    let query = getSupabaseAdmin()
      .from('instancia_whtats')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    } else {
      query = query.eq('user_id', parseInt(userId))
    }

    const { data: instancias, error } = await query

    if (error) {
      throw error
    }

    if (!instancias || instancias.length === 0) {
      return NextResponse.json({
        success: true,
        instances: []
      })
    }

    // Para cada instância, verificar status
    const instancesWithStatus = await Promise.all(
      instancias.map(async (inst) => {
        // Se é API oficial do WhatsApp, não verificar via UAZAPI
        if (inst.is_official_api) {
          return {
            id: inst.id,
            instanceName: inst.instancia || '',
            status: 'connected', // API oficial sempre "conectada"
            isOfficialApi: true,
            wabaId: inst.waba_id,
            phoneId: inst.id_telefone,
            created_at: inst.created_at
          }
        }

        // Instância UAZAPI - verificar status
        if (inst.apikey && inst.baseurl) {
          try {
            const uazapiClient = createUazapiInstance(inst.apikey, inst.baseurl)
            const statusResult = await uazapiClient.getStatus()

            const status = statusResult.success ? statusResult.data?.status : 'erro'

            return {
              id: inst.id,
              instanceName: inst.instancia || '',
              status: status,
              isOfficialApi: false,
              profileName: statusResult.data?.profileName,
              profilePicUrl: statusResult.data?.profilePicUrl,
              created_at: inst.created_at
            }
          } catch (err) {
            return {
              id: inst.id,
              instanceName: inst.instancia || '',
              status: 'erro',
              isOfficialApi: false,
              error: (err as Error).message,
              created_at: inst.created_at
            }
          }
        }

        return {
          id: inst.id,
          instanceName: inst.instancia || '',
          status: 'created',
          isOfficialApi: false,
          created_at: inst.created_at
        }
      })
    )

    return NextResponse.json({
      success: true,
      instances: instancesWithStatus
    })

  } catch (error) {
    console.error('Erro ao listar instâncias:', error)

    return NextResponse.json(
      { error: 'Erro ao listar instâncias', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT - Gerar QR Code para conectar instância
// =====================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { instanceId } = body

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar instância
    const { data: instancia, error } = await getSupabaseAdmin()
      .from('instancia_whtats')
      .select('*')
      .eq('id', instanceId)
      .single()

    if (error || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Se é API oficial, não precisa de QR Code
    if (instancia.is_official_api) {
      return NextResponse.json({
        success: true,
        isOfficialApi: true,
        message: 'API oficial não requer QR Code'
      })
    }

    // Gerar QR Code via UAZAPI
    if (!instancia.apikey || !instancia.baseurl) {
      return NextResponse.json(
        { error: 'Instância não possui credenciais configuradas' },
        { status: 400 }
      )
    }

    const uazapiClient = createUazapiInstance(instancia.apikey, instancia.baseurl)

    // Verificar status primeiro
    const statusResult = await uazapiClient.getStatus()

    if (statusResult.success && statusResult.data?.status === 'connected') {
      return NextResponse.json({
        success: true,
        isConnected: true,
        data: {
          status: 'connected',
          profileName: statusResult.data?.profileName,
          profilePicUrl: statusResult.data?.profilePicUrl
        }
      })
    }

    // Gerar QR Code
    const connectResult = await uazapiClient.connect()

    return NextResponse.json({
      success: true,
      isConnected: false,
      data: {
        status: statusResult.data?.status || 'disconnected',
        qrCode: connectResult.data?.qrcode,
        pairCode: connectResult.data?.paircode
      }
    })

  } catch (error) {
    console.error('Erro ao conectar instância:', error)

    return NextResponse.json(
      { error: 'Erro ao conectar instância', details: (error as Error).message },
      { status: 500 }
    )
  }
}
