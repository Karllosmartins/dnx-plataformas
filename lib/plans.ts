// Configurações e permissões por plano
export type PlanType = 'basico' | 'premium' | 'enterprise'

export interface PlanConfig {
  maxInstances: number
  features: {
    dashboard: boolean
    crm: boolean
    whatsapp: boolean
    agentesIA: boolean
    disparoSimples: boolean
    disparoIA: boolean
    extracaoLeads: boolean
    configuracoes: boolean
  }
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  basico: {
    maxInstances: 1,
    features: {
      dashboard: true,
      crm: true,
      whatsapp: true,
      agentesIA: false,      // Não tem acesso
      disparoSimples: true,
      disparoIA: false,      // Não tem acesso
      extracaoLeads: false,  // Não tem acesso
      configuracoes: true
    }
  },
  premium: {
    maxInstances: 1,
    features: {
      dashboard: true,
      crm: true,
      whatsapp: true,
      agentesIA: false,      // Não tem acesso
      disparoSimples: true,
      disparoIA: false,      // Não tem acesso
      extracaoLeads: true,
      configuracoes: true
    }
  },
  enterprise: {
    maxInstances: 3,
    features: {
      dashboard: true,
      crm: true,
      whatsapp: true,
      agentesIA: true,       // Acesso completo
      disparoSimples: true,
      disparoIA: true,       // Acesso completo
      extracaoLeads: true,
      configuracoes: true
    }
  }
}

export function getPlanConfig(planType: PlanType): PlanConfig {
  return PLAN_CONFIGS[planType] || PLAN_CONFIGS.basico
}

export function hasFeatureAccess(planType: PlanType, feature: keyof PlanConfig['features']): boolean {
  const hasAccess = getPlanConfig(planType).features[feature]
  console.log(`hasFeatureAccess: plano=${planType}, feature=${feature}, hasAccess=${hasAccess}`)
  return hasAccess
}

export function getMaxInstances(planType: PlanType): number {
  return getPlanConfig(planType).maxInstances
}

export function getPlanDisplayName(planType: PlanType): string {
  const names = {
    basico: 'Básico',
    premium: 'Premium',
    enterprise: 'Enterprise'
  }
  return names[planType] || 'Básico'
}