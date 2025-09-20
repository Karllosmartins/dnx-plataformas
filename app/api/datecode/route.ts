import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cnpj } = await request.json()

    if (!cnpj) {
      return NextResponse.json(
        { error: 'CNPJ é obrigatório' },
        { status: 400 }
      )
    }

    // Remover caracteres especiais do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '')

    // Obter credenciais do ambiente
    const username = process.env.DATECODE_USERNAME
    const password = process.env.DATECODE_PASSWORD

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Credenciais do Datecode não configuradas' },
        { status: 500 }
      )
    }

    // Fazer requisição para API do Datecode
    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify({
        cnpj: cnpjLimpo
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro na consulta Datecode', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API Datecode:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}