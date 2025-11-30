import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { hasAvailableConsultas, consumeConsultas, getConsultasBalance } from '../../../../lib/permissions'
import { getDatecodeCredentials, createDatecodeAuthHeader, validateDatecodeCredentials } from '../../../../lib/datecode'

export async function POST(request: NextRequest) {
  try {
    const { cpf, userId } = await request.json()

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Se userId foi fornecido, verificar limites do workspace
    let workspaceId: string | null = null
    let limiteConsultas = 0
    let consultasRealizadas = 0

    if (userId) {
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

      workspaceId = userData.current_workspace_id

      // Buscar plano do workspace
      const { data: workspace, error: workspaceError } = await getSupabaseAdmin()
        .from('workspaces')
        .select(`
          id,
          plano_id,
          consultas_realizadas_mes,
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

      consultasRealizadas = workspace.consultas_realizadas_mes || 0
      limiteConsultas = plano.limite_consultas_mes || 0
      const consultasRestantes = limiteConsultas - consultasRealizadas

      // Verificar se o workspace tem consultas disponíveis
      if (consultasRestantes <= 0) {
        return NextResponse.json(
          {
            error: 'Limite de consultas excedido',
            details: `Seu workspace não possui consultas disponíveis. Consultas restantes: ${consultasRestantes}`
          },
          { status: 429 }
        )
      }
    }

    // Remover caracteres especiais do CPF
    const cpfLimpo = cpf.replace(/[^\d]/g, '')

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
      document: cpfLimpo,
      tipoPessoa: 'PF'
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

    // Se userId foi fornecido, consumir uma consulta do workspace
    if (userId && workspaceId) {
      // Incrementar contador de consultas do workspace
      await getSupabaseAdmin()
        .from('workspaces')
        .update({
          consultas_realizadas_mes: consultasRealizadas + 1
        })
        .eq('id', workspaceId)

      // Calcular dados atualizados
      const consultasRealizadasAtual = consultasRealizadas + 1
      const consultasRestantesAtual = limiteConsultas - consultasRealizadasAtual

      return NextResponse.json({
        ...data,
        usage: {
          consultasRealizadas: consultasRealizadasAtual,
          limiteConsultas: limiteConsultas,
          consultasRestantes: consultasRestantesAtual
        }
      })
    }

    return NextResponse.json(data)

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}