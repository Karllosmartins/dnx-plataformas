// =====================================================
// @dnx/types - Tipos compartilhados entre API e Web
// =====================================================

// === Planos ===
export interface Plano {
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
  ativo: boolean
  created_at: string
  updated_at: string
}

// === Workspaces (Multi-Tenancy) ===
export interface Workspace {
  id: string
  name: string
  slug: string
  plano_id?: number
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface WorkspacePermissions {
  leads?: {
    create?: boolean
    read?: boolean
    update?: boolean
    delete?: boolean
  }
  whatsapp?: {
    create?: boolean
    read?: boolean
    update?: boolean
    delete?: boolean
  }
  members?: {
    invite?: boolean
    remove?: boolean
    update_roles?: boolean
  }
  workspace?: {
    update?: boolean
    delete?: boolean
  }
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: number
  role: WorkspaceRole
  permissions: WorkspacePermissions
  joined_at: string
  invited_by?: number
}

export interface WorkspaceWithMembers extends Workspace {
  members?: WorkspaceMember[]
  member_count?: number
}

export interface WorkspaceInvitation {
  id: string
  workspace_id: string
  email: string
  role: WorkspaceRole
  invited_by: number
  created_at: string
  expires_at: string
  accepted_at?: string
  token: string
}

export interface CreateWorkspaceRequest {
  name: string
  slug?: string
}

export interface InviteMemberRequest {
  email: string
  role: WorkspaceRole
  permissions?: WorkspacePermissions
}

export interface UpdateMemberRoleRequest {
  role: WorkspaceRole
  permissions?: WorkspacePermissions
}

// === Usuários ===
export interface User {
  id: number
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  active: boolean
  cpf?: string
  telefone?: string
  plano: 'basico' | 'premium' | 'enterprise'
  plano_id?: number
  plano_customizado?: Record<string, unknown>
  limite_leads: number
  limite_consultas: number
  leads_consumidos?: number
  consultas_realizadas?: number
  ultimo_reset_contagem?: string
  numero_instancias?: number
  current_workspace_id?: string  // Nova propriedade para multi-tenancy
  created_at: string
  updated_at: string
  tipos_negocio?: Array<{
    id: number
    nome_exibicao: string
    cor: string
  }>
}

export interface UsuarioComPlano extends User {
  plano_nome?: string
  plano_descricao?: string
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
  acesso_integracoes?: boolean
  acesso_arquivos?: boolean
}

// === Leads ===
export interface Lead {
  id: number
  user_id: number
  workspace_id?: string  // Nova propriedade para multi-tenancy
  created_by?: number    // Quem criou o lead
  created_at: string | null
  remotejid: string | null
  response_id: string | null
  atendimentofinalizado: boolean | null
  conversation_log: unknown | null
  times_tamp: string | null
  tokens: number | null
  user_lastinteraction: string | null
  bot_lastinteraction: string | null
  lead_id: string | null
  contact_id: string | null
  numero_formatado: string | null
  email_usuario: string | null
  task_id: string | null
  site_usuario: string | null
  link_meet: string | null
  numero_follow: string | null
  instance: string | null
  nome_cliente: string | null
  id_calendar: string | null
  data_agendamento: string | null
  hora_agendamento: string | null
  Agente_ID: string | null
  data_folowup_solicitado: string | null
  folowup_solicitado: boolean | null
  id_card: string | null
  existe_whatsapp: boolean | null
  responsavel_encontrado: boolean | null
  falando_com_responsavel: boolean | null
  responsavel_seguro: boolean | null
  efetuar_disparo: boolean | null
  nome_empresa: string | null
  id_empresa: string | null
  nome_campanha: string | null
  status_disparo: string | null

  // Campos Limpa Nome
  cpf?: string
  cpf_cnpj?: string
  telefone?: string
  origem?: string
  status_limpa_nome?: 'novo_lead' | 'qualificacao' | 'desqualificado' | 'pagamento_consulta' | 'nao_consta_divida' | 'consta_divida' | 'enviado_para_negociacao' | 'cliente_fechado'

  // Dados financeiros
  valor_estimado_divida?: number
  valor_real_divida?: number
  valor_pago_consulta?: number
  valor_contrato?: number

  // Dados específicos por estágio
  tempo_negativado?: string
  tipo_consulta_interesse?: string
  motivo_desqualificacao?: string
  data_pagamento?: string
  link_pagamento?: string
  data_consulta?: string
  orgaos_negativados?: string[]
  link_relatorio?: string
  observacoes_limpa_nome?: string
  data_escalacao?: string
  vendedor_responsavel?: string
  data_fechamento?: string

  // Controle
  data_ultima_atividade?: string
  updated_at?: string

  // Campos do sistema de funis personalizáveis
  funil_id?: string
  estagio_id?: string
  dados_personalizados?: Record<string, unknown>

  // DEPRECATED: campos antigos (manter para retrocompatibilidade)
  tipo_negocio_id?: number
  status_generico?: string
}

// === WhatsApp ===
export interface InstanciaWhatsapp {
  id: number
  user_id: number
  workspace_id?: string  // Nova propriedade para multi-tenancy
  apikey?: string
  instancia?: string
  baseurl?: string
  waba_id?: string
  is_official_api?: boolean
  id_telefone?: string
  agante_id?: number
  created_at: string
  updated_at?: string
}

export interface AgenteIA {
  id: number
  created_at: string
  nome: string
  funcao: string
  prompt: string
  estagio: string
  user_id: number
  workspace_id?: string  // Para multi-tenancy
}

export interface WhatsappTemplate {
  id: number
  instancia_id: number
  template_name: string
  template_language: string
  template_category: string
  template_status: string
  template_components?: Record<string, unknown>
  created_at: string
  updated_at: string
}

// === Funis Personalizáveis ===
export interface Funil {
  id: string
  workspace_id: string
  nome: string
  descricao?: string
  icone: string
  cor: string
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export interface FunilEstagio {
  id: string
  funil_id: string
  nome: string
  descricao?: string
  cor: string
  ordem: number
  ativo: boolean
  created_at: string
}

export type CampoPersonalizadoTipo =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'email'
  | 'phone'
  | 'currency'
  | 'url'

export interface CampoPersonalizado {
  id: string
  workspace_id: string
  funil_id?: string  // NULL = campo global
  nome: string
  tipo: CampoPersonalizadoTipo
  opcoes?: string[]  // Para tipo 'select'
  obrigatorio: boolean
  ordem: number
  ativo: boolean
  created_at: string
}

export interface FunilComEstagios extends Funil {
  estagios?: FunilEstagio[]
  total_estagios?: number
}

export interface CreateFunilRequest {
  nome: string
  descricao?: string
  icone?: string
  cor?: string
}

export interface CreateEstagioRequest {
  nome: string
  descricao?: string
  cor?: string
  ordem: number
}

export interface CreateCampoRequest {
  funil_id?: string
  nome: string
  tipo: CampoPersonalizadoTipo
  opcoes?: string[]
  obrigatorio?: boolean
}

export interface Tool {
  id: number
  type: string
  nome: string
  descricao?: string
  tool: Record<string, unknown>
  created_at: string
}

export interface UserTool {
  id: number
  user_id: number
  tool_id: number
  agente_id?: number
  is_active: boolean
  created_at: string
}

export interface UserAgentVectorstore {
  id: number
  user_id: number
  agent_id: number
  vectorstore_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CredenciasDiversas {
  id: number
  user_id: number
  google_calendar?: {
    email?: string
    refresh_token?: string
  }
  asaas?: {
    access_token?: string
  }
  zapsign?: {
    token?: string
    modelos?: string
  }
  datecode?: Record<string, unknown>
  created_at: string
}

export interface Arquivo {
  id: number
  nome?: string
  mimetype?: string
  mediatype?: string
  arquivo?: string
  descricao?: string
  produto?: string
  user_id?: number
  workspace_id?: string
}

export interface AdsLead {
  id: number
  created_at: string
  remoteJid?: string
  id2?: string
  pushName?: string
  conversation?: string
  conversionSource?: string
  title?: string
  mediaType?: string
  thumbnailUrl?: string
  sourceType?: string
  sourceId?: string
  sourceUrl?: string
  source?: string
}

// === API Responses ===
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number
  limit: number
  total: number
  totalPages: number
}

// === Auth ===
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: Omit<User, 'password'>
  error?: string
}

export interface JWTPayload {
  userId: number
  email: string
  role: 'admin' | 'user'
  iat: number
  exp: number
}
