'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { authService, User } from '../../lib/auth'
import { WorkspaceProvider } from '../../contexts/WorkspaceContext'
import Sidebar from '../layout/Sidebar'
import LoginForm from '../layout/LoginForm'

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/esqueci-senha', '/auth/callback', '/login']

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthWrapper')
  }
  return context
}

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Verificar se é uma rota pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))

  useEffect(() => {
    // Verificar se há usuário logado
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)

    const { user: loggedUser, error } = await authService.signIn(email, password)

    if (loggedUser) {
      setUser(loggedUser)
      setLoading(false)
      return { success: true }
    } else {
      setLoading(false)
      return { success: false, error: error || 'Erro ao fazer login' }
    }
  }

  const logout = async () => {
    await authService.signOut()
    setUser(null)
  }

  // Se ainda está carregando (exceto em rotas públicas)
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se é uma rota pública, renderizar o conteúdo diretamente
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Se não está logado, mostrar tela de login
  if (!user) {
    return <LoginForm onLogin={login} />
  }

  // Se está logado, mostrar o dashboard com contexto de workspace
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <WorkspaceProvider userId={user.id}>
        <div className="min-h-screen bg-gray-50">
          <Sidebar user={user as any} onLogout={logout} onCollapseChange={setSidebarCollapsed} />
          <div className={`${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'} relative z-10 transition-all duration-300`}>
            <main className="py-4 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </WorkspaceProvider>
    </AuthContext.Provider>
  )
}
