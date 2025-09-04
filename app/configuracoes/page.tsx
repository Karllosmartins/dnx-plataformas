'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { authService, User } from '../../lib/auth'
import { supabase, ConfiguracaoCredenciais } from '../../lib/supabase'
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
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('credenciais')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Estados dos formulários
  const [credenciaisForm, setCredenciaisForm] = useState({
    openai_api_token: '',
    model: 'gpt-4.1-mini',
    apikey_elevenlabs: '',
    id_voz_elevenlabs: '',
    vector_store_ids: '',
    api_profile_key: '',
    delay_entre_mensagens_em_segundos: 1,
    delay_apos_intervencao_humana_minutos: 60,
    inicio_expediente: 8,
    fim_expediente: 18
  })

  useEffect(() => {
    if (currentUser) {
      loadUsers()
      loadCredenciais()
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

      // Carregar API Profile key da tabela credenciais_api
      const { data: profileData } = await supabase
        .from('credenciais_api')
        .select('api_key')
        .eq('user_id', currentUser.id)
        .eq('nome', 'profile')
        .single()

      if (data) {
        setCredenciais(data)
        setCredenciaisForm({
          openai_api_token: data.openai_api_token || '',
          model: data.model || 'gpt-4.1-mini',
          apikey_elevenlabs: data.apikey_elevenlabs || '',
          id_voz_elevenlabs: data.id_voz_elevenlabs || '',
          vector_store_ids: data.vector_store_ids ? JSON.stringify(data.vector_store_ids) : '',
          api_profile_key: profileData?.api_key || '',
          delay_entre_mensagens_em_segundos: data.delay_entre_mensagens_em_segundos || 1,
          delay_apos_intervencao_humana_minutos: data.delay_apos_intervencao_humana_minutos || 60,
          inicio_expediente: data.inicio_expediente || 8,
          fim_expediente: data.fim_expediente || 18
        })
      } else {
        // Se não tem credenciais, pelo menos carrega a API Profile
        setCredenciaisForm(prev => ({
          ...prev,
          api_profile_key: profileData?.api_key || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error)
    } finally {
      finishLoading()
    }
  }

  const finishLoading = () => {
    setLoading(false)
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

      // Salvar API Profile key na tabela credenciais_api
      if (credenciaisForm.api_profile_key) {
        // Verificar se já existe
        const { data: existingProfile } = await supabase
          .from('credenciais_api')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('nome', 'profile')
          .single()

        if (existingProfile) {
          // Update
          await supabase
            .from('credenciais_api')
            .update({ api_key: credenciaisForm.api_profile_key })
            .eq('id', existingProfile.id)
        } else {
          // Insert
          await supabase
            .from('credenciais_api')
            .insert([{
              user_id: currentUser.id,
              nome: 'profile',
              api_key: credenciaisForm.api_profile_key
            }])
        }
      }

      alert('Credenciais salvas com sucesso!')
      loadCredenciais()
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error)
      alert('Erro ao salvar credenciais')
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Profile Key
                </label>
                <input
                  type="password"
                  value={credenciaisForm.api_profile_key}
                  onChange={(e) => setCredenciaisForm({...credenciaisForm, api_profile_key: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="043d2754-cd7f-47ba-b83b-0dbbb3877f36"
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

