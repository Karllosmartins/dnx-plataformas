'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { adminWorkspacesApi } from '../../../lib/api-client'
import {
  Building,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Users,
  Key,
  Shield,
  Settings,
  Bot,
  Mic,
  Database,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react'

interface Plano {
  id: number
  nome: string
  descricao?: string
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
  limite_leads: number
  limite_consultas: number
  limite_instancias: number
}

interface Workspace {
  id: string
  name: string
  slug: string
  plano_id?: number
  ativo: boolean
  owner_id?: number
  limite_leads: number
  limite_consultas: number
  limite_instancias: number
  leads_consumidos: number
  consultas_realizadas: number
  instancias_ativas: number
  created_at: string
  updated_at: string
  planos?: Plano
  config_credenciais?: {
    openai_api_token?: string
    gemini_api_key?: string
    apikey_elevenlabs?: string
    id_voz_elevenlabs?: string
    model?: string
  }
  credenciais_diversas?: {
    datecode?: {
      username?: string
      password?: string
    }
  }
  total_membros: number
}

export default function WorkspacesSection() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null)
  const [showNewWorkspace, setShowNewWorkspace] = useState(false)

  useEffect(() => {
    fetchWorkspaces()
    fetchPlanos()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/admin/workspaces')
      const result = await response.json()

      if (result.success && result.data) {
        setWorkspaces(result.data)
      }
    } catch (error) {
      console.error('Erro ao buscar workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setPlanos(data || [])
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    }
  }

  const handleCreateWorkspace = async (workspaceData: Partial<Workspace> & {
    openai_api_token?: string
    gemini_api_key?: string
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    datecode_username?: string
    datecode_password?: string
  }) => {
    try {
      const response = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar workspace')
      }

      await fetchWorkspaces()
      setShowNewWorkspace(false)
      alert('Workspace criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar workspace:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar workspace')
    }
  }

  const handleUpdateWorkspace = async (id: string, workspaceData: Partial<Workspace> & {
    openai_api_token?: string
    gemini_api_key?: string
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    datecode_username?: string
    datecode_password?: string
  }) => {
    try {
      const response = await fetch(`/api/admin/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar workspace')
      }

      await fetchWorkspaces()
      setEditingWorkspace(null)
      alert('Workspace atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar workspace:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar workspace')
    }
  }

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const response = await fetch(`/api/admin/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar status')
      }

      await fetchWorkspaces()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar status')
    }
  }

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este workspace? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/workspaces/${id}`, {
        method: 'DELETE'
      })

      if (response.status === 204 || response.ok) {
        await fetchWorkspaces()
        alert('Workspace excluído com sucesso!')
      } else {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao excluir workspace')
      }
    } catch (error) {
      console.error('Erro ao excluir workspace:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir workspace')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Building className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gerenciamento de Workspaces
          </h2>
          <span className="ml-3 text-sm text-gray-500">
            ({workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={() => setShowNewWorkspace(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Workspace
        </button>
      </div>

      <div className="space-y-4">
        {showNewWorkspace && (
          <NovoWorkspaceCard
            planos={planos}
            onSave={handleCreateWorkspace}
            onCancel={() => setShowNewWorkspace(false)}
          />
        )}

        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            planos={planos}
            isEditing={editingWorkspace === workspace.id}
            onEdit={() => setEditingWorkspace(workspace.id)}
            onCancel={() => setEditingWorkspace(null)}
            onSave={handleUpdateWorkspace}
            onToggleAtivo={handleToggleAtivo}
            onDelete={handleDeleteWorkspace}
          />
        ))}

        {workspaces.length === 0 && !showNewWorkspace && (
          <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">Nenhum workspace encontrado</p>
            <button
              onClick={() => setShowNewWorkspace(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Criar primeiro workspace
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface WorkspaceCardProps {
  workspace: Workspace
  planos: Plano[]
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (id: string, data: any) => void
  onToggleAtivo: (id: string, ativo: boolean) => void
  onDelete: (id: string) => void
}

function WorkspaceCard({
  workspace,
  planos,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onToggleAtivo,
  onDelete
}: WorkspaceCardProps) {
  const [activeTab, setActiveTab] = useState('basico')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    name: workspace.name,
    slug: workspace.slug,
    plano_id: workspace.plano_id?.toString() || '',
    ativo: workspace.ativo,
    limite_leads: workspace.limite_leads,
    limite_consultas: workspace.limite_consultas,
    limite_instancias: workspace.limite_instancias,
    // Credenciais
    openai_api_token: workspace.config_credenciais?.openai_api_token || '',
    gemini_api_key: workspace.config_credenciais?.gemini_api_key || '',
    elevenlabs_api_key: workspace.config_credenciais?.apikey_elevenlabs || '',
    elevenlabs_voice_id: workspace.config_credenciais?.id_voz_elevenlabs || '',
    datecode_username: workspace.credenciais_diversas?.datecode?.username || '',
    datecode_password: workspace.credenciais_diversas?.datecode?.password || ''
  })

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSave = () => {
    onSave(workspace.id, {
      name: formData.name,
      slug: formData.slug,
      plano_id: formData.plano_id ? parseInt(formData.plano_id) : null,
      ativo: formData.ativo,
      limite_leads: formData.limite_leads,
      limite_consultas: formData.limite_consultas,
      limite_instancias: formData.limite_instancias,
      openai_api_token: formData.openai_api_token || undefined,
      gemini_api_key: formData.gemini_api_key || undefined,
      elevenlabs_api_key: formData.elevenlabs_api_key || undefined,
      elevenlabs_voice_id: formData.elevenlabs_voice_id || undefined,
      datecode_username: formData.datecode_username || undefined,
      datecode_password: formData.datecode_password || undefined
    })
  }

  if (!isEditing) {
    return (
      <div className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${!workspace.ativo ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="font-medium text-gray-900 mr-3">{workspace.name}</h3>
              <span className="text-xs text-gray-500 mr-3">/{workspace.slug}</span>
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                workspace.ativo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {workspace.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {workspace.planos?.nome || 'Sem plano'}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                {workspace.total_membros} membro{workspace.total_membros !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 mt-3">
              <div>
                <span className="block font-medium">Leads</span>
                <span>{workspace.leads_consumidos} / {workspace.limite_leads}</span>
              </div>
              <div>
                <span className="block font-medium">Consultas</span>
                <span>{workspace.consultas_realizadas} / {workspace.limite_consultas}</span>
              </div>
              <div>
                <span className="block font-medium">Instâncias</span>
                <span>{workspace.instancias_ativas} / {workspace.limite_instancias}</span>
              </div>
            </div>

            {/* Indicadores de credenciais */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                workspace.config_credenciais?.openai_api_token ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Bot className="h-3 w-3 mr-1" />
                OpenAI {workspace.config_credenciais?.openai_api_token ? <CheckCircle className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
              </span>
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                workspace.config_credenciais?.gemini_api_key ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Bot className="h-3 w-3 mr-1" />
                Gemini {workspace.config_credenciais?.gemini_api_key ? <CheckCircle className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
              </span>
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                workspace.config_credenciais?.apikey_elevenlabs ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Mic className="h-3 w-3 mr-1" />
                ElevenLabs {workspace.config_credenciais?.apikey_elevenlabs ? <CheckCircle className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
              </span>
              <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                workspace.credenciais_diversas?.datecode?.username ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Database className="h-3 w-3 mr-1" />
                Datecode {workspace.credenciais_diversas?.datecode?.username ? <CheckCircle className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleAtivo(workspace.id, !workspace.ativo)}
              className={`p-2 rounded ${
                workspace.ativo
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-green-600 hover:text-green-800'
              }`}
              title={workspace.ativo ? 'Desativar workspace' : 'Ativar workspace'}
            >
              {workspace.ativo ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </button>
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 p-2 rounded"
              title="Editar workspace"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(workspace.id)}
              className="text-red-600 hover:text-red-800 p-2 rounded"
              title="Excluir workspace"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basico', label: 'Informações', icon: Building },
    { id: 'limites', label: 'Limites', icon: Settings },
    { id: 'credenciais', label: 'APIs de IA', icon: Bot },
    { id: 'elevenlabs', label: 'ElevenLabs', icon: Mic },
    { id: 'datecode', label: 'Datecode', icon: Database }
  ]

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50">
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Editando: {workspace.name}</h3>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'basico' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Workspace *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={formData.plano_id}
                  onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem plano</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ws-ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ws-ativo" className="ml-2 block text-sm text-gray-900">
                  Workspace Ativo
                </label>
              </div>
            </div>
          )}

          {activeTab === 'limites' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Leads
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limite_leads}
                  onChange={(e) => setFormData({ ...formData, limite_leads: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Consultas
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limite_consultas}
                  onChange={(e) => setFormData({ ...formData, limite_consultas: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Instâncias WhatsApp
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limite_instancias}
                  onChange={(e) => setFormData({ ...formData, limite_instancias: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'credenciais' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Bot className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">APIs de IA</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Token
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.openai ? 'text' : 'password'}
                    value={formData.openai_api_token}
                    onChange={(e) => setFormData({ ...formData, openai_api_token: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-proj-..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('openai')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.gemini ? 'text' : 'password'}
                    value={formData.gemini_api_key}
                    onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('gemini')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'elevenlabs' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Mic className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">ElevenLabs (Sintese de Voz)</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key ElevenLabs
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.elevenlabs ? 'text' : 'password'}
                    value={formData.elevenlabs_api_key}
                    onChange={(e) => setFormData({ ...formData, elevenlabs_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk_..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('elevenlabs')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.elevenlabs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID da Voz
                </label>
                <input
                  type="text"
                  value={formData.elevenlabs_voice_id}
                  onChange={(e) => setFormData({ ...formData, elevenlabs_voice_id: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="21m00Tcm4TlvDq8ikWAM"
                />
              </div>
            </div>
          )}

          {activeTab === 'datecode' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Datecode (Consulta de Dados)</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username (Email)
                </label>
                <input
                  type="email"
                  value={formData.datecode_username}
                  onChange={(e) => setFormData({ ...formData, datecode_username: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.datecode ? 'text' : 'password'}
                    value={formData.datecode_password}
                    onChange={(e) => setFormData({ ...formData, datecode_password: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('datecode')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.datecode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-6 border-t border-gray-200 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

interface NovoWorkspaceCardProps {
  planos: Plano[]
  onSave: (data: any) => void
  onCancel: () => void
}

function NovoWorkspaceCard({ planos, onSave, onCancel }: NovoWorkspaceCardProps) {
  const [activeTab, setActiveTab] = useState('basico')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plano_id: '',
    ativo: true,
    limite_leads: 1000,
    limite_consultas: 100,
    limite_instancias: 1,
    openai_api_token: '',
    gemini_api_key: '',
    elevenlabs_api_key: '',
    elevenlabs_voice_id: '',
    datecode_username: '',
    datecode_password: ''
  })

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('Nome e Slug são obrigatórios')
      return
    }

    onSave({
      name: formData.name,
      slug: formData.slug,
      plano_id: formData.plano_id ? parseInt(formData.plano_id) : undefined,
      ativo: formData.ativo,
      limite_leads: formData.limite_leads,
      limite_consultas: formData.limite_consultas,
      limite_instancias: formData.limite_instancias,
      openai_api_token: formData.openai_api_token || undefined,
      gemini_api_key: formData.gemini_api_key || undefined,
      elevenlabs_api_key: formData.elevenlabs_api_key || undefined,
      elevenlabs_voice_id: formData.elevenlabs_voice_id || undefined,
      datecode_username: formData.datecode_username || undefined,
      datecode_password: formData.datecode_password || undefined
    })
  }

  const tabs = [
    { id: 'basico', label: 'Informações', icon: Building },
    { id: 'limites', label: 'Limites', icon: Settings },
    { id: 'credenciais', label: 'APIs de IA', icon: Bot },
    { id: 'elevenlabs', label: 'ElevenLabs', icon: Mic },
    { id: 'datecode', label: 'Datecode', icon: Database }
  ]

  return (
    <div className="border border-green-200 rounded-lg bg-green-50">
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Criar Novo Workspace</h3>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'basico' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Workspace *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                    setFormData({ ...formData, name, slug })
                  }}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="nome-da-empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={formData.plano_id}
                  onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sem plano</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="novo-ws-ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="novo-ws-ativo" className="ml-2 block text-sm text-gray-900">
                  Workspace Ativo
                </label>
              </div>
            </div>
          )}

          {activeTab === 'limites' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Leads
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limite_leads}
                  onChange={(e) => setFormData({ ...formData, limite_leads: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Consultas
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limite_consultas}
                  onChange={(e) => setFormData({ ...formData, limite_consultas: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Instâncias
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.limite_instancias}
                  onChange={(e) => setFormData({ ...formData, limite_instancias: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'credenciais' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Bot className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">APIs de IA</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Token
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.openai ? 'text' : 'password'}
                    value={formData.openai_api_token}
                    onChange={(e) => setFormData({ ...formData, openai_api_token: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-proj-..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('openai')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.gemini ? 'text' : 'password'}
                    value={formData.gemini_api_key}
                    onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('gemini')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'elevenlabs' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Mic className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">ElevenLabs (Sintese de Voz)</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key ElevenLabs
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.elevenlabs ? 'text' : 'password'}
                    value={formData.elevenlabs_api_key}
                    onChange={(e) => setFormData({ ...formData, elevenlabs_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk_..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('elevenlabs')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.elevenlabs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID da Voz
                </label>
                <input
                  type="text"
                  value={formData.elevenlabs_voice_id}
                  onChange={(e) => setFormData({ ...formData, elevenlabs_voice_id: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="21m00Tcm4TlvDq8ikWAM"
                />
              </div>
            </div>
          )}

          {activeTab === 'datecode' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Datecode (Consulta de Dados)</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username (Email)
                </label>
                <input
                  type="email"
                  value={formData.datecode_username}
                  onChange={(e) => setFormData({ ...formData, datecode_username: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.datecode ? 'text' : 'password'}
                    value={formData.datecode_password}
                    onChange={(e) => setFormData({ ...formData, datecode_password: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('datecode')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.datecode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-6 border-t border-gray-200 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <Save className="h-4 w-4 mr-1" />
            Criar Workspace
          </button>
        </div>
      </div>
    </div>
  )
}
