import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Verificar se agente tem vector store
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const agentId = searchParams.get('agentId')

    if (!workspaceId || !agentId) {
      return NextResponse.json({ error: 'workspaceId e agentId são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_agent_vectorstore')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('agent_id', parseInt(agentId))
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }

    return NextResponse.json({
      hasVectorStore: !!data,
      vectorStore: data || null
    })
  } catch (error) {

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar vector store na OpenAI e salvar no banco
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, userId, agentId, vectorStoreName } = body

    if (!workspaceId || !agentId || !vectorStoreName) {
      return NextResponse.json({
        error: 'workspaceId, agentId e vectorStoreName são obrigatórios'
      }, { status: 400 })
    }

    // 1. Buscar token OpenAI do workspace
    const { data: config, error: configError } = await supabase
      .from('configuracoes_credenciais')
      .select('openai_api_token')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (configError) {

      return NextResponse.json({ 
        error: `Erro ao buscar configuração: ${configError.message}` 
      }, { status: 400 })
    }

    if (!config?.openai_api_token) {

      return NextResponse.json({ 
        error: 'Token OpenAI não encontrado. Configure suas credenciais primeiro.' 
      }, { status: 400 })
    }

    // 2. Criar vector store na OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/vector_stores', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai_api_token}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: vectorStoreName
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()

      return NextResponse.json({ 
        error: 'Erro ao criar vector store na OpenAI' 
      }, { status: 400 })
    }

    const vectorStoreData = await openaiResponse.json()

    // 3. Verificar se já existe um registro para esse workspace/agent
    const { data: existingRecord } = await supabase
      .from('user_agent_vectorstore')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('agent_id', parseInt(agentId))
      .maybeSingle()

    let savedData
    let saveError

    if (existingRecord) {
      // Atualizar registro existente
      const result = await supabase
        .from('user_agent_vectorstore')
        .update({
          vectorstore_id: vectorStoreData.id,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .eq('agent_id', parseInt(agentId))
        .select()
        .maybeSingle()

      savedData = result.data
      saveError = result.error
    } else {
      // Inserir novo registro
      const insertData: Record<string, unknown> = {
        workspace_id: workspaceId,
        agent_id: parseInt(agentId),
        vectorstore_id: vectorStoreData.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Adicionar user_id se fornecido
      if (userId) {
        insertData.user_id = userId
      }

      const result = await supabase
        .from('user_agent_vectorstore')
        .insert(insertData)
        .select()
        .maybeSingle()

      savedData = result.data
      saveError = result.error
    }

    if (saveError) {
      console.error('Erro ao salvar no banco:', JSON.stringify(saveError, null, 2))
      // Se falhou ao salvar, tentar deletar o vector store da OpenAI
      try {
        await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.openai_api_token}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        })
      } catch (cleanupError) {
        console.error('Erro ao limpar vector store da OpenAI:', cleanupError)
      }
      return NextResponse.json({
        error: 'Erro ao salvar no banco de dados',
        details: saveError.message || saveError.code || JSON.stringify(saveError)
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      vectorStore: savedData,
      openaiData: vectorStoreData
    })

  } catch (error) {
    console.error('Erro na criação de vector store:', error)
    const errorMessage = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null)
        ? JSON.stringify(error)
        : String(error)

    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: errorMessage
    }, { status: 500 })
  }
}

// PUT - Ativar/desativar vector store
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, agentId, isActive } = body

    if (!workspaceId || !agentId || typeof isActive !== 'boolean') {
      return NextResponse.json({
        error: 'workspaceId, agentId e isActive são obrigatórios'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_agent_vectorstore')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('workspace_id', workspaceId)
      .eq('agent_id', parseInt(agentId))
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true,
      vectorStore: data
    })

  } catch (error) {

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar vector store da OpenAI e do banco
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, agentId, vectorStoreId } = body

    if (!workspaceId || !agentId || !vectorStoreId) {
      return NextResponse.json({
        error: 'workspaceId, agentId e vectorStoreId são obrigatórios'
      }, { status: 400 })
    }

    // 1. Buscar token OpenAI do workspace
    const { data: config, error: configError } = await supabase
      .from('configuracoes_credenciais')
      .select('openai_api_token')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (configError) {

      return NextResponse.json({ 
        error: `Erro ao buscar configuração: ${configError.message}` 
      }, { status: 400 })
    }

    // 2. Deletar vector store da OpenAI (se token disponível)
    if (config?.openai_api_token) {
      try {
        const openaiResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.openai_api_token}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        })

        if (!openaiResponse.ok) {

        }
      } catch (openaiError) {

      }
    }

    // 3. Deletar do banco de dados
    const { error: deleteError } = await supabase
      .from('user_agent_vectorstore')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('agent_id', parseInt(agentId))
      .eq('vectorstore_id', vectorStoreId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vector Store deletado com sucesso'
    })

  } catch (error) {

    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}