/**
 * Biblioteca de funções para integração com Profile API
 * Usa variável de ambiente PROFILE_API_KEY (mesma para todos os usuários)
 */

/**
 * Busca a API Key do Profile da variável de ambiente
 *
 * @returns API Key do Profile ou null se não encontrada
 */
export function getProfileApiKey(): string | null {
  const envApiKey = process.env.PROFILE_API_KEY

  if (envApiKey && envApiKey.trim() !== '') {
    console.log('Usando API Key do Profile da variável de ambiente')
    return envApiKey
  }

  console.error('API Key do Profile não encontrada nas variáveis de ambiente')
  return null
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
