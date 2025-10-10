import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

async function getUserFromToken() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
    const { payload } = await jwtVerify(token, secret)

    return {
      userId: payload.userId as string,
      role: payload.role as string,
    }
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('arquivos')
      .select('*')
      .order('id', { ascending: false })

    if (user.role !== 'admin') {
      query = query.eq('user_id', parseInt(user.userId))
    }

    const { data, error } = await query

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
    const user = await getUserFromToken()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do arquivo é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    if (user.role !== 'admin') {
      const { data: arquivo } = await supabase
        .from('arquivos')
        .select('user_id')
        .eq('id', id)
        .single()

      if (!arquivo || arquivo.user_id !== parseInt(user.userId)) {
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
