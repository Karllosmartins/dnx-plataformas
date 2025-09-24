// =====================================================
// API ROUTE - CRIAR INSTÂNCIA WHATSAPP
// Criar instância WhatsApp com configurações padrão
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { createEvolutionClient, DEFAULT_EVOLUTION_CONFIG } from '../../../../lib/evolution-api'

// =====================================================
// POST - Criar instância WhatsApp simples
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, nomeInstancia } = body

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
    const { data: existingConfig, error: configError } = await getSupabaseAdmin()
      .from('configuracoes_credenciais')
      .select('id, instancia, apikey, baseurl')
      .eq('user_id', userId)
      .single()

    if (existingConfig && existingConfig.instancia && existingConfig.apikey && existingConfig.baseurl) {
      return NextResponse.json(
        { error: 'Usuário já possui uma instância WhatsApp configurada' },
        { status: 400 }
      )
    }

    // Usar o nome específico fornecido pelo usuário (sem timestamp)
    const instanceName = nomeInstancia.toLowerCase().replace(/\s+/g, '_')

    // Criar instância na Evolution API com configurações padrão
    const evolutionClient = createEvolutionClient()
    
    const instanceConfig = {
      instanceName: instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      
      // Webhook padrão
      webhook: {
        url: 'https://webhooks.dnmarketing.com.br/webhook/c05a8122-fb58-4a3a-a2c1-73f492b95f11',
        events: ['CONNECTION_UPDATE', 'QRCODE_UPDATED', 'MESSAGES_UPSERT'],
        webhook_by_events: true
      },
      
      // Configurações padrão solicitadas
      groups_ignore: true,    // Ignorar grupos
      read_messages: true,    // Read Messages ativa
      reject_call: false,
      always_online: false,
      read_status: false,
      
      // Proxy padrão
      proxy: {
        host: 'p.webshare.io',
        port: 80,
        username: 'dpaulflz-rotate',
        password: 'mq45cez0q5vx'
      }
    }

    const evolutionResponse = await evolutionClient.createInstance(instanceConfig)

    // Se já existe configuração, apenas atualizar com dados da instância
    if (existingConfig) {
      const { data: updatedConfig, error: updateError } = await getSupabaseAdmin()
        .from('configuracoes_credenciais')
        .update({
          instancia: instanceName,
          apikey: evolutionResponse.data?.apikey || 'api-key-gerada',
          baseurl: DEFAULT_EVOLUTION_CONFIG.baseUrl
        })
        .eq('id', existingConfig.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: 'Instância WhatsApp criada e configuração atualizada',
        data: {
          instanceName: instanceName,
          instanceData: evolutionResponse,
          configData: updatedConfig
        }
      })
    } else {
      // Criar nova configuração completa
      const { data: newConfig, error: insertError } = await getSupabaseAdmin()
        .from('configuracoes_credenciais')
        .insert({
          user_id: userId,
          baseurl: DEFAULT_EVOLUTION_CONFIG.baseUrl,
          instancia: instanceName,
          apikey: evolutionResponse.data?.apikey || 'api-key-gerada',
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

      return NextResponse.json({
        success: true,
        message: 'Instância WhatsApp criada com sucesso',
        data: {
          instanceName: instanceName,
          instanceData: evolutionResponse,
          configData: newConfig
        }
      })
    }

  } catch (error) {
    console.error('Erro ao criar instância WhatsApp:', error)
    
    // Se erro específico da Evolution API
    if ((error as any)?.response?.data) {
      return NextResponse.json(
        { 
          error: 'Erro na Evolution API', 
          details: (error as any).response.data.message || (error as Error).message 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar instância WhatsApp', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// GET - Verificar status da criação da instância
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar configuração do usuário
    const { data: config, error } = await getSupabaseAdmin()
      .from('configuracoes_credenciais')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !config) {
      return NextResponse.json({
        success: true,
        hasInstance: false,
        data: null
      })
    }

    // Verificar se instância, apikey e baseurl estão preenchidos
    if (config.instancia && config.apikey && config.baseurl) {
      try {
        const evolutionClient = createEvolutionClient({
          baseUrl: config.baseurl,
          instanceName: config.instancia,
          apiKey: config.apikey
        })

        const instanceStatus = await evolutionClient.getConnectionState(config.instancia)
        
        // Se conectado, retornar status
        if (instanceStatus.success && instanceStatus.data?.state === 'open') {
          return NextResponse.json({
            success: true,
            hasInstance: true,
            isConnected: true,
            data: {
              instanceName: config.instancia,
              baseurl: config.baseurl,
              status: 'connected',
              created_at: config.created_at
            }
          })
        } else {
          // Se desconectado, gerar QR Code
          const connectResult = await evolutionClient.connectInstance(config.instancia)
          
          return NextResponse.json({
            success: true,
            hasInstance: true,
            isConnected: false,
            data: {
              instanceName: config.instancia,
              baseurl: config.baseurl,
              status: 'disconnected',
              qrCode: connectResult.data?.qrCode || connectResult.data?.qr,
              created_at: config.created_at
            }
          })
        }
        
      } catch (evolutionError) {
        return NextResponse.json({
          success: true,
          hasInstance: true,
          isConnected: false,
          data: {
            instanceName: config.instancia,
            baseurl: config.baseurl,
            status: 'erro',
            error: (evolutionError as Error).message
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      hasInstance: false,
      data: null
    })

  } catch (error) {
    console.error('Erro ao verificar instância:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar instância', details: (error as Error).message },
      { status: 500 }
    )
  }
}