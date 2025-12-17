import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Mapear rotas para features necessárias
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/': 'dashboard', // Home page precisa de acesso ao dashboard
  '/leads': 'crm',
  '/whatsapp': 'whatsapp',
  '/disparo-simples': 'disparoSimples',
  '/disparo-ia': 'disparoIA',
  '/agentes-ia': 'agentesIA',
  '/extracao-leads': 'extracaoLeads',
  '/enriquecimento-api': 'enriquecimentoAPI',
  '/consulta': 'consulta',
  '/usuarios': 'usuarios',
  '/historico-contagens': 'extracaoLeads'
}

// Mapear features para campos do banco (mesmo do lib/permissions.ts)
const FEATURE_TO_DB_FIELD: Record<string, string> = {
  dashboard: 'acesso_dashboard',
  crm: 'acesso_crm',
  whatsapp: 'acesso_whatsapp',
  disparoSimples: 'acesso_disparo_simples',
  disparoIA: 'acesso_disparo_ia',
  agentesIA: 'acesso_agentes_ia',
  extracaoLeads: 'acesso_extracao_leads',
  enriquecimentoAPI: 'acesso_enriquecimento',
  consulta: 'acesso_consulta',
  usuarios: 'acesso_usuarios'
}

// Ordem de prioridade das rotas (primeira disponível será usada)
const ROUTE_PRIORITY = [
  '/',
  '/leads',
  '/extracao-leads',
  '/whatsapp',
  '/disparo-simples',
  '/disparo-ia',
  '/agentes-ia',
  '/enriquecimento-api',
  '/consulta',
  '/historico-contagens',
  '/usuarios'
]

// Rotas públicas (sem autenticação necessária)
const PUBLIC_ROUTES: string[] = [
  '/login',
  '/esqueci-senha',
  '/auth/callback'
]

// Rotas de admin que sempre passam
const ADMIN_ROUTES = ['/admin', '/dashboard/admin']

async function verifyToken(token: string) {
  try {
    const jwtSecret = process.env.JWT_SECRET

    // JWT_SECRET é obrigatório em produção
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      console.error('❌ JWT_SECRET não está configurada em produção')
      return null
    }

    // Em desenvolvimento, use um padrão, mas log um aviso
    if (!jwtSecret && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  JWT_SECRET não configurada - usando valor padrão (apenas para dev)')
    }

    const secret = new TextEncoder().encode(jwtSecret || 'dev-secret-only-for-development')
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

async function getUserPermissions(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/view_usuarios_planos?id=eq.${userId}&select=*`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) return null

    const data = await response.json()
    return data[0] || null
  } catch {
    return null
  }
}

function getFirstAvailableRoute(userPermissions: any): string {
  for (const route of ROUTE_PRIORITY) {
    const requiredFeature = ROUTE_PERMISSIONS[route]
    if (!requiredFeature) continue

    const permissionField = FEATURE_TO_DB_FIELD[requiredFeature]
    if (userPermissions[permissionField] === true) {
      return route
    }
  }

  // Fallback - se nenhuma rota específica, redirecionar para home
  // (AuthWrapper vai mostrar tela de login se necessário)
  return '/'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rotas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Redirecionar páginas de configurações antigas para dashboard/admin
  if (pathname === '/configuracoes' || pathname === '/configuracoes-admin') {
    return NextResponse.redirect(new URL('/dashboard/admin', request.url))
  }

  const token = request.cookies.get('auth-token')?.value

  // Se não tem token, deixar o AuthWrapper gerenciar
  if (!token) {
    return NextResponse.next()
  }

  // Verificar token
  const payload = await verifyToken(token)
  if (!payload || !payload.userId) {
    // Token inválido, deixar o AuthWrapper gerenciar
    return NextResponse.next()
  }

  // Admin sempre pode acessar tudo
  if (payload.role === 'admin') {
    return NextResponse.next()
  }

  // Buscar permissões do usuário
  const userPermissions = await getUserPermissions(payload.userId as string)
  if (!userPermissions) {
    return NextResponse.next() // Deixar AuthWrapper gerenciar
  }

  // Verificar se a rota precisa de permissão específica
  const requiredFeature = ROUTE_PERMISSIONS[pathname]

  if (requiredFeature) {
    const permissionField = FEATURE_TO_DB_FIELD[requiredFeature]
    const hasPermission = userPermissions[permissionField] === true

    if (!hasPermission) {
      // Encontrar primeira página que o usuário tem acesso
      const firstAvailableRoute = getFirstAvailableRoute(userPermissions)

      // Se a primeira rota disponível é diferente da atual, redirecionar
      if (firstAvailableRoute !== pathname) {
        return NextResponse.redirect(new URL(firstAvailableRoute, request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sublogo.png).*)',
  ]
}