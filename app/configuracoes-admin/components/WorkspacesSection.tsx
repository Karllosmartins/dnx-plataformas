'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
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
  EyeOff,
  UserPlus,
  UserMinus,
  Crown,
  ToggleLeft,
  ToggleRight,
  Wrench
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
  produtos: boolean
  limite_leads: number
  limite_consultas: number
  limite_instancias: number
}

interface Membro {
  id: number
  user_id: number
  role: string
  joined_at: string
  users: {
    id: number
    name: string
    email: string
    role: string
    active: boolean
  }
}

// Tipos para Tools
interface Tool {
  id: number
  type: string
  nome: string
  descricao?: string
}

interface UserTool {
  id: number
  workspace_id: string
  tool_id: number
  agente_id?: number
  is_active: boolean
  tools?: Tool
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
  plano_customizado?: Record<string, boolean>
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
  membros?: Membro[]
  user_tools?: UserTool[]
}

interface Usuario {
  id: number
  name: string
  email: string
  role: string
  active: boolean
}

export default function WorkspacesSection() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [allUsers, setAllUsers] = useState<Usuario[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [allTools, setAllTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null)
  const [showNewWorkspace, setShowNewWorkspace] = useState(false)
  const [toolsModalWorkspace, setToolsModalWorkspace] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkspaces()
    fetchPlanos()
    fetchAllUsers()
    fetchAllTools()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      // Buscar todos os workspaces com suas informações
      const { data: workspacesData, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          planos (
            id,
            nome,
            descricao,
            acesso_dashboard,
            acesso_crm,
            acesso_whatsapp,
            acesso_disparo_simples,
            acesso_disparo_ia,
            acesso_agentes_ia,
            acesso_extracao_leads,
            acesso_enriquecimento,
            acesso_usuarios,
            acesso_consulta,
            acesso_integracoes,
            acesso_arquivos,
            produtos,
            limite_leads,
            limite_consultas,
            limite_instancias
          )
        `)
        .order('name')

      if (error) throw error

      // Buscar membros, credenciais para cada workspace
      const workspacesComDados = await Promise.all(
        (workspacesData || []).map(async (ws) => {
          // Membros
          const { data: membros } = await supabase
            .from('workspace_members')
            .select(`
              id,
              user_id,
              role,
              joined_at,
              users (
                id,
                name,
                email,
                role,
                active
              )
            `)
            .eq('workspace_id', ws.id)

          // Credenciais
          const { data: configCred } = await supabase
            .from('configuracoes_credenciais')
            .select('*')
            .eq('workspace_id', ws.id)
            .single()

          const { data: credDiversas } = await supabase
            .from('credencias_diversas')
            .select('*')
            .eq('workspace_id', ws.id)
            .single()

          // User tools do workspace
          const { data: userTools } = await supabase
            .from('user_tools')
            .select(`
              id,
              workspace_id,
              tool_id,
              agente_id,
              is_active,
              tools (
                id,
                type,
                nome,
                descricao
              )
            `)
            .eq('workspace_id', ws.id)

          return {
            ...ws,
            membros: membros || [],
            config_credenciais: configCred || null,
            credenciais_diversas: credDiversas || null,
            user_tools: userTools || []
          }
        })
      )

      setWorkspaces(workspacesComDados)
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

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, active')
        .order('name')

      if (error) throw error
      setAllUsers(data || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const fetchAllTools = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, type, nome, descricao')
        .order('nome')

      if (error) throw error
      setAllTools(data || [])
    } catch (error) {
      console.error('Erro ao buscar tools:', error)
    }
  }

  const handleCreateWorkspace = async (workspaceData: any) => {
    try {
      // Criar workspace
      const { data: newWs, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceData.name,
          slug: workspaceData.slug,
          plano_id: workspaceData.plano_id || null,
          ativo: workspaceData.ativo ?? true,
          limite_leads: workspaceData.limite_leads || 1000,
          limite_consultas: workspaceData.limite_consultas || 100,
          limite_instancias: workspaceData.limite_instancias || 1,
          plano_customizado: workspaceData.plano_customizado || null
        })
        .select()
        .single()

      if (wsError) throw wsError

      // Criar credenciais se fornecidas
      if (workspaceData.openai_api_token || workspaceData.gemini_api_key || workspaceData.elevenlabs_api_key) {
        await supabase
          .from('configuracoes_credenciais')
          .insert({
            workspace_id: newWs.id,
            cliente: workspaceData.name,
            openai_api_token: workspaceData.openai_api_token || null,
            gemini_api_key: workspaceData.gemini_api_key || null,
            apikey_elevenlabs: workspaceData.elevenlabs_api_key || null,
            id_voz_elevenlabs: workspaceData.elevenlabs_voice_id || null
          })
      }

      // Criar credenciais datecode se fornecidas
      if (workspaceData.datecode_username || workspaceData.datecode_password) {
        await supabase
          .from('credencias_diversas')
          .insert({
            workspace_id: newWs.id,
            datecode: {
              username: workspaceData.datecode_username || '',
              password: workspaceData.datecode_password || ''
            }
          })
      }

      await fetchWorkspaces()
      setShowNewWorkspace(false)
      alert('Workspace criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar workspace:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar workspace')
    }
  }

  const handleUpdateWorkspace = async (id: string, workspaceData: any) => {
    try {
      // Atualizar workspace
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (workspaceData.name !== undefined) updateData.name = workspaceData.name
      if (workspaceData.slug !== undefined) updateData.slug = workspaceData.slug
      if (workspaceData.plano_id !== undefined) updateData.plano_id = workspaceData.plano_id
      if (workspaceData.ativo !== undefined) updateData.ativo = workspaceData.ativo
      if (workspaceData.limite_leads !== undefined) updateData.limite_leads = workspaceData.limite_leads
      if (workspaceData.limite_consultas !== undefined) updateData.limite_consultas = workspaceData.limite_consultas
      if (workspaceData.limite_instancias !== undefined) updateData.limite_instancias = workspaceData.limite_instancias
      if (workspaceData.plano_customizado !== undefined) updateData.plano_customizado = workspaceData.plano_customizado

      const { error: wsError } = await supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', id)

      if (wsError) throw wsError

      // Atualizar credenciais
      const hasCredenciais = workspaceData.openai_api_token !== undefined ||
                            workspaceData.gemini_api_key !== undefined ||
                            workspaceData.elevenlabs_api_key !== undefined ||
                            workspaceData.elevenlabs_voice_id !== undefined

      if (hasCredenciais) {
        const { data: existingConfig } = await supabase
          .from('configuracoes_credenciais')
          .select('id')
          .eq('workspace_id', id)
          .single()

        const configData: any = {}
        if (workspaceData.openai_api_token !== undefined) configData.openai_api_token = workspaceData.openai_api_token || null
        if (workspaceData.gemini_api_key !== undefined) configData.gemini_api_key = workspaceData.gemini_api_key || null
        if (workspaceData.elevenlabs_api_key !== undefined) configData.apikey_elevenlabs = workspaceData.elevenlabs_api_key || null
        if (workspaceData.elevenlabs_voice_id !== undefined) configData.id_voz_elevenlabs = workspaceData.elevenlabs_voice_id || null

        if (existingConfig) {
          await supabase
            .from('configuracoes_credenciais')
            .update(configData)
            .eq('id', existingConfig.id)
        } else {
          await supabase
            .from('configuracoes_credenciais')
            .insert({
              workspace_id: id,
              cliente: workspaceData.name || 'Workspace',
              ...configData
            })
        }
      }

      // Atualizar datecode
      const hasDatecode = workspaceData.datecode_username !== undefined || workspaceData.datecode_password !== undefined

      if (hasDatecode) {
        const { data: existingCred } = await supabase
          .from('credencias_diversas')
          .select('id, datecode')
          .eq('workspace_id', id)
          .single()

        const datecodeData = {
          username: workspaceData.datecode_username ?? existingCred?.datecode?.username ?? '',
          password: workspaceData.datecode_password ?? existingCred?.datecode?.password ?? ''
        }

        if (existingCred) {
          await supabase
            .from('credencias_diversas')
            .update({ datecode: datecodeData })
            .eq('id', existingCred.id)
        } else {
          await supabase
            .from('credencias_diversas')
            .insert({
              workspace_id: id,
              datecode: datecodeData
            })
        }
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
      const { error } = await supabase
        .from('workspaces')
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
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
      // Remover membros
      await supabase.from('workspace_members').delete().eq('workspace_id', id)
      // Remover credenciais
      await supabase.from('configuracoes_credenciais').delete().eq('workspace_id', id)
      await supabase.from('credencias_diversas').delete().eq('workspace_id', id)
      // Remover workspace
      const { error } = await supabase.from('workspaces').delete().eq('id', id)

      if (error) throw error

      await fetchWorkspaces()
      alert('Workspace excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir workspace:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir workspace')
    }
  }

  const handleAddMember = async (workspaceId: string, userId: number, role: string = 'member') => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role
        })

      if (error) {
        if (error.code === '23505') {
          alert('Este usuário já é membro do workspace')
          return
        }
        throw error
      }

      await fetchWorkspaces()
      alert('Membro adicionado com sucesso!')
    } catch (error) {
      console.error('Erro ao adicionar membro:', error)
      alert(error instanceof Error ? error.message : 'Erro ao adicionar membro')
    }
  }

  const handleRemoveMember = async (workspaceId: string, memberId: number) => {
    if (!confirm('Tem certeza que deseja remover este membro do workspace?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      await fetchWorkspaces()
      alert('Membro removido com sucesso!')
    } catch (error) {
      console.error('Erro ao remover membro:', error)
      alert(error instanceof Error ? error.message : 'Erro ao remover membro')
    }
  }

  const handleUpdateMemberRole = async (memberId: number, newRole: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      await fetchWorkspaces()
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar role')
    }
  }

  // Funções para gerenciar tools do workspace
  const handleAddTool = async (workspaceId: string, toolId: number) => {
    try {
      // Precisamos de um user_id - pegar o primeiro admin/owner do workspace ou usar um padrão
      const workspace = workspaces.find(w => w.id === workspaceId)
      const owner = workspace?.membros?.find(m => m.role === 'owner')
      const userId = owner?.user_id || 24 // fallback para user 24 se não tiver owner

      const { error } = await supabase
        .from('user_tools')
        .insert({
          workspace_id: workspaceId,
          tool_id: toolId,
          user_id: userId,
          is_active: true
        })

      if (error) {
        if (error.code === '23505') {
          alert('Esta tool já está adicionada ao workspace')
          return
        }
        throw error
      }

      await fetchWorkspaces()
    } catch (error) {
      console.error('Erro ao adicionar tool:', error)
      alert(error instanceof Error ? error.message : 'Erro ao adicionar tool')
    }
  }

  const handleRemoveTool = async (userToolId: number) => {
    if (!confirm('Tem certeza que deseja remover esta tool do workspace?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('user_tools')
        .delete()
        .eq('id', userToolId)

      if (error) throw error

      await fetchWorkspaces()
    } catch (error) {
      console.error('Erro ao remover tool:', error)
      alert(error instanceof Error ? error.message : 'Erro ao remover tool')
    }
  }

  const handleToggleToolActive = async (userToolId: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_tools')
        .update({ is_active: isActive })
        .eq('id', userToolId)

      if (error) throw error

      await fetchWorkspaces()
    } catch (error) {
      console.error('Erro ao atualizar status da tool:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar status')
    }
  }

  // Toggle tool para workspace (adiciona se não existe, ativa/desativa se existe)
  const handleToggleToolForWorkspace = async (workspaceId: string, toolId: number, currentlyActive: boolean) => {
    try {
      const workspace = workspaces.find(w => w.id === workspaceId)
      const existingUserTool = workspace?.user_tools?.find(ut => ut.tool_id === toolId)

      if (existingUserTool) {
        // Atualizar is_active
        const { error } = await supabase
          .from('user_tools')
          .update({ is_active: !currentlyActive })
          .eq('id', existingUserTool.id)

        if (error) throw error
      } else {
        // Adicionar nova tool
        const owner = workspace?.membros?.find(m => m.role === 'owner')
        const userId = owner?.user_id || 24

        const { error } = await supabase
          .from('user_tools')
          .insert({
            workspace_id: workspaceId,
            tool_id: toolId,
            user_id: userId,
            is_active: true
          })

        if (error) throw error
      }

      await fetchWorkspaces()
    } catch (error) {
      console.error('Erro ao toggle tool:', error)
      alert(error instanceof Error ? error.message : 'Erro ao atualizar tool')
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
            allUsers={allUsers}
            allTools={allTools}
            isEditing={editingWorkspace === workspace.id}
            onEdit={() => setEditingWorkspace(workspace.id)}
            onCancel={() => setEditingWorkspace(null)}
            onSave={handleUpdateWorkspace}
            onToggleAtivo={handleToggleAtivo}
            onDelete={handleDeleteWorkspace}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onUpdateMemberRole={handleUpdateMemberRole}
            onOpenTools={(id) => setToolsModalWorkspace(id)}
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

      {/* Modal de Tools */}
      {toolsModalWorkspace && (
        <ToolsModal
          workspace={workspaces.find(w => w.id === toolsModalWorkspace)!}
          allTools={allTools}
          onClose={() => setToolsModalWorkspace(null)}
          onToggleTool={handleToggleToolForWorkspace}
          onRefresh={fetchWorkspaces}
        />
      )}
    </div>
  )
}

interface WorkspaceCardProps {
  workspace: Workspace
  planos: Plano[]
  allUsers: Usuario[]
  allTools: Tool[]
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (id: string, data: any) => void
  onToggleAtivo: (id: string, ativo: boolean) => void
  onDelete: (id: string) => void
  onAddMember: (workspaceId: string, userId: number, role: string) => void
  onRemoveMember: (workspaceId: string, memberId: number) => void
  onUpdateMemberRole: (memberId: number, role: string) => void
  onOpenTools: (workspaceId: string) => void
}

function WorkspaceCard({
  workspace,
  planos,
  allUsers,
  allTools,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onToggleAtivo,
  onDelete,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onOpenTools
}: WorkspaceCardProps) {
  const [activeTab, setActiveTab] = useState('basico')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('member')

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

  // Usuários que NÃO são membros deste workspace
  const availableUsers = allUsers.filter(
    user => !workspace.membros?.some(m => m.user_id === user.id)
  )

  if (!isEditing) {
    return (
      <div className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${!workspace.ativo ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
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
                {workspace.membros?.length || 0} membro{(workspace.membros?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Membros do workspace */}
            {workspace.membros && workspace.membros.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500 font-medium block mb-1">Membros:</span>
                <div className="flex flex-wrap gap-1">
                  {workspace.membros.map(membro => (
                    <span
                      key={membro.id}
                      className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                        membro.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                        membro.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {membro.role === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                      {membro.users?.name || 'Usuário'}
                      <span className="ml-1 opacity-60">({membro.role})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 mt-3">
              <div>
                <span className="block font-medium">Leads</span>
                <span>{workspace.leads_consumidos || 0} / {workspace.limite_leads}</span>
              </div>
              <div>
                <span className="block font-medium">Consultas</span>
                <span>{workspace.consultas_realizadas || 0} / {workspace.limite_consultas}</span>
              </div>
              <div>
                <span className="block font-medium">Instâncias</span>
                <span>{workspace.instancias_ativas || 0} / {workspace.limite_instancias}</span>
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

          <div className="flex flex-col space-y-2">
            <button
              onClick={onEdit}
              className="flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
              title="Editar workspace"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </button>
            <button
              onClick={() => onOpenTools(workspace.id)}
              className="flex items-center px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded border border-green-200"
              title="Gerenciar tools do workspace"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Tools
            </button>
            <button
              onClick={() => onDelete(workspace.id)}
              className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200"
              title="Excluir workspace"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basico', label: 'Informações', icon: Building },
    { id: 'membros', label: 'Membros', icon: Users },
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
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
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
                  <Icon className="h-4 w-4 mr-1" />
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
                  Plano Base
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
                <p className="text-xs text-gray-500 mt-1">O plano define as permissões base. Use a aba "Permissões" para customizar.</p>
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

          {activeTab === 'membros' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Membros do Workspace</h4>
              </div>

              {/* Adicionar novo membro */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </h5>
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um usuário...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-32 text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => {
                      if (selectedUserId) {
                        onAddMember(workspace.id, parseInt(selectedUserId), selectedRole)
                        setSelectedUserId('')
                      }
                    }}
                    disabled={!selectedUserId}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Lista de membros */}
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                {workspace.membros && workspace.membros.length > 0 ? (
                  workspace.membros.map((membro) => (
                    <div key={membro.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          membro.role === 'owner' ? 'bg-yellow-100' :
                          membro.role === 'admin' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {membro.role === 'owner' ? (
                            <Crown className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Users className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{membro.users?.name}</p>
                          <p className="text-xs text-gray-500">{membro.users?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={membro.role}
                          onChange={(e) => onUpdateMemberRole(membro.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Membro</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                        <button
                          onClick={() => onRemoveMember(workspace.id, membro.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Remover membro"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nenhum membro neste workspace
                  </div>
                )}
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
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
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
                  <Icon className="h-4 w-4 mr-1" />
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
                  Plano Base
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
                <h4 className="text-lg font-medium text-gray-900">ElevenLabs</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
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
                <h4 className="text-lg font-medium text-gray-900">Datecode</h4>
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

// Modal de Tools
interface ToolsModalProps {
  workspace: Workspace
  allTools: Tool[]
  onClose: () => void
  onToggleTool: (workspaceId: string, toolId: number, currentlyActive: boolean) => void
  onRefresh: () => void
}

function ToolsModal({ workspace, allTools, onClose, onToggleTool }: ToolsModalProps) {
  // Criar um mapa de tools ativas para o workspace
  const activeToolsMap = new Map(
    workspace.user_tools?.map(ut => [ut.tool_id, ut.is_active]) || []
  )

  const isToolActive = (toolId: number): boolean => {
    return activeToolsMap.get(toolId) || false
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Atribuir Ferramentas ao Workspace</h2>
            <p className="text-sm text-gray-500">Selecione quais ferramentas este workspace poderá usar nos agentes</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Grid de Tools */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTools.map((tool) => {
              const isActive = isToolActive(tool.id)
              return (
                <div
                  key={tool.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isActive
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isActive ? 'text-green-800' : 'text-gray-900'
                    }`}>
                      {tool.nome}
                    </p>
                    <p className={`text-xs ${
                      isActive ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {tool.type}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleTool(workspace.id, tool.id, isActive)}
                    className={`ml-3 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>

          {allTools.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p>Nenhuma ferramenta cadastrada no sistema</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
