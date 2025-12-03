import { NextRequest, NextResponse } from 'next/server'

const PROFILE_API_BASE = 'https://apiprofile.infinititi.com.br/api'

// Função para log com timestamp
function logDebug(method: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] 🔵 [Profile Proxy ${method}] ${message}`)
  if (data !== undefined) {
    console.log(`[${timestamp}] 🔵 [Profile Proxy ${method}] Data:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2))
  }
}

function logError(method: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] 🔴 [Profile Proxy ${method}] ${message}`)
  if (data !== undefined) {
    console.error(`[${timestamp}] 🔴 [Profile Proxy ${method}] Data:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2))
  }
}

export async function GET(request: NextRequest) {
  logDebug('GET', '>>> REQUISIÇÃO RECEBIDA <<<')

  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const token = request.headers.get('authorization')

  logDebug('GET', `Endpoint: ${endpoint}`)
  logDebug('GET', `Token presente: ${!!token}`)

  if (!endpoint) {
    logError('GET', 'Endpoint não fornecido')
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = token
    }

    const fullUrl = `${PROFILE_API_BASE}${endpoint}`
    logDebug('GET', `Chamando API Profile: ${fullUrl}`)

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers
    })

    logDebug('GET', `Status da resposta: ${response.status}`)

    const responseText = await response.text()
    logDebug('GET', `Resposta bruta (primeiros 500 chars):`, responseText.substring(0, 500))

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      logError('GET', 'Falha ao parsear resposta como JSON')
      return NextResponse.json({ error: 'Invalid JSON response from Profile API' }, { status: 500 })
    }

    logDebug('GET', '<<< REQUISIÇÃO FINALIZADA COM SUCESSO >>>')
    return NextResponse.json(data)
  } catch (error) {
    logError('GET', 'Exceção capturada:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Failed to fetch from Profile API' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  logDebug('POST', '>>> REQUISIÇÃO RECEBIDA <<<')

  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const token = request.headers.get('authorization')

  logDebug('POST', `Endpoint: ${endpoint}`)
  logDebug('POST', `Token presente: ${!!token}`)

  // Ler body bruto primeiro para debug
  let bodyText: string
  let body
  try {
    bodyText = await request.text()
    logDebug('POST', 'Body bruto (primeiros 500 chars):', bodyText.substring(0, 500))

    // Verificar se há caracteres de controle
    const controlChars = bodyText.match(/[\x00-\x1F]/g)
    if (controlChars) {
      logError('POST', `⚠️ Caracteres de controle encontrados: ${controlChars.map(c => '0x' + c.charCodeAt(0).toString(16)).join(', ')}`)
    }

    body = JSON.parse(bodyText)
    logDebug('POST', 'Payload parseado:', body)
  } catch (parseError) {
    logError('POST', 'Erro ao parsear body da requisição:', parseError instanceof Error ? parseError.message : String(parseError))
    return NextResponse.json({
      sucesso: false,
      msg: 'Erro ao processar dados da requisição'
    }, { status: 400 })
  }

  if (!endpoint) {
    logError('POST', 'Endpoint não fornecido')
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = token
    }

    const fullUrl = `${PROFILE_API_BASE}${endpoint}`
    logDebug('POST', `Chamando API Profile: ${fullUrl}`)
    logDebug('POST', 'Headers:', { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ***' : 'não definido' })

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    logDebug('POST', `Status da resposta: ${response.status}`)
    logDebug('POST', `Status Text: ${response.statusText}`)

    const responseText = await response.text()
    logDebug('POST', `Resposta bruta (primeiros 1000 chars):`, responseText.substring(0, 1000))

    // Tentar parsear como JSON
    let data
    try {
      data = JSON.parse(responseText)
      logDebug('POST', 'Resposta parseada com sucesso:', data)
    } catch {
      logError('POST', 'Falha ao parsear resposta como JSON')
      logError('POST', 'Resposta original:', responseText.substring(0, 500))
      return NextResponse.json({
        sucesso: false,
        msg: `Erro na API Profile: resposta não é JSON válido`
      }, { status: response.status })
    }

    // Se a resposta não foi OK, adicionar informação de debug
    if (!response.ok) {
      logError('POST', `Erro HTTP ${response.status}:`, data)
      return NextResponse.json({
        ...data,
        sucesso: false,
        msg: data.msg || data.message || `Erro HTTP ${response.status}`
      })
    }

    logDebug('POST', '<<< REQUISIÇÃO FINALIZADA COM SUCESSO >>>')
    return NextResponse.json(data)
  } catch (error) {
    logError('POST', 'Exceção capturada:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error) {
      logError('POST', 'Stack trace:', error.stack)
    }
    return NextResponse.json({
      sucesso: false,
      msg: 'Falha ao conectar com a API Profile: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    }, { status: 500 })
  }
}
