import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    console.log('[GET /api/arquivos] userId:', userId, 'role:', role)

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('arquivos')
      .select('*')
      .order('id', { ascending: false })

    // Apenas admin vê todos os arquivos
    // Qualquer outro role ou undefined filtra por user_id
    if (role !== 'admin') {
      console.log('[GET /api/arquivos] Filtrando por user_id:', userId)
      query = query.eq('user_id', parseInt(userId))
    } else {
      console.log('[GET /api/arquivos] Admin - mostrando todos os arquivos')
    }

    const { data, error } = await query

    console.log('[GET /api/arquivos] Retornando', data?.length || 0, 'arquivos')

    if (error) {
      console.error('Erro ao buscar arquivos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar arquivos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar arquivos' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do arquivo é obrigatório' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Se não for admin, verificar se o arquivo pertence ao usuário
    if (role !== 'admin') {
      const { data: arquivo } = await supabase
        .from('arquivos')
        .select('user_id')
        .eq('id', id)
        .single()

      if (!arquivo || arquivo.user_id !== parseInt(userId)) {
        return NextResponse.json(
          { error: 'Não autorizado a deletar este arquivo' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase.from('arquivos').delete().eq('id', id)

    if (error) {
      console.error('Erro ao deletar arquivo:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo' },
      { status: 500 }
    )
  }
}
