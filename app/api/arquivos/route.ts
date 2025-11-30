import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// Helper para obter workspace_id do usuário
async function getUserWorkspaceId(userId: string): Promise<number | null> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('users')
    .select('current_workspace_id')
    .eq('id', parseInt(userId))
    .single()

  return data?.current_workspace_id || null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Determinar workspace_id - usar o passado ou buscar o atual do usuário
    let wsId = workspaceId ? parseInt(workspaceId) : await getUserWorkspaceId(userId)

    if (!wsId) {
      return NextResponse.json(
        { error: 'Usuário não possui workspace ativo' },
        { status: 404 }
      )
    }

    // Filtrar arquivos pelo workspace_id
    const { data, error } = await supabase
      .from('arquivos')
      .select('*')
      .eq('workspace_id', wsId)
      .order('id', { ascending: false })

    if (error) {
      // Se a coluna workspace_id não existir, usar fallback por user_id
      if (error.message.includes('workspace_id')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('arquivos')
          .select('*')
          .eq('user_id', parseInt(userId))
          .order('id', { ascending: false })

        if (fallbackError) {
          return NextResponse.json(
            { error: 'Erro ao buscar arquivos' },
            { status: 500 }
          )
        }
        return NextResponse.json({ data: fallbackData })
      }

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
    const workspaceId = searchParams.get('workspaceId')

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

    // Determinar workspace_id
    let wsId = workspaceId ? parseInt(workspaceId) : await getUserWorkspaceId(userId)

    // Verificar se o arquivo pertence ao workspace do usuário
    const { data: arquivo } = await supabase
      .from('arquivos')
      .select('workspace_id, user_id')
      .eq('id', id)
      .single()

    if (!arquivo) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão: deve pertencer ao workspace OU ao user_id (fallback)
    const hasAccess = arquivo.workspace_id === wsId || arquivo.user_id === parseInt(userId)

    if (!hasAccess) {
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
