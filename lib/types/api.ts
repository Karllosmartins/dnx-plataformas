/**
 * Common API types and interfaces
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client type for function parameters
 */
export type SupabaseClientType = SupabaseClient

/**
 * Generic JSON type for flexible data structures
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue }

/**
 * API response types
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export type ApiResponseType<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Datecode API types
 */
export interface DatecodeCredentials {
  usuario: string
  senha: string
}

export interface DatecodeRequestBody {
  document: string
  tipoPessoa: 'PF' | 'PJ'
  [key: string]: string | number | boolean | undefined
}

export interface DatecodeConsultaResult {
  nome?: string
  cpf?: string
  cnpj?: string
  telefones?: Array<{ numero: string; tipo?: string }>
  enderecos?: Array<{
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
    cep?: string
  }>
  emails?: Array<{ email: string }>
  [key: string]: unknown
}

/**
 * User and permissions types
 */
export interface UserPlanInfo {
  id: number
  plano: string
  plano_nome?: string
  leads_consumidos: number
  limite_leads: number
  consultas_realizadas: number
  limite_consultas: number
  ultimo_reset_contagem?: string
}

/**
 * WhatsApp types
 */
export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: string
  text?: string
  parameters?: Array<{
    type: string
    text?: string
    [key: string]: unknown
  }>
  buttons?: Array<{
    type: string
    text?: string
    url?: string
    phone_number?: string
  }>
}

/**
 * Evolution API types
 */
export interface EvolutionApiResponse<T = unknown> {
  success?: boolean
  error?: string
  data?: T
  [key: string]: unknown
}

/**
 * Vector store file type
 */
export interface VectorStoreFile {
  id: string
  object: string
  bytes: number
  created_at: number
  filename: string
  purpose: string
  status: string
  status_details?: string | null
}

/**
 * Form field value type
 */
export type FormFieldValue = string | number | boolean | string[] | null | undefined
