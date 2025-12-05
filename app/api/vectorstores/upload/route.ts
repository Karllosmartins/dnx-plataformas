import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

// POST - Upload arquivo para vector store
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const workspaceId = formData.get('workspaceId') as string
    const agentId = formData.get('agentId') as string

    if (!file || !workspaceId || !agentId) {
      return NextResponse.json({
        error: 'Arquivo, workspaceId e agentId são obrigatórios'
      }, { status: 400 })
    }

    // 1. Buscar token OpenAI do workspace
    const { data: config, error: configError } = await supabase
      .from('configuracoes_credenciais')
      .select('openai_api_token')
      .eq('workspace_id', workspaceId)
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
      .eq('workspace_id', workspaceId)
      .eq('agent_id', parseInt(agentId))
      .eq('is_active', true)
      .single()

    if (vectorError || !vectorStore?.vectorstore_id) {
      return NextResponse.json({
        error: 'Vector store não encontrado. Crie um vector store primeiro.'
      }, { status: 400 })
    }

    // 3. Upload do arquivo para OpenAI
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('purpose', 'assistants')

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai_api_token}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: uploadFormData
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text()

      return NextResponse.json({ 
        error: 'Erro ao fazer upload do arquivo para OpenAI' 
      }, { status: 400 })
    }

    const fileData = await uploadResponse.json()

    // 4. Adicionar arquivo ao vector store
    const vectorStoreResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStore.vectorstore_id}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai_api_token}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        file_id: fileData.id
      })
    })

    if (!vectorStoreResponse.ok) {
      const errorData = await vectorStoreResponse.text()

      return NextResponse.json({ 
        error: 'Erro ao adicionar arquivo ao vector store' 
      }, { status: 400 })
    }

    const vectorFileData = await vectorStoreResponse.json()

    return NextResponse.json({ 
      success: true,
      file: fileData,
      vectorFile: vectorFileData
    })

  } catch (error) {
    console.error('Erro no upload de arquivo:', error)
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