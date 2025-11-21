import { getSupabaseAdmin } from './supabase'
import { hasAvailableLeads, hasAvailableConsultas, getLeadsBalance, getConsultasBalance } from './permissions'

export type FeatureType = 'datecode' | 'whatsapp' | 'extract' | 'leads' | 'consulta' | 'enriquecimento'

export interface AccessCheckResult {
  allowed: boolean
  userPlan?: any
  reason?: string
  status?: number
  remaining?: number
}

/**
 * Verifies if a user has access to a specific feature based on their plan
 */
export async function verifyUserPlanAccess(
  userId: string | number,
  feature: FeatureType
): Promise<AccessCheckResult> {
  try {
    // Get user plan data
    const { data: userPlan, error: planError } = await getSupabaseAdmin()
      .from('view_usuarios_planos')
      .select('*')
      .eq('id', userId)
      .single()

    if (planError || !userPlan) {
      return {
        allowed: false,
        reason: 'Usuario nao encontrado ou sem plano ativo',
        status: 404
      }
    }

    // Check feature-specific access
    switch (feature) {
      case 'datecode':
      case 'consulta':
        // Check if user has consulta access and available consultas
        if (!userPlan.acesso_consulta) {
          return {
            allowed: false,
            userPlan,
            reason: 'Seu plano nao inclui acesso a consultas',
            status: 403
          }
        }
        if (!hasAvailableConsultas(userPlan, 1)) {
          const remaining = getConsultasBalance(userPlan)
          return {
            allowed: false,
            userPlan,
            reason: `Limite de consultas excedido. Restantes: ${remaining}`,
            status: 429,
            remaining
          }
        }
        return {
          allowed: true,
          userPlan,
          remaining: getConsultasBalance(userPlan)
        }

      case 'extract':
      case 'leads':
        // Check if user has leads access and available leads
        if (!userPlan.acesso_extracao) {
          return {
            allowed: false,
            userPlan,
            reason: 'Seu plano nao inclui acesso a extracao de leads',
            status: 403
          }
        }
        if (!hasAvailableLeads(userPlan, 1)) {
          const remaining = getLeadsBalance(userPlan)
          return {
            allowed: false,
            userPlan,
            reason: `Limite de leads excedido. Restantes: ${remaining}`,
            status: 429,
            remaining
          }
        }
        return {
          allowed: true,
          userPlan,
          remaining: getLeadsBalance(userPlan)
        }

      case 'enriquecimento':
        // Check if user has enriquecimento access
        if (!userPlan.acesso_enriquecimento) {
          return {
            allowed: false,
            userPlan,
            reason: 'Seu plano nao inclui acesso ao enriquecimento de dados',
            status: 403
          }
        }
        return {
          allowed: true,
          userPlan,
          remaining: getLeadsBalance(userPlan)
        }

      case 'whatsapp':
        // Check if user has whatsapp access
        if (!userPlan.acesso_whatsapp) {
          return {
            allowed: false,
            userPlan,
            reason: 'Seu plano nao inclui acesso ao WhatsApp',
            status: 403
          }
        }
        return { allowed: true, userPlan }

      default:
        return {
          allowed: false,
          reason: 'Feature desconhecida',
          status: 400
        }
    }
  } catch (error) {
    return {
      allowed: false,
      reason: 'Erro ao verificar permissoes',
      status: 500
    }
  }
}

/**
 * Checks if a user can consume a specific number of leads/consultas
 */
export async function canConsume(
  userId: string | number,
  feature: 'leads' | 'consultas',
  quantity: number = 1
): Promise<AccessCheckResult> {
  const { data: userPlan, error } = await getSupabaseAdmin()
    .from('view_usuarios_planos')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !userPlan) {
    return {
      allowed: false,
      reason: 'Usuario nao encontrado',
      status: 404
    }
  }

  if (feature === 'leads') {
    const canUse = hasAvailableLeads(userPlan, quantity)
    const remaining = getLeadsBalance(userPlan)
    return {
      allowed: canUse,
      userPlan,
      remaining,
      reason: canUse ? undefined : `Leads insuficientes. Necessario: ${quantity}, Disponivel: ${remaining}`,
      status: canUse ? 200 : 429
    }
  }

  if (feature === 'consultas') {
    const canUse = hasAvailableConsultas(userPlan, quantity)
    const remaining = getConsultasBalance(userPlan)
    return {
      allowed: canUse,
      userPlan,
      remaining,
      reason: canUse ? undefined : `Consultas insuficientes. Necessario: ${quantity}, Disponivel: ${remaining}`,
      status: canUse ? 200 : 429
    }
  }

  return {
    allowed: false,
    reason: 'Feature desconhecida',
    status: 400
  }
}

/**
 * Gets user's current usage stats
 */
export async function getUserUsageStats(
  userId: string | number
): Promise<{
  leads: { used: number; limit: number; remaining: number }
  consultas: { used: number; limit: number; remaining: number }
} | null> {
  const { data: userData, error } = await getSupabaseAdmin()
    .from('users')
    .select('leads_consumidos, limite_leads, consultas_realizadas, limite_consultas')
    .eq('id', userId)
    .single()

  if (error || !userData) return null

  return {
    leads: {
      used: userData.leads_consumidos || 0,
      limit: userData.limite_leads || 0,
      remaining: (userData.limite_leads || 0) - (userData.leads_consumidos || 0)
    },
    consultas: {
      used: userData.consultas_realizadas || 0,
      limit: userData.limite_consultas || 0,
      remaining: (userData.limite_consultas || 0) - (userData.consultas_realizadas || 0)
    }
  }
}
