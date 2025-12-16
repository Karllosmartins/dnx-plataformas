'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../shared/AuthWrapper'
import { useWorkspaceContext } from '../../../contexts/WorkspaceContext'
import { supabase, ContagemProfile, ExtracaoProfile } from '../../../lib/supabase'
import {
  History,
  RefreshCw,
  Settings,
  Database,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  Trash2,
  RotateCcw
} from 'lucide-react'

interface HistoricoContagensProps {
  apiConfig: { token: string; authenticated: boolean }
  authenticateAPI: () => void
  loading: boolean
}

// Estender interface para incluir extrações
interface ContagemComExtracoes extends ContagemProfile {
  extracoes_profile?: ExtracaoProfile[]
}

export default function HistoricoContagens({
  apiConfig,
  authenticateAPI,
  loading
}: HistoricoContagensProps) {
  const { user } = useAuth()
  const { workspaceId, loading: workspaceLoading } = useWorkspaceContext()
  const [contagens, setContagens] = useState<ContagemComExtracoes[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [atualizandoExtracoes, setAtualizandoExtracoes] = useState<Set<number>>(new Set())

  // Carregar histórico de contagens
  const loadHistorico = async () => {
    if (!user || !workspaceId) return

    setLoadingHistorico(true)
    try {
      // Buscar contagens do banco com suas extrações do workspace atual
      const { data: contagensBanco, error } = await supabase
        .from('contagens_profile')
        .select(`
          *,
          extracoes_profile (*)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setContagens(contagensBanco || [])

      // Verificar e atualizar status de extrações pendentes automaticamente
      const extracoesPendentes = (contagensBanco || [])
        .flatMap(c => c.extracoes_profile || [])
        .filter(e => e.status === 'processando' && e.id_extracao_api)

      if (extracoesPendentes.length > 0) {
        // Atualizar status em background
        atualizarStatusExtracoesPendentes(extracoesPendentes)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoadingHistorico(false)
    }
  }

  // Verificar e atualizar status de uma extração específica
  const atualizarStatusExtracao = async (extracao: ExtracaoProfile) => {
    if (!user || !extracao.id_extracao_api) return

    // Marcar como atualizando
    setAtualizandoExtracoes(prev => new Set(prev).add(extracao.id))

    try {
      // Buscar apiKey do usuário
      const { data: config } = await supabase
        .from('configuracoes_credenciais')
        .select('apikeydados')
        .eq('user_id', user.id)
        .single()

      if (!config?.apikeydados) {
        console.error('API Key não encontrada')
        return
      }

      // Chamar API para verificar status
      const response = await fetch('/api/extracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracaoId: extracao.id,
          userId: user.id,
          apiKey: config.apikeydados,
          idExtracaoAPI: extracao.id_extracao_api
        })
      })

      if (response.ok) {
        // Recarregar histórico para refletir as mudanças
        await loadHistoricoSemVerificacao()
      }
    } catch (error) {
      console.error('Erro ao atualizar status da extração:', error)
    } finally {
      setAtualizandoExtracoes(prev => {
        const newSet = new Set(prev)
        newSet.delete(extracao.id)
        return newSet
      })
    }
  }

  // Atualizar status de múltiplas extrações pendentes (em background)
  const atualizarStatusExtracoesPendentes = async (extracoes: ExtracaoProfile[]) => {
    if (!user) return

    try {
      // Buscar apiKey do usuário
      const { data: config } = await supabase
        .from('configuracoes_credenciais')
        .select('apikeydados')
        .eq('user_id', user.id)
        .single()

      if (!config?.apikeydados) return

      // Atualizar cada extração pendente
      for (const extracao of extracoes) {
        if (!extracao.id_extracao_api) continue

        setAtualizandoExtracoes(prev => new Set(prev).add(extracao.id))

        try {
          await fetch('/api/extracoes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              extracaoId: extracao.id,
              userId: user.id,
              apiKey: config.apikeydados,
              idExtracaoAPI: extracao.id_extracao_api
            })
          })
        } catch (err) {
          console.error('Erro ao atualizar extração:', extracao.id, err)
        } finally {
          setAtualizandoExtracoes(prev => {
            const newSet = new Set(prev)
            newSet.delete(extracao.id)
            return newSet
          })
        }
      }

      // Recarregar histórico após atualizar todas
      await loadHistoricoSemVerificacao()
    } catch (error) {
      console.error('Erro ao atualizar extrações pendentes:', error)
    }
  }

  // Carregar histórico sem verificar pendentes (para evitar loop)
  const loadHistoricoSemVerificacao = async () => {
    if (!user || !workspaceId) return

    try {
      const { data: contagensBanco, error } = await supabase
        .from('contagens_profile')
        .select(`
          *,
          extracoes_profile (*)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (!error) {
        setContagens(contagensBanco || [])
      }
    } catch (error) {
      console.error('Erro ao recarregar histórico:', error)
    }
  }

  // Deletar contagem
  const deletarContagem = async (contagemId: number, nomeContagem: string) => {
    if (!user || !workspaceId) return

    const confirmacao = confirm(`Tem certeza que deseja deletar a contagem "${nomeContagem}"?\n\nEsta ação irá remover:\n- A contagem do histórico\n- Todas as extrações relacionadas\n\nEsta ação não pode ser desfeita.`)

    if (!confirmacao) return

    try {
      setLoadingHistorico(true)

      // Deletar extrações relacionadas primeiro
      const { error: errorExtracoes } = await supabase
        .from('extracoes_profile')
        .delete()
        .eq('contagem_id', contagemId)
        .eq('workspace_id', workspaceId)

      if (errorExtracoes) {
        throw errorExtracoes
      }

      // Deletar a contagem
      const { error: errorContagem } = await supabase
        .from('contagens_profile')
        .delete()
        .eq('id', contagemId)
        .eq('workspace_id', workspaceId)

      if (errorContagem) {
        throw errorContagem
      }

      // Recarregar histórico
      await loadHistorico()

    } catch (error) {
      console.error('Erro ao deletar contagem:', error)
      alert('Erro ao deletar contagem. Tente novamente.')
    } finally {
      setLoadingHistorico(false)
    }
  }

  // Carregar histórico quando componente monta, usuário muda ou workspace muda
  useEffect(() => {
    if (user && workspaceId && !workspaceLoading) {
      loadHistorico()
    }
  }, [user, workspaceId, workspaceLoading])

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
                    Total Contagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extrações
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
                            {contagem.nome_contagem || 'Sem nome'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID API: {contagem.id_contagem_api}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contagem.tipo_pessoa === 'pf' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {contagem.tipo_pessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        contagem.status === 'concluida'
                          ? 'bg-green-100 text-green-800'
                          : contagem.status === 'processando'
                          ? 'bg-yellow-100 text-yellow-800'
                          : contagem.status === 'erro'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contagem.status === 'concluida' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : contagem.status === 'processando' ? (
                          <Clock className="h-3 w-3 mr-1" />
                        ) : contagem.status === 'erro' ? (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {contagem.status === 'concluida' ? 'Concluída' : 
                         contagem.status === 'processando' ? 'Processando' :
                         contagem.status === 'erro' ? 'Erro' : 'Processando'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contagem.total_registros?.toLocaleString('pt-BR') || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contagem.extracoes_profile && contagem.extracoes_profile.length > 0 ? (
                        <div className="space-y-1">
                          {contagem.extracoes_profile.map((extracao, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                                extracao.status === 'concluida' ? 'bg-green-100 text-green-800' :
                                extracao.status === 'processando' ? 'bg-yellow-100 text-yellow-800' :
                                extracao.status === 'erro' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {extracao.formato_arquivo.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-600">
                                ({extracao.total_registros_extraidos?.toLocaleString('pt-BR') || '?'} leads)
                              </span>
                              {extracao.status === 'concluida' && extracao.id_extracao_api && (
                                <button
                                  onClick={async () => {
                                    try {
                                      // Buscar API Key da variável de ambiente via endpoint
                                      const response = await fetch('/api/profile/get-api-key')

                                      if (!response.ok) {
                                        throw new Error('Erro ao buscar API Key')
                                      }

                                      const { apiKey } = await response.json()

                                      if (apiKey) {
                                        const downloadUrl = `/api/extracoes/download?idExtracao=${extracao.id_extracao_api}&apiKey=${encodeURIComponent(apiKey)}`
                                        window.open(downloadUrl, '_blank')
                                      } else {
                                        alert('API Key não encontrada. Verifique suas configurações.')
                                      }
                                    } catch (error) {
                                      console.error('Erro ao buscar API Key:', error)
                                      alert('Erro ao buscar API Key. Verifique suas configurações.')
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                  title="Download"
                                >
                                  <Download className="h-3 w-3" />
                                </button>
                              )}
                              {extracao.status === 'processando' && (
                                <button
                                  onClick={() => atualizarStatusExtracao(extracao)}
                                  disabled={atualizandoExtracoes.has(extracao.id)}
                                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                  title="Verificar status na API"
                                >
                                  <RotateCcw className={`h-3 w-3 ${atualizandoExtracoes.has(extracao.id) ? 'animate-spin' : ''}`} />
                                </button>
                              )}
                              {extracao.status === 'erro' && (
                                <AlertCircle className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Nenhuma</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contagem.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const dados = contagem.dados_resultado
                            if (dados) {
                              alert(`Detalhes da contagem:\nNome: ${contagem.nome_contagem}\nTotal: ${contagem.total_registros}\nStatus: ${contagem.status}\nData: ${new Date(contagem.created_at).toLocaleString('pt-BR')}`)
                            }
                          }}
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          title="Ver detalhes"
                        >
                          <FileText className="h-4 w-4" />
                        </button>

                        {contagem.dados_resultado && (
                          <button
                            onClick={() => {
                              const link = document.createElement('a')
                              const dataStr = JSON.stringify(contagem.dados_resultado, null, 2)
                              const blob = new Blob([dataStr], { type: 'application/json' })
                              link.href = URL.createObjectURL(blob)
                              link.download = `contagem_${contagem.nome_contagem}_${contagem.id}.json`
                              link.click()
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title="Baixar dados da contagem (JSON)"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => deletarContagem(contagem.id, contagem.nome_contagem || 'Sem nome')}
                          disabled={loadingHistorico}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title="Deletar contagem e extrações"
                        >
                          <Trash2 className="h-4 w-4" />
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