import { NextRequest, NextResponse } from 'next/server'

const API_PROFILE_BASE_URL = 'https://apiprofile.infinititi.com.br'

// Função para autenticar na API Profile - ATUALIZADA PARA JSON
async function authenticateAPI(apiKey: string) {
  const response = await fetch(`${API_PROFILE_BASE_URL}/api/Auth`, {
    method: 'POST',
    headers: {
      'accept': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ apiKey: apiKey })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha na autenticação da API Profile: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.token
}

// GET /api/extracoes/download - Fazer download da extração
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idExtracaoAPI = searchParams.get('idExtracao')
    const apiKey = searchParams.get('apiKey')

    if (!idExtracaoAPI || !apiKey) {
      return NextResponse.json({ 
        error: 'idExtracao e apiKey são obrigatórios' 
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
    const contentType = response.headers.get('content-type') || 'text/csv'
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