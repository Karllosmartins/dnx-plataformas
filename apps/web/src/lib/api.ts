import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// API de Funis
export const funisApi = {
  list: (includeEstagios = false) =>
    api.get(`/funis${includeEstagios ? '?includeEstagios=true' : ''}`),

  get: (id: string) => api.get(`/funis/${id}`),

  create: (data: { nome: string; descricao?: string; icone?: string; cor?: string }) =>
    api.post('/funis', data),

  update: (id: string, data: Partial<{ nome: string; descricao: string; icone: string; cor: string; ativo: boolean }>) =>
    api.put(`/funis/${id}`, data),

  delete: (id: string) => api.delete(`/funis/${id}`),

  reorder: (id: string, novaOrdem: number) =>
    api.put(`/funis/${id}/reorder`, { novaOrdem }),
}

// API de Estágios
export const estagiosApi = {
  list: (funilId: string) => api.get(`/funis/${funilId}/estagios`),

  create: (funilId: string, data: { nome: string; descricao?: string; cor?: string; ordem: number }) =>
    api.post(`/funis/${funilId}/estagios`, data),

  update: (funilId: string, estagioId: string, data: Partial<{ nome: string; descricao: string; cor: string; ordem: number }>) =>
    api.put(`/funis/${funilId}/estagios/${estagioId}`, data),

  delete: (funilId: string, estagioId: string) =>
    api.delete(`/funis/${funilId}/estagios/${estagioId}`),

  reorder: (funilId: string, estagioId: string, novaOrdem: number) =>
    api.put(`/funis/${funilId}/estagios/${estagioId}/reorder`, { novaOrdem }),
}

// API de Leads
export const leadsApi = {
  list: (params?: { page?: number; limit?: number; funil_id?: string; estagio_id?: string; search?: string }) =>
    api.get('/leads', { params }),

  get: (id: number) => api.get(`/leads/${id}`),

  create: (data: Record<string, unknown>) => api.post('/leads', data),

  update: (id: number, data: Record<string, unknown>) => api.put(`/leads/${id}`, data),

  delete: (id: number) => api.delete(`/leads/${id}`),

  // Kanban
  kanban: (funilId: string) => api.get(`/leads/kanban/${funilId}`),

  moveToStage: (leadId: number, estagioId: string, funilId?: string) =>
    api.put(`/leads/${leadId}/estagio`, { estagio_id: estagioId, funil_id: funilId }),

  bulkMoveToStage: (leadIds: number[], estagioId: string) =>
    api.put('/leads/bulk/estagio', { lead_ids: leadIds, estagio_id: estagioId }),
}

// API de Campos Personalizados
export const camposApi = {
  list: (params?: { funilId?: string; global?: boolean }) =>
    api.get('/campos', { params: { funil_id: params?.funilId, global: params?.global } }),

  get: (id: string) => api.get(`/campos/${id}`),

  create: (data: { nome: string; tipo: string; funil_id?: string; opcoes?: string[]; obrigatorio?: boolean }) =>
    api.post('/campos', data),

  update: (id: string, data: Partial<{ nome: string; tipo: string; opcoes: string[]; obrigatorio: boolean }>) =>
    api.put(`/campos/${id}`, data),

  delete: (id: string) => api.delete(`/campos/${id}`),
}

// API de Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),
}

// API de Workspaces
export const workspacesApi = {
  list: () => api.get('/workspaces'),

  get: (id: string) => api.get(`/workspaces/${id}`),

  create: (data: { name: string; slug?: string }) =>
    api.post('/workspaces', data),

  switch: (id: string) => api.post(`/workspaces/${id}/switch`),
}
