import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { requireAdmin } from '../../../../lib/auth-utils'

export const dynamic = 'force-dynamic'

// GET - Listar todas as tools (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verificar se é admin
    const adminError = await requireAdmin(request)
    if (adminError) return adminError

    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, type, nome, descricao')
      .order('nome')

    if (error) throw error

    return NextResponse.json({ success: true, data: tools || [] })
  } catch (error) {
    console.error('Erro ao listar tools:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar tools' },
      { status: 500 }
    )
  }
}
