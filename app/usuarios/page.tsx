'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { supabase, User, Tool, UserTool } from '../../lib/supabase'
import { getPlanDisplayName } from '../../lib/plans'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  UserCog,
  Settings,
  Wrench,
  Users,
  Crown,
  Shield
} from 'lucide-react'

interface UserFormData {
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  plano: 'basico' | 'premium' | 'enterprise'
  limite_leads: number
  limite_consultas: number
  numero_instancias: number
  active: boolean
}

interface ConfigCredentials {
  openai_api_token?: string
  gemini_api_key?: string
  model?: string
  type_tool_supabase?: string
  reasoning_effort?: string
  apikey_elevenlabs?: string
  id_voz_elevenlabs?: string
  firecrawl_apikey?: string
  baseurl?: string
  instancia?: string
  apikey?: string
  base_tools_supabase?: string
  base_leads_supabase?: string
  base_mensagens_supabase?: string
  base_agentes_supabase?: string
  base_rag_supabase?: string
  base_ads_supabase?: string
  prompt_do_agente?: string
  vector_store_ids?: string
  structured_output?: string
  delay_entre_mensagens_em_segundos?: number
  delay_apos_intervencao_humana_minutos?: number
  inicio_expediente?: number
  fim_expediente?: number
  url_crm?: string
  usuario_crm?: string
  senha_crm?: string
  token_crm?: string
  pasta_drive?: string
  id_pasta_drive_rag?: string
  cliente?: string
  apikeydados?: string
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showUserTools, setShowUserTools] = useState<{[key: number]: boolean}>({})
  const [defaultCredentials, setDefaultCredentials] = useState<ConfigCredentials>({})
  
  const loadDefaultCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_credenciais')
        .select('*')
        .eq('user_id', 24)
        .maybeSingle()

      if (data && !error) {
        const { id, user_id, created_at, updated_at, ...credentials } = data
        setDefaultCredentials(credentials)
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais padrão:', error)
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers()
      loadTools()
      loadDefaultCredentials()
    }
  }, [currentUser])

  // Verificar se o usuário atual é admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTools = async () => {
    try {
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

  const saveUser = async (userData: UserFormData, credentials?: ConfigCredentials) => {
    try {
      const dataToSave = {
        ...userData,
        updated_at: new Date().toISOString()
      }

      let userId: number

      if (editingUser && editingUser.id > 0) {
        const { error } = await supabase
          .from('users')
          .update(dataToSave)
          .eq('id', editingUser.id)

        if (error) throw error
        userId = editingUser.id
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([{
            ...dataToSave,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) throw error
        userId = newUser.id
      }

      // Salvar credenciais se fornecidas
      if (credentials && userId) {
        const credentialsToSave = Object.fromEntries(
          Object.entries(credentials).filter(([_, value]) => 
            value !== undefined && value !== null && value !== ''
          )
        )

        if (Object.keys(credentialsToSave).length > 0) {
          const finalCredentials = {
            ...defaultCredentials,
            ...credentialsToSave,
            user_id: userId,
            updated_at: new Date().toISOString()
          }

          const { data: existingConfig } = await supabase
            .from('configuracoes_credenciais')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

          if (existingConfig) {
            const { error: credError } = await supabase
              .from('configuracoes_credenciais')
              .update(finalCredentials)
              .eq('user_id', userId)

            if (credError) throw credError
          } else {
            const { error: credError } = await supabase
              .from('configuracoes_credenciais')
              .insert([{
                ...finalCredentials,
                created_at: new Date().toISOString()
              }])

            if (credError) throw credError
          }
        }
      }

      alert('Usuário e credenciais salvos com sucesso!')
      setEditingUser(null)
      loadUsers()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      alert('Erro ao salvar usuário')
    }
  }

  const deleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Usuário excluído com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando usuários...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <UserCog className="h-8 w-8 mr-3 text-indigo-600" />
          Gerenciamento de Usuários
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Gerencie usuários do sistema, planos, limites e ferramentas disponíveis
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Usuários do Sistema</h3>
          <button
            onClick={() => setEditingUser({
              id: 0,
              name: '',
              email: '',
              password: '',
              role: 'user',
              active: true,
              plano: 'basico',
              limite_leads: 100,
              limite_consultas: 50,
              numero_instancias: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as User)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </button>
        </div>

        <div className="p-6">
          {users.length > 0 ? (
            <div className="grid gap-6">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-gray-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${user.role === 'admin' ? 'bg-red-100' : 'bg-indigo-100'}`}>
                          {user.role === 'admin' ? (
                            <Crown className="h-6 w-6 text-red-600" />
                          ) : (
                            <Users className="h-6 w-6 text-indigo-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{user.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Plano</span>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {getPlanDisplayName(user.plano)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Instâncias</span>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {user.numero_instancias || 1}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Limite Leads</span>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {user.limite_leads.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Limite Consultas</span>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {user.limite_consultas.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          user.active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                        
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        ID: {user.id} • Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 justify-end sm:justify-start">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors whitespace-nowrap"
                      >
                        <Edit2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline ml-1">Editar</span>
                      </button>
                      <button
                        onClick={() => setShowUserTools({...showUserTools, [user.id]: !showUserTools[user.id]})}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors whitespace-nowrap"
                      >
                        <Wrench className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline ml-1">Tools</span>
                      </button>
                      {user.id !== parseInt(currentUser?.id || '0') && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors whitespace-nowrap"
                        >
                          <Trash2 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline ml-1">Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Seção de Tools do Usuário */}
                  {showUserTools[user.id] && (
                    <UserToolsSection 
                      userId={user.id} 
                      tools={tools} 
                      onClose={() => setShowUserTools({...showUserTools, [user.id]: false})}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCog className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-4">Nenhum usuário encontrado</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Comece criando o primeiro usuário do sistema.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <UserModal
          user={editingUser}
          onSave={saveUser}
          onClose={() => setEditingUser(null)}
          defaultConfig={defaultCredentials}
        />
      )}
    </div>
  )
}

// Componente para gerenciar tools do usuário
function UserToolsSection({ 
  userId, 
  tools, 
  onClose 
}: { 
  userId: number
  tools: Tool[]
  onClose: () => void
}) {
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserTools()
  }, [userId])

  const loadUserTools = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tools')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      if (data) {
        setUserTools(data)
      }
    } catch (error) {
      console.error('Erro ao carregar user_tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserTool = async (toolId: number, isActive: boolean) => {
    try {
      const existingUserTool = userTools.find(ut => ut.tool_id === toolId)
      
      if (existingUserTool) {
        // Atualizar existente
        const { error } = await supabase
          .from('user_tools')
          .update({ is_active: !isActive })
          .eq('user_id', userId)
          .eq('tool_id', toolId)

        if (error) throw error
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('user_tools')
          .insert([{
            user_id: userId,
            tool_id: toolId,
            is_active: true,
            agente_id: '1'
          }])

        if (error) throw error
      }

      loadUserTools()
    } catch (error) {
      console.error('Erro ao alterar tool:', error)
      alert('Erro ao alterar ferramenta')
    }
  }

  const isToolActive = (toolId: number): boolean => {
    const userTool = userTools.find(ut => ut.tool_id === toolId)
    return userTool?.is_active === true
  }

  if (loading) {
    return <div className="mt-4 p-4 bg-gray-50 rounded-lg">Carregando ferramentas...</div>
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h5 className="font-medium text-gray-900">Ferramentas Disponíveis</h5>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const isActive = isToolActive(tool.id)
          return (
            <div key={tool.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div>
                <h6 className="text-sm font-medium text-gray-900">{tool.nome}</h6>
                <p className="text-xs text-gray-500">{tool.type}</p>
              </div>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleUserTool(tool.id, isActive)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Componente Modal para Usuário
function UserModal({ 
  user, 
  onSave, 
  onClose,
  defaultConfig
}: { 
  user: User
  onSave: (data: UserFormData, credentials?: ConfigCredentials) => void
  onClose: () => void
  defaultConfig: ConfigCredentials
}) {
  const [formData, setFormData] = useState<UserFormData>({
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'user',
    plano: user.plano || 'basico',
    limite_leads: user.limite_leads || 100,
    limite_consultas: user.limite_consultas || 50,
    numero_instancias: user.numero_instancias || 1,
    active: user.active ?? true
  })

  const [credentials, setCredentials] = useState<ConfigCredentials>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData, credentials)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <UserCog className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {user.id && user.id > 0 ? 'Editar Usuário' : 'Criar Novo Usuário'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="João Silva"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="joao@exemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha {user.id > 0 ? '(deixe em branco para manter atual)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Digite a senha"
              required={user.id === 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuário
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plano
              </label>
              <select
                value={formData.plano}
                onChange={(e) => setFormData({...formData, plano: e.target.value as 'basico' | 'premium' | 'enterprise'})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="basico">Básico</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Instâncias
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.numero_instancias}
                onChange={(e) => setFormData({...formData, numero_instancias: parseInt(e.target.value) || 1})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de Leads
              </label>
              <input
                type="number"
                min="0"
                value={formData.limite_leads}
                onChange={(e) => setFormData({...formData, limite_leads: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de Consultas
              </label>
              <input
                type="number"
                min="0"
                value={formData.limite_consultas}
                onChange={(e) => setFormData({...formData, limite_consultas: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Usuário Ativo</span>
            </label>
          </div>

          {/* Seção de Credenciais Essenciais */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-indigo-600" />
              Credenciais (Opcional)
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Preencha apenas os campos necessários. Campos vazios usarão configuração padrão do sistema.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Token</label>
                <input
                  type="password"
                  value={credentials.openai_api_token || ''}
                  onChange={(e) => setCredentials({...credentials, openai_api_token: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="sk-proj-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key de Dados</label>
                <input
                  type="password"
                  value={credentials.apikeydados || ''}
                  onChange={(e) => setCredentials({...credentials, apikeydados: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="043d2754-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Base URL</label>
                <input
                  type="url"
                  value={credentials.baseurl || ''}
                  onChange={(e) => setCredentials({...credentials, baseurl: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://wsapi.dnmarketing.com.br"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={credentials.cliente || ''}
                  onChange={(e) => setCredentials({...credentials, cliente: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
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
              className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {user.id && user.id > 0 ? 'Atualizar Usuário' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}