// Configurações compartilhadas do DNX Plataformas

export const API_CONFIG = {
  // URL base da API (configurável via env)
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',

  // Timeout padrão para requisições (ms)
  timeout: 30000,

  // Versão da API
  version: 'v1',
}

export const JWT_CONFIG = {
  // Tempo de expiração do access token
  accessTokenExpiry: '15m',

  // Tempo de expiração do refresh token
  refreshTokenExpiry: '7d',

  // Nome do cookie/header do token
  tokenName: 'dnx_token',
  refreshTokenName: 'dnx_refresh_token',
}

export const PAGINATION_CONFIG = {
  // Itens por página padrão
  defaultLimit: 20,

  // Máximo de itens por página
  maxLimit: 100,
}

export const UPLOAD_CONFIG = {
  // Tamanho máximo de arquivo (10MB)
  maxFileSize: 10 * 1024 * 1024,

  // Tipos de arquivo permitidos
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
}

export const STATUS_LEAD = {
  NOVO: 'novo',
  EM_NEGOCIACAO: 'em_negociacao',
  PROPOSTA_ENVIADA: 'proposta_enviada',
  FECHADO: 'fechado',
  PERDIDO: 'perdido',
} as const

export type StatusLead = typeof STATUS_LEAD[keyof typeof STATUS_LEAD]

export const LEAD_STATUS_LABELS: Record<StatusLead, string> = {
  [STATUS_LEAD.NOVO]: 'Novo',
  [STATUS_LEAD.EM_NEGOCIACAO]: 'Em Negociação',
  [STATUS_LEAD.PROPOSTA_ENVIADA]: 'Proposta Enviada',
  [STATUS_LEAD.FECHADO]: 'Fechado',
  [STATUS_LEAD.PERDIDO]: 'Perdido',
}

export const LEAD_STATUS_COLORS: Record<StatusLead, string> = {
  [STATUS_LEAD.NOVO]: 'blue',
  [STATUS_LEAD.EM_NEGOCIACAO]: 'yellow',
  [STATUS_LEAD.PROPOSTA_ENVIADA]: 'purple',
  [STATUS_LEAD.FECHADO]: 'green',
  [STATUS_LEAD.PERDIDO]: 'red',
}
