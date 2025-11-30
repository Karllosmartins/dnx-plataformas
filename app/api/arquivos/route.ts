import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // SEMPRE filtrar por user_id - cada usuário vê apenas seus próprios arquivos
    const { data, error } = await supabase
      .from('arquivos')
      .select('*')
      .eq('user_id', parseInt(userId))
      .order('id', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar arquivos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
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

    // Verificar se o arquivo pertence ao usuário
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

    const { error } = await supabase.from('arquivos').delete().eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar arquivo' },
      { status: 500 }
    )
  }
}
