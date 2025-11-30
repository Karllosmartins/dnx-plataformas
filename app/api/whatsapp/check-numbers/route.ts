// =====================================================
// API ROUTE - VERIFICAR NÚMEROS WHATSAPP
// Verificar se números possuem WhatsApp via UAZAPI
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import { createUazapiInstance } from '../../../../lib/uazapi'

// =====================================================
// POST - Verificar números
// =====================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instanceId, numbers } = body

    if (!instanceId) {
      return NextResponse.json(
        { error: 'instanceId é obrigatório' },
        { status: 400 }
      )
    }

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json(
        { error: 'numbers deve ser um array não vazio de números' },
        { status: 400 }
      )
    }

    // Limitar quantidade de números por requisição (máximo 100)
    if (numbers.length > 100) {
      return NextResponse.json(
        { error: 'Máximo de 100 números por requisição' },
        { status: 400 }
      )
    }

    // Buscar instância no banco
    const { data: instancia, error: instanciaError } = await getSupabaseAdmin()
      .from('instancia_whtats')
      .select('*')
      .eq('id', instanceId)
      .single()

    if (instanciaError || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada' },
        { status: 404 }
      )
    }

    // Se é API oficial, não suporta verificação de números
    if (instancia.is_official_api) {
      return NextResponse.json(
        { error: 'API oficial do WhatsApp não suporta verificação de números' },
        { status: 400 }
      )
    }

    // Verificar credenciais
    if (!instancia.apikey || !instancia.baseurl) {
      return NextResponse.json(
        { error: 'Instância não possui credenciais configuradas' },
        { status: 400 }
      )
    }

    // Criar cliente UAZAPI
    const uazapiClient = createUazapiInstance(instancia.apikey, instancia.baseurl)

    // Verificar números
    const result = await uazapiClient.checkNumbers(numbers)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao verificar números' },
        { status: 500 }
      )
    }

    // Formatar resposta
    const checkResults = Array.isArray(result.data) ? result.data : []

    return NextResponse.json({
      success: true,
      data: checkResults.map((item: { query: string; jid: string; isInWhatsapp: boolean; verifiedName?: string }) => ({
        number: item.query,
        jid: item.jid,
        isInWhatsapp: item.isInWhatsapp,
        verifiedName: item.verifiedName || null
      }))
    })

  } catch (error) {
    console.error('Erro ao verificar números:', error)

    return NextResponse.json(
      { error: 'Erro ao verificar números', details: (error as Error).message },
      { status: 500 }
    )
  }
}
