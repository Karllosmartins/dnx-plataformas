import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

const API_PROFILE_BASE_URL = 'https://apiprofile.infinititi.com.br'

// Função para autenticar na API Profile
async function authenticateAPI(apiKey: string) {
  const response = await fetch(`${API_PROFILE_BASE_URL}/api/Auth`, {
    method: 'POST',
    headers: {
      'accept': 'text/plain',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `apiKey=${encodeURIComponent(apiKey)}`
  })

  if (!response.ok) {
    throw new Error('Falha na autenticação da API Profile')
  }

  const data = await response.json()
  return data.token
}

// GET /api/extracoes - Listar extrações do usuário (do banco local + API Profile)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const apiKey = searchParams.get('apiKey')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    // Buscar extrações do banco local
    const { data: extracoesLocal, error } = await supabase
      .from('extracoes_profile')
      .select(`
        *,
        contagem_profile (
          id,
          nome_contagem,
          total_registros,
          tipo_pessoa,
          id_contagem_api
        )
      `)
      .eq('user_id', parseInt(userId))
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Se tiver apiKey, buscar também da API Profile
    let extracoesAPI = []
    if (apiKey) {
      try {
        const token = await authenticateAPI(apiKey)
        
        const response = await fetch(`${API_PROFILE_BASE_URL}/api/Extracao/ListarExtracoes`, {
          method: 'GET',
          headers: {
            'accept': 'text/plain',
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.sucesso && data.extracoes) {
            extracoesAPI = data.extracoes
          }
        }
      } catch (error) {
        console.error('Erro ao buscar extrações da API:', error)
      }
    }

    return NextResponse.json({ 
      extracoesLocal: extracoesLocal || [],
      extracoesAPI: extracoesAPI || []
    })
  } catch (error) {
    console.error('Erro ao buscar extrações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/extracoes - Criar nova extração usando API Profile real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contagemId, userId, qtdeSolicitada = 1000, apiKey } = body

    if (!contagemId || !userId || !apiKey) {
      return NextResponse.json({ 
        error: 'contagemId, userId e apiKey são obrigatórios' 
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

    // Autenticar na API Profile
    const token = await authenticateAPI(apiKey)

    // Criar extração na API Profile usando o endpoint correto
    const extracaoPayload = {
      idContagem: contagem.id_contagem_api,
      idTipoAcesso: 3, // Conforme exemplo do N8N
      qtdeSolicitada: Math.min(qtdeSolicitada, contagem.total_registros),
      removerRegistrosExtraidos: true
    }

    const response = await fetch(`${API_PROFILE_BASE_URL}/api/Extracao/CriarExtracao`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(extracaoPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API Profile: ${response.status} - ${errorText}`)
    }

    const resultadoExtracao = await response.json()

    if (!resultadoExtracao.sucesso) {
      throw new Error(`API Profile retornou erro: ${resultadoExtracao.msg}`)
    }

    // Criar registro de extração no banco local para tracking
    const nomeArquivo = `leads_${contagem.nome_contagem.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.csv`
    const dataExpiracao = new Date()
    dataExpiracao.setDate(dataExpiracao.getDate() + 7)

    const { data: novaExtracao, error: erroExtracao } = await supabase
      .from('extracoes_profile')
      .insert([{
        user_id: userId,
        contagem_id: contagemId,
        id_extracao_api: resultadoExtracao.idExtracao,
        nome_arquivo: nomeArquivo,
        formato_arquivo: 'csv',
        total_registros_extraidos: qtdeSolicitada,
        status: 'processando',
        data_solicitacao: new Date().toISOString(),
        data_expiracao: dataExpiracao.toISOString()
      }])
      .select('*')
      .single()

    if (erroExtracao) {
      console.error('Erro ao salvar no banco local:', erroExtracao)
      // Não falhar aqui pois a extração foi criada na API Profile
    }

    return NextResponse.json({ 
      extracaoId: novaExtracao?.id,
      idExtracaoAPI: resultadoExtracao.idExtracao,
      nomeArquivo,
      status: 'processando',
      message: resultadoExtracao.msg || 'Extração criada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao criar extração:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// PUT /api/extracoes - Verificar status de extração na API Profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { extracaoId, userId, apiKey, idExtracaoAPI } = body

    if ((!extracaoId && !idExtracaoAPI) || !userId || !apiKey) {
      return NextResponse.json({ 
        error: 'extracaoId ou idExtracaoAPI, userId e apiKey são obrigatórios' 
      }, { status: 400 })
    }

    let extracaoAPIId = idExtracaoAPI

    // Se não tiver idExtracaoAPI, buscar no banco local
    if (!extracaoAPIId && extracaoId) {
      const { data: extracaoLocal, error } = await supabase
        .from('extracoes_profile')
        .select('id_extracao_api')
        .eq('id', extracaoId)
        .eq('user_id', userId)
        .single()

      if (error || !extracaoLocal?.id_extracao_api) {
        return NextResponse.json({ 
          error: 'Extração não encontrada' 
        }, { status: 404 })
      }

      extracaoAPIId = extracaoLocal.id_extracao_api
    }

    // Autenticar na API Profile
    const token = await authenticateAPI(apiKey)

    // Buscar detalhes da extração na API Profile
    const response = await fetch(
      `${API_PROFILE_BASE_URL}/api/Extracao/BuscarDetalhesExtracao?idExtracao=${extracaoAPIId}`,
      {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ 
          error: 'Extração não encontrada na API Profile' 
        }, { status: 404 })
      }
      throw new Error(`Erro na API Profile: ${response.status}`)
    }

    const detalhesExtracao = await response.json()

    if (!detalhesExtracao.sucesso) {
      throw new Error(`API Profile retornou erro: ${detalhesExtracao.msg}`)
    }

    // Atualizar status no banco local se tiver extracaoId
    if (extracaoId) {
      let statusLocal = 'processando'
      if (detalhesExtracao.status === 'Finalizada') {
        statusLocal = 'concluida'
      } else if (detalhesExtracao.status === 'Erro' || detalhesExtracao.status === 'Cancelada') {
        statusLocal = 'erro'
      }

      await supabase
        .from('extracoes_profile')
        .update({
          status: statusLocal,
          data_conclusao: detalhesExtracao.dataFinalizacao ? new Date(detalhesExtracao.dataFinalizacao).toISOString() : null
        })
        .eq('id', extracaoId)
        .eq('user_id', userId)
    }

    return NextResponse.json({ 
      extracao: detalhesExtracao,
      downloadDisponivel: detalhesExtracao.status === 'Finalizada'
    })

  } catch (error) {
    console.error('Erro ao buscar status da extração:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// DELETE /api/extracoes/download - Fazer download da extração
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { idExtracaoAPI, apiKey } = body

    if (!idExtracaoAPI || !apiKey) {
      return NextResponse.json({ 
        error: 'idExtracaoAPI e apiKey são obrigatórios' 
      }, { status: 400 })
    }

    // Autenticar na API Profile
    const token = await authenticateAPI(apiKey)

    // Fazer download da extração
    const response = await fetch(
      `${API_PROFILE_BASE_URL}/api/Extracao/DownloadExtracao?idExtracao=${idExtracaoAPI}`,
      {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ 
          error: 'Arquivo de extração não encontrado' 
        }, { status: 404 })
      }
      throw new Error(`Erro no download: ${response.status}`)
    }

    // Retornar o arquivo como stream
    const fileBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || `extracao_${idExtracaoAPI}.csv`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Erro ao fazer download da extração:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro no download' 
    }, { status: 500 })
  }
}