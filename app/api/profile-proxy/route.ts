import { NextRequest, NextResponse } from 'next/server'

const PROFILE_API_BASE = 'https://apiprofile.infinititi.com.br/api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const token = request.headers.get('authorization')
  
  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = token
    }

    const response = await fetch(`${PROFILE_API_BASE}${endpoint}`, {
      method: 'GET',
      headers
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Profile API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch from Profile API' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const token = request.headers.get('authorization')
  const body = await request.json()
  
  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = token
    }

    const response = await fetch(`${PROFILE_API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Profile API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch from Profile API' }, { status: 500 })
  }
}