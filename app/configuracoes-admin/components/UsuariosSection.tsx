'use client'

import { useState, useEffect } from 'react'
import { supabase, UsuarioComPlano, Plano } from '../../../lib/supabase'
import { Users, Edit, Save, X, Shield, UserX, Plus, Settings, Lock, Bot, Mic, Globe, Database, Building, Clock, Zap, Wrench } from 'lucide-react'

export default function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<UsuarioComPlano[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [tiposNegocio, setTiposNegocio] = useState<Array<{id: number, nome: string, nome_exibicao: string}>>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<number | null>(null)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showUserTools, setShowUserTools] = useState<number | null>(null)
  const [tools, setTools] = useState<Array<{id: number, type: string, nome: string, descricao: string}>>([])
  const [userTools, setUserTools] = useState<Array<{id: number, user_id: number, tool_id: number, is_active: boolean}>>([])
  const [toolsLoading, setToolsLoading] = useState(false)

  useEffect(() => {
    fetchUsuarios()
    fetchPlanos()
    fetchTiposNegocio()
    fetchTools()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('view_usuarios_planos')
        .select('*')
        .order('name')

      if (error) throw error

      // Buscar tipos de negócio para cada usuário
      const usuariosComTipos = await Promise.all(
        (data || []).map(async (usuario) => {
          const { data: tiposData } = await supabase
            .from('user_tipos_negocio')
            .select(`
              tipos_negocio (
                id,
                nome,
                nome_exibicao
              )
            `)
            .eq('user_id', usuario.id)
            .eq('ativo', true)

          return {
            ...usuario,
            tipos_negocio_selecionados: tiposData?.map((item: any) => item.tipos_negocio?.nome) || []
          }
        })
      )

      setUsuarios(usuariosComTipos)
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
    } finally {
      setLoading(false)
    }
  }

  const fetchTiposNegocio = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_negocio')
        .select('id, nome, nome_exibicao')
        .eq('ativo', true)
        .order('ordem, nome_exibicao')

      if (error) throw error
      setTiposNegocio(data || [])
    } catch (error) {
      console.error('Erro ao buscar tipos de negócio:', error)
    }
  }

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, type, nome, descricao')
        .order('type, nome')

      if (error) throw error
      setTools(data || [])
    } catch (error) {
      console.error('Erro ao buscar tools:', error)
    }
  }

  const fetchUserTools = async (userId: number) => {
    try {
      setToolsLoading(true)
      const { data, error } = await supabase
        .from('user_tools')
        .select('id, user_id, tool_id, is_active')
        .eq('user_id', userId)

      if (error) throw error
      setUserTools(data || [])
    } catch (error) {
      console.error('Erro ao buscar tools do usuário:', error)
    } finally {
      setToolsLoading(false)
    }
  }

  const toggleUserTool = async (userId: number, toolId: number, isActive: boolean) => {
    try {
      // Verificar se já existe um registro
      const existing = userTools.find(ut => ut.user_id === userId && ut.tool_id === toolId)

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('user_tools')
          .update({ is_active: isActive })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('user_tools')
          .insert({
            user_id: userId,
            tool_id: toolId,
            is_active: isActive
          })

        if (error) throw error
      }

      // Recarregar tools do usuário
      await fetchUserTools(userId)
    } catch (error) {
      console.error('Erro ao atualizar tool do usuário:', error)
      alert('Erro ao atualizar tool do usuário')
    }
  }

  const handleChangeUserPlan = async (userId: number, planoId: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ plano_id: planoId })
        .eq('id', userId)

      if (error) throw error

      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao alterar plano do usuário:', error)
      alert('Erro ao alterar plano do usuário')
    }
  }

  const handleChangeUserRole = async (userId: number, role: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)

      if (error) throw error

      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao alterar role do usuário:', error)
      alert('Erro ao alterar role do usuário')
    }
  }

  const handleToggleUserActive = async (userId: number, active: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active })
        .eq('id', userId)

      if (error) throw error

      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error)
      alert('Erro ao alterar status do usuário')
    }
  }

  const handleUpdateUser = async (userId: number, userData: {
    name?: string
    email?: string
    cpf?: string
    telefone?: string
    limite_leads?: number
    limite_consultas?: number
    delay_entre_mensagens?: number
    delay_apos_intervencao?: number
    inicio_expediente?: number
    fim_expediente?: number
    numero_instancias?: number
    tipos_negocio?: string[]
    crm_url?: string
    crm_usuario?: string
    crm_senha?: string
    crm_token?: string
    pasta_drive?: string
    id_pasta_rag?: string
    nome_cliente_empresa?: string
    structured_output_schema?: string
    openai_api_token?: string
    gemini_api_key?: string
    modelo_ia?: string
    tipo_tool_supabase?: string
    reasoning_effort?: string
    api_key_dados?: string
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    firecrawl_api_key?: string
    // Campos da view que não devem ser atualizados
    plano_legado?: string
    plano_nome?: string
    plano_descricao?: string
    plano_preco?: number
    plano_permissoes?: any
    acesso_dashboard?: boolean
    acesso_crm?: boolean
    acesso_whatsapp?: boolean
    acesso_disparo_simples?: boolean
    acesso_disparo_ia?: boolean
    acesso_agentes_ia?: boolean
    acesso_extracao_leads?: boolean
    acesso_enriquecimento?: boolean
    acesso_usuarios?: boolean
    acesso_consulta?: boolean
    [key: string]: any // Para permitir outros campos da view
  }) => {
    try {
      // Separar tipos_negocio e campos que NÃO pertencem à tabela users
      const {
        tipos_negocio,
        // Campos que não existem na tabela users (serão ignorados)
        delay_entre_mensagens,
        delay_apos_intervencao,
        inicio_expediente,
        fim_expediente,
        openai_api_token,
        gemini_api_key,
        modelo_ia,
        tipo_tool_supabase,
        reasoning_effort,
        api_key_dados,
        elevenlabs_api_key,
        elevenlabs_voice_id,
        firecrawl_api_key,
        crm_url,
        crm_usuario,
        crm_senha,
        crm_token,
        pasta_drive,
        id_pasta_rag,
        nome_cliente_empresa,
        structured_output_schema,
        // Campos da view que vêm da tabela planos
        plano_legado,
        plano_nome,
        plano_descricao,
        plano_preco,
        plano_permissoes,
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
        ...userDataOnly
      } = userData

      // Atualizar dados básicos do usuário (apenas campos que existem em users)
      const { error } = await supabase
        .from('users')
        .update({
          ...userDataOnly,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Se tipos_negocio foi fornecido, atualizar relacionamentos
      if (tipos_negocio !== undefined) {
        // Desativar todos os tipos existentes
        await supabase
          .from('user_tipos_negocio')
          .update({ ativo: false })
          .eq('user_id', userId)

        // Ativar ou criar os tipos selecionados
        for (const tipoNome of tipos_negocio) {
          // Buscar ID do tipo
          const { data: tipoData } = await supabase
            .from('tipos_negocio')
            .select('id')
            .eq('nome', tipoNome)
            .single()

          if (tipoData) {
            // Tentar atualizar registro existente
            const { error: updateError } = await supabase
              .from('user_tipos_negocio')
              .update({ ativo: true })
              .eq('user_id', userId)
              .eq('tipo_negocio_id', tipoData.id)

            // Se não existe, criar novo
            if (updateError) {
              await supabase
                .from('user_tipos_negocio')
                .insert({
                  user_id: userId,
                  tipo_negocio_id: tipoData.id,
                  ativo: true
                })
            }
          }
        }
      }

      await fetchUsuarios()
      setEditingUser(null)
      alert('Usuário atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('Erro ao atualizar usuário')
    }
  }

  const handleCreateUser = async (userData: {
    name: string
    email: string
    password: string
    role: 'admin' | 'user'
    plano_id?: number
    cpf?: string
    telefone?: string
    // Configurações operacionais
    delay_entre_mensagens?: number
    delay_apos_intervencao?: number
    inicio_expediente?: number
    fim_expediente?: number
    numero_instancias?: number
    limite_leads?: number
    limite_consultas?: number
    // Tipos de negócio
    tipos_negocio?: string[]
    // Integração CRM
    crm_url?: string
    crm_usuario?: string
    crm_senha?: string
    crm_token?: string
    // Google Drive
    pasta_drive?: string
    id_pasta_rag?: string
    // Informações do cliente
    nome_cliente_empresa?: string
    structured_output_schema?: string
    // APIs de IA
    openai_api_token?: string
    gemini_api_key?: string
    modelo_ia?: string
    tipo_tool_supabase?: string
    reasoning_effort?: string
    api_key_dados?: string
    // ElevenLabs
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    // FireCrawl
    firecrawl_api_key?: string
    // Status
    ativo?: boolean
  }) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          plano_id: userData.plano_id,
          cpf: userData.cpf || null,
          telefone: userData.telefone || null,
          active: userData.ativo !== false,
          // Configurações operacionais
          delay_entre_mensagens: userData.delay_entre_mensagens || 30,
          delay_apos_intervencao: userData.delay_apos_intervencao || 0,
          inicio_expediente: userData.inicio_expediente || 8,
          fim_expediente: userData.fim_expediente || 18,
          numero_instancias: userData.numero_instancias || 1,
          limite_leads: userData.limite_leads || 100,
          limite_consultas: userData.limite_consultas || 50,
          // Tipos de negócio
          tipos_negocio: userData.tipos_negocio ? JSON.stringify(userData.tipos_negocio) : null,
          // Integração CRM
          crm_url: userData.crm_url || null,
          crm_usuario: userData.crm_usuario || null,
          crm_senha: userData.crm_senha || null,
          crm_token: userData.crm_token || null,
          // Google Drive
          pasta_drive: userData.pasta_drive || null,
          id_pasta_rag: userData.id_pasta_rag || null,
          // Informações do cliente
          nome_cliente_empresa: userData.nome_cliente_empresa || null,
          structured_output_schema: userData.structured_output_schema || null,
          // APIs de IA
          openai_api_token: userData.openai_api_token || null,
          gemini_api_key: userData.gemini_api_key || null,
          modelo_ia: userData.modelo_ia || null,
          tipo_tool_supabase: userData.tipo_tool_supabase || null,
          reasoning_effort: userData.reasoning_effort || null,
          api_key_dados: userData.api_key_dados || null,
          // ElevenLabs
          elevenlabs_api_key: userData.elevenlabs_api_key || null,
          elevenlabs_voice_id: userData.elevenlabs_voice_id || null,
          // FireCrawl
          firecrawl_api_key: userData.firecrawl_api_key || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      await fetchUsuarios()
      setShowNewUser(false)
      alert('Usuário criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário')
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
          <Users className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gerenciamento de Usuários
          </h2>
        </div>
        <button
          onClick={() => setShowNewUser(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Usuário
        </button>
      </div>

      <div className="space-y-4">
        {showNewUser && (
          <NovoUsuarioCard
            planos={planos}
            tiposNegocio={tiposNegocio}
            onSave={handleCreateUser}
            onCancel={() => setShowNewUser(false)}
          />
        )}

        {usuarios.map((usuario) => (
          <UsuarioCard
            key={usuario.id}
            usuario={usuario}
            planos={planos}
            tiposNegocio={tiposNegocio}
            isEditing={editingUser === usuario.id}
            onEdit={() => setEditingUser(usuario.id)}
            onCancel={() => setEditingUser(null)}
            onChangePlan={handleChangeUserPlan}
            onChangeRole={handleChangeUserRole}
            onToggleActive={handleToggleUserActive}
            onUpdateUser={handleUpdateUser}
            onOpenTools={(userId) => {
              setShowUserTools(userId)
              fetchUserTools(userId)
            }}
          />
        ))}
      </div>

      {/* Modal de Tools */}
      {showUserTools && (
        <UserToolsModal
          userId={showUserTools}
          usuario={usuarios.find(u => u.id === showUserTools)}
          tools={tools}
          userTools={userTools}
          loading={toolsLoading}
          onClose={() => setShowUserTools(null)}
          onToggleTool={toggleUserTool}
          onOpen={(userId) => {
            setShowUserTools(userId)
            fetchUserTools(userId)
          }}
        />
      )}
    </div>
  )
}

interface UsuarioCardProps {
  usuario: UsuarioComPlano
  planos: Plano[]
  tiposNegocio: Array<{id: number, nome: string, nome_exibicao: string}>
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onChangePlan: (userId: number, planoId: number) => void
  onChangeRole: (userId: number, role: string) => void
  onToggleActive: (userId: number, active: boolean) => void
  onUpdateUser: (userId: number, userData: {
    name?: string
    email?: string
    cpf?: string
    telefone?: string
    limite_leads?: number
    limite_consultas?: number
    delay_entre_mensagens?: number
    delay_apos_intervencao?: number
    inicio_expediente?: number
    fim_expediente?: number
    numero_instancias?: number
    tipos_negocio?: string[]
    crm_url?: string
    crm_usuario?: string
    crm_senha?: string
    crm_token?: string
    pasta_drive?: string
    id_pasta_rag?: string
    nome_cliente_empresa?: string
    structured_output_schema?: string
    openai_api_token?: string
    gemini_api_key?: string
    modelo_ia?: string
    tipo_tool_supabase?: string
    reasoning_effort?: string
    api_key_dados?: string
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    firecrawl_api_key?: string
  }) => void
  onOpenTools: (userId: number) => void
}

function UsuarioCard({
  usuario,
  planos,
  tiposNegocio,
  isEditing,
  onEdit,
  onCancel,
  onChangePlan,
  onChangeRole,
  onToggleActive,
  onUpdateUser,
  onOpenTools
}: UsuarioCardProps) {
  const [selectedPlan, setSelectedPlan] = useState(usuario.plano_id || '')
  const [selectedRole, setSelectedRole] = useState(usuario.role || 'user')
  const [activeTab, setActiveTab] = useState('basico')
  const [formData, setFormData] = useState({
    // Informações básicas
    name: usuario.name || '',
    email: usuario.email || '',
    cpf: usuario.cpf || '',
    telefone: usuario.telefone || '',
    // Configurações operacionais
    delay_entre_mensagens: (usuario as any).delay_entre_mensagens || 30,
    delay_apos_intervencao: (usuario as any).delay_apos_intervencao || 0,
    inicio_expediente: (usuario as any).inicio_expediente || 8,
    fim_expediente: (usuario as any).fim_expediente || 18,
    numero_instancias: (usuario as any).numero_instancias || 1,
    limite_leads: (usuario as any).limite_leads || 100,
    limite_consultas: (usuario as any).limite_consultas || 50,
    // Tipos de negócio
    tipos_negocio: (usuario as any).tipos_negocio_selecionados || [],
    // Integração CRM
    crm_url: (usuario as any).crm_url || '',
    crm_usuario: (usuario as any).crm_usuario || '',
    crm_senha: (usuario as any).crm_senha || '',
    crm_token: (usuario as any).crm_token || '',
    // Google Drive
    pasta_drive: (usuario as any).pasta_drive || '',
    id_pasta_rag: (usuario as any).id_pasta_rag || '',
    // Informações do cliente
    nome_cliente_empresa: (usuario as any).nome_cliente_empresa || '',
    structured_output_schema: (usuario as any).structured_output_schema || '',
    // APIs de IA
    openai_api_token: (usuario as any).openai_api_token || '',
    gemini_api_key: (usuario as any).gemini_api_key || '',
    modelo_ia: (usuario as any).modelo_ia || '',
    tipo_tool_supabase: (usuario as any).tipo_tool_supabase || '',
    reasoning_effort: (usuario as any).reasoning_effort || '',
    api_key_dados: (usuario as any).api_key_dados || '',
    // ElevenLabs
    elevenlabs_api_key: (usuario as any).elevenlabs_api_key || '',
    elevenlabs_voice_id: (usuario as any).elevenlabs_voice_id || '',
    // FireCrawl
    firecrawl_api_key: (usuario as any).firecrawl_api_key || ''
  })

  const toggleTipoNegocio = (tipo: string) => {
    setFormData(prev => ({
      ...prev,
      tipos_negocio: prev.tipos_negocio.includes(tipo)
        ? prev.tipos_negocio.filter((t: string) => t !== tipo)
        : [...prev.tipos_negocio, tipo]
    }))
  }

  const handleSave = async () => {
    // Atualizar plano se mudou
    if (selectedPlan !== usuario.plano_id && selectedPlan) {
      await onChangePlan(usuario.id, parseInt(selectedPlan.toString()))
    }

    // Atualizar role se mudou
    if (selectedRole !== usuario.role) {
      await onChangeRole(usuario.id, selectedRole)
    }

    // Atualizar outros dados se mudaram
    const tiposOriginais = (usuario as any).tipos_negocio_selecionados || []
    const tiposChanged = JSON.stringify(formData.tipos_negocio.sort()) !== JSON.stringify(tiposOriginais.sort())

    const hasChanges =
      formData.name !== usuario.name ||
      formData.email !== usuario.email ||
      formData.cpf !== (usuario.cpf || '') ||
      formData.telefone !== (usuario.telefone || '') ||
      formData.limite_leads !== (usuario as any).limite_leads ||
      formData.limite_consultas !== (usuario as any).limite_consultas ||
      formData.delay_entre_mensagens !== (usuario as any).delay_entre_mensagens ||
      formData.delay_apos_intervencao !== (usuario as any).delay_apos_intervencao ||
      formData.inicio_expediente !== (usuario as any).inicio_expediente ||
      formData.fim_expediente !== (usuario as any).fim_expediente ||
      formData.numero_instancias !== (usuario as any).numero_instancias ||
      formData.crm_url !== ((usuario as any).crm_url || '') ||
      formData.crm_usuario !== ((usuario as any).crm_usuario || '') ||
      formData.crm_senha !== ((usuario as any).crm_senha || '') ||
      formData.crm_token !== ((usuario as any).crm_token || '') ||
      formData.pasta_drive !== ((usuario as any).pasta_drive || '') ||
      formData.id_pasta_rag !== ((usuario as any).id_pasta_rag || '') ||
      formData.nome_cliente_empresa !== ((usuario as any).nome_cliente_empresa || '') ||
      formData.structured_output_schema !== ((usuario as any).structured_output_schema || '') ||
      formData.openai_api_token !== ((usuario as any).openai_api_token || '') ||
      formData.gemini_api_key !== ((usuario as any).gemini_api_key || '') ||
      formData.modelo_ia !== ((usuario as any).modelo_ia || '') ||
      formData.tipo_tool_supabase !== ((usuario as any).tipo_tool_supabase || '') ||
      formData.reasoning_effort !== ((usuario as any).reasoning_effort || '') ||
      formData.api_key_dados !== ((usuario as any).api_key_dados || '') ||
      formData.elevenlabs_api_key !== ((usuario as any).elevenlabs_api_key || '') ||
      formData.elevenlabs_voice_id !== ((usuario as any).elevenlabs_voice_id || '') ||
      formData.firecrawl_api_key !== ((usuario as any).firecrawl_api_key || '') ||
      tiposChanged

    if (hasChanges || tiposChanged) {
      // Enviar apenas os campos que existem na tabela users
      const updateData: any = {}

      // Campos básicos que existem em users
      if (formData.name !== usuario.name) updateData.name = formData.name
      if (formData.email !== usuario.email) updateData.email = formData.email
      if (formData.cpf !== (usuario.cpf || '')) updateData.cpf = formData.cpf
      if (formData.telefone !== (usuario.telefone || '')) updateData.telefone = formData.telefone
      if (formData.limite_leads !== (usuario as any).limite_leads) updateData.limite_leads = formData.limite_leads
      if (formData.limite_consultas !== (usuario as any).limite_consultas) updateData.limite_consultas = formData.limite_consultas
      if (formData.numero_instancias !== (usuario as any).numero_instancias) updateData.numero_instancias = formData.numero_instancias

      // Tipos de negócio (sempre enviar se mudou)
      if (tiposChanged) {
        updateData.tipos_negocio = formData.tipos_negocio
      }

      await onUpdateUser(usuario.id, updateData)
    } else {
      onCancel()
    }
  }

  if (!isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="font-medium text-gray-900 mr-3">{usuario.name}</h3>
              <div className="flex items-center space-x-2">
                {usuario.role === 'admin' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  usuario.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {usuario.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{usuario.email}</p>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                {usuario.plano_nome || usuario.plano || 'Sem plano'}
              </span>
              {usuario.limite_leads && (
                <span className="text-xs text-gray-500">
                  Leads: {usuario.limite_leads}
                </span>
              )}
              {usuario.limite_consultas && (
                <span className="text-xs text-gray-500">
                  Consultas: {usuario.limite_consultas}
                </span>
              )}
            </div>
            {/* Tipos de Negócio */}
            {(usuario as any).tipos_negocio_selecionados && (usuario as any).tipos_negocio_selecionados.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Negócios:</span>
                {(usuario as any).tipos_negocio_selecionados.map((tipo: any) => (
                  <span
                    key={tipo.id}
                    className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                  >
                    {tipo.nome_exibicao}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleActive(usuario.id, !usuario.active)}
              className={`p-2 rounded ${
                usuario.active
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-green-600 hover:text-green-800'
              }`}
              title={usuario.active ? 'Desativar usuário' : 'Ativar usuário'}
            >
              <UserX className="h-4 w-4" />
            </button>
            <button
              onClick={() => onOpenTools(usuario.id)}
              className="text-green-600 hover:text-green-800 p-2 rounded"
              title="Gerenciar Tools"
            >
              <Wrench className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 p-2 rounded"
              title="Editar usuário"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basico', label: 'Informações Básicas', icon: Users },
    { id: 'operacional', label: 'Config. Operacionais', icon: Clock },
    { id: 'negocios', label: 'Tipos de Negócio', icon: Building },
    { id: 'crm', label: 'Integração CRM', icon: Database },
    { id: 'drive', label: 'Google Drive', icon: Globe },
    { id: 'cliente', label: 'Info do Cliente', icon: Building },
    { id: 'ia', label: 'APIs de IA', icon: Bot },
    { id: 'elevenlabs', label: 'ElevenLabs', icon: Mic },
    { id: 'firecrawl', label: 'FireCrawl', icon: Zap }
  ]

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50">
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Editando: {usuario.name}</h3>

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
                  Nome Completo
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuário
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'user')}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecionar plano...</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'operacional' && (
            <div>
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Configurações Operacionais</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Entre Mensagens (seg)
                  </label>
                  <input
                    type="number"
                    value={formData.delay_entre_mensagens}
                    onChange={(e) => setFormData({ ...formData, delay_entre_mensagens: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Após Intervenção (min)
                  </label>
                  <input
                    type="number"
                    value={formData.delay_apos_intervencao}
                    onChange={(e) => setFormData({ ...formData, delay_apos_intervencao: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início Expediente (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.inicio_expediente}
                    onChange={(e) => setFormData({ ...formData, inicio_expediente: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fim Expediente (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.fim_expediente}
                    onChange={(e) => setFormData({ ...formData, fim_expediente: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Instâncias
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numero_instancias}
                    onChange={(e) => setFormData({ ...formData, numero_instancias: parseInt(e.target.value) || 1 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
              </div>
            </div>
          )}

          {activeTab === 'negocios' && (
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Tipos de Negócio</h4>
              </div>
              <div className="space-y-3">
                {tiposNegocio.map((tipo) => (
                  <label key={tipo.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tipos_negocio.includes(tipo.nome)}
                      onChange={() => toggleTipoNegocio(tipo.nome)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tipo.nome_exibicao}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div>
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Integração CRM</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do CRM
                  </label>
                  <input
                    type="url"
                    value={formData.crm_url}
                    onChange={(e) => setFormData({ ...formData, crm_url: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://crm.exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário CRM
                  </label>
                  <input
                    type="text"
                    value={formData.crm_usuario}
                    onChange={(e) => setFormData({ ...formData, crm_usuario: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@crm.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha CRM
                  </label>
                  <input
                    type="password"
                    value={formData.crm_senha}
                    onChange={(e) => setFormData({ ...formData, crm_senha: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token CRM
                  </label>
                  <input
                    type="text"
                    value={formData.crm_token}
                    onChange={(e) => setFormData({ ...formData, crm_token: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Token de integração"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drive' && (
            <div>
              <div className="flex items-center mb-4">
                <Globe className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Integração Google Drive</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pasta Drive
                  </label>
                  <input
                    type="text"
                    value={formData.pasta_drive}
                    onChange={(e) => setFormData({ ...formData, pasta_drive: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Pasta Drive RAG
                  </label>
                  <input
                    type="text"
                    value={formData.id_pasta_rag}
                    onChange={(e) => setFormData({ ...formData, id_pasta_rag: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cliente' && (
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🏢 Informações do Cliente</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente/Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.nome_cliente_empresa}
                    onChange={(e) => setFormData({ ...formData, nome_cliente_empresa: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Structured Output Schema
                  </label>
                  <textarea
                    value={formData.structured_output_schema}
                    onChange={(e) => setFormData({ ...formData, structured_output_schema: e.target.value })}
                    rows={10}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="Schema JSON"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ia' && (
            <div>
              <div className="flex items-center mb-4">
                <Bot className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🤖 APIs de IA</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Token
                  </label>
                  <input
                    type="password"
                    value={formData.openai_api_token}
                    onChange={(e) => setFormData({ ...formData, openai_api_token: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-proj-..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={formData.gemini_api_key}
                    onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo IA
                  </label>
                  <select
                    value={formData.modelo_ia}
                    onChange={(e) => setFormData({ ...formData, modelo_ia: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">gpt-4.1 (padrão)</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                    <option value="gpt-4.1-nano">GPT-4.1 Nano</option>
                    <option value="o3">O3</option>
                    <option value="o4-mini">O4 Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-5">GPT-5</option>
                    <option value="gpt-5-mini">GPT-5 Mini</option>
                    <option value="gpt-5-nano">GPT-5 Nano</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Tool Supabase
                  </label>
                  <select
                    value={formData.tipo_tool_supabase}
                    onChange={(e) => setFormData({ ...formData, tipo_tool_supabase: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">OpenAI (padrão)</option>
                    <option value="function">Function</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reasoning Effort
                  </label>
                  <select
                    value={formData.reasoning_effort}
                    onChange={(e) => setFormData({ ...formData, reasoning_effort: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Usar padrão do sistema</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key de Dados (Profile)
                  </label>
                  <input
                    type="password"
                    value={formData.api_key_dados}
                    onChange={(e) => setFormData({ ...formData, api_key_dados: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="043d2754-..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'elevenlabs' && (
            <div>
              <div className="flex items-center mb-4">
                <Mic className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🎙️ ElevenLabs (Síntese de Voz)</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key ElevenLabs
                  </label>
                  <input
                    type="password"
                    value={formData.elevenlabs_api_key}
                    onChange={(e) => setFormData({ ...formData, elevenlabs_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk_..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da Voz ElevenLabs
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
            </div>
          )}

          {activeTab === 'firecrawl' && (
            <div>
              <div className="flex items-center mb-4">
                <Zap className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🔥 FireCrawl (Web Scraping)</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FireCrawl API Key
                  </label>
                  <input
                    type="password"
                    value={formData.firecrawl_api_key}
                    onChange={(e) => setFormData({ ...formData, firecrawl_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="fc-..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between space-x-2 pt-6 border-t border-gray-200">
          <div className="flex space-x-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tabs[index > 0 ? index - 1 : 0].id)}
                disabled={index === 0}
                className={`px-3 py-1 text-sm rounded ${
                  index === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                } ${activeTab === tab.id && index > 0 ? 'block' : 'hidden'}`}
              >
                ← Anterior
              </button>
            ))}

            {tabs.map((tab, index) => (
              <button
                key={`next-${tab.id}`}
                onClick={() => setActiveTab(tabs[index < tabs.length - 1 ? index + 1 : tabs.length - 1].id)}
                disabled={index === tabs.length - 1}
                className={`px-3 py-1 text-sm rounded ${
                  index === tabs.length - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                } ${activeTab === tab.id && index < tabs.length - 1 ? 'block' : 'hidden'}`}
              >
                Próximo →
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
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
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NovoUsuarioCardProps {
  planos: Plano[]
  tiposNegocio: Array<{id: number, nome: string, nome_exibicao: string}>
  onSave: (userData: {
    name: string
    email: string
    password: string
    role: 'admin' | 'user'
    plano_id?: number
    cpf?: string
    telefone?: string
    // Configurações operacionais
    delay_entre_mensagens?: number
    delay_apos_intervencao?: number
    inicio_expediente?: number
    fim_expediente?: number
    numero_instancias?: number
    limite_leads?: number
    limite_consultas?: number
    // Tipos de negócio
    tipos_negocio?: string[]
    // Integração CRM
    crm_url?: string
    crm_usuario?: string
    crm_senha?: string
    crm_token?: string
    // Google Drive
    pasta_drive?: string
    id_pasta_rag?: string
    // Informações do cliente
    nome_cliente_empresa?: string
    structured_output_schema?: string
    // APIs de IA
    openai_api_token?: string
    gemini_api_key?: string
    modelo_ia?: string
    tipo_tool_supabase?: string
    reasoning_effort?: string
    api_key_dados?: string
    // ElevenLabs
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    // FireCrawl
    firecrawl_api_key?: string
    // Status
    ativo?: boolean
  }) => void
  onCancel: () => void
}

function NovoUsuarioCard({ planos, tiposNegocio, onSave, onCancel }: NovoUsuarioCardProps) {
  const [activeTab, setActiveTab] = useState('basico')
  const [formData, setFormData] = useState({
    // Informações básicas
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    plano_id: '',
    cpf: '',
    telefone: '',
    ativo: true,
    // Configurações operacionais
    delay_entre_mensagens: 30,
    delay_apos_intervencao: 0,
    inicio_expediente: 8,
    fim_expediente: 18,
    numero_instancias: 1,
    limite_leads: 100,
    limite_consultas: 50,
    // Tipos de negócio
    tipos_negocio: [] as string[],
    // Integração CRM
    crm_url: '',
    crm_usuario: '',
    crm_senha: '',
    crm_token: '',
    // Google Drive
    pasta_drive: '',
    id_pasta_rag: '',
    // Informações do cliente
    nome_cliente_empresa: '',
    structured_output_schema: '{\n  "name": "response_pattern",\n  "schema": {\n    "type": "object",\n    "required": [\n      "messages"\n    ],\n    "properties": {\n      "messages": {\n        "type": "array",\n        "items": {\n          "type": "string",\n          "description": "A part of the response."\n        },\n        "description": "An array of strings representing the response parts."\n      }\n    },\n    "additionalProperties": false\n  },\n  "strict": true\n}',
    // APIs de IA
    openai_api_token: '',
    gemini_api_key: '',
    modelo_ia: '',
    tipo_tool_supabase: '',
    reasoning_effort: '',
    api_key_dados: '',
    // ElevenLabs
    elevenlabs_api_key: '',
    elevenlabs_voice_id: '',
    // FireCrawl
    firecrawl_api_key: ''
  })

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    onSave({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      plano_id: formData.plano_id ? parseInt(formData.plano_id) : undefined,
      cpf: formData.cpf || undefined,
      telefone: formData.telefone || undefined,
      ativo: formData.ativo,
      // Configurações operacionais
      delay_entre_mensagens: formData.delay_entre_mensagens,
      delay_apos_intervencao: formData.delay_apos_intervencao,
      inicio_expediente: formData.inicio_expediente,
      fim_expediente: formData.fim_expediente,
      numero_instancias: formData.numero_instancias,
      limite_leads: formData.limite_leads,
      limite_consultas: formData.limite_consultas,
      // Tipos de negócio
      tipos_negocio: formData.tipos_negocio.length > 0 ? formData.tipos_negocio : undefined,
      // Integração CRM
      crm_url: formData.crm_url || undefined,
      crm_usuario: formData.crm_usuario || undefined,
      crm_senha: formData.crm_senha || undefined,
      crm_token: formData.crm_token || undefined,
      // Google Drive
      pasta_drive: formData.pasta_drive || undefined,
      id_pasta_rag: formData.id_pasta_rag || undefined,
      // Informações do cliente
      nome_cliente_empresa: formData.nome_cliente_empresa || undefined,
      structured_output_schema: formData.structured_output_schema || undefined,
      // APIs de IA
      openai_api_token: formData.openai_api_token || undefined,
      gemini_api_key: formData.gemini_api_key || undefined,
      modelo_ia: formData.modelo_ia || undefined,
      tipo_tool_supabase: formData.tipo_tool_supabase || undefined,
      reasoning_effort: formData.reasoning_effort || undefined,
      api_key_dados: formData.api_key_dados || undefined,
      // ElevenLabs
      elevenlabs_api_key: formData.elevenlabs_api_key || undefined,
      elevenlabs_voice_id: formData.elevenlabs_voice_id || undefined,
      // FireCrawl
      firecrawl_api_key: formData.firecrawl_api_key || undefined
    })
  }

  const toggleTipoNegocio = (tipo: string) => {
    setFormData(prev => ({
      ...prev,
      tipos_negocio: prev.tipos_negocio.includes(tipo)
        ? prev.tipos_negocio.filter((t: string) => t !== tipo)
        : [...prev.tipos_negocio, tipo]
    }))
  }

  const tabs = [
    { id: 'basico', label: 'Informações Básicas', icon: Users },
    { id: 'operacional', label: 'Config. Operacionais', icon: Clock },
    { id: 'negocios', label: 'Tipos de Negócio', icon: Building },
    { id: 'crm', label: 'Integração CRM', icon: Database },
    { id: 'drive', label: 'Google Drive', icon: Globe },
    { id: 'cliente', label: 'Info do Cliente', icon: Building },
    { id: 'ia', label: 'APIs de IA', icon: Bot },
    { id: 'elevenlabs', label: 'ElevenLabs', icon: Mic },
    { id: 'firecrawl', label: 'FireCrawl', icon: Zap }
  ]

  return (
    <div className="border border-green-200 rounded-lg bg-green-50">
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Criar Novo Usuário</h3>

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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Senha do usuário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuário
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
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
                  <option value="">Selecionar plano...</option>
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
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Usuário Ativo
                </label>
              </div>
            </div>
          )}

          {activeTab === 'operacional' && (
            <div>
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Configurações Operacionais</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Entre Mensagens (seg)
                  </label>
                  <input
                    type="number"
                    value={formData.delay_entre_mensagens}
                    onChange={(e) => setFormData({ ...formData, delay_entre_mensagens: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Após Intervenção (min)
                  </label>
                  <input
                    type="number"
                    value={formData.delay_apos_intervencao}
                    onChange={(e) => setFormData({ ...formData, delay_apos_intervencao: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início Expediente (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.inicio_expediente}
                    onChange={(e) => setFormData({ ...formData, inicio_expediente: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fim Expediente (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.fim_expediente}
                    onChange={(e) => setFormData({ ...formData, fim_expediente: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Instâncias
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numero_instancias}
                    onChange={(e) => setFormData({ ...formData, numero_instancias: parseInt(e.target.value) || 1 })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
              </div>
            </div>
          )}

          {activeTab === 'negocios' && (
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Tipos de Negócio</h4>
              </div>
              <div className="space-y-3">
                {tiposNegocio.map((tipo) => (
                  <label key={tipo.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tipos_negocio.includes(tipo.nome)}
                      onChange={() => toggleTipoNegocio(tipo.nome)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tipo.nome_exibicao}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div>
              <div className="flex items-center mb-4">
                <Database className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Integração CRM</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do CRM
                  </label>
                  <input
                    type="url"
                    value={formData.crm_url}
                    onChange={(e) => setFormData({ ...formData, crm_url: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://crm.exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário CRM
                  </label>
                  <input
                    type="text"
                    value={formData.crm_usuario}
                    onChange={(e) => setFormData({ ...formData, crm_usuario: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="usuario@crm.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha CRM
                  </label>
                  <input
                    type="password"
                    value={formData.crm_senha}
                    onChange={(e) => setFormData({ ...formData, crm_senha: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token CRM
                  </label>
                  <input
                    type="text"
                    value={formData.crm_token}
                    onChange={(e) => setFormData({ ...formData, crm_token: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Token de integração"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drive' && (
            <div>
              <div className="flex items-center mb-4">
                <Globe className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">Integração Google Drive</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pasta Drive
                  </label>
                  <input
                    type="text"
                    value={formData.pasta_drive}
                    onChange={(e) => setFormData({ ...formData, pasta_drive: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Pasta Drive RAG
                  </label>
                  <input
                    type="text"
                    value={formData.id_pasta_rag}
                    onChange={(e) => setFormData({ ...formData, id_pasta_rag: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cliente' && (
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🏢 Informações do Cliente</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente/Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.nome_cliente_empresa}
                    onChange={(e) => setFormData({ ...formData, nome_cliente_empresa: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Structured Output Schema
                  </label>
                  <textarea
                    value={formData.structured_output_schema}
                    onChange={(e) => setFormData({ ...formData, structured_output_schema: e.target.value })}
                    rows={10}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="Schema JSON"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ia' && (
            <div>
              <div className="flex items-center mb-4">
                <Bot className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🤖 APIs de IA</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Token
                  </label>
                  <input
                    type="password"
                    value={formData.openai_api_token}
                    onChange={(e) => setFormData({ ...formData, openai_api_token: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-proj-..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={formData.gemini_api_key}
                    onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo IA
                  </label>
                  <select
                    value={formData.modelo_ia}
                    onChange={(e) => setFormData({ ...formData, modelo_ia: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">gpt-4.1 (padrão)</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                    <option value="gpt-4.1-nano">GPT-4.1 Nano</option>
                    <option value="o3">O3</option>
                    <option value="o4-mini">O4 Mini</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-5">GPT-5</option>
                    <option value="gpt-5-mini">GPT-5 Mini</option>
                    <option value="gpt-5-nano">GPT-5 Nano</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Tool Supabase
                  </label>
                  <select
                    value={formData.tipo_tool_supabase}
                    onChange={(e) => setFormData({ ...formData, tipo_tool_supabase: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">OpenAI (padrão)</option>
                    <option value="function">Function</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reasoning Effort
                  </label>
                  <select
                    value={formData.reasoning_effort}
                    onChange={(e) => setFormData({ ...formData, reasoning_effort: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Usar padrão do sistema</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key de Dados (Profile)
                  </label>
                  <input
                    type="password"
                    value={formData.api_key_dados}
                    onChange={(e) => setFormData({ ...formData, api_key_dados: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="043d2754-..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'elevenlabs' && (
            <div>
              <div className="flex items-center mb-4">
                <Mic className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🎙️ ElevenLabs (Síntese de Voz)</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key ElevenLabs
                  </label>
                  <input
                    type="password"
                    value={formData.elevenlabs_api_key}
                    onChange={(e) => setFormData({ ...formData, elevenlabs_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk_..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da Voz ElevenLabs
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
            </div>
          )}

          {activeTab === 'firecrawl' && (
            <div>
              <div className="flex items-center mb-4">
                <Zap className="h-5 w-5 mr-2 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-900">🔥 FireCrawl (Web Scraping)</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FireCrawl API Key
                  </label>
                  <input
                    type="password"
                    value={formData.firecrawl_api_key}
                    onChange={(e) => setFormData({ ...formData, firecrawl_api_key: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="fc-..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between space-x-2 pt-6 border-t border-gray-200">
          <div className="flex space-x-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tabs[index > 0 ? index - 1 : 0].id)}
                disabled={index === 0}
                className={`px-3 py-1 text-sm rounded ${
                  index === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                } ${activeTab === tab.id && index > 0 ? 'block' : 'hidden'}`}
              >
                ← Anterior
              </button>
            ))}

            {tabs.map((tab, index) => (
              <button
                key={`next-${tab.id}`}
                onClick={() => setActiveTab(tabs[index < tabs.length - 1 ? index + 1 : tabs.length - 1].id)}
                disabled={index === tabs.length - 1}
                className={`px-3 py-1 text-sm rounded ${
                  index === tabs.length - 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                } ${activeTab === tab.id && index < tabs.length - 1 ? 'block' : 'hidden'}`}
              >
                Próximo →
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
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
              Criar Usuário
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal para gerenciar tools do usuário
interface UserToolsModalProps {
  userId: number
  usuario?: UsuarioComPlano
  tools: Array<{id: number, type: string, nome: string, descricao: string}>
  userTools: Array<{id: number, user_id: number, tool_id: number, is_active: boolean}>
  loading: boolean
  onClose: () => void
  onToggleTool: (userId: number, toolId: number, isActive: boolean) => void
  onOpen: (userId: number) => void
}

function UserToolsModal({ userId, usuario, tools, userTools, loading, onClose, onToggleTool }: UserToolsModalProps) {
  const getUserToolStatus = (toolId: number) => {
    const userTool = userTools.find(ut => ut.tool_id === toolId)
    return userTool?.is_active || false
  }

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.type]) {
      acc[tool.type] = []
    }
    acc[tool.type].push(tool)
    return acc
  }, {} as Record<string, typeof tools>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Wrench className="h-6 w-6 mr-2 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Gerenciar Tools - {usuario?.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTools).map(([type, typeTools]) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                  {type}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeTools.map((tool) => (
                    <div
                      key={tool.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        getUserToolStatus(tool.id)
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => onToggleTool(userId, tool.id, !getUserToolStatus(tool.id))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{tool.nome}</h4>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            getUserToolStatus(tool.id)
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {getUserToolStatus(tool.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      {tool.descricao && (
                        <p className="text-sm text-gray-600">{tool.descricao}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}