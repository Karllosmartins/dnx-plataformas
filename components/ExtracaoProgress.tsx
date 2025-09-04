'use client'

import { useState, useEffect } from 'react'
import { 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  X,
  ExternalLink 
} from 'lucide-react'

interface ExtracaoProgressProps {
  extracaoId: number
  nomeArquivo: string
  initialStatus: string
  userId: number
  onClose: () => void
}

interface ExtracaoStatus {
  id: number
  status: 'solicitada' | 'processando' | 'concluida' | 'erro' | 'expirada'
  url_download?: string
  data_conclusao?: string
  tamanho_arquivo?: number
}

export default function ExtracaoProgress({ 
  extracaoId, 
  nomeArquivo, 
  initialStatus, 
  userId, 
  onClose 
}: ExtracaoProgressProps) {
  const [status, setStatus] = useState<ExtracaoStatus>({
    id: extracaoId,
    status: initialStatus as ExtracaoStatus['status']
  })
  const [polling, setPolling] = useState(true)

  // Função para verificar status da extração
  const verificarStatus = async () => {
    try {
      const response = await fetch('/api/extracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extracaoId,
          userId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data.extracao)
        
        // Parar polling se concluído ou com erro
        if (data.extracao.status === 'concluida' || data.extracao.status === 'erro') {
          setPolling(false)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  // Polling para verificar status
  useEffect(() => {
    if (!polling) return

    const interval = setInterval(verificarStatus, 3000) // Verificar a cada 3 segundos

    return () => clearInterval(interval)
  }, [polling])

  // Função para download
  const handleDownload = () => {
    if (status.url_download) {
      window.open(status.url_download, '_blank')
    }
  }

  // Ícone baseado no status
  const getStatusIcon = () => {
    switch (status.status) {
      case 'concluida':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'erro':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      case 'processando':
        return <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-6 w-6 text-yellow-600" />
    }
  }

  // Cor do status
  const getStatusColor = () => {
    switch (status.status) {
      case 'concluida':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'erro':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'processando':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  }

  // Texto do status
  const getStatusText = () => {
    switch (status.status) {
      case 'solicitada':
        return 'Solicitada'
      case 'processando':
        return 'Processando...'
      case 'concluida':
        return 'Concluída'
      case 'erro':
        return 'Erro no processamento'
      case 'expirada':
        return 'Link expirado'
      default:
        return 'Status desconhecido'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Status da Extração</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          {/* Nome do arquivo */}
          <div>
            <label className="text-sm font-medium text-gray-700">Arquivo:</label>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
              {nomeArquivo}
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusColor()}`}>
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-semibold">{getStatusText()}</div>
              {status.data_conclusao && (
                <div className="text-sm opacity-75">
                  Concluída em: {new Date(status.data_conclusao).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {/* Informações adicionais */}
          {status.status === 'concluida' && status.tamanho_arquivo && (
            <div className="text-sm text-gray-600">
              Tamanho: {(status.tamanho_arquivo / (1024 * 1024)).toFixed(2)} MB
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {status.status === 'concluida' && status.url_download ? (
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Fazer Download
              </button>
            ) : status.status === 'erro' ? (
              <div className="flex-1 text-center text-red-600 py-2">
                Erro no processamento. Tente novamente.
              </div>
            ) : (
              <div className="flex-1 text-center text-gray-600 py-2">
                {status.status === 'processando' ? 'Processando arquivo...' : 'Aguarde...'}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>

          {/* Atualização automática */}
          {polling && (
            <div className="text-xs text-gray-500 text-center">
              Status atualizado automaticamente a cada 3 segundos
            </div>
          )}
        </div>
      </div>
    </div>
  )
}