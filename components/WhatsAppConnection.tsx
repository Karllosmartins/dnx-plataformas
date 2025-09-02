'use client'

// =====================================================
// COMPONENTE - CONEXÃO WHATSAPP
// Interface simples para criar conexão WhatsApp
// =====================================================

import { useState, useEffect } from 'react'
import { Smartphone, Wifi, WifiOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface WhatsAppConnectionProps {
  userId: number
  onInstanceCreated?: (instanceData: any) => void
}

interface InstanceData {
  instanceName: string
  baseurl: string
  status: 'connected' | 'disconnected' | 'error'
  created_at: string
  qrCode?: string
  error?: string
}

export default function WhatsAppConnection({ userId, onInstanceCreated }: WhatsAppConnectionProps) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null)
  const [hasInstance, setHasInstance] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [nomeInstancia, setNomeInstancia] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Verificar se usuário já tem instância
  useEffect(() => {
    checkExistingInstance()
  }, [userId])

  const checkExistingInstance = async () => {
    setChecking(true)
    try {
      const response = await fetch(`/api/whatsapp/create-instance?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setHasInstance(data.hasInstance)
        setIsConnected(data.isConnected || false)
        setInstanceData(data.data)
      }
    } catch (error) {
      console.error('Erro ao verificar instância:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nomeInstancia.trim()) {
      setError('Nome da instância é obrigatório')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/whatsapp/create-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          nomeInstancia: nomeInstancia.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setHasInstance(true)
        setIsConnected(false)
        setInstanceData({
          instanceName: data.data.instanceName,
          baseurl: data.data.configData.baseurl,
          status: 'disconnected',
          created_at: data.data.configData.created_at
        })
        
        if (onInstanceCreated) {
          onInstanceCreated(data.data)
        }

        // Limpar formulário
        setNomeInstancia('')
        
        // Recarregar dados para pegar QR Code se necessário
        setTimeout(() => {
          checkExistingInstance()
        }, 1000)
      } else {
        setError(data.error || 'Erro ao criar instância')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
      console.error('Erro ao criar instância:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'disconnected':
        return <WifiOff className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Wifi className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'disconnected':
        return 'Desconectado'
      case 'error':
        return 'Erro de conexão'
      default:
        return 'Status desconhecido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50'
      case 'disconnected':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (checking) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Verificando conexão WhatsApp...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <Smartphone className="w-6 h-6 text-green-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Conexão WhatsApp</h2>
      </div>

      {hasInstance && instanceData ? (
        // Mostrar instância existente
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {getStatusIcon(instanceData.status)}
                <span className="ml-2 font-medium text-gray-900">
                  {instanceData.instanceName}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(instanceData.status)}`}>
                {getStatusText(instanceData.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">URL Base:</span>
                <div className="mt-1">{instanceData.baseurl}</div>
              </div>
              <div>
                <span className="font-medium">Criado em:</span>
                <div className="mt-1">
                  {new Date(instanceData.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {instanceData.error && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                <strong>Erro:</strong> {instanceData.error}
              </div>
            )}

            {/* QR Code para conexão */}
            {!isConnected && instanceData.qrCode && (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-200">
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">Escaneie o QR Code com seu WhatsApp</h3>
                  <div className="flex justify-center mb-3">
                    <img 
                      src={instanceData.qrCode} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48 border rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Abra o WhatsApp no seu celular → Configurações → Aparelhos conectados → Conectar novo aparelho
                  </p>
                </div>
              </div>
            )}

            {/* Instância conectada */}
            {isConnected && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-center text-green-700">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  <span className="font-medium">WhatsApp conectado com sucesso!</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={checkExistingInstance}
              disabled={checking}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {checking ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verificando...
                </div>
              ) : (
                'Atualizar Status'
              )}
            </button>
          </div>

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
            <strong>Configurações automáticas aplicadas:</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Webhook configurado automaticamente</li>
              <li>• Proxy configurado (p.webshare.io)</li>
              <li>• Grupos ignorados: Ativo</li>
              <li>• Read Messages: Ativo</li>
            </ul>
          </div>
        </div>
      ) : (
        // Formulário para criar nova instância
        <div className="space-y-4">
          <div className="text-gray-600 mb-4">
            Conecte seu WhatsApp para começar a receber e gerenciar leads através da plataforma.
          </div>

          <form onSubmit={handleCreateInstance} className="space-y-4">
            <div>
              <label htmlFor="nomeInstancia" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Instância WhatsApp
              </label>
              <input
                type="text"
                id="nomeInstancia"
                value={nomeInstancia}
                onChange={(e) => setNomeInstancia(e.target.value)}
                placeholder="Ex: Minha Empresa, Atendimento Principal..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Use apenas letras, números e espaços (será convertido para formato válido)
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !nomeInstancia.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Criando Conexão...
                </div>
              ) : (
                'Criar Conexão WhatsApp'
              )}
            </button>
          </form>

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
            <strong>O que será configurado automaticamente:</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Webhook: https://webhooks.dnmarketing.com.br/webhook/c05a8122-fb58-4a3a-a2c1-73f492b95f11</li>
              <li>• Proxy: p.webshare.io (usuário: dpaulflz-rotate)</li>
              <li>• Grupos ignorados: Sim</li>
              <li>• Read Messages: Sim</li>
              <li>• Integração: WhatsApp Baileys</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}