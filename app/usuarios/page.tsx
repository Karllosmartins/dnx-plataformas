'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
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
  cpf?: string
  telefone?: string
  tipos_negocio?: number[]
}

interface ConfigCredentials {
  // APIs de IA
  openai_api_token?: string
  gemini_api_key?: string
  model?: string
  type_tool_supabase?: string
  reasoning_effort?: string
  apikeydados?: string

  // ElevenLabs
  apikey_elevenlabs?: string
  id_voz_elevenlabs?: string

  // FireCrawl
  firecrawl_apikey?: string

  // WhatsApp Evolution API
  baseurl?: string
  instancia?: string
  apikey?: string

  // Supabase Databases
  base_tools_supabase?: string
  base_leads_supabase?: string
  base_mensagens_supabase?: string
  base_agentes_supabase?: string
  base_rag_supabase?: string
  base_ads_supabase?: string

  // Configurações do Agente
  prompt_do_agente?: string
  vector_store_ids?: string
  structured_output?: string

  // Configurações Operacionais
  delay_entre_mensagens_em_segundos?: number
  delay_apos_intervencao_humana_minutos?: number
  inicio_expediente?: number
  fim_expediente?: number

  // CRM Integration
  url_crm?: string
  usuario_crm?: string
  senha_crm?: string
  token_crm?: string

  // Drive Integration
  pasta_drive?: string
  id_pasta_drive_rag?: string

  // Cliente
  cliente?: string

  // Datecode (Consulta e Enriquecimento)
  datecode_username?: string
  datecode_password?: string
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
        // Carregar tipos de negócio para cada usuário
        const usersWithTypes = await Promise.all(
          data.map(async (user) => {
            try {
              const { data: userTipos, error: tiposError } = await supabase
                .from('user_tipos_negocio')
                .select(`
                  tipo_negocio_id,
                  tipos_negocio (
                    id,
                    nome_exibicao,
                    cor
                  )
                `)
                .eq('user_id', user.id)

              if (tiposError) {
                console.error('Erro ao carregar tipos do usuário:', tiposError)
                return { ...user, tipos_negocio: [] }
              }

              return {
                ...user,
                tipos_negocio: userTipos?.map(ut => ut.tipos_negocio).filter(Boolean) || []
              }
            } catch (err) {
              console.error('Erro ao processar usuário:', err)
              return { ...user, tipos_negocio: [] }
            }
          })
        )

        setUsers(usersWithTypes)
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
      // Separar tipos_negocio dos dados do usuário
      const { tipos_negocio, plano, ...userDataOnly } = userData

      // Buscar o ID do plano baseado no nome
      let plano_id: number | null = null
      if (plano) {
        const { data: planoData, error: planoError } = await supabase
          .from('planos')
          .select('id')
          .eq('nome', plano)
          .maybeSingle()

        if (planoError) {
          console.error('Erro ao buscar plano:', planoError)
          throw new Error(`Erro ao buscar plano: ${planoError.message}`)
        }

        if (planoData) {
          plano_id = planoData.id
        }
      }

      const dataToSave = {
        ...userDataOnly,
        plano_id: plano_id,
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
        // Separar credenciais Datecode das demais
        const { datecode_username, datecode_password, ...otherCredentials } = credentials

        // 1. Salvar credenciais gerais (configuracoes_credenciais)
        const credentialsToSave = Object.fromEntries(
          Object.entries(otherCredentials).filter(([_, value]) =>
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

        // 2. Salvar credenciais Datecode na tabela credencias_diversas
        if (datecode_username || datecode_password) {
          const datecodeCredentials = {
            username: datecode_username || '',
            password: datecode_password || ''
          }

          const { data: existingDiversas } = await supabase
            .from('credencias_diversas')
            .select('id, datecode')
            .eq('user_id', userId)
            .maybeSingle()

          if (existingDiversas) {
            // Atualizar registro existente
            const { error: datecodeError } = await supabase
              .from('credencias_diversas')
              .update({
                datecode: datecodeCredentials,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId)

            if (datecodeError) throw datecodeError
          } else {
            // Criar novo registro
            const { error: datecodeError } = await supabase
              .from('credencias_diversas')
              .insert([{
                user_id: userId,
                datecode: datecodeCredentials,
                created_at: new Date().toISOString()
              }])

            if (datecodeError) throw datecodeError
          }
        }
      }

      // Salvar tipos de negócio do usuário
      if (userData.tipos_negocio && userId) {
        // Remover tipos existentes
        await supabase
          .from('user_tipos_negocio')
          .delete()
          .eq('user_id', userId)

        // Adicionar novos tipos se houver seleções
        if (userData.tipos_negocio.length > 0) {
          const userTipos = userData.tipos_negocio.map(tipoId => ({
            user_id: userId,
            tipo_negocio_id: tipoId,
            created_at: new Date().toISOString()
          }))

          const { error: tiposError } = await supabase
            .from('user_tipos_negocio')
            .insert(userTipos)

          if (tiposError) throw tiposError
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
              cpf: '',
              telefone: '',
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

                      {/* Tipos de Negócio */}
                      {user.tipos_negocio && user.tipos_negocio.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 block mb-2">
                            Tipos de Negócio:
                          </span>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {user.tipos_negocio.map((tipo: any) => (
                              <span
                                key={tipo.id}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: tipo.cor || '#6B7280' }}
                              >
                                {tipo.nome_exibicao}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

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
    active: user.active ?? true,
    cpf: user.cpf || '',
    telefone: user.telefone || '',
    tipos_negocio: []
  })

  const [credentials, setCredentials] = useState<ConfigCredentials>({})
  const [tiposNegocio, setTiposNegocio] = useState<any[]>([])
  const [userTiposNegocio, setUserTiposNegocio] = useState<number[]>([])

  // Carregar tipos de negócio e tipos do usuário
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar tipos de negócio
        const { data: tipos, error: tiposError } = await supabase
          .from('tipos_negocio')
          .select('id, nome_exibicao, ativo')
          .eq('ativo', true)
          .order('ordem', { ascending: true })

        if (tiposError) throw tiposError
        setTiposNegocio(tipos || [])

        // Carregar tipos do usuário se estiver editando
        if (user.id && user.id > 0) {
          const { data: userTipos, error: userTiposError } = await supabase
            .from('user_tipos_negocio')
            .select('tipo_negocio_id')
            .eq('user_id', user.id)

          if (userTiposError) throw userTiposError
          const tipoIds = userTipos?.map(ut => ut.tipo_negocio_id) || []
          setUserTiposNegocio(tipoIds)
          setFormData(prev => ({ ...prev, tipos_negocio: tipoIds }))
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }

    carregarDados()
  }, [user.id])

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                maxLength={20}
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

          {/* Seleção de Tipos de Negócio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipos de Negócio
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tiposNegocio.map((tipo) => (
                <div key={tipo.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`tipo-${tipo.id}`}
                    checked={formData.tipos_negocio?.includes(tipo.id) || false}
                    onChange={(e) => {
                      const currentTipos = formData.tipos_negocio || []
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          tipos_negocio: [...currentTipos, tipo.id]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          tipos_negocio: currentTipos.filter(id => id !== tipo.id)
                        })
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label 
                    htmlFor={`tipo-${tipo.id}`}
                    className="ml-2 text-sm text-gray-700 cursor-pointer"
                  >
                    {tipo.nome_exibicao}
                  </label>
                </div>
              ))}
            </div>
            {tiposNegocio.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Nenhum tipo de negócio disponível. Configure os tipos na página administrativa.
              </p>
            )}
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

          {/* Seção de Credenciais Completa */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-indigo-600" />
              Configurações e Credenciais (Opcional)
            </h4>
            <p className="text-sm text-gray-600 mb-6">
              Preencha apenas os campos necessários. Campos vazios usarão configuração padrão do sistema.
            </p>
            
            {/* Seção: APIs de IA */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🤖 APIs de IA</h5>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                  <input
                    type="password"
                    value={credentials.gemini_api_key || ''}
                    onChange={(e) => setCredentials({...credentials, gemini_api_key: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="AI..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo IA</label>
                  <select
                    value={credentials.model || ''}
                    onChange={(e) => setCredentials({...credentials, model: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Usar padrão do sistema</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Tool Supabase</label>
                  <select
                    value={credentials.type_tool_supabase || ''}
                    onChange={(e) => setCredentials({...credentials, type_tool_supabase: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Usar padrão do sistema</option>
                    <option value="OpenAi">OpenAI</option>
                    <option value="Gemini">Gemini</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reasoning Effort</label>
                  <select
                    value={credentials.reasoning_effort || ''}
                    onChange={(e) => setCredentials({...credentials, reasoning_effort: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Usar padrão do sistema</option>
                    <option value="low">Baixo</option>
                    <option value="medium">Médio</option>
                    <option value="high">Alto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key de Dados (Profile)</label>
                  <input
                    type="password"
                    value={credentials.apikeydados || ''}
                    onChange={(e) => setCredentials({...credentials, apikeydados: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="043d2754-..."
                  />
                </div>
              </div>
            </div>

            {/* Seção: ElevenLabs */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🎙️ ElevenLabs (Síntese de Voz)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key ElevenLabs</label>
                  <input
                    type="password"
                    value={credentials.apikey_elevenlabs || ''}
                    onChange={(e) => setCredentials({...credentials, apikey_elevenlabs: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="sk_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID da Voz ElevenLabs</label>
                  <input
                    type="text"
                    value={credentials.id_voz_elevenlabs || ''}
                    onChange={(e) => setCredentials({...credentials, id_voz_elevenlabs: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="21m00Tcm4TlvDq8ikWAM"
                  />
                </div>
              </div>
            </div>

            {/* Seção: FireCrawl */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🔥 FireCrawl (Web Scraping)</h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">FireCrawl API Key</label>
                  <input
                    type="password"
                    value={credentials.firecrawl_apikey || ''}
                    onChange={(e) => setCredentials({...credentials, firecrawl_apikey: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="fc-..."
                  />
                </div>
              </div>
            </div>

            {/* Seção: WhatsApp */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">📱 WhatsApp Evolution API</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                  <input
                    type="url"
                    value={credentials.baseurl || ''}
                    onChange={(e) => setCredentials({...credentials, baseurl: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://wsapi.dnmarketing.com.br"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Instância</label>
                  <input
                    type="text"
                    value={credentials.instancia || ''}
                    onChange={(e) => setCredentials({...credentials, instancia: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="minha-instancia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key da Instância</label>
                  <input
                    type="password"
                    value={credentials.apikey || ''}
                    onChange={(e) => setCredentials({...credentials, apikey: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="B6D711FCDE4D4FD5936544120E713976"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Supabase Databases */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🗄️ Bases de Dados Supabase</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Tools</label>
                  <input
                    type="text"
                    value={credentials.base_tools_supabase || ''}
                    onChange={(e) => setCredentials({...credentials, base_tools_supabase: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="URL da base Tools"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Leads</label>
                  <input
                    type="text"
                    value={credentials.base_leads_supabase || ''}
                    onChange={(e) => setCredentials({...credentials, base_leads_supabase: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="URL da base Leads"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Mensagens</label>
                  <input
                    type="text"
                    value={credentials.base_mensagens_supabase || ''}
                    onChange={(e) => setCredentials({...credentials, base_mensagens_supabase: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="URL da base Mensagens"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Agentes</label>
                  <input
                    type="text"
                    value={credentials.base_agentes_supabase || ''}
                    onChange={(e) => setCredentials({...credentials, base_agentes_supabase: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="URL da base Agentes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base RAG</label>
                  <input
                    type="text"
                    value={credentials.base_rag_supabase || ''}
                    onChange={(e) => setCredentials({...credentials, base_rag_supabase: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="URL da base RAG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Ads</label>
                  <input
                    type="text"
                    value={credentials.base_ads_supabase || ''}
                    onChange={(e) => setCredentials({...credentials, base_ads_supabase: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="URL da base Ads"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Configurações do Agente */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🤖 Configurações do Agente</h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prompt do Agente</label>
                  <textarea
                    value={credentials.prompt_do_agente || ''}
                    onChange={(e) => setCredentials({...credentials, prompt_do_agente: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={4}
                    placeholder="Você é um assistente especializado em..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vector Store IDs</label>
                    <input
                      type="text"
                      value={credentials.vector_store_ids || ''}
                      onChange={(e) => setCredentials({...credentials, vector_store_ids: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder='["vs_abc123", "vs_def456"]'
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Structured Output</label>
                    <input
                      type="text"
                      value={credentials.structured_output || ''}
                      onChange={(e) => setCredentials({...credentials, structured_output: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder='{"tipo": "object", "properties": {...}}'
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Configurações Operacionais */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">⚙️ Configurações Operacionais</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delay Entre Mensagens (seg)</label>
                  <input
                    type="number"
                    min="1"
                    value={credentials.delay_entre_mensagens_em_segundos || ''}
                    onChange={(e) => setCredentials({...credentials, delay_entre_mensagens_em_segundos: parseInt(e.target.value) || undefined})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delay Após Intervenção (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={credentials.delay_apos_intervencao_humana_minutos || ''}
                    onChange={(e) => setCredentials({...credentials, delay_apos_intervencao_humana_minutos: parseInt(e.target.value) || undefined})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início Expediente (h)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={credentials.inicio_expediente || ''}
                    onChange={(e) => setCredentials({...credentials, inicio_expediente: parseInt(e.target.value) || undefined})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fim Expediente (h)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={credentials.fim_expediente || ''}
                    onChange={(e) => setCredentials({...credentials, fim_expediente: parseInt(e.target.value) || undefined})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="18"
                  />
                </div>
              </div>
            </div>

            {/* Seção: CRM Integration */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🔗 Integração CRM</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do CRM</label>
                  <input
                    type="url"
                    value={credentials.url_crm || ''}
                    onChange={(e) => setCredentials({...credentials, url_crm: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://crm.exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuário CRM</label>
                  <input
                    type="text"
                    value={credentials.usuario_crm || ''}
                    onChange={(e) => setCredentials({...credentials, usuario_crm: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="usuario@crm.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha CRM</label>
                  <input
                    type="password"
                    value={credentials.senha_crm || ''}
                    onChange={(e) => setCredentials({...credentials, senha_crm: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token CRM</label>
                  <input
                    type="password"
                    value={credentials.token_crm || ''}
                    onChange={(e) => setCredentials({...credentials, token_crm: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="token_api_crm"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Drive Integration */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">📁 Integração Google Drive</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pasta Drive</label>
                  <input
                    type="text"
                    value={credentials.pasta_drive || ''}
                    onChange={(e) => setCredentials({...credentials, pasta_drive: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Pasta Drive RAG</label>
                  <input
                    type="text"
                    value={credentials.id_pasta_drive_rag || ''}
                    onChange={(e) => setCredentials({...credentials, id_pasta_drive_rag: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Cliente */}
            <div className="mb-8">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🏢 Informações do Cliente</h5>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente/Empresa</label>
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

            {/* Seção: Datecode (Consulta e Enriquecimento) */}
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">🔍 Datecode (Consulta e Enriquecimento)</h5>
              <p className="text-sm text-gray-600 mb-4">
                Credenciais para consulta e enriquecimento de dados via Datecode API
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuário Datecode</label>
                  <input
                    type="text"
                    value={credentials.datecode_username || ''}
                    onChange={(e) => setCredentials({...credentials, datecode_username: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="seu_usuario_datecode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Datecode</label>
                  <input
                    type="password"
                    value={credentials.datecode_password || ''}
                    onChange={(e) => setCredentials({...credentials, datecode_password: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
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