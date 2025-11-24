import { Router, Response } from 'express'
import { supabase } from '../lib/supabase.js'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace.js'
import fetch from 'node-fetch'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// Helper para obter credenciais Datecode do workspace
async function getDatecodeCredentials(workspaceId: string) {
  const { data, error } = await supabase
    .from('configuracoes_credenciais')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('instancia', 'datecode')
    .single()

  if (error || !data) {
    return null
  }

  return {
    usuario: data.usuario,
    senha: data.senha
  }
}

// Helper para criar header de autenticação Datecode
function createDatecodeAuthHeader(credentials: { usuario: string; senha: string }) {
  const authString = `${credentials.usuario}:${credentials.senha}`
  const base64Auth = Buffer.from(authString).toString('base64')
  return `Basic ${base64Auth}`
}

// POST /api/datecode/consulta - Realizar consulta individual
router.post('/consulta', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

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
      placaVeiculo
    } = req.body

    // Validar tipoPessoa (obrigatório)
    if (!tipoPessoa || !['PF', 'PJ'].includes(tipoPessoa)) {
      throw ApiError.badRequest('tipoPessoa (PF/PJ) é obrigatório', 'INVALID_TIPO_PESSOA')
    }

    // Validar se pelo menos um campo de busca foi fornecido
    const hasSearchCriteria = document || numeroTelefone || email || placaVeiculo ||
                               (nomeRazao && (cidade || uf || cep))

    if (!hasSearchCriteria) {
      throw ApiError.badRequest(
        'Pelo menos um campo de busca deve ser fornecido',
        'MISSING_SEARCH_CRITERIA'
      )
    }

    // Buscar plano do workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select(`
        id,
        plano_id,
        consultas_realizadas_mes,
        planos!inner (
          acesso_consulta,
          limite_consultas_mes
        )
      `)
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      logger.error({ error: workspaceError }, 'Failed to fetch workspace')
      throw ApiError.internal('Erro ao buscar informações do workspace', 'WORKSPACE_FETCH_ERROR')
    }

    const plano = Array.isArray(workspace.planos) ? workspace.planos[0] : workspace.planos

    // Verificar acesso à funcionalidade
    if (!plano?.acesso_consulta) {
      throw ApiError.forbidden(
        'Seu plano não tem acesso às consultas individuais',
        'NO_CONSULTA_ACCESS'
      )
    }

    // Verificar limite de consultas
    const consultasRealizadas = workspace.consultas_realizadas_mes || 0
    const limiteConsultas = plano.limite_consultas_mes || 0
    const consultasRestantes = limiteConsultas - consultasRealizadas

    if (consultasRestantes <= 0) {
      throw ApiError.tooManyRequests(
        `Limite de consultas excedido. Consultas restantes: ${consultasRestantes}`,
        'CONSULTAS_LIMIT_EXCEEDED'
      )
    }

    // Obter credenciais Datecode
    const credentials = await getDatecodeCredentials(workspaceId!)

    if (!credentials || !credentials.usuario || !credentials.senha) {
      throw ApiError.forbidden(
        'Credenciais Datecode não configuradas para este workspace',
        'DATECODE_CREDENTIALS_NOT_FOUND'
      )
    }

    // Preparar corpo da requisição para Datecode
    const requestBody: any = {
      tipoPessoa: tipoPessoa.toUpperCase()
    }

    // Adicionar campos opcionais
    if (document) requestBody.document = document.replace(/\D/g, '')
    if (nomeRazao) requestBody.nomeRazao = nomeRazao
    if (cidade) requestBody.cidade = cidade
    if (uf) requestBody.uf = uf.toUpperCase()
    if (cep) requestBody.cep = cep.replace(/\D/g, '')
    if (numeroEndereco) requestBody.numeroEndereco = numeroEndereco
    if (numeroTelefone) requestBody.numeroTelefone = numeroTelefone.replace(/\D/g, '')
    if (email) requestBody.email = email
    if (dataNascimentoAbertura) requestBody.dataNascimentoAbertura = dataNascimentoAbertura
    if (placaVeiculo) requestBody.placaVeiculo = placaVeiculo.toUpperCase()

    logger.info({ requestBody }, 'Sending request to Datecode API')

    // Fazer requisição para API Datecode
    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createDatecodeAuthHeader(credentials)
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error({ status: response.status, data }, 'Datecode API error')
      throw ApiError.internal('Erro na consulta Datecode', 'DATECODE_API_ERROR')
    }

    // Incrementar contador de consultas do workspace
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({
        consultas_realizadas_mes: consultasRealizadas + 1
      })
      .eq('id', workspaceId)

    if (updateError) {
      logger.error({ error: updateError }, 'Failed to update consultas counter')
      // Não interromper o fluxo, apenas logar o erro
    }

    // Registrar lead para controle
    try {
      let tipoConsulta = 'Consulta Individual'
      if (document) {
        tipoConsulta = `Consulta ${tipoPessoa}`
      } else if (numeroTelefone) {
        tipoConsulta = 'Consulta por telefone'
      } else if (email) {
        tipoConsulta = 'Consulta por email'
      } else if (placaVeiculo) {
        tipoConsulta = 'Consulta por placa'
      } else if (nomeRazao) {
        tipoConsulta = 'Consulta por nome'
      }

      await supabase
        .from('leads')
        .insert({
          workspace_id: workspaceId,
          user_id: parseInt(userId || '0'),
          nome_cliente: nomeRazao || 'Consulta Individual',
          cpf_cnpj: document ? document.replace(/\D/g, '') : null,
          origem: 'Consulta Individual',
          status_limpa_nome: 'consulta_realizada',
          observacoes_limpa_nome: `${tipoConsulta} realizada`,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      logger.error({ error }, 'Failed to register lead')
      // Não interromper o fluxo
    }

    // Retornar dados com informações de uso
    logger.info({ workspaceId, userId }, 'Consulta realizada com sucesso')

    ApiResponse.success(res, {
      data: data,
      usage: {
        consultasRealizadas: consultasRealizadas + 1,
        limiteConsultas: limiteConsultas,
        consultasRestantes: consultasRestantes - 1
      }
    })

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/datecode/cpf - Consulta rápida por CPF
router.post('/cpf', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const { cpf } = req.body

    if (!cpf) {
      throw ApiError.badRequest('CPF é obrigatório', 'MISSING_CPF')
    }

    // Buscar plano do workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select(`
        id,
        plano_id,
        consultas_realizadas_mes,
        planos!inner (
          acesso_consulta,
          limite_consultas_mes
        )
      `)
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      throw ApiError.internal('Erro ao buscar informações do workspace', 'WORKSPACE_FETCH_ERROR')
    }

    const plano = Array.isArray(workspace.planos) ? workspace.planos[0] : workspace.planos

    // Verificar acesso
    if (!plano?.acesso_consulta) {
      throw ApiError.forbidden(
        'Seu plano não tem acesso às consultas individuais',
        'NO_CONSULTA_ACCESS'
      )
    }

    // Verificar limite
    const consultasRealizadas = workspace.consultas_realizadas_mes || 0
    const limiteConsultas = plano?.limite_consultas_mes || 0
    const consultasRestantes = limiteConsultas - consultasRealizadas

    if (consultasRestantes <= 0) {
      throw ApiError.tooManyRequests(
        `Limite de consultas excedido. Consultas restantes: ${consultasRestantes}`,
        'CONSULTAS_LIMIT_EXCEEDED'
      )
    }

    // Obter credenciais
    const credentials = await getDatecodeCredentials(workspaceId!)

    if (!credentials) {
      throw ApiError.forbidden(
        'Credenciais Datecode não configuradas',
        'DATECODE_CREDENTIALS_NOT_FOUND'
      )
    }

    // Fazer requisição
    const cpfLimpo = cpf.replace(/\D/g, '')
    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': createDatecodeAuthHeader(credentials)
      },
      body: JSON.stringify({
        document: cpfLimpo,
        tipoPessoa: 'PF'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw ApiError.internal('Erro na consulta Datecode', 'DATECODE_API_ERROR')
    }

    // Incrementar contador
    await supabase
      .from('workspaces')
      .update({
        consultas_realizadas_mes: consultasRealizadas + 1
      })
      .eq('id', workspaceId)

    logger.info({ workspaceId, userId }, 'Consulta CPF realizada com sucesso')

    ApiResponse.success(res, {
      ...data,
      usage: {
        consultasRealizadas: consultasRealizadas + 1,
        limiteConsultas: limiteConsultas,
        consultasRestantes: consultasRestantes - 1
      }
    })

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router