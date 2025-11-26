import { NextRequest, NextResponse } from 'next/server'
import { getProfileApiKey } from '../../../../lib/profile'

// Marcar como dinâmico para evitar erro de pré-renderização
export const dynamic = 'force-dynamic'

/**
 * GET /api/profile/get-api-key
 * Busca a API Key do Profile para o usuário atual
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    // Buscar API Key usando função utilitária (server-side)
    const apiKey = await getProfileApiKey(parseInt(userId))

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'API Key da Profile não encontrada. Configure suas credenciais em Usuários.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ apiKey })

  } catch (error) {
    console.error('Erro ao buscar API Key do Profile:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}