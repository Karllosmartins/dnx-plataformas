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
  idExtracaoAPI: number
  nomeArquivo: string
  initialStatus: string
  userId: number
  apiKey: string
  onClose: () => void
}

interface ExtracaoStatus {
  idExtracao: number
  idContagem: number
  status: string // Status da API Profile: 'Processando', 'Finalizada', 'Erro', etc.
  nomeContagem?: string
  tipoPessoa?: string
  qtdeSolicitada?: number
  qtdeRetorno?: number
  dataCriacao?: string
  dataFinalizacao?: string
  usuario?: string
  tipoExtracao?: string
}

export default function ExtracaoProgress({ 
  extracaoId, 
  idExtracaoAPI,
  nomeArquivo, 
  initialStatus, 
  userId,
  apiKey, 
  onClose 
}: ExtracaoProgressProps) {
  const [status, setStatus] = useState<ExtracaoStatus>({
    idExtracao: idExtracaoAPI,
    idContagem: 0,
    status: initialStatus
  })
  const [polling, setPolling] = useState(true)
  const [pollingCount, setPollingCount] = useState(0)
  const [consultandoManual, setConsultandoManual] = useState(false)

  // Função para verificar status da extração
  const verificarStatus = async (manual = false) => {
    if (manual) setConsultandoManual(true)

    try {
      console.log('🔄 Verificando status da extração:', { extracaoId, idExtracaoAPI, tentativa: pollingCount + 1 })

      const response = await fetch('/api/extracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extracaoId,
          userId,
          apiKey,
          idExtracaoAPI
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Status recebido:', data.extracao)
        setStatus(data.extracao)
        setPollingCount(prev => prev + 1)

        // Parar polling se processado, com erro ou cancelado
        if (data.extracao.status === 'Processado' ||
            data.extracao.status === 'Finalizada' ||
            data.extracao.status === 'Erro' ||
            data.extracao.status === 'Cancelada') {
          console.log('✅ Extração finalizada, parando polling:', data.extracao.status)
          setPolling(false)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ Erro na resposta da API:', response.status, errorData)

        // Se erro 404, pode ser que a extração não existe na API - parar polling
        if (response.status === 404) {
          console.log('🚫 Extração não encontrada, parando polling')
          setPolling(false)
          setStatus(prev => ({ ...prev, status: 'Erro' }))
        }
      }
    } catch (error) {
      console.error('💥 Erro ao verificar status:', error)
      // Não parar polling em caso de erro de rede - pode ser temporário
    } finally {
      if (manual) setConsultandoManual(false)
    }
  }

  // Polling para verificar status
  useEffect(() => {
    if (!polling) return

    // Verificar status imediatamente
    verificarStatus()

    // Continuar verificando a cada 10 segundos por até 10 minutos (60 tentativas)
    const interval = setInterval(() => {
      if (pollingCount < 60) {
        verificarStatus()
      } else {
        console.log('⏰ Timeout do polling após 10 minutos')
        setPolling(false)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [polling, pollingCount, extracaoId, idExtracaoAPI])

  // Função para download
  const handleDownload = () => {
    if (status.status === 'Processado' || status.status === 'Finalizada') {
      const downloadUrl = `/api/extracoes/download?idExtracao=${idExtracaoAPI}&apiKey=${encodeURIComponent(apiKey)}`
      window.open(downloadUrl, '_blank')
    }
  }

  // Função para deletar extração
  const handleDelete = () => {
    if (confirm('Tem certeza que deseja remover esta extração da lista?')) {
      onClose()
    }
  }

  // Ícone baseado no status
  const getStatusIcon = () => {
    switch (status.status) {
      case 'Processado':
      case 'Finalizada':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'Erro':
      case 'Cancelada':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      case 'Processando':
        return <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-6 w-6 text-yellow-600" />
    }
  }

  // Cor do status
  const getStatusColor = () => {
    switch (status.status) {
      case 'Processado':
      case 'Finalizada':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'Erro':
      case 'Cancelada':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'Processando':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  }

  // Texto do status
  const getStatusText = () => {
    switch (status.status) {
      case 'Processando':
        return 'Processando...'
      case 'Processado':
      case 'Finalizada':
        return 'Concluída'
      case 'Erro':
        return 'Erro no processamento'
      case 'Cancelada':
        return 'Cancelada'
      default:
        return status.status || 'Aguardando...'
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
              {status.dataFinalizacao && (
                <div className="text-sm opacity-75">
                  Concluída em: {new Date(status.dataFinalizacao).toLocaleString('pt-BR')}
                </div>
              )}
              {status.qtdeRetorno && (
                <div className="text-sm opacity-75">
                  Registros extraídos: {status.qtdeRetorno.toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {/* Informações adicionais */}
          {status.tipoExtracao && (
            <div className="text-sm text-gray-600">
              Tipo: {status.tipoExtracao}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {status.status === 'Processado' || status.status === 'Finalizada' ? (
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Fazer Download
              </button>
            ) : status.status === 'Erro' || status.status === 'Cancelada' ? (
              <div className="flex-1 text-center text-red-600 py-2">
                {status.status === 'Erro' ? 'Erro no processamento. Tente novamente.' : 'Extração cancelada.'}
              </div>
            ) : (
              <button
                onClick={() => verificarStatus(true)}
                disabled={consultandoManual}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${consultandoManual ? 'animate-spin' : ''}`} />
                {consultandoManual ? 'Consultando...' : 'Consultar Status'}
              </button>
            )}

            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              title="Remover extração da lista"
            >
              <X className="h-4 w-4" />
              Deletar
            </button>

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
              Status atualizado automaticamente a cada 10 segundos ({pollingCount}/60 tentativas)
            </div>
          )}
          {!polling && pollingCount >= 60 && (
            <div className="text-xs text-yellow-600 text-center">
              ⏰ Timeout após 10 minutos. Use "Consultar Status" para verificar manualmente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}