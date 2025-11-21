import { getSupabaseAdmin } from './supabase'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  created_at: string
  active: boolean
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export const authService = {
  async signIn(email: string, password: string) {
    try {
      console.log('Tentativa de login:', email)

      // Chamar API de login (bcrypt roda no servidor)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer login')
      }

      const user: User = result.data.user

      console.log('Login bem-sucedido!')

      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(user))
      }

      return { user, error: null }
    } catch (error) {
      console.error('Erro no processo de login:', error)
      return { user: null, error: error instanceof Error ? error.message : 'Erro ao fazer login' }
    }
  },

  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user')
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
      console.log('Window undefined - SSR')
      return null
    }
    
    try {
      const userStr = localStorage.getItem('auth_user')
      console.log('User string from localStorage:', userStr)
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Erro ao recuperar usuário:', error)
      return null
    }
  },

  async createUser(userData: {
    name: string
    email: string
    password: string
    role: 'admin' | 'user'
  }) {
    try {
      // Chamar API de registro (bcrypt roda no servidor)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar usuario')
      }

      return { user: result.data, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Erro ao criar usuario' }
    }
  },

  async updateUser(id: string, updates: Partial<User>) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { user: data, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Erro ao atualizar usuário' }
    }
  },

  async getUsers() {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('users')
        .select('id, name, email, role, created_at, active')
        .order('created_at', { ascending: false })

      if (error) throw error

      return { users: data, error: null }
    } catch (error) {
      return { users: [], error: error instanceof Error ? error.message : 'Erro ao buscar usuários' }
    }
  }
}