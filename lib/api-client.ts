/**
 * Cliente API centralizado para comunicação com a API Express
 * Gerencia tokens JWT e chamadas autenticadas
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dnxplataformas.com.br/api'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

interface AuthTokens {
  token: string
  refreshToken: string
}

// Gerenciamento de tokens
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const USER_KEY = 'auth_user'

export const tokenManager = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, tokens.token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  },

  clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getUser<T>(): T | null {
    if (typeof window === 'undefined') return null
    try {
      const userStr = localStorage.getItem(USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },

  setUser<T>(user: T): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

// Cliente API principal
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = tokenManager.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      // Se for 204 No Content, retornar sucesso sem body
      if (response.status === 204) {
        return { success: true }
      }

      const data = await response.json()

      // Se token expirou, tentar refresh
      if (response.status === 401 && data.code === 'INVALID_TOKEN') {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // Tentar novamente com novo token
          return this.request<T>(endpoint, options)
        }
        // Se refresh falhou, limpar tokens e redirecionar
        tokenManager.clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão com a API',
        code: 'NETWORK_ERROR'
      }
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()
      if (data.success && data.data?.token) {
        tokenManager.setTokens({
          token: data.data.token,
          refreshToken: data.data.refreshToken || refreshToken
        })
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Métodos HTTP
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Instância singleton
export const apiClient = new ApiClient()

// APIs específicas por domínio
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiClient.post<{
      user: {
        id: string
        email: string
        name: string
        role: string
      }
      token: string
      refreshToken: string
    }>('/auth/login', { email, password })

    if (response.success && response.data) {
      tokenManager.setTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken
      })
      tokenManager.setUser(response.data.user)
    }

    return response
  },

  async register(data: { name: string; email: string; password: string; role?: string }) {
    return apiClient.post('/auth/register', data)
  },

  async logout() {
    tokenManager.clearTokens()
  },

  async me() {
    return apiClient.get('/auth/me')
  },

  getCurrentUser() {
    return tokenManager.getUser()
  }
}

export const workspacesApi = {
  list() {
    return apiClient.get('/workspaces')
  },

  get(id: string) {
    return apiClient.get(`/workspaces/${id}`)
  },

  create(data: { name: string; slug: string }) {
    return apiClient.post('/workspaces', data)
  },

  update(id: string, data: { name?: string }) {
    return apiClient.patch(`/workspaces/${id}`, data)
  },

  delete(id: string) {
    return apiClient.delete(`/workspaces/${id}`)
  },

  switchWorkspace(workspaceId: string) {
    return apiClient.post('/workspaces/switch', { workspaceId })
  },

  inviteMember(workspaceId: string, data: { email: string; role: string }) {
    return apiClient.post(`/workspaces/${workspaceId}/members`, data)
  },

  removeMember(workspaceId: string, userId: string) {
    return apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`)
  },

  updateMemberRole(workspaceId: string, userId: string, role: string) {
    return apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role })
  }
}

export const leadsApi = {
  list(params?: {
    page?: string
    limit?: string
    status?: string
    funilId?: string
    estagioId?: string
    search?: string
  }) {
    return apiClient.get('/leads', params as Record<string, string>)
  },

  get(id: string) {
    return apiClient.get(`/leads/${id}`)
  },

  create(data: Record<string, unknown>) {
    return apiClient.post('/leads', data)
  },

  update(id: string, data: Record<string, unknown>) {
    return apiClient.put(`/leads/${id}`, data)
  },

  delete(id: string) {
    return apiClient.delete(`/leads/${id}`)
  },

  moveToStage(id: string, estagioId: string) {
    return apiClient.patch(`/leads/${id}/stage`, { estagioId })
  },

  toggleAtendimento(id: string, atendimentofinalizado: boolean) {
    return apiClient.patch(`/leads/${id}`, { atendimentofinalizado })
  },

  patch(id: string, data: Record<string, unknown>) {
    return apiClient.patch(`/leads/${id}`, data)
  }
}

export const funisApi = {
  list(includeEstagios?: boolean) {
    const params = includeEstagios ? { includeEstagios: 'true' } : undefined
    return apiClient.get('/funis', params)
  },

  get(id: string) {
    return apiClient.get(`/funis/${id}`)
  },

  create(data: { nome: string; descricao?: string; cor?: string }) {
    return apiClient.post('/funis', data)
  },

  update(id: string, data: { nome?: string; descricao?: string; cor?: string; ativo?: boolean }) {
    return apiClient.put(`/funis/${id}`, data)
  },

  delete(id: string) {
    return apiClient.delete(`/funis/${id}`)
  },

  reorder(id: string, novaOrdem: number) {
    return apiClient.patch(`/funis/${id}/reorder`, { novaOrdem })
  },

  // Estágios
  listEstagios(funilId: string) {
    return apiClient.get(`/funis/${funilId}/estagios`)
  },

  createEstagio(funilId: string, data: { nome: string; cor?: string }) {
    return apiClient.post(`/funis/${funilId}/estagios`, data)
  },

  updateEstagio(funilId: string, estagioId: string, data: { nome?: string; cor?: string }) {
    return apiClient.put(`/funis/${funilId}/estagios/${estagioId}`, data)
  },

  deleteEstagio(funilId: string, estagioId: string) {
    return apiClient.delete(`/funis/${funilId}/estagios/${estagioId}`)
  },

  reorderEstagio(funilId: string, estagioId: string, novaOrdem: number) {
    return apiClient.put(`/funis/${funilId}/estagios/${estagioId}/reorder`, { novaOrdem })
  }
}

export const arquivosApi = {
  list(params?: { produto?: string; mimetype?: string }) {
    return apiClient.get('/arquivos', params as Record<string, string>)
  },

  get(id: string) {
    return apiClient.get(`/arquivos/${id}`)
  },

  delete(id: string) {
    return apiClient.delete(`/arquivos/${id}`)
  }
}

export const whatsappApi = {
  listInstances() {
    return apiClient.get('/whatsapp/instances')
  },

  getInstance(id: string) {
    return apiClient.get(`/whatsapp/instances/${id}`)
  },

  createInstance(data: { nome: string }) {
    return apiClient.post('/whatsapp/instances', data)
  },

  deleteInstance(id: string) {
    return apiClient.delete(`/whatsapp/instances/${id}`)
  }
}

export const agentesIAApi = {
  list(params?: { estagio?: string }) {
    return apiClient.get('/agentes-ia', params as Record<string, string>)
  },

  get(id: string) {
    return apiClient.get(`/agentes-ia/${id}`)
  },

  create(data: Record<string, unknown>) {
    return apiClient.post('/agentes-ia', data)
  },

  update(id: string, data: Record<string, unknown>) {
    return apiClient.patch(`/agentes-ia/${id}`, data)
  },

  delete(id: string) {
    return apiClient.delete(`/agentes-ia/${id}`)
  }
}

export const camposApi = {
  list(params?: { funilId?: string; global?: string }) {
    return apiClient.get('/campos', params as Record<string, string>)
  },

  get(id: string) {
    return apiClient.get(`/campos/${id}`)
  },

  create(data: Record<string, unknown>) {
    return apiClient.post('/campos', data)
  },

  update(id: string, data: Record<string, unknown>) {
    return apiClient.put(`/campos/${id}`, data)
  },

  delete(id: string) {
    return apiClient.delete(`/campos/${id}`)
  }
}

// ============================================
// APIs Admin - Gestão de Usuários e Workspaces
// ============================================

export const adminToolsApi = {
  list() {
    return apiClient.get('/admin/tools')
  }
}

export const adminUsersApi = {
  list() {
    return apiClient.get('/admin/users')
  },

  get(id: string) {
    return apiClient.get(`/admin/users/${id}`)
  },

  create(data: {
    name: string
    email: string
    password: string
    role?: 'admin' | 'user'
    workspace_id: string
    workspace_role?: 'owner' | 'admin' | 'member' | 'viewer'
    cpf?: string
    telefone?: string
  }) {
    return apiClient.post('/admin/users', data)
  },

  update(id: string, data: {
    name?: string
    email?: string
    password?: string
    role?: 'admin' | 'user'
    active?: boolean
    cpf?: string
    telefone?: string
    workspace_id?: string
    workspace_role?: string
  }) {
    return apiClient.put(`/admin/users/${id}`, data)
  },

  delete(id: string) {
    return apiClient.delete(`/admin/users/${id}`)
  }
}

export const adminWorkspacesApi = {
  list() {
    return apiClient.get('/admin/workspaces')
  },

  get(id: string) {
    return apiClient.get(`/admin/workspaces/${id}`)
  },

  create(data: {
    name: string
    slug: string
    plano_id?: number
    ativo?: boolean
    owner_id?: number
    limite_leads?: number
    limite_consultas?: number
    limite_instancias?: number
    // Credenciais
    openai_api_token?: string
    gemini_api_key?: string
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    datecode_username?: string
    datecode_password?: string
  }) {
    return apiClient.post('/admin/workspaces', data)
  },

  update(id: string, data: {
    name?: string
    slug?: string
    plano_id?: number
    ativo?: boolean
    owner_id?: number
    limite_leads?: number
    limite_consultas?: number
    limite_instancias?: number
    // Credenciais
    openai_api_token?: string
    gemini_api_key?: string
    elevenlabs_api_key?: string
    elevenlabs_voice_id?: string
    datecode_username?: string
    datecode_password?: string
    // Permissões customizadas
    plano_customizado?: Record<string, unknown>
  }) {
    return apiClient.put(`/admin/workspaces/${id}`, data)
  },

  delete(id: string) {
    return apiClient.delete(`/admin/workspaces/${id}`)
  },

  // Membros
  listMembers(workspaceId: string) {
    return apiClient.get(`/admin/workspaces/${workspaceId}/members`)
  },

  addMember(workspaceId: string, data: { user_id: number; role?: string }) {
    return apiClient.post(`/admin/workspaces/${workspaceId}/members`, data)
  }
}

// API para agentes (lista de agentes para consulta)
export const agentesApi = {
  list(workspaceId: string) {
    return apiClient.get<Array<{
      id: number
      agente_id: string
      nome: string
      ativo: boolean
    }>>('/agentes', { workspaceId })
  }
}
