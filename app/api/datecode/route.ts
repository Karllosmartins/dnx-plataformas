import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { hasAvailableConsultas, consumeConsultas, getConsultasBalance } from '../../../lib/permissions'
import { getDatecodeCredentials, createDatecodeAuthHeader, validateDatecodeCredentials } from '../../../lib/datecode'

export async function POST(request: NextRequest) {
  try {
    const { cnpj, userId } = await request.json()

    if (!cnpj) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      )
    }

    // Se userId foi fornecido, verificar limites do usuário
    if (userId) {
      const { data: userPlan, error: planError } = await getSupabaseAdmin()
        .from('view_usuarios_planos')
        .select('*')
        .eq('id', userId)
        .single()

      if (planError || !userPlan) {
        return NextResponse.json(
          { error: 'Usuário não encontrado ou sem plano ativo' },
          { status: 404 }
        )
      }

      // Verificar se o usuário tem consultas disponíveis
      if (!hasAvailableConsultas(userPlan, 1)) {
        const consultasRestantes = getConsultasBalance(userPlan)
        return NextResponse.json(
          {
            error: 'Limite de consultas excedido',
            details: `Você não possui consultas disponíveis. Consultas restantes: ${consultasRestantes}`
          },
          { status: 429 }
        )
      }
    }

    // Remover caracteres especiais do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '')

    // Obter credenciais Datecode do usuário
    const credentials = userId ? await getDatecodeCredentials(userId) : null

    if (!validateDatecodeCredentials(credentials)) {
      return NextResponse.json(
        {
          error: 'Credenciais Datecode não configuradas',
          message: 'Você precisa cadastrar suas credenciais Datecode no menu Usuários antes de realizar consultas.'
        },
        { status: 403 }
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
        { error: 'Erro na consulta Datecode', details: data },
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
        ...data,
        usage: {
          consultasRealizadas: consultasRealizadas,
          limiteConsultas: limiteConsultas,
          consultasRestantes: consultasRestantes
        }
      })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API Datecode:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}