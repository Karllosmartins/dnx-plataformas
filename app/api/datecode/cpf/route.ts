import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { hasAvailableConsultas, consumeConsultas, getConsultasBalance } from '../../../../lib/permissions'
import { getDatecodeCredentials, createDatecodeAuthHeader, validateDatecodeCredentials } from '../../../../lib/datecode'

export async function POST(request: NextRequest) {
  try {
    const { cpf, userId } = await request.json()
    console.log('API Datecode CPF: Recebido CPF:', cpf)

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
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
        console.error('Erro ao buscar plano do usuário:', planError)
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

    // Remover caracteres especiais do CPF
    const cpfLimpo = cpf.replace(/[^\d]/g, '')
    console.log('API Datecode CPF: CPF limpo:', cpfLimpo)

    // Obter credenciais Datecode do usuário
    const credentials = userId ? await getDatecodeCredentials(userId) : null

    console.log('API Datecode CPF: Credenciais disponíveis:', {
      userId: userId || 'não fornecido',
      found: !!credentials,
      valid: validateDatecodeCredentials(credentials)
    })

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
      document: cpfLimpo,
      tipoPessoa: 'PF'
    }

    console.log('API Datecode CPF: Enviando requisição:', requestBody)

    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createDatecodeAuthHeader(credentials!)
      },
      body: JSON.stringify(requestBody)
    })

    console.log('API Datecode CPF: Status da resposta:', response.status)

    const data = await response.json()
    console.log('API Datecode CPF: Dados recebidos:', data)

    if (!response.ok) {
      console.log('API Datecode CPF: Erro na consulta:', { status: response.status, data })
      return NextResponse.json(
        { error: 'Erro na consulta Datecode', details: data },
        { status: response.status }
      )
    }

    // Se userId foi fornecido, consumir uma consulta
    if (userId) {
      const supabaseAdmin = getSupabaseAdmin()
      const consumeResult = await consumeConsultas(userId, 1, supabaseAdmin)
      if (!consumeResult.success) {
        console.error('Erro ao consumir consulta:', consumeResult.error)
        // Não interromper o fluxo por erro de consumo
      }

      // Buscar dados atualizados do usuário
      const { data: updatedUser } = await getSupabaseAdmin()
        .from('view_usuarios_planos')
        .select('*')
        .eq('id', userId)
        .single()

      const consultasRestantes = updatedUser ? getConsultasBalance(updatedUser) : 0

      return NextResponse.json({
        ...data,
        usage: {
          consultasRealizadas: (updatedUser?.consultas_realizadas || 0),
          consultasRestantes: consultasRestantes
        }
      })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API Datecode CPF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}