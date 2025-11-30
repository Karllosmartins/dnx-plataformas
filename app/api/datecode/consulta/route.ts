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

    // Buscar workspace do usuário
    const { data: userData, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('current_workspace_id')
      .eq('id', userId)
      .single()

    if (userError || !userData || !userData.current_workspace_id) {
      return NextResponse.json(
        { error: 'Usuário não possui workspace ativo' },
        { status: 404 }
      )
    }

    const workspaceId = userData.current_workspace_id

    // Buscar plano do workspace
    const { data: workspace, error: workspaceError } = await getSupabaseAdmin()
      .from('workspaces')
      .select(`
        id,
        plano_id,
        planos (
          acesso_consulta,
          limite_consultas_mes
        )
      `)
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace || !workspace.planos) {
      return NextResponse.json(
        { error: 'Workspace não encontrado ou sem plano ativo' },
        { status: 404 }
      )
    }

    const plano = Array.isArray(workspace.planos) ? workspace.planos[0] : workspace.planos

    // Verificar se o workspace tem acesso às consultas
    if (!plano.acesso_consulta) {
      return NextResponse.json(
        { error: 'Seu plano não tem acesso às consultas individuais' },
        { status: 403 }
      )
    }

    // Verificar limite de consultas do workspace
    const { data: workspaceData } = await getSupabaseAdmin()
      .from('workspaces')
      .select('consultas_realizadas_mes')
      .eq('id', workspaceId)
      .single()

    const consultasRealizadas = workspaceData?.consultas_realizadas_mes || 0
    const limiteConsultas = plano.limite_consultas_mes || 0
    const consultasRestantes = limiteConsultas - consultasRealizadas

    if (consultasRestantes <= 0) {
      return NextResponse.json(
        {
          error: 'Limite de consultas excedido',
          details: `Seu workspace não possui consultas disponíveis. Consultas restantes: ${consultasRestantes}`
        },
        { status: 429 }
      )
    }

    // Remover caracteres especiais do documento (se fornecido)
    let documentoLimpo = null
    if (document) {
      documentoLimpo = document.replace(/[^\d]/g, '')
    }

    // Obter credenciais Datecode do usuário
    const credentials = await getDatecodeCredentials(userId)

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
    const requestBody: any = {
      tipoPessoa: tipoPessoa.toUpperCase() // tipoPessoa é SEMPRE obrigatório
    }

    // Adicionar documento se fornecido
    if (documentoLimpo) {
      requestBody.document = documentoLimpo
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

    // Incrementar contador de consultas do workspace
    const { error: updateError } = await getSupabaseAdmin()
      .from('workspaces')
      .update({
        consultas_realizadas_mes: consultasRealizadas + 1
      })
      .eq('id', workspaceId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao processar consulta' },
        { status: 500 }
      )
    }

    // Registrar consulta no banco para controle de limite
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
          workspace_id: workspaceId,
          user_id: userId,
          nome_cliente: nomeRazao || 'Consulta Individual',
          cpf_cnpj: documentoLimpo || null,
          origem: 'Consulta Individual',
          status_limpa_nome: 'consulta_realizada',
          observacoes_limpa_nome: `${tipoConsulta} realizada`,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      // Não interromper o fluxo por erro de logging
    }

    // Calcular dados atualizados
    const consultasRealizadasAtual = consultasRealizadas + 1
    const consultasRestantesAtual = limiteConsultas - consultasRealizadasAtual
    return NextResponse.json({
      success: true,
      data: data,
      usage: {
        consultasRealizadas: consultasRealizadasAtual,
        limiteConsultas: limiteConsultas,
        consultasRestantes: consultasRestantesAtual
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}