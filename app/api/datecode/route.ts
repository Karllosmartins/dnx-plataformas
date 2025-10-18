import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { hasAvailableConsultas, consumeConsultas, getConsultasBalance } from '../../../lib/permissions'
import { getDatecodeCredentials, createDatecodeAuthHeader, validateDatecodeCredentials } from '../../../lib/datecode'

export async function POST(request: NextRequest) {
  try {
    const { cnpj, userId } = await request.json()
    console.log('API Datecode: Recebido CNPJ:', cnpj)

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

    // Remover caracteres especiais do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
    console.log('API Datecode: CNPJ limpo:', cnpjLimpo)

    // Obter credenciais Datecode do usuário
    const credentials = userId ? await getDatecodeCredentials(userId) : null

    console.log('API Datecode: Credenciais disponíveis:', {
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
      document: cnpjLimpo,
      tipoPessoa: 'PJ'
    }

    console.log('API Datecode: Enviando requisição:', requestBody)

    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createDatecodeAuthHeader(credentials!)
      },
      body: JSON.stringify(requestBody)
    })

    console.log('API Datecode: Status da resposta:', response.status)

    const data = await response.json()
    console.log('API Datecode: Dados recebidos:', data)

    if (!response.ok) {
      console.log('API Datecode: Erro na consulta:', { status: response.status, data })
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