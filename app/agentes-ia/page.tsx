'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { supabase, AgenteIA, Tool, UserTool } from '../../lib/supabase'
import PlanProtection from '../../components/PlanProtection'
import VectorStoreManager from '../../components/VectorStoreManager'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Bot,
  Settings,
  Wrench
} from 'lucide-react'

export default function AgentesIAPage() {
  const { user: currentUser } = useAuth()
  const [agentes, setAgentes] = useState<AgenteIA[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAgent, setEditingAgent] = useState<AgenteIA | null>(null)
  const [tools, setTools] = useState<Tool[]>([])
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [showAgentTools, setShowAgentTools] = useState<{[key: number]: boolean}>({})

  useEffect(() => {
    if (currentUser) {
      loadAgentes()
      loadTools()
      loadUserTools()
    }
  }, [currentUser])

  const loadAgentes = async () => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (data) {
        setAgentes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTools = async () => {
    if (!currentUser) return

    try {
      // Buscar todas as tools disponíveis
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('nome')

      if (error) throw error
      if (data) {
        setTools(data)
      }
    } catch (error) {
      console.error('Erro ao carregar tools:', error)
    }
  }

  const loadUserTools = async () => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('user_tools')
        .select('*')
        .eq('user_id', currentUser.id)

      if (error) throw error
      if (data) {
        setUserTools(data)
      }
    } catch (error) {
      console.error('Erro ao carregar user_tools:', error)
    }
  }

  const toggleAgentTool = async (agentId: number, toolId: number, currentState: boolean) => {
    if (!currentUser) return

    try {
      // Primeiro, verificar se existe um registro para este agente específico
      const existingForAgent = userTools.find(ut => 
        ut.tool_id === toolId && 
        ut.user_id === parseInt(currentUser.id) && 
        ut.agente_id === agentId.toString()
      )

      // Verificar se existe algum registro para esta combinação user_id + tool_id
      const existingForUser = userTools.find(ut => 
        ut.tool_id === toolId && 
        ut.user_id === parseInt(currentUser.id)
      )

      if (existingForAgent) {
        // Atualizar o registro específico do agente
        const { error } = await supabase
          .from('user_tools')
          .update({ is_active: !currentState })
          .eq('id', existingForAgent.id)

        if (error) throw error
      } else if (existingForUser) {
        // Atualizar o registro existente para incluir o novo agente
        const { error } = await supabase
          .from('user_tools')
          .update({ 
            agente_id: agentId.toString(),
            is_active: true
          })
          .eq('id', existingForUser.id)

        if (error) throw error
      } else {
        // Inserir novo registro
        const { error } = await supabase
          .from('user_tools')
          .insert([{
            user_id: parseInt(currentUser.id),
            tool_id: toolId,
            agente_id: agentId.toString(),
            is_active: true
          }])

        if (error) throw error
      }

      // Recarregar user_tools
      loadUserTools()
    } catch (error) {
      console.error('Erro ao alterar status da tool:', error)
      alert('Erro ao alterar status da ferramenta')
    }
  }

  const isAgentToolActive = (agentId: number, toolId: number): boolean => {
    const userTool = userTools.find(ut => 
      ut.tool_id === toolId && 
      ut.user_id === parseInt(currentUser?.id || '0') && 
      ut.agente_id === agentId.toString()
    )
    return userTool?.is_active === true
  }

  const saveAgent = async (agentData: Partial<AgenteIA>) => {
    if (!currentUser) return

    try {
      const dataToSave = {
        ...agentData,
        user_id: currentUser.id
      }

      if (editingAgent && editingAgent.id > 0) {
        // Update
        const { error } = await supabase
          .from('agentes_ia')
          .update(dataToSave)
          .eq('id', editingAgent.id)
      } else {
        // Insert
        const { error } = await supabase
          .from('agentes_ia')
          .insert([dataToSave])
      }

      alert('Agente salvo com sucesso!')
      setEditingAgent(null)
      loadAgentes()
    } catch (error) {
      console.error('Erro ao salvar agente:', error)
      alert('Erro ao salvar agente')
    }
  }

  const deleteAgent = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este agente? Isso também removerá o Vector Store associado.')) return

    try {
      // 1. Primeiro, deletar o vector store associado (se existir)
      try {
        const vectorStoreResponse = await fetch(`/api/vectorstores?userId=${currentUser?.id}&agentId=${id}`)
        const vectorStoreData = await vectorStoreResponse.json()
        
        if (vectorStoreData.hasVectorStore && vectorStoreData.vectorStore) {
          // Deletar vector store da OpenAI e do banco
          const deleteResponse = await fetch('/api/vectorstores', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser?.id,
              agentId: id,
              vectorStoreId: vectorStoreData.vectorStore.vectorstore_id
            })
          })
          
          if (!deleteResponse.ok) {
            console.warn('Erro ao deletar vector store, mas continuando com exclusão do agente')
          }
        }
      } catch (vectorStoreError) {
        console.warn('Erro ao processar vector store, mas continuando com exclusão do agente:', vectorStoreError)
      }

      // 2. Deletar o agente
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Agente e recursos associados excluídos com sucesso!')
      loadAgentes()
    } catch (error) {
      console.error('Erro ao excluir agente:', error)
      alert('Erro ao excluir agente')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando agentes...</div>
  }

  return (
    <PlanProtection feature="agentesIA">
      <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Bot className="h-8 w-8 mr-3 text-purple-600" />
          Agentes IA
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Gerencie seus agentes de inteligência artificial para automação
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Meus Agentes</h3>
          <button
            onClick={() => setEditingAgent({
              id: 0,
              agente_id: '',
              nome: '',
              funcao: '',
              prompt: '',
              estagio: 'ativo',
              user_id: Number(currentUser?.id) || 0,
              created_at: new Date().toISOString()
            })}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </button>
        </div>

        <div className="p-6">
          {agentes.length > 0 ? (
            <div className="grid gap-6">
              {agentes.map((agente) => (
                <div key={agente.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-gray-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Bot className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{agente.nome}</h4>
                          <p className="text-sm text-gray-600 truncate">{agente.funcao}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          agente.estagio === 'ativo' 
                            ? 'bg-green-100 text-green-800'
                            : agente.estagio === 'desenvolvimento'
                            ? 'bg-yellow-100 text-yellow-800'
                            : agente.estagio === 'teste'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {agente.estagio === 'ativo' && 'Ativo'}
                          {agente.estagio === 'desenvolvimento' && 'Em Desenvolvimento'}
                          {agente.estagio === 'teste' && 'Teste'}
                          {agente.estagio === 'inativo' && 'Inativo'}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Prompt do Agente:</h5>
                        <p className="text-sm text-gray-700 leading-relaxed max-h-24 overflow-y-auto">
                          {agente.prompt}
                        </p>
                      </div>

                      <div className="mt-4 text-xs text-gray-500">
                        ID: {agente.agente_id} • Criado em {new Date(agente.created_at).toLocaleDateString('pt-BR')}
                      </div>

                      {/* Vector Store Manager */}
                      <VectorStoreManager agentId={agente.id} />
                      
                      {/* Ferramentas do Agente */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-blue-600" />
                            <h5 className="text-sm font-medium text-gray-900">Ferramentas do Agente</h5>
                          </div>
                          <button
                            onClick={() => setShowAgentTools({
                              ...showAgentTools, 
                              [agente.id]: !showAgentTools[agente.id]
                            })}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {showAgentTools[agente.id] ? 'Ocultar' : 'Mostrar'}
                          </button>
                        </div>

                        {showAgentTools[agente.id] && (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {tools.map((tool) => {
                              const isActive = isAgentToolActive(agente.id, tool.id)
                              return (
                                <div key={tool.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                  <div className="min-w-0 flex-1">
                                    <h6 className="text-xs font-medium text-gray-900 truncate">{tool.nome}</h6>
                                    <p className="text-xs text-gray-500 truncate">{tool.type}</p>
                                  </div>
                                  
                                  <label className="flex items-center cursor-pointer ml-2">
                                    <input
                                      type="checkbox"
                                      checked={isActive}
                                      onChange={() => toggleAgentTool(agente.id, tool.id, isActive)}
                                      className="sr-only"
                                    />
                                    <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                      isActive ? 'bg-green-600' : 'bg-gray-300'
                                    }`}>
                                      <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${
                                        isActive ? 'translate-x-4' : 'translate-x-1'
                                      }`} />
                                    </div>
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 justify-end sm:justify-start">
                      <button
                        onClick={() => setEditingAgent(agente)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors whitespace-nowrap"
                      >
                        <Edit2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline ml-1">Editar</span>
                      </button>
                      <button
                        onClick={() => deleteAgent(agente.id)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline ml-1">Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-4">Nenhum agente configurado</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Crie seu primeiro agente IA para começar a automatizar suas tarefas. 
                Agentes podem ser usados para vendas, suporte, qualificação de leads e muito mais.
              </p>
              <button
                onClick={() => setEditingAgent({
                  id: 0,
                  agente_id: '',
                  nome: '',
                  funcao: '',
                  prompt: '',
                  estagio: 'ativo',
                  user_id: Number(currentUser?.id) || 0,
                  created_at: new Date().toISOString()
                })}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeiro Agente
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Modal de Edição de Agente */}
      {editingAgent && (
        <AgentModal
          agent={editingAgent}
          onSave={saveAgent}
          onClose={() => setEditingAgent(null)}
        />
      )}
      </div>
    </PlanProtection>
  )
}

// Componente Modal para Agente
function AgentModal({ 
  agent, 
  onSave, 
  onClose 
}: { 
  agent: AgenteIA
  onSave: (data: Partial<AgenteIA>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    agente_id: agent.agente_id || '',
    nome: agent.nome || '',
    funcao: agent.funcao || '',
    prompt: agent.prompt || '',
    estagio: agent.estagio || 'ativo'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bot className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {agent.id && agent.id > 0 ? 'Editar Agente IA' : 'Criar Novo Agente IA'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Agente *
              </label>
              <input
                type="text"
                value={formData.agente_id}
                onChange={(e) => setFormData({...formData, agente_id: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="agent_vendas_001"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Identificador único para este agente</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Agente *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Agente de Vendas"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Função do Agente *
            </label>
            <input
              type="text"
              value={formData.funcao}
              onChange={(e) => setFormData({...formData, funcao: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Especialista em vendas e conversão de leads"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Descreva brevemente qual é o papel deste agente</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status do Agente
            </label>
            <select
              value={formData.estagio}
              onChange={(e) => setFormData({...formData, estagio: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ativo">Ativo</option>
              <option value="desenvolvimento">Em Desenvolvimento</option>
              <option value="teste">Teste</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt do Agente *
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({...formData, prompt: e.target.value})}
              rows={12}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder="Você é um agente especialista em vendas focado em recuperação de crédito. Seu objetivo é qualificar leads e converter em clientes...

Suas responsabilidades incluem:
- Analisar o perfil do lead
- Fazer perguntas qualificadoras
- Apresentar soluções adequadas
- Conduzir para o fechamento

Seja sempre profissional, empático e focado em resultados."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Define como o agente deve se comportar e responder. Seja específico e detalhado.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              {agent.id && agent.id > 0 ? 'Atualizar Agente' : 'Criar Agente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}