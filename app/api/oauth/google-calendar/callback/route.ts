import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Se usuário negou permissão
    if (error) {
      return NextResponse.redirect(
        new URL(`/integracoes?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/integracoes?error=missing_params', request.url)
      )
    }

    // Parse do state que contém as credenciais OAuth2
    const stateData = JSON.parse(decodeURIComponent(state))
    const { user_id, client_id, client_secret } = stateData

    // Trocar código de autorização por access_token e refresh_token
    const redirectUri = `${new URL(request.url).origin}/api/oauth/google-calendar/callback`

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
      console.error('Erro ao trocar código por token:', errorData)
      return NextResponse.redirect(
        new URL('/integracoes?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    if (!refresh_token) {
      return NextResponse.redirect(
        new URL('/integracoes?error=no_refresh_token', request.url)
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
        new URL('/integracoes?error=user_info_failed', request.url)
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
            zapsign: { token: '', modelos: '' },
            asaas: { access_token: '' },
          },
        ])

      if (insertError) throw insertError
    }

    // Redirecionar de volta para a página de integrações com sucesso
    return NextResponse.redirect(
      new URL('/integracoes?success=google_calendar_connected', request.url)
    )
  } catch (error) {
    console.error('Erro no callback OAuth:', error)
    return NextResponse.redirect(
      new URL('/integracoes?error=server_error', request.url)
    )
  }
}
