import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getLeadsBalance, getConsultasBalance } from '../../../../lib/permissions'

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

    // Buscar dados do usuário da tabela users diretamente
    const { data: userPlan, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !userPlan) {
      console.error('Erro ao buscar dados do usuário:', error)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Calcular saldos
    const leadsRestantes = getLeadsBalance(userPlan)
    const consultasRestantes = getConsultasBalance(userPlan)

    return NextResponse.json({
      // Leads
      leadsConsumidos: userPlan.leads_consumidos || 0,
      limiteLeads: userPlan.limite_leads || 0,
      leadsRestantes: leadsRestantes,

      // Consultas
      consultasRealizadas: userPlan.consultas_realizadas || 0,
      limiteConsultas: userPlan.limite_consultas || 0,
      consultasRestantes: consultasRestantes,

      // Metadados
      ultimoReset: userPlan.ultimo_reset_contagem,
      planoNome: userPlan.plano
    })

  } catch (error) {
    console.error('Erro na API de limites:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}