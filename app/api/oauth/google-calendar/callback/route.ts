import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

// Marca esta rota como dinâmica
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Detectar host e protocolo corretos
    const host = request.headers.get('host') || new URL(request.url).host
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Se usuário negou permissão
    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/integracoes?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/integracoes?error=missing_params`
      )
    }

    // Parse do state que contém as credenciais OAuth2
    const stateData = JSON.parse(decodeURIComponent(state))
    const { user_id, client_id, client_secret } = stateData

    // Trocar código de autorização por access_token e refresh_token
    const redirectUri = `${baseUrl}/api/oauth/google-calendar/callback`

    console.log('🔍 Callback - Host detectado:', host)
    console.log('🔍 Callback - Protocol:', protocol)
    console.log('🔍 Callback - Redirect URI:', redirectUri)

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('❌ Erro ao trocar código por token:', errorData)
      console.error('📋 Detalhes da requisição:')
      console.error('- Client ID:', client_id)
      console.error('- Redirect URI:', redirectUri)
      console.error('- Code:', code?.substring(0, 20) + '...')

      // Redirecionar com mais informações
      return NextResponse.redirect(
        `${baseUrl}/integracoes?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(errorData))}`
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    if (!refresh_token) {
      return NextResponse.redirect(
        `${baseUrl}/integracoes?error=no_refresh_token`
      )
    }

    // Obter informações do usuário Google para pegar o email
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    if (!userInfoResponse.ok) {
      console.error('Erro ao obter informações do usuário')
      return NextResponse.redirect(
        `${baseUrl}/integracoes?error=user_info_failed`
      )
    }

    const userInfo = await userInfoResponse.json()
    const email = userInfo.email

    // Salvar refresh_token no banco de dados
    const supabaseAdmin = getSupabaseAdmin()

    const { data: existing } = await supabaseAdmin
      .from('credencias_diversas')
      .select('id')
      .eq('user_id', parseInt(user_id))
      .single()

    const googleCalendarData = {
      email: email,
      refresh_token: refresh_token,
      client_id: client_id,
      client_secret: client_secret,
    }

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabaseAdmin
        .from('credencias_diversas')
        .update({
          google_calendar: googleCalendarData,
        })
        .eq('user_id', parseInt(user_id))

      if (updateError) throw updateError
    } else {
      // Criar novo registro
      const { error: insertError } = await supabaseAdmin
        .from('credencias_diversas')
        .insert([
          {
            user_id: parseInt(user_id),
            google_calendar: googleCalendarData,
            zapsign: { token: '', modelos: [] },
            asaas: { access_token: '' },
          },
        ])

      if (insertError) throw insertError
    }

    // Redirecionar de volta para a página de integrações com sucesso
    const successUrl = `${baseUrl}/integracoes?success=google_calendar_connected`
    console.log('✅ Redirecionando para:', successUrl)
    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.error('Erro no callback OAuth:', error)
    const host = request.headers.get('host') || new URL(request.url).host
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const errorUrl = `${protocol}://${host}/integracoes?error=server_error`
    return NextResponse.redirect(errorUrl)
  }
}
