// =====================================================
// UAZAPI Integration Service
// API WhatsApp não oficial - https://docs.uazapi.com/
// Base URL: https://dnxplataforma.uazapi.com
// =====================================================

// Configuração padrão da UAZAPI
export const DEFAULT_UAZAPI_CONFIG = {
  baseUrl: process.env.UAZAPI_BASE_URL || 'https://dnxplataforma.uazapi.com',
  adminToken: process.env.UAZAPI_ADMIN_TOKEN || ''
}

export interface UazapiResponse {
  success: boolean
  data?: any
  error?: string
}

// =====================================================
// INTERFACES - INSTÂNCIA
// =====================================================

export interface UazapiInstance {
  id: string
  token: string
  status: 'disconnected' | 'connecting' | 'connected'
  paircode?: string
  qrcode?: string
  name: string
  profileName?: string
  profilePicUrl?: string
  isBusiness?: boolean
  plataform?: string
  systemName?: string
  owner?: string
  lastDisconnect?: string
  lastDisconnectReason?: string
  adminField01?: string
  adminField02?: string
  created?: string
  updated?: string
}

export interface CreateInstancePayload {
  name: string
  systemName?: string
  adminField01?: string
  adminField02?: string
}

export interface ConnectPayload {
  phone?: string // Se passar, gera código de pareamento. Se não, gera QR Code
}

// =====================================================
// INTERFACES - MENSAGENS
// =====================================================

export interface SendTextPayload {
  number: string
  text: string
  linkPreview?: boolean
  linkPreviewTitle?: string
  linkPreviewDescription?: string
  linkPreviewImage?: string
  linkPreviewLarge?: boolean
  replyid?: string
  mentions?: string
  readchat?: boolean
  readmessages?: boolean
  delay?: number
  forward?: boolean
  track_source?: string
  track_id?: string
}

export interface SendMediaPayload {
  number: string
  type: 'image' | 'video' | 'document' | 'audio' | 'myaudio' | 'ptt' | 'sticker'
  file: string // URL ou base64
  text?: string // Caption
  docName?: string // Nome do documento
  replyid?: string
  mentions?: string
  readchat?: boolean
  readmessages?: boolean
  delay?: number
  forward?: boolean
  track_source?: string
  track_id?: string
}

export interface SendContactPayload {
  number: string
  fullName: string
  phoneNumber: string // Múltiplos separados por vírgula
  organization?: string
  email?: string
  url?: string
  replyid?: string
  delay?: number
}

// =====================================================
// INTERFACES - VERIFICAÇÃO DE NÚMERO
// =====================================================

export interface CheckNumberPayload {
  numbers: string[]
}

export interface CheckNumberResult {
  query: string
  jid: string
  isInWhatsapp: boolean
  verifiedName?: string
}

// =====================================================
// INTERFACES - WEBHOOK
// =====================================================

export interface WebhookConfig {
  id?: string
  enabled?: boolean
  url: string
  events?: string[]
  excludeMessages?: string[]
  addUrlEvents?: boolean
  addUrlTypesMessages?: boolean
  action?: 'add' | 'update' | 'delete'
}

// =====================================================
// SERVIÇO ADMIN (usa admintoken)
// Para operações que requerem permissão de administrador
// =====================================================

class UazapiAdminService {
  private baseUrl: string
  private adminToken: string

  constructor(baseUrl: string, adminToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.adminToken = adminToken
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'admintoken': this.adminToken
    }
  }

  /**
   * Criar nova instância
   * POST /instance/init
   */
  async createInstance(payload: CreateInstancePayload): Promise<UazapiResponse> {
    try {
      console.log('UAZAPI createInstance - URL:', `${this.baseUrl}/instance/init`)
      console.log('UAZAPI createInstance - Payload:', JSON.stringify(payload))
      console.log('UAZAPI createInstance - AdminToken present:', !!this.adminToken)

      const response = await fetch(`${this.baseUrl}/instance/init`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      })

      const responseText = await response.text()
      console.log('UAZAPI createInstance - Response status:', response.status)
      console.log('UAZAPI createInstance - Response body:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch {
        result = { error: responseText }
      }

      if (!response.ok) {
        const errorMsg = result.error || result.message || result.msg || responseText || `Erro HTTP ${response.status}`
        console.error('UAZAPI createInstance - Error:', errorMsg)
        return {
          success: false,
          error: errorMsg,
          data: result
        }
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('UAZAPI createInstance - Exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Listar todas as instâncias
   * GET /instance/all
   */
  async listAllInstances(): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/all`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao listar instâncias:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Atualizar campos administrativos de uma instância
   * POST /instance/updateAdminFields
   */
  async updateAdminFields(id: string, adminField01?: string, adminField02?: string): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/updateAdminFields`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ id, adminField01, adminField02 })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao atualizar campos admin:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Configurar Webhook Global
   * POST /globalwebhook
   */
  async setGlobalWebhook(config: WebhookConfig): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/globalwebhook`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao configurar webhook global:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Ver Webhook Global
   * GET /globalwebhook
   */
  async getGlobalWebhook(): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/globalwebhook`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao obter webhook global:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}

// =====================================================
// SERVIÇO DE INSTÂNCIA (usa token da instância)
// Para operações específicas de cada instância
// =====================================================

class UazapiInstanceService {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.token = token
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'token': this.token
    }
  }

  // =====================================================
  // GERENCIAMENTO DE CONEXÃO
  // =====================================================

  /**
   * Verificar status da instância
   * GET /instance/status
   */
  async getStatus(): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/status`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Conectar instância (gera QR Code ou código de pareamento)
   * POST /instance/connect
   */
  async connect(payload?: ConnectPayload): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connect`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload || {})
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Desconectar instância
   * POST /instance/disconnect
   */
  async disconnect(): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/disconnect`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Deletar instância
   * DELETE /instance
   */
  async delete(): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao deletar instância:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Atualizar nome da instância
   * POST /instance/updateInstanceName
   */
  async updateName(name: string): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/updateInstanceName`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao atualizar nome:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Atualizar presença (online/offline)
   * POST /instance/presence
   */
  async setPresence(presence: 'available' | 'unavailable'): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/presence`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ presence })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // =====================================================
  // PRIVACIDADE
  // =====================================================

  /**
   * Buscar configurações de privacidade
   * GET /instance/privacy
   */
  async getPrivacy(): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/privacy`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao buscar privacidade:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Alterar configurações de privacidade
   * POST /instance/privacy
   */
  async setPrivacy(settings: Record<string, string>): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/privacy`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(settings)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao alterar privacidade:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // =====================================================
  // PERFIL
  // =====================================================

  /**
   * Alterar nome do perfil do WhatsApp
   * POST /profile/name
   */
  async setProfileName(name: string): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/name`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ name })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao alterar nome do perfil:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Alterar imagem do perfil
   * POST /profile/image
   */
  async setProfileImage(image: string): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/profile/image`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ image })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao alterar imagem do perfil:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // =====================================================
  // WEBHOOK DA INSTÂNCIA
  // =====================================================

  /**
   * Ver webhook da instância
   * GET /webhook
   */
  async getWebhook(): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao obter webhook:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Configurar webhook da instância
   * POST /webhook
   */
  async setWebhook(config: WebhookConfig): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // =====================================================
  // ENVIO DE MENSAGENS
  // =====================================================

  /**
   * Formatar número de telefone
   */
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned
    }
    return cleaned
  }

  /**
   * Enviar mensagem de texto
   * POST /send/text
   */
  async sendText(payload: SendTextPayload): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send/text`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...payload,
          number: this.formatPhoneNumber(payload.number)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao enviar texto:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Enviar mídia (imagem, vídeo, áudio, documento)
   * POST /send/media
   */
  async sendMedia(payload: SendMediaPayload): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send/media`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...payload,
          number: this.formatPhoneNumber(payload.number)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao enviar mídia:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Enviar cartão de contato
   * POST /send/contact
   */
  async sendContact(payload: SendContactPayload): Promise<UazapiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send/contact`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...payload,
          number: this.formatPhoneNumber(payload.number)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao enviar contato:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  // =====================================================
  // VERIFICAÇÃO DE NÚMEROS
  // =====================================================

  /**
   * Verificar se números possuem WhatsApp
   * POST /chat/check
   */
  async checkNumbers(numbers: string[]): Promise<UazapiResponse> {
    try {
      // Formatar números antes de enviar
      const formattedNumbers = numbers.map(num => this.formatPhoneNumber(num))

      const response = await fetch(`${this.baseUrl}/chat/check`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ numbers: formattedNumbers })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || `Erro HTTP ${response.status}`)
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao verificar números:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Verificar um único número
   */
  async checkNumber(number: string): Promise<{ isInWhatsapp: boolean; verifiedName?: string }> {
    const result = await this.checkNumbers([number])
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      return {
        isInWhatsapp: result.data[0].isInWhatsapp || false,
        verifiedName: result.data[0].verifiedName
      }
    }
    return { isInWhatsapp: false }
  }

  // =====================================================
  // MÉTODOS DE CONVENIÊNCIA
  // =====================================================

  /**
   * Enviar imagem com caption
   */
  async sendImage(number: string, fileUrl: string, caption?: string): Promise<UazapiResponse> {
    return this.sendMedia({
      number,
      type: 'image',
      file: fileUrl,
      text: caption
    })
  }

  /**
   * Enviar documento
   */
  async sendDocument(number: string, fileUrl: string, fileName: string, caption?: string): Promise<UazapiResponse> {
    return this.sendMedia({
      number,
      type: 'document',
      file: fileUrl,
      docName: fileName,
      text: caption
    })
  }

  /**
   * Enviar áudio
   */
  async sendAudio(number: string, fileUrl: string): Promise<UazapiResponse> {
    return this.sendMedia({
      number,
      type: 'audio',
      file: fileUrl
    })
  }

  /**
   * Enviar vídeo
   */
  async sendVideo(number: string, fileUrl: string, caption?: string): Promise<UazapiResponse> {
    return this.sendMedia({
      number,
      type: 'video',
      file: fileUrl,
      text: caption
    })
  }

  /**
   * Enviar mensagem de voz (PTT)
   */
  async sendVoice(number: string, fileUrl: string): Promise<UazapiResponse> {
    return this.sendMedia({
      number,
      type: 'ptt',
      file: fileUrl
    })
  }

  /**
   * Enviar sticker
   */
  async sendSticker(number: string, fileUrl: string): Promise<UazapiResponse> {
    return this.sendMedia({
      number,
      type: 'sticker',
      file: fileUrl
    })
  }
}

// =====================================================
// FACTORY FUNCTIONS
// =====================================================

/**
 * Criar cliente admin UAZAPI
 */
export function createUazapiAdmin(baseUrl?: string, adminToken?: string): UazapiAdminService {
  return new UazapiAdminService(
    baseUrl || DEFAULT_UAZAPI_CONFIG.baseUrl,
    adminToken || DEFAULT_UAZAPI_CONFIG.adminToken
  )
}

/**
 * Criar cliente de instância UAZAPI
 */
export function createUazapiInstance(token: string, baseUrl?: string): UazapiInstanceService {
  return new UazapiInstanceService(
    baseUrl || DEFAULT_UAZAPI_CONFIG.baseUrl,
    token
  )
}

/**
 * Criar cliente UAZAPI a partir de dados do banco
 * Mantém compatibilidade com a estrutura existente (baseurl, apikey/token, instancia)
 */
export function createUazapiClientFromDb(dbConfig: {
  baseurl: string
  apikey: string  // Este é o token da instância
  instancia: string
}): UazapiInstanceService {
  return new UazapiInstanceService(
    dbConfig.baseurl || DEFAULT_UAZAPI_CONFIG.baseUrl,
    dbConfig.apikey
  )
}

// Export das classes
export { UazapiAdminService, UazapiInstanceService }
