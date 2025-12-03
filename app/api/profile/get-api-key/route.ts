import { NextResponse } from 'next/server'
import { getProfileApiKey } from '../../../../lib/profile'

// Marcar como dinâmico para evitar erro de pré-renderização
export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/get-api-key
 * Retorna a API Key do Profile da variável de ambiente
 * (mesma API Key para todos os usuários)
 */
export async function GET() {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] 🔵 [get-api-key] >>> REQUISIÇÃO RECEBIDA <<<`)

  try {
    // Buscar API Key da variável de ambiente (server-side)
    const apiKey = getProfileApiKey()

    if (!apiKey || apiKey.trim() === '') {
      console.error(`[${timestamp}] 🔴 [get-api-key] API Key não encontrada ou vazia`)
      return NextResponse.json(
        { error: 'API Key da Profile não encontrada nas variáveis de ambiente' },
        { status: 404 }
      )
    }

    console.log(`[${timestamp}] 🟢 [get-api-key] API Key retornada com sucesso`)
    return NextResponse.json({ apiKey })

  } catch (error) {
    console.error(`[${timestamp}] 🔴 [get-api-key] Erro:`, error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}