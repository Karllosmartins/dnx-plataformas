import { createClient } from '@supabase/supabase-js'

// Configuração para o projeto DNX Plataformas CRM Limpa Nome
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

// Cliente principal para operações do usuário
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin - apenas para uso no servidor (APIs)
function createSupabaseAdmin() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables for admin client')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Função para obter cliente admin (apenas no servidor)
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side')
  }
  return createSupabaseAdmin()
}

// =====================================================
// INTERFACES PARA O CRM LIMPA NOME
// =====================================================

export interface Plano {
  id: number
  nome: string
  descricao?: string

  // Controles de acesso
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

  // Limites
  limite_leads: number
  limite_consultas: number
  limite_instancias: number

  ativo: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  active: boolean
  cpf?: string
  telefone?: string
  plano: 'basico' | 'premium' | 'enterprise' // Mantido para compatibilidade
  plano_id?: number
  plano_customizado?: Record<string, any> // Overrides específicos
  limite_leads: number
  limite_consultas: number
  leads_consumidos?: number
  consultas_realizadas?: number
  ultimo_reset_contagem?: string
  numero_instancias?: number
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

export interface Workspace {
  id: string
  name: string
  slug: string
  plano_id?: number
  settings?: Record<string, any>

  // Limites do workspace (compartilhados por todos os usuários)
  limite_leads: number
  limite_consultas: number
  limite_instancias: number

  // Consumo atual do workspace
  leads_consumidos: number
  consultas_realizadas: number
  instancias_ativas: number

  // Controle de reset de contadores
  ultimo_reset_contagem: string

  // Overrides customizados para este workspace
  plano_customizado?: Record<string, any>

  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: number
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions?: Record<string, any>
  joined_at: string
  invited_by?: number
}

export interface ConfiguracaoCredenciais {
  id: number
  user_id: number
  
  // APIs de IA
  openai_api_token?: string
  gemini_api_key?: string
  model: string
  type_tool_supabase: string
  reasoning_effort?: string
  apikeydados?: string
  
  // ElevenLabs
  apikey_elevenlabs?: string
  id_voz_elevenlabs?: string
  
  // FireCrawl
  firecrawl_apikey?: string
  
  // WhatsApp Evolution API (INCLUÍDO AQUI)
  baseurl: string
  instancia?: string  // Nome da instância WhatsApp
  apikey?: string     // API Key da instância
  
  // Supabase Databases
  base_tools_supabase?: string
  base_leads_supabase?: string
  base_mensagens_supabase?: string
  base_agentes_supabase?: string
  base_rag_supabase?: string
  base_ads_supabase?: string
  
  // Configurações do Agente
  prompt_do_agente?: string
  vector_store_ids?: any
  structured_output?: any
  
  // Configurações Operacionais
  delay_entre_mensagens_em_segundos: number
  delay_apos_intervencao_humana_minutos: number
  inicio_expediente: number
  fim_expediente: number
  
  // CRM Integration
  url_crm?: string
  usuario_crm?: string
  senha_crm?: string
  token_crm?: string
  
  // Drive Integration
  pasta_drive?: string
  id_pasta_drive_rag?: string
  
  cliente: string
  created_at: string
  updated_at: string
}

// Nova interface para instâncias WhatsApp (tabela instancia_whtats)
export interface InstanciaWhats {
  id: number
  user_id: number
  apikey?: string
  instancia?: string
  baseurl?: string

  // Campos para API oficial do WhatsApp
  waba_id?: string
  is_official_api?: boolean
  id_telefone?: string

  // Vinculação com agente
  agante_id?: number

  created_at: string
}

export interface InstanciaWhatsapp {
  id: number
  user_id: number
  config_id: number
  nome_instancia: string
  instancia: string
  apikey?: string
  baseurl?: string
  status_conexao: 'conectado' | 'desconectado' | 'erro'
  ultimo_ping?: string
  ativo: boolean
  configuracoes_credenciais?: ConfiguracaoCredenciais
  users?: User
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
}

// Interface para templates do WhatsApp Business API
export interface WhatsAppTemplate {
  id: number
  instancia_id: number
  template_name: string
  template_language: string
  template_category: string
  template_status: string
  template_components?: any // JSON com header, body, footer, buttons
  created_at: string
  updated_at: string
}

// Interface para a tabela tools
export interface Tool {
  id: number
  type: string
  nome: string
  descricao?: string
  tool: any // JSON object
  created_at: string
}

// Interface para a tabela user_tools
export interface UserTool {
  id: number
  user_id: number
  tool_id: number
  agente_id?: number // Mudou para number (bigint no banco)
  is_active: boolean
  created_at: string
}

export interface PagamentoConsulta {
  id: number
  lead_id: number
  user_id: number
  
  // Dados do Cliente
  id_cliente_asaas?: string
  id_cobranca_asaas?: string
  telefone_cliente: string
  cpfcnpj?: string
  
  // Dados do Pagamento
  valor_cobranca: number
  valor_recebido?: number
  metodo_pagamento?: 'PIX' | 'BOLETO' | 'CARTAO'
  status_pagamento: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED'
  data_pago?: string
  
  // Referências
  tabela_leads?: string
  
  // Links das Consultas
  consulta_link1?: string
  consulta_link2?: string
  
  created_at: string
  updated_at: string
}


// Views para Dashboard
export interface ViewFunilConversao {
  user_id: number
  usuario: string
  novos_leads: number
  qualificados: number
  pagou_consulta: number
  divida_encontrada: number
  contratos_fechados: number
  perc_lead_to_qualificacao: number
  perc_qualificacao_to_pagamento: number
  perc_pagamento_to_divida: number
  perc_divida_to_fechado: number
}

export interface ViewMetricasFinanceiras {
  user_id: number
  usuario: string
  total_consultas_pagas: number
  receita_contratos: number
  ticket_medio: number
  consultas_basicas: number
  consultas_rating: number
}

// Interface para leads (tabela unificada)
export interface Lead {
  id: number
  user_id: number
  
  // Campos originais (compatibilidade)
  created_at: string | null
  remotejid: string | null
  response_id: string | null
  atendimentofinalizado: boolean | null
  conversation_log: any | null
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
  
  // Campos do sistema multi-negócios
  tipo_negocio_id?: number
  status_generico?: string
  dados_personalizados?: Record<string, any>

  // Sistema de funis e estágios
  funil_id?: string
  estagio_id?: string
}

// Interfaces para contagens da API Profile
export interface ContagemProfile {
  id: number
  user_id: number
  id_contagem_api: number // ID retornado pela API Profile
  nome_contagem: string
  tipo_pessoa: 'pf' | 'pj'
  
  // Dados da contagem
  total_registros: number
  dados_filtros: any // JSON com os filtros aplicados
  dados_resultado: any // JSON com o resultado completo da API
  
  // Status
  status: 'processando' | 'concluida' | 'erro'
  data_criacao: string
  data_conclusao?: string
  
  created_at: string
  updated_at?: string
}

export interface ExtracaoProfile {
  id: number
  user_id: number
  contagem_id: number // FK para contagens_profile
  id_extracao_api?: number // ID da extração na API Profile (se aplicável)
  
  // Dados da extração
  nome_arquivo: string
  formato_arquivo: 'csv' | 'excel' | 'json'
  url_download?: string
  tamanho_arquivo?: number
  total_registros_extraidos: number
  
  // Status
  status: 'solicitada' | 'processando' | 'concluida' | 'erro' | 'expirada'
  data_solicitacao: string
  data_conclusao?: string
  data_expiracao?: string // Link expira após X dias
  
  // Relacionamento
  contagem_profile?: ContagemProfile
  
  created_at: string
  updated_at?: string
}

// Interface para tabela user_agent_vectorstore
export interface UserAgentVectorStore {
  id: number
  user_id: number
  agent_id: number
  vectorstore_id: string // ID do vector store na OpenAI
  is_active: boolean
  created_at: string
  updated_at?: string
}


