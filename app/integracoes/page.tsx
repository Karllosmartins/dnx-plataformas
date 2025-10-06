'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { supabase } from '../../lib/supabase'
import {
  Plug,
  FileText,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Save,
  AlertCircle
} from 'lucide-react'

interface Credentials {
  google_calendar: {
    email: string
    refresh_token: string
    client_id?: string
    client_secret?: string
  }
  asaas: {
    access_token: string
  }
  zapsign: {
    token: string
    modelos: string
  }
}

export default function IntegracoesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<Credentials>({
    google_calendar: { email: '', refresh_token: '' },
    asaas: { access_token: '' },
    zapsign: { token: '', modelos: '' }
  })
  const [editingZapSign, setEditingZapSign] = useState(false)
  const [zapSignForm, setZapSignForm] = useState({ token: '', modelos: '' })
  const [editingAsaas, setEditingAsaas] = useState(false)
  const [asaasForm, setAsaasForm] = useState({ access_token: '' })
  const [successMessage, setSuccessMessage] = useState('')

  // Credenciais OAuth2 do Google (variáveis de ambiente)
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || ''

  useEffect(() => {
    if (user) {
      fetchCredentials()
    }

    // Verificar parâmetros de sucesso/erro na URL
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'google_calendar_connected') {
      setSuccessMessage('Google Calendar conectado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 5000)
      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/integracoes')
    }

    if (error) {
      const details = urlParams.get('details')
      const errorMessages: Record<string, string> = {
        'token_exchange_failed': 'Erro ao trocar código por token. Verifique suas credenciais.',
        'no_refresh_token': 'Não foi possível obter refresh token. Tente novamente.',
        'missing_params': 'Parâmetros obrigatórios ausentes.',
        'server_error': 'Erro no servidor. Tente novamente mais tarde.',
        'access_denied': 'Acesso negado pelo usuário.'
      }

      // Mostrar detalhes do erro se disponível
      let errorMessage = errorMessages[error] || 'Erro ao conectar com Google Calendar'
      if (details) {
        try {
          const detailsObj = JSON.parse(details)
          errorMessage += `\n\nDetalhes técnicos:\n${JSON.stringify(detailsObj, null, 2)}`
          console.error('Detalhes do erro OAuth:', detailsObj)
        } catch (e) {
          // Ignorar erro de parse
        }
      }

      alert(errorMessage)
      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/integracoes')
    }
  }, [user])

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('credencias_diversas')
        .select('*')
        .eq('user_id', parseInt(user?.id || '0'))
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        // Parse dos JSONBs
        setCredentials({
          google_calendar: typeof data.google_calendar === 'string'
            ? JSON.parse(data.google_calendar)
            : data.google_calendar,
          asaas: typeof data.asaas === 'string'
            ? JSON.parse(data.asaas)
            : data.asaas,
          zapsign: typeof data.zapsign === 'string'
            ? JSON.parse(data.zapsign)
            : data.zapsign
        })

        // Inicializar formulário do ZapSign
        const zapsignData = typeof data.zapsign === 'string'
          ? JSON.parse(data.zapsign)
          : data.zapsign
        setZapSignForm({
          token: zapsignData.token || '',
          modelos: zapsignData.modelos || ''
        })

        // Inicializar formulário do Asaas
        const asaasData = typeof data.asaas === 'string'
          ? JSON.parse(data.asaas)
          : data.asaas
        setAsaasForm({
          access_token: asaasData.access_token || ''
        })
      }
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveZapSignCredentials = async () => {
    setSaving(true)
    setSuccessMessage('')

    try {
      const { data: existing } = await supabase
        .from('credencias_diversas')
        .select('id')
        .eq('user_id', parseInt(user?.id || '0'))
        .single()

      const zapSignData = {
        token: zapSignForm.token,
        modelos: zapSignForm.modelos
      }

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('credencias_diversas')
          .update({
            zapsign: zapSignData
          })
          .eq('user_id', parseInt(user?.id || '0'))

        if (error) throw error
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('credencias_diversas')
          .insert([{
            user_id: parseInt(user?.id || '0'),
            zapsign: zapSignData,
            google_calendar: { email: '', refresh_token: '' },
            asaas: { access_token: '' }
          }])

        if (error) throw error
      }

      setCredentials(prev => ({
        ...prev,
        zapsign: zapSignData
      }))
      setEditingZapSign(false)
      setSuccessMessage('Credenciais do ZapSign salvas com sucesso!')

      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error)
      alert('Erro ao salvar credenciais do ZapSign')
    } finally {
      setSaving(false)
    }
  }

  const saveAsaasCredentials = async () => {
    setSaving(true)
    setSuccessMessage('')

    try {
      const { data: existing } = await supabase
        .from('credencias_diversas')
        .select('id')
        .eq('user_id', parseInt(user?.id || '0'))
        .single()

      const asaasData = {
        access_token: asaasForm.access_token
      }

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('credencias_diversas')
          .update({
            asaas: asaasData
          })
          .eq('user_id', parseInt(user?.id || '0'))

        if (error) throw error
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('credencias_diversas')
          .insert([{
            user_id: parseInt(user?.id || '0'),
            asaas: asaasData,
            zapsign: { token: '', modelos: '' },
            google_calendar: { email: '', refresh_token: '' }
          }])

        if (error) throw error
      }

      setCredentials(prev => ({
        ...prev,
        asaas: asaasData
      }))
      setEditingAsaas(false)
      setSuccessMessage('Credenciais do Asaas salvas com sucesso!')

      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error)
      alert('Erro ao salvar credenciais do Asaas')
    } finally {
      setSaving(false)
    }
  }

  const isZapSignConfigured = () => {
    return credentials.zapsign.token && credentials.zapsign.modelos
  }

  const isAsaasConfigured = () => {
    return credentials.asaas.access_token && credentials.asaas.access_token.length > 0
  }

  const isGoogleCalendarConfigured = () => {
    return credentials.google_calendar.email && credentials.google_calendar.refresh_token
  }

  const initiateGoogleOAuth = () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      alert('Credenciais do Google não configuradas. Entre em contato com o suporte.')
      return
    }

    // Construir URL de autorização OAuth2
    const redirectUri = `${window.location.origin}/api/oauth/google-calendar/callback`
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email'
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')

    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.append('redirect_uri', redirectUri)
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('scope', scope)
    authUrl.searchParams.append('access_type', 'offline')
    authUrl.searchParams.append('prompt', 'consent')
    authUrl.searchParams.append('state', JSON.stringify({
      user_id: user?.id,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET
    }))

    // Redirecionar para página de autorização do Google
    window.location.href = authUrl.toString()
  }


  const disconnectGoogleCalendar = async () => {
    if (!confirm('Deseja realmente desconectar o Google Calendar?')) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('credencias_diversas')
        .update({
          google_calendar: { email: '', refresh_token: '' }
        })
        .eq('user_id', parseInt(user?.id || '0'))

      if (error) throw error

      setCredentials(prev => ({
        ...prev,
        google_calendar: { email: '', refresh_token: '' }
      }))
      setSuccessMessage('Google Calendar desconectado com sucesso!')

      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      alert('Erro ao desconectar Google Calendar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Plug className="h-8 w-8 mr-3 text-blue-600" />
            Integrações
          </h1>
          <p className="text-gray-600 mt-2">
            Conecte suas ferramentas favoritas para automatizar seu fluxo de trabalho
          </p>
        </div>

        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Grid de Integrações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card ZapSign */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">ZapSign</h3>
                    <p className="text-purple-100 text-sm">Assinatura Digital</p>
                  </div>
                </div>
                {isZapSignConfigured() ? (
                  <CheckCircle className="h-6 w-6 text-green-300" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-300" />
                )}
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Integre com o ZapSign para enviar documentos para assinatura digital automaticamente.
              </p>

              {!editingZapSign ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Status:</span>
                    {isZapSignConfigured() ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Configurado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Não configurado
                      </span>
                    )}
                  </div>

                  {isZapSignConfigured() && (
                    <>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Token:</span>
                        <span className="text-sm text-gray-900 font-mono">
                          {credentials.zapsign.token.substring(0, 20)}...
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Modelo:</span>
                        <span className="text-sm text-gray-900 font-mono">
                          {credentials.zapsign.modelos.substring(0, 8)}...
                        </span>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => setEditingZapSign(true)}
                    className="w-full mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    {isZapSignConfigured() ? 'Editar Configuração' : 'Configurar ZapSign'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token da API *
                    </label>
                    <input
                      type="text"
                      value={zapSignForm.token}
                      onChange={(e) => setZapSignForm({ ...zapSignForm, token: e.target.value })}
                      placeholder="Digite o token da API do ZapSign"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Encontre seu token nas configurações da sua conta ZapSign
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID do Modelo *
                    </label>
                    <input
                      type="text"
                      value={zapSignForm.modelos}
                      onChange={(e) => setZapSignForm({ ...zapSignForm, modelos: e.target.value })}
                      placeholder="Digite o ID do modelo de documento"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ID do template que será usado para gerar documentos
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingZapSign(false)
                        // Resetar para valores salvos
                        setZapSignForm({
                          token: credentials.zapsign.token || '',
                          modelos: credentials.zapsign.modelos || ''
                        })
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveZapSignCredentials}
                      disabled={saving || !zapSignForm.token || !zapSignForm.modelos}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Google Calendar */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">Google Calendar</h3>
                    <p className="text-blue-100 text-sm">Agendamentos</p>
                  </div>
                </div>
                {isGoogleCalendarConfigured() ? (
                  <CheckCircle className="h-6 w-6 text-green-300" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-300" />
                )}
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Conecte sua conta Google para sincronizar agendamentos automaticamente.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status:</span>
                  {isGoogleCalendarConfigured() ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Não conectado
                    </span>
                  )}
                </div>

                {isGoogleCalendarConfigured() && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm text-gray-900">
                      {credentials.google_calendar.email}
                    </span>
                  </div>
                )}

                {isGoogleCalendarConfigured() ? (
                  <button
                    onClick={disconnectGoogleCalendar}
                    disabled={saving}
                    className="w-full mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={initiateGoogleOAuth}
                    disabled={!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET}
                    className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Conectar com Google
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card Asaas */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-white">Asaas</h3>
                    <p className="text-green-100 text-sm">Pagamentos</p>
                  </div>
                </div>
                {isAsaasConfigured() ? (
                  <CheckCircle className="h-6 w-6 text-green-300" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-300" />
                )}
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Integre com o Asaas para gerenciar cobranças e pagamentos automaticamente.
              </p>

              {!editingAsaas ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Status:</span>
                    {isAsaasConfigured() ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Configurado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Não configurado
                      </span>
                    )}
                  </div>

                  {isAsaasConfigured() && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Token:</span>
                      <span className="text-sm text-gray-900 font-mono">
                        {credentials.asaas.access_token.substring(0, 20)}...
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setEditingAsaas(true)}
                    className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    {isAsaasConfigured() ? 'Editar Configuração' : 'Configurar Asaas'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Token *
                    </label>
                    <input
                      type="text"
                      value={asaasForm.access_token}
                      onChange={(e) => setAsaasForm({ access_token: e.target.value })}
                      placeholder="$aact_prod_..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Encontre seu token nas configurações da sua conta Asaas
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingAsaas(false)
                        // Resetar para valores salvos
                        setAsaasForm({
                          access_token: credentials.asaas.access_token || ''
                        })
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveAsaasCredentials}
                      disabled={saving || !asaasForm.access_token}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
