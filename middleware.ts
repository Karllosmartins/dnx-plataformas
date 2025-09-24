import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Mapear rotas para features necessárias
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/leads': 'crm',
  '/whatsapp': 'whatsapp',
  '/disparo-simples': 'disparoSimples',
  '/disparo-ia': 'disparoIA',
  '/agentes-ia': 'agentesIA',
  '/extracao-leads': 'extracaoLeads',
  '/enriquecimento-api': 'enriquecimentoAPI',
  '/usuarios': 'usuarios',
  '/historico-contagens': 'extracaoLeads'
}

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = ['/', '/login']

// Rotas de admin que sempre passam
const ADMIN_ROUTES = ['/admin', '/configuracoes-admin']

async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rotas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // Bloquear página de configurações obsoleta
  if (pathname === '/configuracoes') {
    return NextResponse.redirect(new URL('/configuracoes-admin', request.url))
  }

  const token = request.cookies.get('auth-token')?.value

  // Se não tem token, redirecionar para login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar token
  const payload = await verifyToken(token)
  if (!payload || !payload.userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin sempre pode acessar tudo
  if (payload.role === 'admin') {
    return NextResponse.next()
  }

  // Verificar se a rota precisa de permissão específica
  const requiredFeature = ROUTE_PERMISSIONS[pathname]
  if (!requiredFeature) {
    return NextResponse.next()
  }

  // Buscar permissões do usuário
  const userPermissions = await getUserPermissions(payload.userId as string)
  if (!userPermissions) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Mapear feature para campo do banco
  const featureMap: Record<string, string> = {
    dashboard: 'acesso_dashboard',
    crm: 'acesso_crm',
    whatsapp: 'acesso_whatsapp',
    disparoSimples: 'acesso_disparo_simples',
    disparoIA: 'acesso_disparo_ia',
    agentesIA: 'acesso_agentes_ia',
    extracaoLeads: 'acesso_extracao_leads',
    enriquecimentoAPI: 'acesso_enriquecimento',
    usuarios: 'acesso_usuarios'
  }

  const permissionField = featureMap[requiredFeature]
  const hasPermission = userPermissions[permissionField] === true

  if (!hasPermission) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sublogo.png).*)',
  ]
}