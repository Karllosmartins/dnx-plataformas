// =====================================================
// API ROUTES - INSTÂNCIAS WHATSAPP
// Gerenciamento de instâncias WhatsApp via Evolution API
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '../../../../lib/supabase'
import { createEvolutionClient, DEFAULT_EVOLUTION_CONFIG } from '../../../../lib/evolution-api'
import type { ConfiguracaoCredenciais, InstanciaWhatsapp, User } from '../../../../lib/supabase'

// =====================================================
// GET - Listar instâncias do usuário
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

    // Buscar instâncias do usuário no banco
    const { data: instancias, error } = await supabase
      .from('instancias_whatsapp')
      .select(`
        *,
        configuracoes_credenciais (
          instancia,
          apikey,
          baseurl
        )
      `)
      .eq('user_id', userId)
      .eq('ativo', true)

    if (error) {
      throw error
    }

    // Para cada instância, verificar status na Evolution API
    const instanciasComStatus = await Promise.all(
      (instancias || []).map(async (instancia) => {
        try {
          const config = instancia.configuracoes_credenciais
          const evolutionClient = createEvolutionClient({
            baseUrl: config?.baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
            masterKey: DEFAULT_EVOLUTION_CONFIG.masterKey,
            instanceName: config?.instancia || instancia.instancia,
            apiKey: config?.apikey
          })

          const status = await evolutionClient.getConnectionState(instancia.instancia)

          return {
            ...instancia,
            status_conexao_real: status.success ? status.data?.state : 'unknown'
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
    console.error('Erro ao listar instâncias:', error)
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

    // Verificar se já tem instância (limite de 1 por usuário)
    const { data: existingInstances, error: countError } = await supabase
      .from('instancias_whatsapp')
      .select('id')
      .eq('user_id', userId)
      .eq('ativo', true)

    if (countError) {
      throw countError
    }

    if (existingInstances && existingInstances.length > 0) {
      return NextResponse.json(
        { error: 'Usuário já possui uma instância ativa. Limite: 1 instância por usuário.' },
        { status: 400 }
      )
    }

    // Verificar se instância já existe na Evolution API
    const evolutionClient = createEvolutionClient({
      baseUrl: baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
      masterKey: DEFAULT_EVOLUTION_CONFIG.masterKey,
      instanceName: instanciaNome
    })

    try {
      const existingInstance = await evolutionClient.getConnectionState(instanciaNome)
      if (existingInstance) {
        return NextResponse.json(
          { error: 'Nome da instância já existe na Evolution API' },
          { status: 400 }
        )
      }
    } catch (error) {
      // Se erro 404, significa que não existe, pode prosseguir
      if (!(error as any)?.response?.status === 404) {
        console.log('Instância não existe, pode criar')
      }
    }

    // Criar instância na Evolution API
    const instanceConfig = {
      instanceName: instanciaNome,
      qrcode: true
    }

    const evolutionInstance = await evolutionClient.createInstance(instanceConfig)

    // Criar configuração de credenciais
    const { data: configData, error: configError } = await supabaseAdmin
      .from('configuracoes_credenciais')
      .insert({
        user_id: userId,
        baseurl: baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
        instancia: instanciaNome,
        apikey: apikey || evolutionInstance.apikey,
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
    const { data: instanciaData, error: instanciaError } = await supabaseAdmin
      .from('instancias_whatsapp')
      .insert({
        user_id: userId,
        config_id: configData.id,
        nome_instancia: nomeInstancia,
        instancia: instanciaNome,
        apikey: apikey || evolutionInstance.apikey,
        baseurl: baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
        status_conexao: 'desconectado',
        ativo: true
      })
      .select()
      .single()

    if (instanciaError) {
      throw instanciaError
    }

    return NextResponse.json({
      success: true,
      message: 'Instância criada com sucesso',
      data: {
        instancia: instanciaData,
        evolution_response: evolutionInstance
      }
    })

  } catch (error) {
    console.error('Erro ao criar instância:', error)
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

    const { data, error } = await supabaseAdmin
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
    console.error('Erro ao atualizar instância:', error)
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

    // Deletar instância da Evolution API
    try {
      const config = instancia.configuracoes_credenciais
      const evolutionClient = createEvolutionClient({
        baseUrl: config?.baseurl || DEFAULT_EVOLUTION_CONFIG.baseUrl,
        masterKey: DEFAULT_EVOLUTION_CONFIG.masterKey,
        instanceName: instancia.instancia,
        apiKey: config?.apikey
      })

      await evolutionClient.deleteInstance(instancia.instancia)
    } catch (error) {
      console.warn('Erro ao deletar instância da Evolution API:', error)
      // Continua mesmo se falhar na Evolution API
    }

    // Marcar como inativa no banco (não deletar para manter histórico)
    const { error: updateError } = await supabaseAdmin
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
    console.error('Erro ao remover instância:', error)
    return NextResponse.json(
      { error: 'Erro ao remover instância', details: (error as Error).message },
      { status: 500 }
    )
  }
}