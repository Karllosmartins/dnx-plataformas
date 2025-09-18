import { UsuarioComPlano, User, Plano } from './supabase'

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
  | 'usuarios'

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
    usuarios: false,
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
    usuarios: false,
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
    usuarios: false,
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
    usuarios: true,
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
      usuarios: 'acesso_usuarios',
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
    'enriquecimento', 'usuarios'
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