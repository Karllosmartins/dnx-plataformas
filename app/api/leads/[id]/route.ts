import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Buscar lead por ID com nome do agente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    // Buscar lead
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Buscar nome do agente se Agente_ID existir
    let nomeAgente = null
    if (lead.Agente_ID) {
      const { data: agente } = await supabase
        .from('agentes_ia')
        .select('nome')
        .eq('agente_id', lead.Agente_ID)
        .eq('workspace_id', lead.workspace_id)
        .single()

      nomeAgente = agente?.nome || null
    }

    return NextResponse.json({
      success: true,
      data: {
        ...lead,
        nome_agente: nomeAgente
      }
    })
  } catch (error) {
    console.error('Erro ao buscar lead:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar lead' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar lead (inclui toggle de atendimento finalizado)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseAdmin()

    // Verificar se lead existe
    const { data: existingLead, error: findError } = await supabase
      .from('leads')
      .select('id, workspace_id')
      .eq('id', id)
      .single()

    if (findError || !existingLead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Campos permitidos para atualização
    if (body.atendimentofinalizado !== undefined) {
      updateData.atendimentofinalizado = body.atendimentofinalizado
    }
    if (body.Agente_ID !== undefined) {
      updateData.Agente_ID = body.Agente_ID
    }
    if (body.nome_cliente !== undefined) {
      updateData.nome_cliente = body.nome_cliente
    }
    if (body.telefone !== undefined) {
      updateData.telefone = body.telefone
    }
    if (body.email !== undefined) {
      updateData.email = body.email
    }
    if (body.cpf_cnpj !== undefined) {
      updateData.cpf_cnpj = body.cpf_cnpj
    }
    if (body.estagio_id !== undefined) {
      updateData.estagio_id = body.estagio_id
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }

    // Atualizar lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar lead:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar lead' },
        { status: 500 }
      )
    }

    // Buscar nome do agente para retornar junto
    let nomeAgente = null
    if (updatedLead.Agente_ID) {
      const { data: agente } = await supabase
        .from('agentes_ia')
        .select('nome')
        .eq('agente_id', updatedLead.Agente_ID)
        .eq('workspace_id', updatedLead.workspace_id)
        .single()

      nomeAgente = agente?.nome || null
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedLead,
        nome_agente: nomeAgente
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar lead:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar lead' },
      { status: 500 }
    )
  }
}
