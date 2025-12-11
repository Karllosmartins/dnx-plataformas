import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Listar agentes do workspace
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: agentes, error } = await supabase
      .from('agentes_ia')
      .select('id, agente_id, nome, ativo')
      .eq('workspace_id', workspaceId)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar agentes:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar agentes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: agentes || []
    })
  } catch (error) {
    console.error('Erro ao buscar agentes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
