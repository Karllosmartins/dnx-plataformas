import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { hasAvailableConsultas, consumeConsultas, getConsultasBalance } from '../../../../lib/permissions'
import { getDatecodeCredentials, createDatecodeAuthHeader, validateDatecodeCredentials } from '../../../../lib/datecode'

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

    // Validar campos obrigatórios
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se pelo menos um campo de busca foi fornecido
    const hasSearchCriteria = document || numeroTelefone || email || placaVeiculo ||
                               (nomeRazao && (cidade || uf || cep))

    if (!hasSearchCriteria) {
      return NextResponse.json(
        {
          error: 'Pelo menos um campo de busca deve ser fornecido',
          details: 'Forneça: documento (CPF/CNPJ), telefone, email, placa de veículo, ou nome completo com localização (cidade/UF/CEP)'
        },
        { status: 400 }
      )
    }

    // tipoPessoa é sempre obrigatório pela API Datecode
    if (!tipoPessoa) {
      return NextResponse.json(
        { error: 'tipoPessoa (PF/PJ) é obrigatório' },
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

    // Verificar se o usuário tem acesso às consultas
    if (!userPlan.acesso_consulta) {
      return NextResponse.json(
        { error: 'Usuário não tem acesso às consultas individuais' },
        { status: 403 }
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

    // Remover caracteres especiais do documento (se fornecido)
    let documentoLimpo = null
    if (document) {
      documentoLimpo = document.replace(/[^\d]/g, '')
      console.log('API Datecode Consulta: Documento limpo:', documentoLimpo)
    }

    // Obter credenciais Datecode do usuário
    const credentials = await getDatecodeCredentials(userId)

    console.log('API Datecode Consulta: Credenciais disponíveis:', {
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
    const requestBody: any = {}

    // Adicionar documento e tipoPessoa apenas se fornecidos
    if (documentoLimpo && tipoPessoa) {
      requestBody.document = documentoLimpo
      requestBody.tipoPessoa = tipoPessoa.toUpperCase()
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
        'Authorization': createDatecodeAuthHeader(credentials!)
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

    // Consumir uma consulta do usuário
    const consumeResult = await consumeConsultas(userId, 1)
    if (!consumeResult.success) {
      console.error('Erro ao consumir consulta:', consumeResult.error)
      return NextResponse.json(
        { error: 'Erro ao processar consulta' },
        { status: 500 }
      )
    }

    // Registrar consulta no banco para controle de limite (não salvar os dados, apenas contar)
    try {
      // Determinar o tipo de consulta realizada
      let tipoConsulta = 'Consulta Individual'
      if (documentoLimpo) {
        tipoConsulta = `Consulta ${tipoPessoa || 'documento'}`
      } else if (numeroTelefone) {
        tipoConsulta = 'Consulta por telefone'
      } else if (email) {
        tipoConsulta = 'Consulta por email'
      } else if (placaVeiculo) {
        tipoConsulta = 'Consulta por placa'
      } else if (nomeRazao) {
        tipoConsulta = 'Consulta por nome'
      }

      await getSupabaseAdmin()
        .from('leads')
        .insert({
          user_id: userId,
          nome_cliente: nomeRazao || 'Consulta Individual',
          cpf_cnpj: documentoLimpo || null,
          origem: 'Consulta Individual',
          status_limpa_nome: 'consulta_realizada',
          observacoes_limpa_nome: `${tipoConsulta} realizada`,
          created_at: new Date().toISOString()
        })

      console.log('Consulta registrada para controle de limite')
    } catch (error) {
      console.error('Erro ao registrar consulta:', error)
      // Não interromper o fluxo por erro de logging
    }

    // Buscar dados atualizados do usuário para retornar o saldo
    const { data: updatedUser, error: updateError } = await getSupabaseAdmin()
      .from('view_usuarios_planos')
      .select('*')
      .eq('id', userId)
      .single()

    const consultasRestantes = updatedUser ? getConsultasBalance(updatedUser) : 0

    return NextResponse.json({
      success: true,
      data: data,
      usage: {
        consultasRealizadas: (updatedUser?.consultas_realizadas || 0),
        limiteConsultas: userPlan.limite_consultas,
        consultasRestantes: consultasRestantes
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