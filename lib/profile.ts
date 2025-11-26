/**
 * Biblioteca de funções para integração com Profile API
 * Gerencia credenciais por usuário com fallback para variável de ambiente
 */

import { getSupabaseAdmin } from './supabase'

/**
 * Busca a API Key do Profile do usuário na tabela configuracoes_credenciais
 * Se não encontrar, usa a variável de ambiente PROFILE_API_KEY como fallback
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

    // Se encontrou a API Key no banco e está válida, usar ela
    if (!error && data && data.apikeydados && data.apikeydados.trim() !== '') {
      console.log(`Usando API Key do Profile do banco para usuário ${userId}`)
      return data.apikeydados
    }

    // Fallback: usar API Key da variável de ambiente (mesmo para todos)
    const envApiKey = process.env.PROFILE_API_KEY
    if (envApiKey && envApiKey.trim() !== '') {
      console.log(`Usando API Key do Profile da variável de ambiente para usuário ${userId}`)
      return envApiKey
    }

    // Não encontrou nem no banco nem nas variáveis de ambiente
    console.error(`API Key do Profile não encontrada nem no banco nem nas variáveis de ambiente para usuário ${userId}`)
    return null

  } catch (error) {
    console.error('Erro ao obter API Key do Profile:', error)

    // Tentar fallback mesmo em caso de erro
    const envApiKey = process.env.PROFILE_API_KEY
    if (envApiKey && envApiKey.trim() !== '') {
      console.log(`Usando API Key do Profile da variável de ambiente (fallback de erro) para usuário ${userId}`)
      return envApiKey
    }

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
