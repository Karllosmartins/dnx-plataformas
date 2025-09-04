'use client'

import { useState, useEffect } from 'react'
import { 
  History, 
  RefreshCw, 
  Settings, 
  Database, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download 
} from 'lucide-react'

interface HistoricoContagensProps {
  apiConfig: { token: string; authenticated: boolean }
  authenticateAPI: () => void
  loading: boolean
}

export default function HistoricoContagens({ 
  apiConfig, 
  authenticateAPI, 
  loading 
}: HistoricoContagensProps) {
  const [contagens, setContagens] = useState<any[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  // Carregar histórico de contagens
  const loadHistorico = async () => {
    if (!apiConfig.token) return

    setLoadingHistorico(true)
    try {
      // Carregar tanto PF quanto PJ
      const [responsesPf, responsesPj] = await Promise.all([
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarMinhasContagens', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPj/ListarMinhasContagens', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        })
      ])

      const [contagensPf, contagensPj] = await Promise.all([
        responsesPf.json(),
        responsesPj.json()
      ])

      // Combinar e marcar o tipo
      const todasContagens = [
        ...(contagensPf || []).map((c: any) => ({ ...c, tipo: 'Pessoa Física' })),
        ...(contagensPj || []).map((c: any) => ({ ...c, tipo: 'Pessoa Jurídica' }))
      ].sort((a, b) => new Date(b.dataCriacao || b.created_at || '').getTime() - new Date(a.dataCriacao || a.created_at || '').getTime())

      setContagens(todasContagens)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoadingHistorico(false)
    }
  }

  // Carregar histórico quando autenticado
  useEffect(() => {
    if (apiConfig.authenticated) {
      loadHistorico()
    }
  }, [apiConfig.authenticated])

  if (!apiConfig.authenticated) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <History className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Histórico de Contagens</h2>
          <p className="text-gray-600 mb-6">Faça a autenticação para visualizar seu histórico</p>
          
          <button
            onClick={authenticateAPI}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Settings className="h-5 w-5" />}
            {loading ? 'Conectando...' : 'Conectar API'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Histórico de Contagens</h2>
              <p className="text-gray-600">Acompanhe o progresso das suas contagens criadas</p>
            </div>
          </div>
          
          <button
            onClick={loadHistorico}
            disabled={loadingHistorico}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingHistorico ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista de Contagens */}
      {loadingHistorico ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-gray-600">Carregando histórico...</span>
          </div>
        </div>
      ) : contagens.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma contagem encontrada</h3>
            <p className="text-gray-600">Você ainda não criou nenhuma contagem. Vá para a aba "Extração de Leads" para criar sua primeira contagem.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome da Contagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contagens.map((contagem, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contagem.nomeContagem || contagem.nome || 'Sem nome'}
                          </div>
                          {contagem.idContagem && (
                            <div className="text-sm text-gray-500">ID: {contagem.idContagem}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contagem.tipo === 'Pessoa Física' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {contagem.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        contagem.status === 'Concluída' || contagem.status === 'Finalizada'
                          ? 'bg-green-100 text-green-800'
                          : contagem.status === 'Em Processamento' || contagem.status === 'Processando'
                          ? 'bg-yellow-100 text-yellow-800'
                          : contagem.status === 'Erro' || contagem.status === 'Falha'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contagem.status === 'Concluída' || contagem.status === 'Finalizada' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : contagem.status === 'Em Processamento' || contagem.status === 'Processando' ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : contagem.status === 'Erro' || contagem.status === 'Falha' ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {contagem.status || 'Processando'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contagem.totalRegistros || contagem.total || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contagem.dataCriacao 
                        ? new Date(contagem.dataCriacao).toLocaleString('pt-BR')
                        : contagem.created_at 
                        ? new Date(contagem.created_at).toLocaleString('pt-BR')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {(contagem.status === 'Concluída' || contagem.status === 'Finalizada') && (
                          <button
                            onClick={() => {
                              alert('Funcionalidade de download será implementada')
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title="Baixar resultados"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            alert(`Detalhes da contagem: ${contagem.nomeContagem || 'Sem nome'}`)
                          }}
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          title="Ver detalhes"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}