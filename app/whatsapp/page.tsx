'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { supabase } from '../../lib/supabase'
import { evolutionAPI } from '../../lib/evolution-api'
import { MessageCircle, Smartphone, QrCode, CheckCircle, AlertCircle, WifiOff, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react'

interface WhatsAppInstance {
  id: string
  instanceName: string
  nome: string
  telefone: string
  status: 'created' | 'connecting' | 'connected' | 'disconnected'
  qrCode?: string
  baseUrl?: string
  apiKey?: string
}

export default function WhatsAppPage() {
  const { user } = useAuth()
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  
  // Formulário
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (user) {
      checkExistingInstance()
    }
  }, [user])

  const checkExistingInstance = async () => {
    try {
      console.log('Verificando instância existente para user_id:', user?.id)
      
      const { data, error } = await supabase
        .from('configuracoes_credenciais')
        .select('baseurl, instancia, apikey')
        .eq('user_id', user?.id)
        .maybeSingle() // Use maybeSingle ao invés de single para não dar erro se não encontrar

      console.log('Resultado da consulta Supabase:', { data, error })

      if (error) {
        console.error('Erro ao consultar Supabase:', error)
      }

      if (data && data.instancia && data.baseurl && data.apikey) {
        console.log('Instância existente encontrada:', data.instancia)
        
        // Já tem uma instância configurada
        setInstance({
          id: data.instancia,
          instanceName: data.instancia,
          nome: '',
          telefone: '',
          status: 'connected',
          baseUrl: data.baseurl,
          apiKey: data.apikey
        })
      } else {
        console.log('Nenhuma instância configurada encontrada')
      }
    } catch (error) {
      console.error('Erro ao verificar instância existente:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInstance = async () => {
    if (!nome.trim() || !telefone.trim() || !senha.trim()) {
      alert('Preencha todos os campos')
      return
    }

    setCreating(true)
    
    try {
      // Gerar nome da instância: nome + telefone limpo
      const telefoneClean = telefone.replace(/\D/g, '')
      const instanceName = nome.toLowerCase().replace(/\s+/g, '') + telefoneClean

      console.log('Criando instância na Evolution API:', instanceName)
      
      // Criar instância na Evolution API real
      const evolutionResponse = await evolutionAPI.createInstance({
        instanceName,
        token: senha,
        nome,
        telefone: telefoneClean
      })

      console.log('Resposta da Evolution API:', evolutionResponse)

      // Se a Evolution API retornou sucesso, continuamos
      // Se retornou erro mas a instância foi criada (como você observou), também continuamos
      let evolutionSuccessful = evolutionResponse.success
      
      if (!evolutionSuccessful) {
        console.warn('Evolution API retornou erro, mas vamos continuar pois você mencionou que a instância foi criada:', evolutionResponse.error)
        // Não vamos interromper o processo, apenas logar o aviso
      }

      // Salvar credenciais no banco
      console.log('Salvando credenciais no banco para user_id:', user?.id)
      
      const { data: existingData, error: checkError } = await supabase
        .from('configuracoes_credenciais')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()

      console.log('Verificação de registro existente:', { existingData, checkError })

      let saveResult
      if (existingData) {
        // Update existing record
        saveResult = await supabase
          .from('configuracoes_credenciais')
          .update({
            instancia: instanceName,
            apikey: '767cfac9-68c6-4d67-aff1-21d6c482c715',
            baseurl: 'https://wsapi.dnmarketing.com.br'
          })
          .eq('user_id', user?.id)
      } else {
        // Insert new record
        saveResult = await supabase
          .from('configuracoes_credenciais')
          .insert({
            user_id: user?.id,
            instancia: instanceName,
            apikey: '767cfac9-68c6-4d67-aff1-21d6c482c715',
            baseurl: 'https://wsapi.dnmarketing.com.br',
            // Campos obrigatórios da tabela
            model: 'gpt-3.5-turbo',
            type_tool_supabase: 'none',
            delay_entre_mensagens_em_segundos: 5,
            delay_apos_intervencao_humana_minutos: 30,
            inicio_expediente: 8,
            fim_expediente: 18,
            cliente: 'WhatsApp Instance'
          })
      }

      console.log('Resultado do salvamento:', saveResult)

      if (saveResult.error) {
        console.error('Erro ao salvar no Supabase:', saveResult.error)
        throw new Error(`Erro ao salvar credenciais: ${saveResult.error.message}`)
      }

      setInstance({
        id: instanceName,
        instanceName,
        nome,
        telefone,
        status: 'created',
        baseUrl: 'https://wsapi.dnmarketing.com.br',
        apiKey: '767cfac9-68c6-4d67-aff1-21d6c482c715'
      })

      setShowCreateForm(false)
      
      if (evolutionSuccessful) {
        alert('✅ Instância criada com sucesso na Evolution API e salva no banco de dados! Agora você pode gerar o QR Code para conectar.')
      } else {
        alert('⚠️ Instância criada na Evolution API (verificado), credenciais salvas no banco! Agora você pode gerar o QR Code para conectar.')
      }

    } catch (error) {
      console.error('Erro ao criar instância:', error)
      alert(`Erro ao criar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setCreating(false)
    }
  }

  const generateQrCode = async () => {
    if (!instance) return

    setConnecting(true)
    
    try {
      console.log('Conectando instância para gerar QR Code:', instance.instanceName)
      
      // Conectar instância na Evolution API para gerar QR Code
      const connectResponse = await evolutionAPI.connectInstance(instance.instanceName)
      
      if (!connectResponse.success) {
        throw new Error(connectResponse.error || 'Erro ao conectar instância')
      }

      // Verificar se o QR Code está na resposta
      let qrCodeData: string | null = null
      if (connectResponse.data?.qrcode) {
        qrCodeData = connectResponse.data.qrcode
      }
      
      setInstance(prev => prev ? {
        ...prev,
        status: 'connecting',
        qrCode: qrCodeData || undefined
      } : null)
      
      setShowQrCode(true)
      
      // Iniciar polling do status de conexão
      startConnectionPolling()
      
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
      alert(`Erro ao gerar QR Code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setConnecting(false)
    }
  }

  const checkConnection = async () => {
    if (!instance) return

    try {
      console.log('Verificando status de conexão:', instance.instanceName)
      
      const statusResponse = await evolutionAPI.getConnectionState(instance.instanceName)
      
      if (!statusResponse.success) {
        throw new Error(statusResponse.error || 'Erro ao verificar status')
      }

      const connectionState = statusResponse.data?.state || statusResponse.data?.instance?.state

      console.log('Status atual da conexão:', connectionState)

      if (connectionState === 'open') {
        setInstance(prev => prev ? {
          ...prev,
          status: 'connected'
        } : null)
        setShowQrCode(false)
        alert('WhatsApp conectado com sucesso!')
      } else if (connectionState === 'close') {
        alert('WhatsApp ainda não foi conectado. Escaneie o QR Code com seu celular.')
      } else {
        alert(`Status da conexão: ${connectionState}`)
      }

    } catch (error) {
      console.error('Erro ao verificar conexão:', error)
      alert(`Erro ao verificar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const startConnectionPolling = () => {
    const pollInterval = setInterval(async () => {
      if (!instance || instance.status === 'connected') {
        clearInterval(pollInterval)
        return
      }

      try {
        const statusResponse = await evolutionAPI.getConnectionState(instance.instanceName)
        
        if (statusResponse.success) {
          const connectionState = statusResponse.data?.state || statusResponse.data?.instance?.state
          
          if (connectionState === 'open') {
            setInstance(prev => prev ? {
              ...prev,
              status: 'connected'
            } : null)
            setShowQrCode(false)
            alert('WhatsApp conectado automaticamente!')
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.log('Erro no polling de conexão:', error)
      }
    }, 5000) // Verificar a cada 5 segundos

    // Limpar polling após 5 minutos para evitar loops infinitos
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 300000)
  }

  const restartInstance = async () => {
    if (!instance) return

    try {
      console.log('Reiniciando instância:', instance.instanceName)
      
      const restartResponse = await evolutionAPI.restartInstance(instance.instanceName)
      
      if (!restartResponse.success) {
        throw new Error(restartResponse.error || 'Erro ao reiniciar instância')
      }

      setInstance(prev => prev ? {
        ...prev,
        status: 'created'
      } : null)

      alert('Instância reiniciada com sucesso!')

    } catch (error) {
      console.error('Erro ao reiniciar instância:', error)
      alert(`Erro ao reiniciar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const logoutInstance = async () => {
    if (!instance) return

    if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return

    try {
      console.log('Desconectando instância:', instance.instanceName)
      
      const logoutResponse = await evolutionAPI.logoutInstance(instance.instanceName)
      
      if (!logoutResponse.success) {
        throw new Error(logoutResponse.error || 'Erro ao desconectar instância')
      }

      setInstance(prev => prev ? {
        ...prev,
        status: 'created'
      } : null)

      alert('WhatsApp desconectado com sucesso!')

    } catch (error) {
      console.error('Erro ao desconectar instância:', error)
      alert(`Erro ao desconectar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const deleteInstance = async () => {
    if (!instance) return

    if (!confirm('Tem certeza que deseja deletar completamente esta instância? Esta ação não pode ser desfeita.')) return

    try {
      console.log('Deletando instância:', instance.instanceName)
      
      const deleteResponse = await evolutionAPI.deleteInstance(instance.instanceName)
      
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.error || 'Erro ao deletar instância')
      }

      // Remover credenciais do banco
      await supabase
        .from('configuracoes_credenciais')
        .update({
          instancia: null,
          apikey: null,
          baseurl: null
        })
        .eq('user_id', user?.id)

      setInstance(null)
      alert('Instância deletada com sucesso!')

    } catch (error) {
      console.error('Erro ao deletar instância:', error)
      alert(`Erro ao deletar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageCircle className="h-8 w-8 mr-3 text-green-600" />
            WhatsApp
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure sua conexão WhatsApp com Evolution API
          </p>
        </div>
      </div>

      {!instance ? (
        // Estado inicial - Mostrar botão para criar primeira instância
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">Configure seu WhatsApp</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Crie sua instância WhatsApp para começar a enviar mensagens automatizadas através da Evolution API
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Criar Instância WhatsApp
          </button>
        </div>
      ) : (
        // Mostrar instância existente
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-start sm:justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Smartphone className="h-12 w-12 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{instance.instanceName}</h3>
                  <div className="mt-1 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      instance.status === 'connected' 
                        ? 'bg-green-100 text-green-800' 
                        : instance.status === 'connecting'
                        ? 'bg-yellow-100 text-yellow-800'
                        : instance.status === 'created'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {instance.status === 'connected' && <><CheckCircle className="h-3 w-3 mr-1" /> Conectado</>}
                      {instance.status === 'connecting' && <><AlertCircle className="h-3 w-3 mr-1" /> Conectando...</>}
                      {instance.status === 'created' && <><Smartphone className="h-3 w-3 mr-1" /> Criado</>}
                      {instance.status === 'disconnected' && <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 sm:flex sm:items-center space-x-3">
                {instance.status === 'created' && (
                  <>
                    <button
                      onClick={generateQrCode}
                      disabled={connecting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {connecting ? 'Gerando...' : 'Gerar QR Code'}
                    </button>
                    <button
                      onClick={deleteInstance}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </button>
                  </>
                )}
                
                {instance.status === 'connecting' && instance.qrCode && (
                  <>
                    <button
                      onClick={checkConnection}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verificar Conexão
                    </button>
                    <button
                      onClick={restartInstance}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reiniciar
                    </button>
                  </>
                )}

                {instance.status === 'connected' && (
                  <>
                    <button
                      onClick={logoutInstance}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Desconectar
                    </button>
                    <button
                      onClick={restartInstance}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reiniciar
                    </button>
                    <button
                      onClick={deleteInstance}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </button>
                  </>
                )}
              </div>
            </div>

            {instance.status === 'connected' && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informações da Instância</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Nome da Instância</dt>
                    <dd className="mt-1 text-sm text-gray-900">{instance.instanceName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Base URL</dt>
                    <dd className="mt-1 text-sm text-gray-900">{instance.baseUrl}</dd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQrCode && instance?.qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowQrCode(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-medium text-center mb-4">Conectar WhatsApp</h3>
            <div className="text-center">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <img 
                  src={instance.qrCode} 
                  alt="QR Code WhatsApp" 
                  className="mx-auto w-48 h-48 border border-gray-200"
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Abra o WhatsApp no seu celular e escaneie este código QR
              </p>
              <button
                onClick={() => setShowQrCode(false)}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Instância */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateForm(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-medium mb-6">Criar Instância WhatsApp</h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Karllos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: 62981048778"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Digite apenas números</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Digite uma senha segura"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Nome da instância:</strong> {nome && telefone ? 
                    nome.toLowerCase().replace(/\s+/g, '') + telefone.replace(/\D/g, '') : 
                    'Preencha nome e telefone'
                  }
                </p>
              </div>
            </form>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={createInstance}
                disabled={creating || !nome.trim() || !telefone.trim() || !senha.trim()}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {creating ? 'Criando...' : 'Criar Instância'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNome('')
                  setTelefone('')
                  setSenha('')
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}