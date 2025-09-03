// =====================================================
// API ROUTES - STATUS INSTÂNCIAS WHATSAPP
// Verificar status de conexão das instâncias
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { createEvolutionClient, DEFAULT_EVOLUTION_CONFIG } from '../../../../lib/evolution-api'

// =====================================================
// GET - Verificar status de uma instância
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instanceId = searchParams.get('instanceId')
    const instanceName = searchParams.get('instanceName')

    if (!instanceId && !instanceName) {
      return NextResponse.json(
        { error: 'instanceId ou instanceName é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar instância
    let query = supabase
      .from('instancias_whatsapp')
      .select(`
        *,
        configuracoes_credenciais (
          baseurl,
          apikey
        ),
        users (
          name,
          email
        )
      `)
      .eq('ativo', true)

    if (instanceId) {
      query = query.eq('id', instanceId)
    } else if (instanceName) {
      query = query.eq('instancia', instanceName)
    }

    const { data: instancia, error: fetchError } = await query.single()

    if (fetchError || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Verificar status na Evolution API
    const config = instancia.configuracoes_credenciais
    const evolutionClient = createEvolutionClient({
      baseUrl: config?.baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
      masterKey: DEFAULT_EVOLUTION_CONFIG.masterKey,
      instanceName: instancia.instancia,
      apiKey: config?.apikey
    })

    try {
      const [connectionStatus, instanceInfo, profileInfo] = await Promise.all([
        evolutionClient.getConnectionState(instancia.instancia),
        evolutionClient.getConnectionState(instancia.instancia),
        evolutionClient.getProfileInfo(instancia.instancia).catch(() => null)
      ])

      // Atualizar status no banco se diferente
      const newStatus = (connectionStatus.success && connectionStatus.data?.state === 'open') ? 'conectado' : 'desconectado'
      if (instancia.status_conexao !== newStatus) {
        await supabaseAdmin
          .from('instancias_whatsapp')
          .update({ 
            status_conexao: newStatus,
            ultimo_ping: new Date().toISOString()
          })
          .eq('id', instancia.id)
      }

      return NextResponse.json({
        success: true,
        data: {
          // Dados da instância local
          id: instancia.id,
          nome_instancia: instancia.nome_instancia,
          instancia: instancia.instancia,
          user: instancia.users,
          
          // Status de conexão
          status_conexao: newStatus,
          ultimo_ping: instancia.ultimo_ping,
          
          // Dados da Evolution API
          evolution_status: connectionStatus,
          instance_info: instanceInfo,
          profile_info: profileInfo,
          
          // Configurações
          baseurl: config?.baseurl,
          webhook_configured: !!instanceInfo?.data?.webhook?.url
        }
      })

    } catch (evolutionError) {
      // Se erro na Evolution API, marcar como erro
      await supabaseAdmin
        .from('instancias_whatsapp')
        .update({ 
          status_conexao: 'erro',
          ultimo_ping: new Date().toISOString()
        })
        .eq('id', instancia.id)

      return NextResponse.json({
        success: false,
        error: 'Erro ao conectar com Evolution API',
        data: {
          id: instancia.id,
          nome_instancia: instancia.nome_instancia,
          instancia: instancia.instancia,
          status_conexao: 'erro',
          error_details: (evolutionError as Error).message
        }
      })
    }

  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// POST - Verificar status de múltiplas instâncias
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instanceIds, userId } = body

    if (!instanceIds && !userId) {
      return NextResponse.json(
        { error: 'instanceIds ou userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar instâncias
    let query = supabase
      .from('instancias_whatsapp')
      .select(`
        *,
        configuracoes_credenciais (
          baseurl,
          apikey
        ),
        users (
          name,
          email
        )
      `)
      .eq('ativo', true)

    if (instanceIds && Array.isArray(instanceIds)) {
      query = query.in('id', instanceIds)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: instancias, error: fetchError } = await query

    if (fetchError) {
      throw fetchError
    }

    if (!instancias || instancias.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Verificar status de cada instância
    const statusResults = await Promise.all(
      instancias.map(async (instancia) => {
        try {
          const config = instancia.configuracoes_credenciais
          const evolutionClient = createEvolutionClient({
            baseUrl: config?.baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
            masterKey: DEFAULT_EVOLUTION_CONFIG.masterKey,
            instanceName: instancia.instancia,
            apiKey: config?.apikey
          })

          const [connectionStatus, instanceInfo] = await Promise.all([
            evolutionClient.getConnectionState(instancia.instancia),
            evolutionClient.getConnectionState(instancia.instancia).catch(() => null)
          ])

          // Atualizar status no banco
          const newStatus = (connectionStatus.success && connectionStatus.data?.state === 'open') ? 'conectado' : 'desconectado'
          if (instancia.status_conexao !== newStatus) {
            await supabaseAdmin
              .from('instancias_whatsapp')
              .update({ 
                status_conexao: newStatus,
                ultimo_ping: new Date().toISOString()
              })
              .eq('id', instancia.id)
          }

          return {
            id: instancia.id,
            nome_instancia: instancia.nome_instancia,
            instancia: instancia.instancia,
            user: instancia.users,
            status_conexao: newStatus,
            ultimo_ping: new Date().toISOString(),
            evolution_status: connectionStatus,
            instance_info: instanceInfo,
            error: null
          }

        } catch (error) {
          // Marcar como erro
          await supabaseAdmin
            .from('instancias_whatsapp')
            .update({ 
              status_conexao: 'erro',
              ultimo_ping: new Date().toISOString()
            })
            .eq('id', instancia.id)

          return {
            id: instancia.id,
            nome_instancia: instancia.nome_instancia,
            instancia: instancia.instancia,
            user: instancia.users,
            status_conexao: 'erro',
            ultimo_ping: new Date().toISOString(),
            error: (error as Error).message
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: statusResults,
      summary: {
        total: statusResults.length,
        conectadas: statusResults.filter(r => r.status_conexao === 'conectado').length,
        desconectadas: statusResults.filter(r => r.status_conexao === 'desconectado').length,
        com_erro: statusResults.filter(r => r.status_conexao === 'erro').length
      }
    })

  } catch (error) {
    console.error('Erro ao verificar status múltiplo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: (error as Error).message },
      { status: 500 }
    )
  }
}