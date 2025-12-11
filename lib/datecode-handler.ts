import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from './supabase'
import { hasAvailableConsultas, consumeConsultas, getConsultasBalance } from './permissions'
import { getDatecodeCredentials, createDatecodeAuthHeader, validateDatecodeCredentials } from './datecode'

export type TipoPessoa = 'PF' | 'PJ'

export interface DatecodeRequestParams {
  document?: string
  tipoPessoa: TipoPessoa
  nomeRazao?: string
  cidade?: string
  uf?: string
  cep?: string
  numeroEndereco?: string
  numeroTelefone?: string
  email?: string
  dataNascimentoAbertura?: string
  placaVeiculo?: string
}

export interface DatecodeResult {
  success: boolean
  data?: any
  usage?: {
    consultasRealizadas: number
    limiteConsultas: number
    consultasRestantes: number
  }
  error?: string
  status?: number
}

/**
 * Verifies user plan access and consultas availability
 */
export async function verifyUserPlanAccess(
  userId: string | number,
  requiredConsultas: number = 1
): Promise<{ allowed: boolean; userPlan?: any; error?: string; status?: number }> {
  const { data: userPlan, error: planError } = await getSupabaseAdmin()
    .from('view_usuarios_planos')
    .select('*')
    .eq('id', userId)
    .single()

  if (planError || !userPlan) {
    return {
      allowed: false,
      error: 'Usuario nao encontrado ou sem plano ativo',
      status: 404
    }
  }

  // Check if user has available consultas
  if (!hasAvailableConsultas(userPlan, requiredConsultas)) {
    const consultasRestantes = getConsultasBalance(userPlan)
    return {
      allowed: false,
      userPlan,
      error: `Limite de consultas excedido. Consultas restantes: ${consultasRestantes}`,
      status: 429
    }
  }

  return { allowed: true, userPlan }
}

/**
 * Validates and gets datecode credentials for a workspace
 */
export async function getValidatedCredentials(
  workspaceId: string
): Promise<{ valid: boolean; credentials?: any; error?: string }> {
  const credentials = await getDatecodeCredentials(workspaceId)

  if (!validateDatecodeCredentials(credentials)) {
    return {
      valid: false,
      error: 'Credenciais Datecode nao configuradas. Configure no menu Usuarios.'
    }
  }

  return { valid: true, credentials }
}

/**
 * Makes a request to Datecode API
 */
export async function makeDatacodeRequest(
  params: DatecodeRequestParams,
  credentials: any
): Promise<{ success: boolean; data?: any; status?: number; error?: string }> {
  const requestBody: any = {
    tipoPessoa: params.tipoPessoa.toUpperCase()
  }

  // Add document if provided (cleaned)
  if (params.document) {
    requestBody.document = params.document.replace(/[^\d]/g, '')
  }

  // Add optional fields if provided
  if (params.nomeRazao) requestBody.nomeRazao = params.nomeRazao
  if (params.cidade) requestBody.cidade = params.cidade
  if (params.uf) requestBody.uf = params.uf.toUpperCase()
  if (params.cep) requestBody.cep = params.cep.replace(/[^\d]/g, '')
  if (params.numeroEndereco) requestBody.numeroEndereco = params.numeroEndereco
  if (params.numeroTelefone) requestBody.numeroTelefone = params.numeroTelefone.replace(/[^\d]/g, '')
  if (params.email) requestBody.email = params.email
  if (params.dataNascimentoAbertura) requestBody.dataNascimentoAbertura = params.dataNascimentoAbertura
  if (params.placaVeiculo) requestBody.placaVeiculo = params.placaVeiculo.toUpperCase()

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
    return {
      success: false,
      data,
      status: response.status,
      error: 'Erro na consulta Datecode'
    }
  }

  return { success: true, data }
}

/**
 * Consumes consultas and returns updated usage stats
 */
export async function consumeAndGetUsage(
  userId: string | number,
  quantidade: number = 1
): Promise<{ consultasRealizadas: number; limiteConsultas: number; consultasRestantes: number }> {
  const supabaseAdmin = getSupabaseAdmin()
  await consumeConsultas(Number(userId), quantidade, supabaseAdmin)

  // Get updated user data directly from users table (avoid view cache)
  const { data: updatedUserData } = await getSupabaseAdmin()
    .from('users')
    .select('consultas_realizadas, limite_consultas')
    .eq('id', userId)
    .single()

  const consultasRealizadas = updatedUserData?.consultas_realizadas || 0
  const limiteConsultas = updatedUserData?.limite_consultas || 0
  const consultasRestantes = limiteConsultas - consultasRealizadas

  return { consultasRealizadas, limiteConsultas, consultasRestantes }
}

/**
 * Full datecode consultation handler - combines all steps
 */
export async function handleDatecodeConsulta(
  userId: string | number,
  workspaceId: string,
  params: DatecodeRequestParams,
  options: { checkAccess?: boolean } = { checkAccess: true }
): Promise<DatecodeResult> {
  try {
    // Step 1: Verify user access if required
    if (options.checkAccess) {
      const accessResult = await verifyUserPlanAccess(userId)
      if (!accessResult.allowed) {
        return {
          success: false,
          error: accessResult.error,
          status: accessResult.status
        }
      }
    }

    // Step 2: Get and validate credentials from workspace
    const credentialsResult = await getValidatedCredentials(workspaceId)
    if (!credentialsResult.valid) {
      return {
        success: false,
        error: credentialsResult.error,
        status: 403
      }
    }

    // Step 3: Make the API request
    const apiResult = await makeDatacodeRequest(params, credentialsResult.credentials)
    if (!apiResult.success) {
      return {
        success: false,
        data: apiResult.data,
        error: apiResult.error,
        status: apiResult.status
      }
    }

    // Step 4: Consume consulta and get usage
    const usage = await consumeAndGetUsage(userId)

    return {
      success: true,
      data: apiResult.data,
      usage
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro interno do servidor',
      status: 500
    }
  }
}
