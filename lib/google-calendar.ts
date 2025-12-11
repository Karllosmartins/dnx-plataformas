import { supabase } from './supabase'

interface GoogleCalendarCredentials {
  email: string
  refresh_token: string
  client_id?: string
  client_secret?: string
}

/**
 * Obtém um access token válido do Google Calendar
 * Se o access token estiver expirado, renova automaticamente usando o refresh token
 */
export async function getGoogleCalendarAccessToken(
  workspaceId: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  // Buscar credenciais do workspace
  const { data, error } = await supabase
    .from('credencias_diversas')
    .select('google_calendar')
    .eq('workspace_id', workspaceId)
    .single()

  if (error || !data) {
    throw new Error('Credenciais do Google Calendar não encontradas')
  }

  const credentials: GoogleCalendarCredentials =
    typeof data.google_calendar === 'string'
      ? JSON.parse(data.google_calendar)
      : data.google_calendar

  if (!credentials.refresh_token) {
    throw new Error('Refresh token não encontrado')
  }

  // Trocar refresh token por novo access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: credentials.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json()
    console.error('Erro ao renovar token:', errorData)
    throw new Error('Falha ao renovar access token')
  }

  const tokens = await tokenResponse.json()
  return tokens.access_token
}

/**
 * Cria um evento no Google Calendar
 */
export async function createCalendarEvent(
  workspaceId: string,
  clientId: string,
  clientSecret: string,
  eventData: {
    summary: string
    description?: string
    start: string // ISO 8601 format
    end: string // ISO 8601 format
    attendees?: string[] // Array de emails
  }
) {
  const accessToken = await getGoogleCalendarAccessToken(workspaceId, clientId, clientSecret)

  const event = {
    summary: eventData.summary,
    description: eventData.description || '',
    start: {
      dateTime: eventData.start,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: eventData.end,
      timeZone: 'America/Sao_Paulo',
    },
    attendees: eventData.attendees?.map(email => ({ email })) || [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  }

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Erro ao criar evento:', errorData)
    throw new Error('Falha ao criar evento no Google Calendar')
  }

  return await response.json()
}

/**
 * Lista eventos do Google Calendar
 */
export async function listCalendarEvents(
  workspaceId: string,
  clientId: string,
  clientSecret: string,
  options?: {
    timeMin?: string // ISO 8601 format
    timeMax?: string // ISO 8601 format
    maxResults?: number
  }
) {
  const accessToken = await getGoogleCalendarAccessToken(workspaceId, clientId, clientSecret)

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: (options?.maxResults || 10).toString(),
  })

  if (options?.timeMin) params.append('timeMin', options.timeMin)
  if (options?.timeMax) params.append('timeMax', options.timeMax)

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Erro ao listar eventos:', errorData)
    throw new Error('Falha ao listar eventos do Google Calendar')
  }

  return await response.json()
}

/**
 * Deleta um evento do Google Calendar
 */
export async function deleteCalendarEvent(
  workspaceId: string,
  clientId: string,
  clientSecret: string,
  eventId: string
) {
  const accessToken = await getGoogleCalendarAccessToken(workspaceId, clientId, clientSecret)

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Erro ao deletar evento:', errorData)
    throw new Error('Falha ao deletar evento do Google Calendar')
  }

  return true
}
