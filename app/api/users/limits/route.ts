import { NextRequest } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getLeadsBalance, getConsultasBalance } from '../../../../lib/permissions'
import { ApiResponse, ApiError, handleApiError } from '../../../../lib/api-utils'

// Marca esta rota como dinâmica
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      throw ApiError.badRequest('userId e obrigatorio', 'MISSING_USER_ID')
    }

    // Buscar dados do usuário da tabela users diretamente
    const { data: userPlan, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !userPlan) {
      throw ApiError.notFound('Usuario nao encontrado', 'USER_NOT_FOUND')
    }

    // Calcular saldos
    const leadsRestantes = getLeadsBalance(userPlan)
    const consultasRestantes = getConsultasBalance(userPlan)

    return ApiResponse.success({
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
    return handleApiError(error)
  }
}