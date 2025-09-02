// =====================================================
// WEBHOOK HANDLER - EVOLUTION API
// Processar eventos recebidos via webhook da Evolution API
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// =====================================================
// POST - Processar webhook da Evolution API
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log do webhook recebido (para debugging)
    console.log('Webhook Evolution API recebido:', {
      event: body.event,
      instance: body.instance,
      timestamp: new Date().toISOString()
    })

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
        console.log(`Evento não processado: ${event}`)
    }

    // Registrar webhook no banco (opcional - para auditoria)
    await supabaseAdmin
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
    console.error('Erro ao processar webhook:', error)
    
    // Log do erro no banco
    try {
      await supabaseAdmin
        .from('webhook_errors')
        .insert({
          instance_name: (await request.json())?.instance || 'unknown',
          error_message: (error as Error).message,
          error_details: JSON.stringify(error),
          occurred_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Erro ao registrar erro do webhook:', logError)
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
    await supabaseAdmin
      .from('instancias_whatsapp')
      .update({
        status_conexao: 'conectado',
        ultimo_ping: new Date().toISOString()
      })
      .eq('instancia', instanceName)

    console.log(`QR Code atualizado para instância: ${instanceName}`)
  } catch (error) {
    console.error('Erro ao processar QR Code:', error)
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
    await supabaseAdmin
      .from('instancias_whatsapp')
      .update({
        status_conexao: statusConexao,
        ultimo_ping: new Date().toISOString()
      })
      .eq('instancia', instanceName)

    console.log(`Status de conexão atualizado: ${instanceName} -> ${statusConexao}`)
  } catch (error) {
    console.error('Erro ao atualizar conexão:', error)
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
      const { data: instancia, error: instanciaError } = await supabaseAdmin
        .from('instancias_whatsapp')
        .select(`
          *,
          users (*)
        `)
        .eq('instancia', instanceName)
        .eq('ativo', true)
        .single()

      if (instanciaError || !instancia) {
        console.warn(`Instância não encontrada: ${instanceName}`)
        continue
      }

      // Extrair número do remetente
      const senderNumber = key.remoteJid.replace('@s.whatsapp.net', '')
      
      // Buscar ou criar lead
      let { data: lead, error: leadError } = await supabaseAdmin
        .from('leads_limpa_nome')
        .select('*')
        .eq('user_id', instancia.user_id)
        .eq('telefone', senderNumber)
        .single()

      // Se lead não existe, criar novo
      if (leadError || !lead) {
        const { data: novoLead, error: novoLeadError } = await supabaseAdmin
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
          console.error('Erro ao criar lead:', novoLeadError)
          continue
        }

        lead = novoLead
      }

      // Registrar mensagem recebida (opcional - criar tabela mensagens)
      console.log(`Mensagem recebida de ${senderNumber}: ${messageContent?.conversation || 'Mídia'}`)
      
      // Aqui você pode adicionar lógica para:
      // - Resposta automática
      // - Processamento com IA
      // - Atualização do status do lead
    }

  } catch (error) {
    console.error('Erro ao processar mensagem recebida:', error)
  }
}

/**
 * Mensagem atualizada (enviada, entregue, lida)
 */
async function handleMessageUpdate(instanceName: string, data: any) {
  try {
    // Processar atualizações de status das mensagens
    console.log(`Mensagem atualizada na instância ${instanceName}:`, data)
  } catch (error) {
    console.error('Erro ao processar atualização de mensagem:', error)
  }
}

/**
 * Contato atualizado
 */
async function handleContactUpdate(instanceName: string, data: any) {
  try {
    // Processar atualizações de contatos
    console.log(`Contato atualizado na instância ${instanceName}:`, data)
  } catch (error) {
    console.error('Erro ao processar atualização de contato:', error)
  }
}

/**
 * Status de presença atualizado (online, offline, typing)
 */
async function handlePresenceUpdate(instanceName: string, data: any) {
  try {
    // Processar atualizações de presença
    console.log(`Presença atualizada na instância ${instanceName}:`, data)
  } catch (error) {
    console.error('Erro ao processar atualização de presença:', error)
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