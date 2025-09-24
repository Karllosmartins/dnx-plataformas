import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      document,
      tipoPessoa,
      nomeRazao,
      cidade,
      uf,
      cep,
      numeroEndereco,
      numeroTelefone,
      email,
      dataNascimentoAbertura,
      placaVeiculo,
      userId
    } = body

    console.log('API Datecode Consulta: Dados recebidos:', body)

    if (!document || !tipoPessoa || !userId) {
      return NextResponse.json(
        { error: 'Documento, tipoPessoa e userId são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar limite do usuário
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

    // Verificar se o usuário tem acesso ao enriquecimento
    if (!userPlan.acesso_enriquecimento) {
      return NextResponse.json(
        { error: 'Usuário não tem acesso ao enriquecimento de dados' },
        { status: 403 }
      )
    }

    // Verificar limite de consultas do usuário
    const { data: consultasRealizadas, error: consultaError } = await getSupabaseAdmin()
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .ilike('origem', '%Consulta Individual%')

    if (consultaError) {
      console.error('Erro ao contar consultas realizadas:', consultaError)
    }

    const totalConsultas = consultasRealizadas?.length || 0
    const limiteConsultas = userPlan.limite_consultas || 0

    if (totalConsultas >= limiteConsultas && limiteConsultas > 0) {
      return NextResponse.json(
        {
          error: 'Limite de consultas excedido',
          details: `Você já realizou ${totalConsultas} consultas. Seu limite é ${limiteConsultas}.`
        },
        { status: 429 }
      )
    }

    // Remover caracteres especiais do documento
    const documentoLimpo = document.replace(/[^\d]/g, '')
    console.log('API Datecode Consulta: Documento limpo:', documentoLimpo)

    // Obter credenciais do ambiente
    const username = process.env.DATECODE_USERNAME
    const password = process.env.DATECODE_PASSWORD

    console.log('API Datecode Consulta: Credenciais disponíveis:', {
      username: username ? 'OK' : 'MISSING',
      password: password ? 'OK' : 'MISSING'
    })

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Credenciais do Datecode não configuradas' },
        { status: 500 }
      )
    }

    // Fazer requisição para API do Datecode
    const requestBody: any = {
      document: documentoLimpo,
      tipoPessoa: tipoPessoa.toUpperCase()
    }

    // Adicionar campos opcionais se fornecidos
    if (nomeRazao) requestBody.nomeRazao = nomeRazao
    if (cidade) requestBody.cidade = cidade
    if (uf) requestBody.uf = uf.toUpperCase()
    if (cep) requestBody.cep = cep.replace(/[^\d]/g, '')
    if (numeroEndereco) requestBody.numeroEndereco = numeroEndereco
    if (numeroTelefone) requestBody.numeroTelefone = numeroTelefone.replace(/[^\d]/g, '')
    if (email) requestBody.email = email
    if (dataNascimentoAbertura) requestBody.dataNascimentoAbertura = dataNascimentoAbertura
    if (placaVeiculo) requestBody.placaVeiculo = placaVeiculo.toUpperCase()

    console.log('API Datecode Consulta: Enviando requisição:', requestBody)

    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('API Datecode Consulta: Status da resposta:', response.status)

    const data = await response.json()
    console.log('API Datecode Consulta: Dados recebidos:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.log('API Datecode Consulta: Erro na consulta:', { status: response.status, data })
      return NextResponse.json(
        { error: 'Erro na consulta Datecode', details: data },
        { status: response.status }
      )
    }

    // Registrar consulta no banco para controle de limite (não salvar os dados, apenas contar)
    try {
      await getSupabaseAdmin()
        .from('leads')
        .insert({
          user_id: userId,
          nome_cliente: nomeRazao || 'Consulta Individual',
          cpf_cnpj: documentoLimpo,
          origem: 'Consulta Individual',
          status_limpa_nome: 'consulta_realizada',
          observacoes_limpa_nome: `Consulta individual ${tipoPessoa} realizada`,
          created_at: new Date().toISOString()
        })

      console.log('Consulta registrada para controle de limite')
    } catch (error) {
      console.error('Erro ao registrar consulta:', error)
      // Não interromper o fluxo por erro de logging
    }

    return NextResponse.json({
      success: true,
      data: data,
      usage: {
        consultasRealizadas: totalConsultas + 1,
        limiteConsultas: limiteConsultas,
        consultasRestantes: limiteConsultas > 0 ? Math.max(0, limiteConsultas - totalConsultas - 1) : 'Ilimitadas'
      }
    })

  } catch (error) {
    console.error('Erro na API Datecode Consulta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}