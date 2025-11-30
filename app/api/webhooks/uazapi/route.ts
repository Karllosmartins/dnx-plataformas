// =====================================================
// WEBHOOK HANDLER - UAZAPI
// Processar eventos recebidos via webhook da UAZAPI
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

// =====================================================
// Tipos de eventos UAZAPI
// =====================================================
type UazapiEvent =
  | 'qrcode'           // QR Code gerado/atualizado
  | 'connected'        // Instância conectada
  | 'disconnected'     // Instância desconectada
  | 'messages'         // Nova mensagem recebida
  | 'messages_read'    // Mensagem foi lida
  | 'messages_status'  // Status da mensagem (enviado, entregue, lido)
  | 'calls'            // Chamada recebida/perdida
  | 'groups'           // Eventos de grupos
  | 'contacts'         // Eventos de contatos

interface UazapiWebhookPayload {
  event: UazapiEvent
  instanceId: string
  instanceName: string
  data: any
  timestamp?: string
}

// =====================================================
// POST - Processar webhook da UAZAPI
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body: UazapiWebhookPayload = await request.json()

    const { event, instanceId, instanceName, data } = body

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não informado' },
        { status: 400 }
      )
    }

    // Identificar instância pelo nome ou ID
    const instanceIdentifier = instanceName || instanceId

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'qrcode':
        await handleQRCode(instanceIdentifier, data)
        break

      case 'connected':
        await handleConnected(instanceIdentifier, data)
        break

      case 'disconnected':
        await handleDisconnected(instanceIdentifier, data)
        break

      case 'messages':
        await handleMessageReceived(instanceIdentifier, data)
        break

      case 'messages_read':
        await handleMessagesRead(instanceIdentifier, data)
        break

      case 'messages_status':
        await handleMessageStatus(instanceIdentifier, data)
        break

      case 'calls':
        await handleCalls(instanceIdentifier, data)
        break

      case 'groups':
        await handleGroups(instanceIdentifier, data)
        break

      case 'contacts':
        await handleContacts(instanceIdentifier, data)
        break

      default:
        // Log de evento desconhecido
        console.log(`Evento UAZAPI desconhecido: ${event}`)
    }

    // Registrar webhook no banco (para auditoria)
    try {
      await getSupabaseAdmin()
        .from('webhook_logs')
        .insert({
          instance_name: instanceIdentifier,
          event_type: event,
          event_data: data,
          processed_at: new Date().toISOString()
        })
    } catch (logError) {
      // Ignorar erros de log
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar webhook UAZAPI:', error)

    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// =====================================================
// HANDLERS PARA DIFERENTES EVENTOS
// =====================================================

/**
 * QR Code gerado/atualizado
 */
async function handleQRCode(instanceName: string, data: any) {
  try {
    // Atualizar status da instância para "conectando"
    await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .update({
        status_conexao: 'conectando',
        ultimo_ping: new Date().toISOString()
      })
      .eq('instancia', instanceName)

  } catch (error) {
    console.error('Erro ao processar QR Code:', error)
  }
}

/**
 * Instância conectada
 */
async function handleConnected(instanceName: string, data: any) {
  try {
    // Atualizar status da instância para "conectado"
    await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .update({
        status_conexao: 'conectado',
        ultimo_ping: new Date().toISOString()
      })
      .eq('instancia', instanceName)

  } catch (error) {
    console.error('Erro ao processar conexão:', error)
  }
}

/**
 * Instância desconectada
 */
async function handleDisconnected(instanceName: string, data: any) {
  try {
    // Atualizar status da instância para "desconectado"
    await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .update({
        status_conexao: 'desconectado',
        ultimo_ping: new Date().toISOString()
      })
      .eq('instancia', instanceName)

  } catch (error) {
    console.error('Erro ao processar desconexão:', error)
  }
}

/**
 * Nova mensagem recebida
 */
async function handleMessageReceived(instanceName: string, data: any) {
  try {
    // Estrutura da mensagem UAZAPI
    const {
      key,          // { id, remoteJid, fromMe }
      message,      // Conteúdo da mensagem
      messageType,  // text, image, video, audio, document, etc
      pushName,     // Nome do remetente
      timestamp
    } = data

    // Ignorar mensagens próprias
    if (key?.fromMe) return

    // Buscar instância e usuário
    const { data: instancia, error: instanciaError } = await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .select(`
        *,
        users (*)
      `)
      .eq('instancia', instanceName)
      .eq('ativo', true)
      .single()

    if (instanciaError || !instancia) {
      console.error('Instância não encontrada:', instanceName)
      return
    }

    // Extrair número do remetente
    const senderNumber = key?.remoteJid?.replace('@s.whatsapp.net', '')?.replace('@c.us', '') || ''

    if (!senderNumber) return

    // Buscar ou criar lead
    let { data: lead, error: leadError } = await getSupabaseAdmin()
      .from('leads_limpa_nome')
      .select('*')
      .eq('user_id', instancia.user_id)
      .eq('telefone', senderNumber)
      .single()

    // Se lead não existe, criar novo
    if (leadError || !lead) {
      const { data: novoLead, error: novoLeadError } = await getSupabaseAdmin()
        .from('leads_limpa_nome')
        .insert({
          user_id: instancia.user_id,
          workspace_id: instancia.workspace_id,
          nome: pushName || 'Nome não informado',
          cpf: '00000000000',
          telefone: senderNumber,
          origem: 'WhatsApp',
          status_atual: 'novo_lead'
        })
        .select()
        .single()

      if (novoLeadError) {
        console.error('Erro ao criar lead:', novoLeadError)
        return
      }

      lead = novoLead
    }

    // Aqui você pode adicionar lógica para:
    // - Resposta automática
    // - Processamento com IA
    // - Atualização do status do lead
    // - Salvar histórico de mensagens

  } catch (error) {
    console.error('Erro ao processar mensagem recebida:', error)
  }
}

/**
 * Mensagens foram lidas
 */
async function handleMessagesRead(instanceName: string, data: any) {
  try {
    // Processar confirmação de leitura
    // data contém: { keys: [{ id, remoteJid, fromMe }] }
  } catch (error) {
    console.error('Erro ao processar leitura de mensagens:', error)
  }
}

/**
 * Status da mensagem atualizado (enviado, entregue, lido)
 */
async function handleMessageStatus(instanceName: string, data: any) {
  try {
    // Processar atualização de status
    // data contém: { key: { id, remoteJid }, status: 'DELIVERY_ACK' | 'READ' | 'PLAYED' }
  } catch (error) {
    console.error('Erro ao processar status de mensagem:', error)
  }
}

/**
 * Chamada recebida/perdida
 */
async function handleCalls(instanceName: string, data: any) {
  try {
    // Processar eventos de chamadas
    // data contém informações sobre a chamada
  } catch (error) {
    console.error('Erro ao processar chamada:', error)
  }
}

/**
 * Eventos de grupos
 */
async function handleGroups(instanceName: string, data: any) {
  try {
    // Processar eventos de grupos
    // data contém informações sobre o grupo
  } catch (error) {
    console.error('Erro ao processar evento de grupo:', error)
  }
}

/**
 * Eventos de contatos
 */
async function handleContacts(instanceName: string, data: any) {
  try {
    // Processar eventos de contatos
    // data contém informações sobre o contato
  } catch (error) {
    console.error('Erro ao processar evento de contato:', error)
  }
}

// =====================================================
// GET - Healthcheck do webhook
// =====================================================
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook UAZAPI ativo',
    timestamp: new Date().toISOString()
  })
}
