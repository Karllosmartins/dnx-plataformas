// =====================================================
// API ROUTES - CONECTAR/DESCONECTAR WHATSAPP
// Gerenciar conexão das instâncias WhatsApp
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { createEvolutionClient, DEFAULT_EVOLUTION_CONFIG } from '../../../../lib/evolution-api'

// =====================================================
// POST - Conectar instância (gerar QR Code)
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instanceId } = body

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
      .eq('ativo', true)
      .single()

    if (fetchError || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Conectar via Evolution API
    const config = instancia.configuracoes_credenciais
    const evolutionClient = createEvolutionClient({
      baseUrl: config?.baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
      masterKey: DEFAULT_EVOLUTION_CONFIG.masterKey,
      instanceName: instancia.instancia,
      apiKey: config?.apikey
    })

    // Verificar status atual
    const currentStatus = await evolutionClient.getConnectionStatus(instancia.instancia)
    
    if (currentStatus.status === 'connected') {
      return NextResponse.json({
        success: true,
        message: 'Instância já está conectada',
        data: {
          status: 'connected',
          instanceName: instancia.instancia
        }
      })
    }

    // Gerar QR Code para conexão
    const connectionResult = await evolutionClient.connectInstance(instancia.instancia)

    // Atualizar status no banco
    await supabaseAdmin
      .from('instancias_whatsapp')
      .update({ 
        status_conexao: 'conectado',
        ultimo_ping: new Date().toISOString()
      })
      .eq('id', instanceId)

    return NextResponse.json({
      success: true,
      message: 'Processo de conexão iniciado',
      data: {
        qrCode: connectionResult.qrCode,
        instanceName: instancia.instancia,
        status: 'connecting'
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

// =====================================================
// DELETE - Desconectar instância
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
      .eq('ativo', true)
      .single()

    if (fetchError || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Desconectar via Evolution API
    const config = instancia.configuracoes_credenciais
    const evolutionClient = createEvolutionClient({
      baseUrl: config?.baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
      masterKey: DEFAULT_EVOLUTION_CONFIG.masterKey,
      instanceName: instancia.instancia,
      apiKey: config?.apikey
    })

    await evolutionClient.logoutInstance(instancia.instancia)

    // Atualizar status no banco
    await supabaseAdmin
      .from('instancias_whatsapp')
      .update({ 
        status_conexao: 'desconectado',
        ultimo_ping: new Date().toISOString()
      })
      .eq('id', instanceId)

    return NextResponse.json({
      success: true,
      message: 'Instância desconectada com sucesso',
      data: {
        instanceName: instancia.instancia,
        status: 'disconnected'
      }
    })

  } catch (error) {
    console.error('Erro ao desconectar instância:', error)
    return NextResponse.json(
      { error: 'Erro ao desconectar instância', details: (error as Error).message },
      { status: 500 }
    )
  }
}