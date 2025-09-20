import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cpf } = await request.json()
    console.log('API Datecode CPF: Recebido CPF:', cpf)

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    // Remover caracteres especiais do CPF
    const cpfLimpo = cpf.replace(/[^\d]/g, '')
    console.log('API Datecode CPF: CPF limpo:', cpfLimpo)

    // Obter credenciais do ambiente
    const username = process.env.DATECODE_USERNAME
    const password = process.env.DATECODE_PASSWORD

    console.log('API Datecode CPF: Credenciais disponíveis:', {
      username: username ? 'OK' : 'MISSING',
      password: password ? 'OK' : 'MISSING'
    })

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Credenciais do Datecode não configuradas' },
        { status: 500 }
      )
    }

    // Fazer requisição para API do Datecode
    const requestBody = {
      document: cpfLimpo,
      tipoPessoa: 'PF'
    }

    console.log('API Datecode CPF: Enviando requisição:', requestBody)

    const response = await fetch('https://api.datecode.com.br/v2/dados/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('API Datecode CPF: Status da resposta:', response.status)

    const data = await response.json()
    console.log('API Datecode CPF: Dados recebidos:', data)

    if (!response.ok) {
      console.log('API Datecode CPF: Erro na consulta:', { status: response.status, data })
      return NextResponse.json(
        { error: 'Erro na consulta Datecode', details: data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API Datecode CPF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}