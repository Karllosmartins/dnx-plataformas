// =====================================================
// WEBHOOK HANDLER - EVOLUTION API
// Processar eventos recebidos via webhook da Evolution API
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

// =====================================================
// POST - Processar webhook da Evolution API
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { event, instance, data } = body

    if (!event || !instance) {
      return NextResponse.json(
        { error: 'Evento ou instância não informados' },
        { status: 400 }
      )
    }

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'qrcode.updated':
        await handleQRCodeUpdated(instance, data)
        break

      case 'connection.update':
        await handleConnectionUpdate(instance, data)
        break

      case 'messages.upsert':
        await handleMessageReceived(instance, data)
        break

      case 'messages.update':
        await handleMessageUpdate(instance, data)
        break

      case 'contacts.upsert':
        await handleContactUpdate(instance, data)
        break

      case 'presence.update':
        await handlePresenceUpdate(instance, data)
        break

      default:

    }

    // Registrar webhook no banco (opcional - para auditoria)
    await getSupabaseAdmin()
      .from('webhook_logs')
      .insert({
        instance_name: instance,
        event_type: event,
        event_data: data,
        processed_at: new Date().toISOString()
      })
      .select()

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso'
    })

  } catch (error) {

    // Log do erro no banco
    try {
      await getSupabaseAdmin()
        .from('webhook_errors')
        .insert({
          instance_name: (await request.json())?.instance || 'unknown',
          error_message: (error as Error).message,
          error_details: JSON.stringify(error),
          occurred_at: new Date().toISOString()
        })
    } catch (logError) {

    }

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
 * QR Code atualizado - atualizar status da instância
 */
async function handleQRCodeUpdated(instanceName: string, data: any) {
  try {
    // Atualizar status da instância para "conectado" quando QR code for escaneado
    await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .update({
        status_conexao: 'conectado',
        ultimo_ping: new Date().toISOString()
      })
      .eq('instancia', instanceName)

  } catch (error) {

  }
}

/**
 * Status de conexão atualizado
 */
async function handleConnectionUpdate(instanceName: string, data: any) {
  try {
    const { state } = data

    let statusConexao: 'conectado' | 'desconectado' | 'erro' = 'desconectado'
    
    switch (state) {
      case 'open':
        statusConexao = 'conectado'
        break
      case 'close':
      case 'connecting':
        statusConexao = 'desconectado'
        break
      default:
        statusConexao = 'erro'
    }

    // Atualizar status no banco
    await getSupabaseAdmin()
      .from('instancias_whatsapp')
      .update({
        status_conexao: statusConexao,
        ultimo_ping: new Date().toISOString()
      })
      .eq('instancia', instanceName)

  } catch (error) {

  }
}

/**
 * Nova mensagem recebida
 */
async function handleMessageReceived(instanceName: string, data: any) {
  try {
    // Processar mensagens recebidas
    const messages = Array.isArray(data) ? data : [data]

    for (const message of messages) {
      const { key, message: messageContent, messageTimestamp } = message

      // Ignorar mensagens próprias
      if (key.fromMe) continue

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

        continue
      }

      // Extrair número do remetente
      const senderNumber = key.remoteJid.replace('@s.whatsapp.net', '')
      
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
            nome: messageContent?.pushName || 'Nome não informado',
            cpf: '00000000000', // Placeholder - será atualizado depois
            telefone: senderNumber,
            origem: 'WhatsApp',
            status_atual: 'novo_lead'
          })
          .select()
          .single()

        if (novoLeadError) {

          continue
        }

        lead = novoLead
      }

      // Registrar mensagem recebida (opcional - criar tabela mensagens)

      // Aqui você pode adicionar lógica para:
      // - Resposta automática
      // - Processamento com IA
      // - Atualização do status do lead
    }

  } catch (error) {

  }
}

/**
 * Mensagem atualizada (enviada, entregue, lida)
 */
async function handleMessageUpdate(instanceName: string, data: any) {
  try {
    // Processar atualizações de status das mensagens

  } catch (error) {

  }
}

/**
 * Contato atualizado
 */
async function handleContactUpdate(instanceName: string, data: any) {
  try {
    // Processar atualizações de contatos

  } catch (error) {

  }
}

/**
 * Status de presença atualizado (online, offline, typing)
 */
async function handlePresenceUpdate(instanceName: string, data: any) {
  try {
    // Processar atualizações de presença

  } catch (error) {

  }
}

// =====================================================
// GET - Healthcheck do webhook
// =====================================================
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook Evolution API ativo',
    timestamp: new Date().toISOString()
  })
}