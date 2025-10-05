import { UsuarioComPlano, User, Plano } from './supabase'
import { supabase } from './supabase'

// Tipos de features disponíveis no sistema
export type FeatureType =
  | 'dashboard'
  | 'crm'
  | 'whatsapp'
  | 'disparoSimples'
  | 'disparoIA'
  | 'agentesIA'
  | 'extracaoLeads'
  | 'enriquecimento'
  | 'enriquecimentoAPI'
  | 'consulta'
  | 'usuarios'
  | 'integracoes'

// Configuração padrão dos planos (fallback)
export const PLANOS_DEFAULT = {
  basico: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: false,
    agentesIA: false,
    extracaoLeads: false,
    enriquecimento: false,
    enriquecimentoAPI: false,
    consulta: false,
    usuarios: false,
    integracoes: true,
  },
  premium1: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: true,
    agentesIA: true,
    extracaoLeads: false,
    enriquecimento: false,
    enriquecimentoAPI: false,
    consulta: false,
    usuarios: false,
    integracoes: true,
  },
  premium2: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: false,
    agentesIA: false,
    extracaoLeads: true,
    enriquecimento: false,
    enriquecimentoAPI: false,
    consulta: false,
    usuarios: false,
    integracoes: true,
  },
  enterprise: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: true,
    agentesIA: true,
    extracaoLeads: true,
    enriquecimento: true,
    enriquecimentoAPI: true,
    consulta: true,
    usuarios: true,
    integracoes: true,
  }
}

/**
 * Verifica se o usuário tem acesso a uma feature específica
 */
export function hasFeatureAccess(
  user: User | UsuarioComPlano,
  feature: FeatureType
): boolean {
  // Admin sempre tem acesso total
  if (user.role === 'admin') {
    return true
  }

  // Se é UsuarioComPlano (vem da view), usar os dados do plano
  if ('acesso_dashboard' in user) {
    const usuarioComPlano = user as UsuarioComPlano

    // Verificar overrides personalizados primeiro
    if (user.plano_customizado && user.plano_customizado[`acesso_${feature}`] !== undefined) {
      return user.plano_customizado[`acesso_${feature}`]
    }

    // Mapear features para campos do banco
    const featureMap: Record<FeatureType, keyof UsuarioComPlano> = {
      dashboard: 'acesso_dashboard',
      crm: 'acesso_crm',
      whatsapp: 'acesso_whatsapp',
      disparoSimples: 'acesso_disparo_simples',
      disparoIA: 'acesso_disparo_ia',
      agentesIA: 'acesso_agentes_ia',
      extracaoLeads: 'acesso_extracao_leads',
      enriquecimento: 'acesso_enriquecimento',
      enriquecimentoAPI: 'acesso_enriquecimento',
      consulta: 'acesso_consulta',
      usuarios: 'acesso_usuarios',
      integracoes: 'acesso_integracoes',
    }

    const fieldName = featureMap[feature]
    return Boolean(usuarioComPlano[fieldName])
  }

  // Fallback para compatibilidade com User legado
  const planoLegado = user.plano
  if (planoLegado === 'premium') {
    // Assumir premium1 como padrão para 'premium' legado
    return PLANOS_DEFAULT.premium1[feature] || false
  }

  return PLANOS_DEFAULT[planoLegado as keyof typeof PLANOS_DEFAULT]?.[feature] || false
}

/**
 * Verifica se o usuário pode acessar o enriquecimento de dados
 */
export function canUseEnriquecimento(user: User | UsuarioComPlano): boolean {
  return hasFeatureAccess(user, 'enriquecimento')
}

/**
 * Verifica se o usuário atingiu o limite de leads
 */
export function hasReachedLeadsLimit(user: User | UsuarioComPlano, currentCount: number): boolean {
  return currentCount >= user.limite_leads
}

/**
 * Verifica se o usuário atingiu o limite de consultas
 */
export function hasReachedConsultasLimit(user: User | UsuarioComPlano, currentCount: number): boolean {
  return currentCount >= user.limite_consultas
}

/**
 * Retorna as features disponíveis para o usuário
 */
export function getAvailableFeatures(user: User | UsuarioComPlano): FeatureType[] {
  const features: FeatureType[] = []

  const allFeatures: FeatureType[] = [
    'dashboard', 'crm', 'whatsapp', 'disparoSimples',
    'disparoIA', 'agentesIA', 'extracaoLeads',
    'enriquecimento', 'enriquecimentoAPI', 'consulta', 'usuarios'
  ]

  for (const feature of allFeatures) {
    if (hasFeatureAccess(user, feature)) {
      features.push(feature)
    }
  }

  return features
}

/**
 * Retorna informações detalhadas do plano do usuário
 */
export function getUserPlanInfo(user: User | UsuarioComPlano) {
  if ('plano_nome' in user) {
    const usuarioComPlano = user as UsuarioComPlano
    return {
      nome: usuarioComPlano.plano_nome || user.plano,
      descricao: usuarioComPlano.plano_descricao,
      features: getAvailableFeatures(user),
      limites: {
        leads: user.limite_leads,
        consultas: user.limite_consultas,
        instancias: user.numero_instancias || 1
      }
    }
  }

  // Fallback para User legado
  const planoLegado = user.plano === 'premium' ? 'premium1' : user.plano
  return {
    nome: planoLegado,
    descricao: `Plano ${planoLegado}`,
    features: getAvailableFeatures(user),
    limites: {
      leads: user.limite_leads,
      consultas: user.limite_consultas,
      instancias: user.numero_instancias || 1
    }
  }
}

/**
 * Verifica se o usuário tem leads suficientes para uma operação
 */
export function hasAvailableLeads(user: User | UsuarioComPlano, requiredLeads: number): boolean {
  const leadsDisponiveis = user.limite_leads - (user.leads_consumidos || 0)
  return leadsDisponiveis >= requiredLeads
}

/**
 * Verifica se o usuário tem consultas suficientes para uma operação
 */
export function hasAvailableConsultas(user: User | UsuarioComPlano, requiredConsultas: number): boolean {
  const consultasDisponiveis = user.limite_consultas - (user.consultas_realizadas || 0)
  return consultasDisponiveis >= requiredConsultas
}

/**
 * Consome leads do usuário (atualiza no banco)
 */
export async function consumeLeads(userId: number, quantidade: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Primeiro, buscar o valor atual
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('leads_consumidos')
      .eq('id', userId)
      .single()

    if (selectError) {
      console.error('Erro ao buscar leads consumidos:', selectError)
      return { success: false, error: selectError.message }
    }

    const novoValor = (user?.leads_consumidos || 0) + quantidade

    const { error } = await supabase
      .from('users')
      .update({
        leads_consumidos: novoValor
      })
      .eq('id', userId)

    if (error) {
      console.error('Erro ao consumir leads:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao consumir leads:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Consome consultas do usuário (atualiza no banco)
 */
export async function consumeConsultas(userId: number, quantidade: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Primeiro, buscar o valor atual
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('consultas_realizadas')
      .eq('id', userId)
      .single()

    if (selectError) {
      console.error('Erro ao buscar consultas realizadas:', selectError)
      return { success: false, error: selectError.message }
    }

    const novoValor = (user?.consultas_realizadas || 0) + quantidade

    const { error } = await supabase
      .from('users')
      .update({
        consultas_realizadas: novoValor
      })
      .eq('id', userId)

    if (error) {
      console.error('Erro ao consumir consultas:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao consumir consultas:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Calcula quantos leads serão consumidos em um enriquecimento
 * 1 lead base + quantidade de sócios
 */
export function calculateEnriquecimentoLeadsConsumption(numeroSocios: number): number {
  return 1 + numeroSocios
}

/**
 * Retorna o saldo atual de leads do usuário
 */
export function getLeadsBalance(user: User | UsuarioComPlano): number {
  return user.limite_leads - (user.leads_consumidos || 0)
}

/**
 * Retorna o saldo atual de consultas do usuário
 */
export function getConsultasBalance(user: User | UsuarioComPlano): number {
  return user.limite_consultas - (user.consultas_realizadas || 0)
}