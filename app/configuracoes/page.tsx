'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { authService, User } from '../../lib/auth'
import { supabase, ConfiguracaoCredenciais, AgenteIA } from '../../lib/supabase'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  Settings, 
  Bot, 
  Save,
  Key,
  MessageSquare,
  Clock
} from 'lucide-react'

export default function ConfiguracoesPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [credenciais, setCredenciais] = useState<ConfiguracaoCredenciais | null>(null)
  const [agentes, setAgentes] = useState<AgenteIA[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('credenciais')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingAgent, setEditingAgent] = useState<AgenteIA | null>(null)

  // Estados dos formulários
  const [credenciaisForm, setCredenciaisForm] = useState({
    openai_api_token: '',
    model: 'gpt-4.1-mini',
    apikey_elevenlabs: '',
    id_voz_elevenlabs: '',
    vector_store_ids: '',
    delay_entre_mensagens_em_segundos: 1,
    delay_apos_intervencao_humana_minutos: 60,
    inicio_expediente: 8,
    fim_expediente: 18
  })

  useEffect(() => {
    if (currentUser) {
      loadUsers()
      loadCredenciais()
      loadAgentes()
    }
  }, [currentUser])

  const loadUsers = async () => {
    const { users: userList } = await authService.getUsers()
    setUsers(userList)
  }

  const loadCredenciais = async () => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('configuracoes_credenciais')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (data) {
        setCredenciais(data)
        setCredenciaisForm({
          openai_api_token: data.openai_api_token || '',
          model: data.model || 'gpt-4.1-mini',
          apikey_elevenlabs: data.apikey_elevenlabs || '',
          id_voz_elevenlabs: data.id_voz_elevenlabs || '',
          vector_store_ids: data.vector_store_ids ? JSON.stringify(data.vector_store_ids) : '',
          delay_entre_mensagens_em_segundos: data.delay_entre_mensagens_em_segundos || 1,
          delay_apos_intervencao_humana_minutos: data.delay_apos_intervencao_humana_minutos || 60,
          inicio_expediente: data.inicio_expediente || 8,
          fim_expediente: data.fim_expediente || 18
        })
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error)
    }
  }

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

  const saveCredenciais = async () => {
    if (!currentUser) return

    try {
      const dataToSave = {
        ...credenciaisForm,
        vector_store_ids: credenciaisForm.vector_store_ids ? JSON.parse(credenciaisForm.vector_store_ids) : null,
        user_id: currentUser.id,
        cliente: currentUser.name
      }

      if (credenciais) {
        // Update
        const { error } = await supabase
          .from('configuracoes_credenciais')
          .update(dataToSave)
          .eq('id', credenciais.id)
      } else {
        // Insert
        const { error } = await supabase
          .from('configuracoes_credenciais')
          .insert([dataToSave])
      }

      alert('Credenciais salvas com sucesso!')
      loadCredenciais()
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error)
      alert('Erro ao salvar credenciais')
    }
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
    if (!confirm('Tem certeza que deseja excluir este agente?')) return

    try {
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Agente excluído com sucesso!')
      loadAgentes()
    } catch (error) {
      console.error('Erro ao excluir agente:', error)
      alert('Erro ao excluir agente')
    }
  }

  if (!currentUser || (currentUser.role !== 'admin' && activeTab === 'usuarios')) {
    // Permitir acesso às outras abas para usuários normais
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-2 text-sm text-gray-700">
          Gerencie suas credenciais, agentes IA e configurações do sistema
        </p>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('credenciais')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'credenciais'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key className="h-4 w-4 inline mr-2" />
            Credenciais
          </button>
          <button
            onClick={() => setActiveTab('agentes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agentes'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bot className="h-4 w-4 inline mr-2" />
            Agentes IA
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'usuarios'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Usuários
            </button>
          )}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'credenciais' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Configurações de Credenciais</h3>
            <button
              onClick={saveCredenciais}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* APIs de IA */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">APIs de IA</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Token
                </label>
                <input
                  type="password"
                  value={credenciaisForm.openai_api_token}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, openai_api_token: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <select
                  value={credenciaisForm.model}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, model: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                  <option value="gpt-4.1">GPT-4.1</option>
                  <option value="gpt-5">GPT-5</option>
                  <option value="gpt-5-mini">GPT-5 Mini</option>
                  <option value="gpt-5-nano">GPT-5 Nano</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ElevenLabs API Key
                </label>
                <input
                  type="password"
                  value={credenciaisForm.apikey_elevenlabs}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, apikey_elevenlabs: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Voz ElevenLabs
                </label>
                <input
                  type="text"
                  value={credenciaisForm.id_voz_elevenlabs}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, id_voz_elevenlabs: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vector Store IDs (JSON)
                </label>
                <textarea
                  value={credenciaisForm.vector_store_ids}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, vector_store_ids: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder='["vs_123", "vs_456"]'
                />
              </div>
            </div>

            {/* Configurações de Timing */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b pb-2">Configurações de Timing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay Entre Mensagens (segundos)
                </label>
                <input
                  type="number"
                  value={credenciaisForm.delay_entre_mensagens_em_segundos}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, delay_entre_mensagens_em_segundos: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delay Após Intervenção Humana (minutos)
                </label>
                <input
                  type="number"
                  value={credenciaisForm.delay_apos_intervencao_humana_minutos}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, delay_apos_intervencao_humana_minutos: parseInt(e.target.value) || 60})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início Expediente (hora)
                  </label>
                  <input
                    type="number"
                    value={credenciaisForm.inicio_expediente}
                    onChange={(e) => setCredenciaisForm({...credenciaisForm, inicio_expediente: parseInt(e.target.value) || 8})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="23"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fim Expediente (hora)
                  </label>
                  <input
                    type="number"
                    value={credenciaisForm.fim_expediente}
                    onChange={(e) => setCredenciaisForm({...credenciaisForm, fim_expediente: parseInt(e.target.value) || 18})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max="23"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agentes' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Agentes IA</h3>
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
              <div className="space-y-4">
                {agentes.map((agente) => (
                  <div key={agente.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{agente.nome}</h4>
                        <p className="text-sm text-gray-600 mt-1">{agente.funcao}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                          {agente.estagio}
                        </span>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700">
                            <strong>Prompt:</strong>
                          </p>
                          <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded border max-h-20 overflow-y-auto">
                            {agente.prompt}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingAgent(agente)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteAgent(agente.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agente configurado</h3>
                <p className="text-gray-600 mb-4">Crie seu primeiro agente IA</p>
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
                  Criar Primeiro Agente
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && currentUser?.role === 'admin' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Usuários do Sistema
                </h3>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Agente */}
      {editingAgent && (
        <AgentModal
          agent={editingAgent}
          onSave={saveAgent}
          onClose={() => setEditingAgent(null)}
        />
      )}

      {/* Formulário de criação de usuário - placeholder */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Criar Novo Usuário</h3>
            <p className="text-sm text-gray-600 mb-4">
              Funcionalidade será implementada em breve
            </p>
            <button
              onClick={() => setShowCreateForm(false)}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )

  async function handleDeleteUser(user: User) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      console.log('Excluir usuário:', user.id)
    }
  }
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
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        <h3 className="text-lg font-medium mb-6">
          {agent.id && agent.id > 0 ? 'Editar Agente' : 'Criar Novo Agente'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID do Agente
              </label>
              <input
                type="text"
                value={formData.agente_id}
                onChange={(e) => setFormData({...formData, agente_id: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="agent_001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <input
              type="text"
              value={formData.funcao}
              onChange={(e) => setFormData({...formData, funcao: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Especialista em vendas e conversões"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estágio
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt do Agente
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({...formData, prompt: e.target.value})}
              rows={8}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Você é um agente especialista em..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
            >
              {agent.id && agent.id > 0 ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}