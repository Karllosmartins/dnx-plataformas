import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// GET /api/extracoes - Listar extrações do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const { data: extracoes, error } = await supabase
      .from('extracoes_profile')
      .select(`
        *,
        contagem_profile (
          id,
          nome_contagem,
          total_registros,
          tipo_pessoa
        )
      `)
      .eq('user_id', parseInt(userId))
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ extracoes })
  } catch (error) {
    console.error('Erro ao buscar extrações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/extracoes - Criar nova extração
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contagemId, userId, formatoArquivo = 'csv', apiToken } = body

    if (!contagemId || !userId || !apiToken) {
      return NextResponse.json({ 
        error: 'contagemId, userId e apiToken são obrigatórios' 
      }, { status: 400 })
    }

    // Buscar contagem no banco
    const { data: contagem, error: erroContagem } = await supabase
      .from('contagens_profile')
      .select('*')
      .eq('id', contagemId)
      .eq('user_id', userId)
      .single()

    if (erroContagem || !contagem) {
      return NextResponse.json({ 
        error: 'Contagem não encontrada' 
      }, { status: 404 })
    }

    // Criar registro de extração no banco
    const nomeArquivo = `leads_${contagem.nome_contagem.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.${formatoArquivo}`
    const dataExpiracao = new Date()
    dataExpiracao.setDate(dataExpiracao.getDate() + 7) // Expira em 7 dias

    const { data: novaExtracao, error: erroExtracao } = await supabase
      .from('extracoes_profile')
      .insert([{
        user_id: userId,
        contagem_id: contagemId,
        nome_arquivo: nomeArquivo,
        formato_arquivo: formatoArquivo,
        total_registros_extraidos: contagem.total_registros,
        status: 'solicitada',
        data_solicitacao: new Date().toISOString(),
        data_expiracao: dataExpiracao.toISOString()
      }])
      .select('*')
      .single()

    if (erroExtracao) {
      throw erroExtracao
    }

    // Processar extração em background
    processarExtracao(novaExtracao.id, contagem, apiToken, formatoArquivo)

    return NextResponse.json({ 
      extracaoId: novaExtracao.id,
      nomeArquivo,
      status: 'solicitada',
      message: 'Extração solicitada com sucesso! Você será notificado quando estiver pronta.'
    })

  } catch (error) {
    console.error('Erro ao criar extração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Função para processar extração em background
async function processarExtracao(extracaoId: number, contagem: any, apiToken: string, formatoArquivo: string) {
  try {
    // Atualizar status para processando
    await supabase
      .from('extracoes_profile')
      .update({ status: 'processando' })
      .eq('id', extracaoId)

    // Definir endpoint com base no tipo de pessoa
    const endpoint = contagem.tipo_pessoa === 'pf' 
      ? '/ExtrairPf/ExtrairCsv' 
      : '/ExtrairPj/ExtrairCsv'

    // Fazer requisição para a API Profile
    const response = await fetch(`https://plataforma.profile.net.br/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idContagem: contagem.id_contagem_api,
        formato: formatoArquivo
      })
    })

    if (!response.ok) {
      throw new Error(`API Profile error: ${response.status}`)
    }

    const resultadoExtracao = await response.json()

    if (resultadoExtracao.sucesso && resultadoExtracao.urlDownload) {
      // Extração bem-sucedida
      await supabase
        .from('extracoes_profile')
        .update({
          status: 'concluida',
          url_download: resultadoExtracao.urlDownload,
          data_conclusao: new Date().toISOString(),
          tamanho_arquivo: resultadoExtracao.tamanhoArquivo || null,
          id_extracao_api: resultadoExtracao.idExtracao || null
        })
        .eq('id', extracaoId)
    } else {
      // Erro na extração
      await supabase
        .from('extracoes_profile')
        .update({
          status: 'erro',
          data_conclusao: new Date().toISOString()
        })
        .eq('id', extracaoId)
    }

  } catch (error) {
    console.error('Erro ao processar extração:', error)
    
    // Marcar como erro
    await supabase
      .from('extracoes_profile')
      .update({
        status: 'erro',
        data_conclusao: new Date().toISOString()
      })
      .eq('id', extracaoId)
  }
}

// PUT /api/extracoes - Atualizar status de extração (para polling)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { extracaoId, userId } = body

    if (!extracaoId || !userId) {
      return NextResponse.json({ 
        error: 'extracaoId e userId são obrigatórios' 
      }, { status: 400 })
    }

    const { data: extracao, error } = await supabase
      .from('extracoes_profile')
      .select('*')
      .eq('id', extracaoId)
      .eq('user_id', userId)
      .single()

    if (error || !extracao) {
      return NextResponse.json({ 
        error: 'Extração não encontrada' 
      }, { status: 404 })
    }

    return NextResponse.json({ extracao })

  } catch (error) {
    console.error('Erro ao buscar status da extração:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}