import { supabase, supabaseAdmin } from './supabase'

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
      
      // Verificar se o usuário existe na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('active', true)
        .single()

      console.log('Resultado da busca no Supabase:', { userData, userError })

      if (userError || !userData) {
        console.error('Usuário não encontrado:', userError)
        throw new Error('Usuário não encontrado ou inativo')
      }

      // Verificar senha (simplificado - em produção usar hash)
      console.log('Verificando senha...')
      if (userData.password !== password) {
        console.error('Senha incorreta')
        throw new Error('Senha incorreta')
      }

      console.log('Login bem-sucedido!')

      // Criar sessão local
      const user: User = {
        id: userData.id.toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: userData.created_at,
        active: userData.active
      }

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
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          password: userData.password, // Em produção, fazer hash
          role: userData.role,
          active: true
        }])
        .select()
        .single()

      if (error) throw error

      return { user: data, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Erro ao criar usuário' }
    }
  },

  async updateUser(id: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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