/**
 * Biblioteca de funções para integração com Profile API
 * Gerencia credenciais por usuário
 */

import { getSupabaseAdmin } from './supabase'

/**
 * Busca a API Key do Profile do usuário na tabela configuracoes_credenciais
 *
 * @param userId - ID do usuário
 * @returns API Key do Profile ou null se não encontrada
 */
export async function getProfileApiKey(userId: number): Promise<string | null> {
  try {
    // Buscar credenciais do usuário na tabela configuracoes_credenciais
    const { data, error } = await getSupabaseAdmin()
      .from('configuracoes_credenciais')
      .select('apikeydados')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar API Key do Profile:', error)
      return null
    }

    // Se encontrou a API Key e está válida
    if (data && data.apikeydados && data.apikeydados.trim() !== '') {
      console.log(`Usando API Key do Profile para usuário ${userId}`)
      return data.apikeydados
    }

    // API Key não encontrada ou vazia
    console.error(`API Key do Profile não encontrada ou vazia para usuário ${userId}`)
    return null

  } catch (error) {
    console.error('Erro ao obter API Key do Profile:', error)
    return null
  }
}

/**
 * Verifica se a API Key do Profile é válida
 *
 * @param apiKey - API Key para validar
 * @returns true se válida, false caso contrário
 */
export function validateProfileApiKey(apiKey: string | null): boolean {
  return !!(apiKey && apiKey.trim() !== '')
}
