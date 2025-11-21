import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { hasAvailableConsultas, consumeConsultas, getConsultasBalance } from '../../../lib/permissions'
import { getDatecodeCredentials, createDatecodeAuthHeader, validateDatecodeCredentials } from '../../../lib/datecode'
import { ApiError, handleApiError } from '../../../lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { cnpj, userId } = await request.json()

    if (!cnpj) {
      throw ApiError.badRequest('CNPJ e obrigatorio', 'MISSING_CNPJ')
    }

    // Se userId foi fornecido, verificar limites do usuário
    if (userId) {
      const { data: userPlan, error: planError } = await getSupabaseAdmin()
        .from('view_usuarios_planos')
        .select('*')
        .eq('id', userId)
        .single()

      if (planError || !userPlan) {
        throw ApiError.notFound('Usuario nao encontrado ou sem plano ativo', 'USER_NOT_FOUND')
      }

      // Verificar se o usuário tem consultas disponíveis
      if (!hasAvailableConsultas(userPlan, 1)) {
        const consultasRestantes = getConsultasBalance(userPlan)
        throw new ApiError(
          429,
          `Limite de consultas excedido. Consultas restantes: ${consultasRestantes}`,
          'RATE_LIMIT_EXCEEDED'
        )
      }
    }

    // Remover caracteres especiais do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '')

    // Obter credenciais Datecode do usuário
    const credentials = userId ? await getDatecodeCredentials(userId) : null

    if (!validateDatecodeCredentials(credentials)) {
      throw ApiError.forbidden(
        'Voce precisa cadastrar suas credenciais Datecode no menu Usuarios antes de realizar consultas.',
        'CREDENTIALS_NOT_CONFIGURED'
      )
    }

    // Fazer requisição para API do Datecode
    const requestBody = {
      document: cnpjLimpo,
      tipoPessoa: 'PJ'
    }

    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createDatecodeAuthHeader(credentials!)
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Erro na consulta Datecode', details: data },
        { status: response.status }
      )
    }

    // Se userId foi fornecido, consumir uma consulta
    if (userId) {
      const supabaseAdmin = getSupabaseAdmin()
      await consumeConsultas(userId, 1, supabaseAdmin)

      // Buscar dados atualizados DIRETAMENTE da tabela users (não da view para evitar cache)
      const { data: updatedUserData } = await getSupabaseAdmin()
        .from('users')
        .select('consultas_realizadas, limite_consultas')
        .eq('id', userId)
        .single()

      const consultasRealizadas = updatedUserData?.consultas_realizadas || 0
      const limiteConsultas = updatedUserData?.limite_consultas || 0
      const consultasRestantes = limiteConsultas - consultasRealizadas

      return NextResponse.json({
        success: true,
        data: {
          ...data,
          usage: {
            consultasRealizadas: consultasRealizadas,
            limiteConsultas: limiteConsultas,
            consultasRestantes: consultasRestantes
          }
        }
      })
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    return handleApiError(error)
  }
}