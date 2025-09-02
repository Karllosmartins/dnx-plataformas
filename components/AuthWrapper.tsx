'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authService, User } from '@/lib/auth'
import Sidebar from './Sidebar'
import LoginForm from './LoginForm'

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Verificar se há usuário logado
    const currentUser = authService.getCurrentUser()
    console.log('Usuario atual:', currentUser) // Debug
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    console.log('AuthWrapper: Iniciando processo de login')
    
    const { user: loggedUser, error } = await authService.signIn(email, password)
    
    console.log('AuthWrapper: Resultado do login:', { loggedUser, error })
    
    if (loggedUser) {
      console.log('AuthWrapper: Login bem-sucedido, definindo usuário')
      setUser(loggedUser)
      setLoading(false)
      return { success: true }
    } else {
      console.log('AuthWrapper: Login falhou:', error)
      setLoading(false)
      return { success: false, error: error || 'Erro ao fazer login' }
    }
  }

  const logout = async () => {
    await authService.signOut()
    setUser(null)
  }

  // Se ainda está carregando
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Se não está logado, mostrar tela de login
  if (!user) {
    return <LoginForm onLogin={login} />
  }

  // Se está logado, mostrar o dashboard
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <div className="min-h-screen bg-gray-50">
        <Sidebar user={user} onLogout={logout} onCollapseChange={setSidebarCollapsed} />
        <div className={`${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'} relative z-10 transition-all duration-300`}>
          <main className="py-4 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  )
}