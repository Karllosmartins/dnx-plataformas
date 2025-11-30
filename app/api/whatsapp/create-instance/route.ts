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

    if (!userId || !workspaceId || !nomeInstancia) {
      return NextResponse.json(
        { error: 'userId, workspaceId e nomeInstancia são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar limite de instâncias do workspace
    const { data: workspace, error: workspaceError } = await getSupabaseAdmin()
      .from('workspaces')
      .select('limite_instancias')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      )
    }

    // Contar instâncias existentes do workspace
    const { count: instanceCount, error: countError } = await getSupabaseAdmin()
      .from('instancia_whtats')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if (countError) {
      throw countError
    }

    const limiteInstancias = workspace.limite_instancias || 1
    if ((instanceCount || 0) >= limiteInstancias) {
      return NextResponse.json(
        { error: `Limite de ${limiteInstancias} instância(s) atingido para este workspace` },
        { status: 400 }
      )
    }

    // Usar o nome específico fornecido pelo usuário
    const instanceName = nomeInstancia.toLowerCase().replace(/\s+/g, '_')

    // Verificar se já existe instância com mesmo nome no workspace
    const { data: existingInstance } = await getSupabaseAdmin()
      .from('instancia_whtats')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('instancia', instanceName)
      .single()

    if (existingInstance) {
      return NextResponse.json(
        { error: 'Já existe uma instância com este nome no workspace' },
        { status: 400 }
      )
    }

    // Criar instância na UAZAPI
    const uazapiAdmin = createUazapiAdmin(
      DEFAULT_UAZAPI_CONFIG.baseUrl,
      DEFAULT_UAZAPI_CONFIG.adminToken
    )

    console.log('Criando instância UAZAPI:', { name: instanceName, workspaceId })

    const uazapiResponse = await uazapiAdmin.createInstance({
      name: instanceName,
      systemName: nomeInstancia,
      adminField01: String(userId),
      adminField02: workspaceId
    })

    console.log('Resposta UAZAPI:', uazapiResponse)

    if (!uazapiResponse.success) {
      return NextResponse.json(
        {
          error: `Erro ao criar instância: ${uazapiResponse.error || 'Erro desconhecido'}`,
          details: uazapiResponse.error
        },
        { status: 400 }
      )
    }

    // Token da instância retornado pela UAZAPI
    const instanceToken = uazapiResponse.data?.token || ''

    // Configurar webhook da instância
    if (instanceToken) {
      try {
        const uazapiInstance = createUazapiInstance(instanceToken, DEFAULT_UAZAPI_CONFIG.baseUrl)
        await uazapiInstance.setWebhook({
          url: WEBHOOK_URL,
          enabled: true,
          events: ['messages'],
          excludeMessages: ['isGroupYes', 'wasSentByApi']
        })
      } catch (webhookError) {
        console.error('Erro ao configurar webhook:', webhookError)
      }
    }

    // Salvar na tabela instancia_whtats
    const { data: newInstancia, error: instanciaError } = await getSupabaseAdmin()
      .from('instancia_whtats')
      .insert({
        user_id: parseInt(userId),
        workspace_id: workspaceId,
        instancia: instanceName,
        apikey: instanceToken,
        baseurl: DEFAULT_UAZAPI_CONFIG.baseUrl,
        is_official_api: false
      })
      .select()
      .single()

    if (instanciaError) {
      console.error('Erro ao salvar instância:', instanciaError)
      return NextResponse.json(
        { error: 'Instância criada na UAZAPI mas falhou ao salvar localmente', details: instanciaError.message },
        { status: 500 }
      )
    }

    console.log('Instância salva com sucesso:', newInstancia)

    return NextResponse.json({
      success: true,
      message: 'Instância WhatsApp criada com sucesso',
      data: {
        instanceId: newInstancia.id,
        instanceName: instanceName,
        instanceData: uazapiResponse.data
      }
    })

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
    console.log('Buscando instâncias:', { userId, workspaceId })

    let query = getSupabaseAdmin()
      .from('instancia_whtats')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    } else {
      query = query.eq('user_id', userId)
    }

    const { data: instancias, error } = await query

    console.log('Resultado da busca:', { instancias, error })

    if (error) {
      throw error
    }

    if (!instancias || instancias.length === 0) {
      console.log('Nenhuma instância encontrada')
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
            console.log(`Status da instância ${inst.instancia}:`, status, statusResult.data)

            return {
              id: inst.id,
              instanceName: inst.instancia || '',
              status: status || 'disconnected',
              isOfficialApi: false,
              profileName: statusResult.data?.profileName,
              profilePicUrl: statusResult.data?.profilePicUrl,
              created_at: inst.created_at
            }
          } catch (err) {
            console.error(`Erro ao verificar status de ${inst.instancia}:`, err)
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
    console.log('Status atual da instância:', statusResult.data?.status)

    // Se já está conectado, retornar sucesso
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

    // Desconectar primeiro para garantir QR Code fresco
    try {
      console.log('Desconectando instância para gerar novo QR Code...')
      await uazapiClient.disconnect()
    } catch (disconnectError) {
      console.log('Erro ao desconectar (pode ser ignorado):', disconnectError)
    }

    // Aguardar um pouco antes de conectar
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Gerar QR Code
    console.log('Conectando para gerar QR Code...')
    const connectResult = await uazapiClient.connect()
    console.log('Resultado da conexão:', connectResult)

    return NextResponse.json({
      success: true,
      isConnected: false,
      data: {
        status: 'connecting',
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
