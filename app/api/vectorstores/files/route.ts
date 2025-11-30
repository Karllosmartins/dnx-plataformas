import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Listar arquivos do vector store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const agentId = searchParams.get('agentId')

    if (!userId || !agentId) {
      return NextResponse.json({ error: 'userId e agentId são obrigatórios' }, { status: 400 })
    }

    // 1. Buscar token OpenAI
    const { data: config, error: configError } = await supabase
      .from('configuracoes_credenciais')
      .select('openai_api_token')
      .eq('user_id', parseInt(userId))
      .maybeSingle()

    if (configError || !config?.openai_api_token) {
      return NextResponse.json({ 
        error: 'Token OpenAI não encontrado. Configure suas credenciais primeiro.' 
      }, { status: 400 })
    }

    // 2. Buscar vector store ID
    const { data: vectorStore, error: vectorError } = await supabase
      .from('user_agent_vectorstore')
      .select('vectorstore_id')
      .eq('user_id', parseInt(userId))
      .eq('agent_id', parseInt(agentId))
      .eq('is_active', true)
      .single()

    if (vectorError || !vectorStore?.vectorstore_id) {
      return NextResponse.json({ 
        error: 'Vector store não encontrado.' 
      }, { status: 404 })
    }

    // 3. Listar arquivos do vector store
    const filesResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStore.vectorstore_id}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.openai_api_token}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    if (!filesResponse.ok) {
      const errorData = await filesResponse.text()

      return NextResponse.json({ 
        error: 'Erro ao listar arquivos do vector store' 
      }, { status: 400 })
    }

    const filesData = await filesResponse.json()

    return NextResponse.json({ 
      success: true,
      files: filesData.data || []
    })

  } catch (error) {

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Remover arquivo do vector store
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, agentId, fileId } = body

    if (!userId || !agentId || !fileId) {
      return NextResponse.json({ 
        error: 'userId, agentId e fileId são obrigatórios' 
      }, { status: 400 })
    }

    // 1. Buscar token OpenAI
    const { data: config, error: configError } = await supabase
      .from('configuracoes_credenciais')
      .select('openai_api_token')
      .eq('user_id', parseInt(userId))
      .maybeSingle()

    if (configError || !config?.openai_api_token) {
      return NextResponse.json({ 
        error: 'Token OpenAI não encontrado. Configure suas credenciais primeiro.' 
      }, { status: 400 })
    }

    // 2. Buscar vector store ID
    const { data: vectorStore, error: vectorError } = await supabase
      .from('user_agent_vectorstore')
      .select('vectorstore_id')
      .eq('user_id', parseInt(userId))
      .eq('agent_id', parseInt(agentId))
      .eq('is_active', true)
      .single()

    if (vectorError || !vectorStore?.vectorstore_id) {
      return NextResponse.json({ 
        error: 'Vector store não encontrado.' 
      }, { status: 404 })
    }

    // 3. Remover arquivo do vector store
    const deleteResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStore.vectorstore_id}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.openai_api_token}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    })

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.text()

      return NextResponse.json({ 
        error: 'Erro ao remover arquivo do vector store' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Arquivo removido com sucesso'
    })

  } catch (error) {

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}