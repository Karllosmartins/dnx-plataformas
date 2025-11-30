import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '../../../lib/supabase'

const API_PROFILE_BASE_URL = 'https://apiprofile.infinititi.com.br'

// Marcar como dinâmico para evitar erro de pré-renderização
export const dynamic = 'force-dynamic'

// Função para validar e converter data do formato brasileiro
function parseDataFinalizacao(dataStr: string | null | undefined): string | null {
  if (!dataStr) return null

  try {
    // Converter formato brasileiro "26/09/2025 13:57:05" para formato ISO
    if (dataStr.includes('/')) {
      // Formato: DD/MM/YYYY HH:MM:SS
      const [datePart, timePart] = dataStr.split(' ')
      const [day, month, year] = datePart.split('/')

      // Criar data no formato ISO: YYYY-MM-DD HH:MM:SS
      const isoDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timePart ? ' ' + timePart : ''}`
      const date = new Date(isoDateStr)

      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return null
      }

      return date.toISOString()
    } else {
      // Tentar formato ISO direto
      const date = new Date(dataStr)

      if (isNaN(date.getTime())) {
        return null
      }

      return date.toISOString()
    }
  } catch (error) {
    return null
  }
}

// Função para autenticar na API Profile - ATUALIZADA PARA JSON
async function authenticateAPI(apiKey: string) {
  const payload = { apiKey: apiKey }
  const response = await fetch(`${API_PROFILE_BASE_URL}/api/Auth`, {
    method: 'POST',
    headers: {
      'accept': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha na autenticação da API Profile: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.token
}

// GET /api/extracoes - Listar extrações do workspace (do banco local + API Profile)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const workspaceId = searchParams.get('workspaceId')
    const apiKey = searchParams.get('apiKey')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    // Determinar workspace_id
    let wsId = workspaceId ? parseInt(workspaceId) : null
    if (!wsId) {
      const { data: userData } = await getSupabaseAdmin()
        .from('users')
        .select('current_workspace_id')
        .eq('id', parseInt(userId))
        .single()
      wsId = userData?.current_workspace_id || null
    }

    // Buscar extrações do banco local - filtrar por workspace_id se disponível
    let query = supabase
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

    // Usar workspace_id se disponível, senão fallback para user_id
    if (wsId) {
      query = query.eq('workspace_id', wsId)
    } else {
      query = query.eq('user_id', parseInt(userId))
    }

    const { data: extracoesLocal, error } = await query.order('created_at', { ascending: false })

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
      }
    }

    return NextResponse.json({ 
      extracoesLocal: extracoesLocal || [],
      extracoesAPI: extracoesAPI || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/extracoes - EXATAMENTE COMO NO N8N
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contagemId, userId, qtdeSolicitada = 1000, idTipoAcesso = 3, removerRegistrosExtraidos = true, apiKey } = body

    if (!contagemId || !userId || !apiKey) {
      return NextResponse.json({
        error: 'contagemId, userId e apiKey são obrigatórios'
      }, { status: 400 })
    }

    // Buscar workspace do usuário
    const { data: userData, error: userError } = await getSupabaseAdmin()
      .from('users')
      .select('current_workspace_id')
      .eq('id', userId)
      .single()

    if (userError || !userData || !userData.current_workspace_id) {
      return NextResponse.json(
        { error: 'Usuário não possui workspace ativo' },
        { status: 404 }
      )
    }

    const workspaceId = userData.current_workspace_id

    // Buscar workspace (extração usa limite_consultas)
    const { data: workspace, error: workspaceError } = await getSupabaseAdmin()
      .from('workspaces')
      .select('id, plano_id, consultas_realizadas, limite_consultas')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace não encontrado' },
        { status: 404 }
      )
    }

    // 1. Buscar contagem no banco para pegar o ID da API Profile
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

    // Calcular quantidade real de leads que serão extraídos
    const quantidadeReal = Math.min(qtdeSolicitada, contagem.total_registros)

    // Verificar limite de consultas do workspace (extração usa consultas)
    const consultasRealizadas = workspace.consultas_realizadas || 0
    const limiteConsultas = workspace.limite_consultas || 0
    const consultasRestantes = limiteConsultas - consultasRealizadas

    if (consultasRestantes < quantidadeReal) {
      return NextResponse.json(
        {
          error: 'Consultas insuficientes',
          details: `Você solicitou ${quantidadeReal} registros, mas possui apenas ${consultasRestantes} consultas disponíveis.`
        },
        { status: 429 }
      )
    }

    // 2. Autenticar para pegar token - EXATAMENTE COMO N8N "Busca Senha2"
    const token = await authenticateAPI(apiKey)

    // 3. Criar extração - EXATAMENTE COMO N8N "Criar extração"
    const extracaoPayload = {
      idContagem: contagem.id_contagem_api,
      idTipoAcesso: idTipoAcesso,
      qtdeSolicitada: quantidadeReal,
      removerRegistrosExtraidos: removerRegistrosExtraidos
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
      throw new Error(`API Profile retornou erro: ${response.status} - ${errorText}`)
    }

    const resultadoExtracao = await response.json()

    if (!resultadoExtracao.sucesso) {
      throw new Error(`API Profile: ${resultadoExtracao.msg}`)
    }

    // Incrementar contador de consultas realizadas do workspace
    const { error: updateError } = await getSupabaseAdmin()
      .from('workspaces')
      .update({
        consultas_realizadas: consultasRealizadas + quantidadeReal
      })
      .eq('id', workspaceId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao processar extração de leads' },
        { status: 500 }
      )
    }

    // 4. Salvar no banco local (opcional, para tracking)
    const nomeArquivo = `leads_${contagem.nome_contagem.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.csv`

    // Buscar o workspace.id (uuid) a partir do workspace (que usa id inteiro)
    const { data: workspaceData } = await getSupabaseAdmin()
      .from('workspaces')
      .select('id')
      .eq('id', workspace.id)
      .single()

    const { data: novaExtracao } = await supabase
      .from('extracoes_profile')
      .insert([{
        user_id: userId,
        workspace_id: workspaceData?.id || null,
        contagem_id: contagemId,
        id_extracao_api: resultadoExtracao.idExtracao,
        nome_arquivo: nomeArquivo,
        formato_arquivo: 'csv',
        total_registros_extraidos: quantidadeReal,
        status: 'processando',
        data_solicitacao: new Date().toISOString()
      }])
      .select('*')
      .single()

    // Calcular dados atualizados
    const consultasRealizadasAtual = consultasRealizadas + quantidadeReal
    const consultasRestantesAtual = limiteConsultas - consultasRealizadasAtual

    // 5. Retornar resultado
    return NextResponse.json({
      extracaoId: novaExtracao?.id,
      idExtracaoAPI: resultadoExtracao.idExtracao,
      nomeArquivo,
      status: 'processando',
      message: 'Extração criada com sucesso!',
      usage: {
        consultasRealizadas: consultasRealizadasAtual,
        consultasRestantes: consultasRestantesAtual,
        quantidadeExtraida: quantidadeReal
      }
    })

  } catch (error) {
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

    // Log para debug da data
    // Atualizar status no banco local se tiver extracaoId
    if (extracaoId) {
      let statusLocal = 'processando'
      if (detalhesExtracao.status === 'Processado' || detalhesExtracao.status === 'Finalizada') {
        statusLocal = 'concluida'
      } else if (detalhesExtracao.status === 'Erro' || detalhesExtracao.status === 'Cancelada') {
        statusLocal = 'erro'
      }

      await supabase
        .from('extracoes_profile')
        .update({
          status: statusLocal,
          data_conclusao: parseDataFinalizacao(detalhesExtracao.dataFinalizacao)
        })
        .eq('id', extracaoId)
        .eq('user_id', userId)
    }

    return NextResponse.json({ 
      extracao: detalhesExtracao,
      downloadDisponivel: detalhesExtracao.status === 'Processado' || detalhesExtracao.status === 'Finalizada'
    })

  } catch (error) {
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
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro no download' 
    }, { status: 500 })
  }
}