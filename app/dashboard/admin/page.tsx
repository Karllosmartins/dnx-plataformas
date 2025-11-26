'use client'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../components/shared/AuthWrapper'
import { hasFeatureAccess } from '../../../lib/permissions'
import { workspacesApi } from '../../../lib/api-client'
import { supabase } from '../../../lib/supabase'
import {
  Building2,
  Plus,
  Edit,
  Save,
  X,
  Settings,
  Shield
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
}

interface Plano {
  id: number
  nome: string
  acesso_dashboard: boolean
  acesso_crm: boolean
  acesso_whatsapp: boolean
  acesso_disparo_simples: boolean
  acesso_disparo_ia: boolean
  acesso_agentes_ia: boolean
  acesso_extracao_leads: boolean
  acesso_enriquecimento: boolean
  acesso_usuarios: boolean
  acesso_consulta: boolean
  acesso_integracoes: boolean
  acesso_arquivos: boolean
}

interface Workspace {
  id: string
  name: string
  slug: string
  owner_id?: number
  plano_id?: number
  plano_nome?: string
  limite_leads?: number
  limite_consultas?: number
  limite_instancias?: number
  plano_customizado?: any
  created_at: string
}

interface WorkspaceForm {
  name: string
  slug: string
  owner_id: number | null
  plano_id: number | null
  limite_leads: number
  limite_consultas: number
  limite_instancias: number
  permissions: {
    acesso_dashboard: boolean
    acesso_crm: boolean
    acesso_whatsapp: boolean
    acesso_disparo_simples: boolean
    acesso_disparo_ia: boolean
    acesso_agentes_ia: boolean
    acesso_extracao_leads: boolean
    acesso_enriquecimento: boolean
    acesso_usuarios: boolean
    acesso_consulta: boolean
    acesso_integracoes: boolean
    acesso_arquivos: boolean
  }
}

const emptyForm: WorkspaceForm = {
  name: '',
  slug: '',
  owner_id: null,
  plano_id: null,
  limite_leads: 1000,
  limite_consultas: 100,
  limite_instancias: 3,
  permissions: {
    acesso_dashboard: true,
    acesso_crm: true,
    acesso_whatsapp: false,
    acesso_disparo_simples: false,
    acesso_disparo_ia: false,
    acesso_agentes_ia: false,
    acesso_extracao_leads: false,
    acesso_enriquecimento: false,
    acesso_usuarios: false,
    acesso_consulta: false,
    acesso_integracoes: false,
    acesso_arquivos: false,
  }
}

export default function AdminWorkspacesPage() {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewWorkspace, setShowNewWorkspace] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null)
  const [formData, setFormData] = useState<WorkspaceForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    cpf: '',
    telefone: '',
    password: ''
  })

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([
      fetchWorkspaces(),
      fetchUsers(),
      fetchPlanos()
    ])
    setLoading(false)
  }

  const fetchWorkspaces = async () => {
    try {
      const response = await workspacesApi.list()
      if (response.success && response.data) {
        const workspacesData = Array.isArray(response.data) ? response.data : [response.data]
        setWorkspaces(workspacesData)
      }
    } catch (error) {
      console.error('Erro ao buscar workspaces:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const fetchPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('nome')

      if (error) throw error
      setPlanos(data || [])
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    }
  }

  const handleNewWorkspace = () => {
    setFormData(emptyForm)
    setEditingWorkspace(null)
    setShowNewWorkspace(true)
  }

  const handleEditWorkspace = (workspace: Workspace) => {
    setFormData({
      name: workspace.name,
      slug: workspace.slug,
      owner_id: workspace.owner_id || null,
      plano_id: workspace.plano_id || null,
      limite_leads: workspace.limite_leads || 1000,
      limite_consultas: workspace.limite_consultas || 100,
      limite_instancias: workspace.limite_instancias || 3,
      permissions: workspace.plano_customizado || emptyForm.permissions
    })
    setEditingWorkspace(workspace.id)
    setShowNewWorkspace(true)
  }

  const handleCancelEdit = () => {
    setFormData(emptyForm)
    setEditingWorkspace(null)
    setShowNewWorkspace(false)
  }

  const handleSaveWorkspace = async () => {
    if (!formData.name || !formData.owner_id) {
      alert('Nome e Proprietário são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        owner_id: formData.owner_id,
        plano_id: formData.plano_id,
        limite_leads: formData.limite_leads,
        limite_consultas: formData.limite_consultas,
        limite_instancias: formData.limite_instancias,
        plano_customizado: formData.permissions
      }

      let response
      if (editingWorkspace) {
        response = await workspacesApi.update(editingWorkspace, payload)
      } else {
        response = await workspacesApi.create(payload)
      }

      if (response.success) {
        await fetchWorkspaces()
        handleCancelEdit()
      } else {
        alert('Erro ao salvar workspace: ' + (response.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar workspace:', error)
      alert('Erro ao salvar workspace')
    } finally {
      setSaving(false)
    }
  }

  const handlePermissionChange = (key: keyof WorkspaceForm['permissions'], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: checked
      }
    }))
  }

  const handlePlanChange = (planoId: string) => {
    const plano = planos.find(p => p.id === parseInt(planoId))
    if (plano) {
      setFormData(prev => ({
        ...prev,
        plano_id: plano.id,
        permissions: {
          acesso_dashboard: plano.acesso_dashboard,
          acesso_crm: plano.acesso_crm,
          acesso_whatsapp: plano.acesso_whatsapp,
          acesso_disparo_simples: plano.acesso_disparo_simples,
          acesso_disparo_ia: plano.acesso_disparo_ia,
          acesso_agentes_ia: plano.acesso_agentes_ia,
          acesso_extracao_leads: plano.acesso_extracao_leads,
          acesso_enriquecimento: plano.acesso_enriquecimento,
          acesso_usuarios: plano.acesso_usuarios,
          acesso_consulta: plano.acesso_consulta,
          acesso_integracoes: plano.acesso_integracoes,
          acesso_arquivos: plano.acesso_arquivos,
        }
      }))
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      alert('Nome, email e senha são obrigatórios')
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: newUserData.name,
          email: newUserData.email,
          cpf: newUserData.cpf,
          telefone: newUserData.telefone,
          password: newUserData.password,
          role: 'user'
        }])
        .select()
        .single()

      if (error) throw error

      // Atualizar lista de usuários
      await fetchUsers()

      // Selecionar o novo usuário automaticamente
      setFormData(prev => ({ ...prev, owner_id: data.id }))

      // Limpar formulário e fechar
      setNewUserData({ name: '', email: '', cpf: '', telefone: '', password: '' })
      setShowNewUserForm(false)

      alert('Usuário criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário: ' + (error as any).message)
    }
  }

  useEffect(() => {
    if (user && hasFeatureAccess(user as any, 'usuarios')) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Verificar se o usuário tem acesso
  if (!user || !hasFeatureAccess(user as any, 'usuarios')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não tem permissão para acessar a administração de workspaces.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gerenciamento de Workspaces
              </h1>
              <p className="mt-2 text-gray-600">
                Administre workspaces, planos e permissões
              </p>
            </div>
          </div>
          <button
            onClick={handleNewWorkspace}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Workspace
          </button>
        </div>
      </div>

      {/* New/Edit Workspace Form */}
      {showNewWorkspace && (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingWorkspace ? 'Editar Workspace' : 'Novo Workspace'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure os detalhes, plano e permissões do workspace
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome do Workspace *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do workspace"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="slug-do-workspace"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="owner" className="block text-sm font-medium text-gray-700">
                    Proprietário *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewUserForm(!showNewUserForm)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {showNewUserForm ? 'Fechar' : 'Criar Novo Usuário'}
                  </button>
                </div>
                <select
                  id="owner"
                  value={formData.owner_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_id: parseInt(e.target.value) || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o proprietário</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>

                {/* Formulário de Novo Usuário */}
                {showNewUserForm && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Criar Novo Usuário</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nome *
                        </label>
                        <input
                          type="text"
                          value={newUserData.name}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome completo"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@exemplo.com"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          CPF
                        </label>
                        <input
                          type="text"
                          value={newUserData.cpf}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, cpf: e.target.value }))}
                          placeholder="000.000.000-00"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          type="text"
                          value={newUserData.telefone}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, telefone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Senha *
                        </label>
                        <input
                          type="password"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewUserForm(false)
                          setNewUserData({ name: '', email: '', cpf: '', telefone: '', password: '' })
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateUser}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Criar e Selecionar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="plano" className="block text-sm font-medium text-gray-700">
                  Plano
                </label>
                <select
                  id="plano"
                  value={formData.plano_id || ''}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o plano</option>
                  {planos.map(plano => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Limites */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900">Limites de Consumo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="limite_leads" className="block text-sm font-medium text-gray-700">
                    Limite de Leads
                  </label>
                  <input
                    id="limite_leads"
                    type="number"
                    value={formData.limite_leads}
                    onChange={(e) => setFormData(prev => ({ ...prev, limite_leads: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="limite_consultas" className="block text-sm font-medium text-gray-700">
                    Limite de Consultas
                  </label>
                  <input
                    id="limite_consultas"
                    type="number"
                    value={formData.limite_consultas}
                    onChange={(e) => setFormData(prev => ({ ...prev, limite_consultas: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="limite_instancias" className="block text-sm font-medium text-gray-700">
                    Limite de Instâncias
                  </label>
                  <input
                    id="limite_instancias"
                    type="number"
                    value={formData.limite_instancias}
                    onChange={(e) => setFormData(prev => ({ ...prev, limite_instancias: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Permissões Customizadas */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Permissões Customizadas</h3>
              <p className="text-sm text-gray-500">
                Estas permissões sobrescrevem as do plano selecionado
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(formData.permissions).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => handlePermissionChange(key as keyof WorkspaceForm['permissions'], e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {key.replace('acesso_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={handleSaveWorkspace}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Workspaces */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Workspaces Cadastrados</h2>
          <p className="mt-1 text-sm text-gray-500">
            {workspaces.length} workspace(s) no sistema
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {workspaces.map(workspace => (
              <div
                key={workspace.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{workspace.name}</h3>
                    <span className="text-xs text-gray-500">({workspace.slug})</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Plano: {workspace.plano_nome || 'Sem plano'} |
                    Leads: {workspace.limite_leads || 0} |
                    Consultas: {workspace.limite_consultas || 0} |
                    Instâncias: {workspace.limite_instancias || 0}
                  </div>
                </div>
                <button
                  onClick={() => handleEditWorkspace(workspace)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </div>
            ))}
            {workspaces.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Nenhum workspace cadastrado</p>
                <button
                  onClick={handleNewWorkspace}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}