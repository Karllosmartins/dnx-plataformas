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
  const timestamp = new Date().toISOString()
  const envApiKey = process.env.PROFILE_API_KEY

  if (envApiKey && envApiKey.trim() !== '') {
    console.log(`[${timestamp}] 🟢 [Profile] API Key encontrada (${envApiKey.substring(0, 8)}...)`)
    return envApiKey
  }

  console.error(`[${timestamp}] 🔴 [Profile] API Key NÃO encontrada nas variáveis de ambiente`)
  console.error(`[${timestamp}] 🔴 [Profile] Verifique se PROFILE_API_KEY está definida no .env`)
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
