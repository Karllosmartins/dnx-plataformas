/**
 * Biblioteca de funções para integração com Datecode API
 * Gerencia credenciais por usuário e fallback para variáveis de ambiente
 */

import { getSupabaseAdmin } from './supabase'

export interface DatecodeCredentials {
  username: string
  password: string
}

/**
 * Busca credenciais Datecode do usuário na tabela credencias_diversas
 * Se não encontrar, tenta usar as variáveis de ambiente como fallback
 *
 * @param userId - ID do usuário
 * @returns Credenciais Datecode ou null se não encontradas
 */
export async function getDatecodeCredentials(userId: number): Promise<DatecodeCredentials | null> {
  try {
    // Buscar credenciais do usuário na tabela credencias_diversas
    const { data, error } = await getSupabaseAdmin()
      .from('credencias_diversas')
      .select('datecode')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar credenciais Datecode:', error)
      // Em caso de erro, tentar fallback
      return getDatecodeCredentialsFromEnv()
    }

    // Se encontrou credenciais do usuário e estão válidas
    if (data && data.datecode) {
      const { username, password } = data.datecode as DatecodeCredentials

      // Validar se as credenciais estão preenchidas
      if (username && password && username.trim() !== '' && password.trim() !== '') {
        console.log(`Usando credenciais Datecode do usuário ${userId}`)
        return { username, password }
      }
    }

    // Se não encontrou credenciais do usuário, usar fallback
    console.log(`Credenciais Datecode não encontradas para usuário ${userId}, usando fallback do ambiente`)
    return getDatecodeCredentialsFromEnv()

  } catch (error) {
    console.error('Erro ao obter credenciais Datecode:', error)
    return getDatecodeCredentialsFromEnv()
  }
}

/**
 * Obtém credenciais Datecode das variáveis de ambiente
 * Usado como fallback quando o usuário não tem credenciais próprias
 *
 * @returns Credenciais do ambiente ou null
 */
function getDatecodeCredentialsFromEnv(): DatecodeCredentials | null {
  const username = process.env.DATECODE_USERNAME
  const password = process.env.DATECODE_PASSWORD

  if (username && password) {
    console.log('Usando credenciais Datecode do ambiente (.env)')
    return { username, password }
  }

  console.error('Credenciais Datecode não encontradas nem no banco nem no ambiente')
  return null
}

/**
 * Cria o header de autenticação Basic para API Datecode
 *
 * @param credentials - Credenciais Datecode
 * @returns String do header Authorization
 */
export function createDatecodeAuthHeader(credentials: DatecodeCredentials): string {
  const { username, password } = credentials
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

/**
 * Verifica se as credenciais Datecode são válidas
 *
 * @param credentials - Credenciais para validar
 * @returns true se válidas, false caso contrário
 */
export function validateDatecodeCredentials(credentials: DatecodeCredentials | null): boolean {
  if (!credentials) return false

  const { username, password } = credentials
  return !!(username && password && username.trim() !== '' && password.trim() !== '')
}
