// Funções para integração com a API oficial do WhatsApp
export interface WhatsAppOfficialTemplate {
  name: string
  language: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  category: string
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    format?: string
    text?: string
    example?: {
      header_handle?: string[]
      header_text?: string
    }
    parameters?: Array<{
      type: string
      name?: string
    }>
    buttons?: Array<{
      type: string
      text: string
      url?: string
      phone_number?: string
    }>
  }>
}

export interface FetchTemplatesResponse {
  data: WhatsAppOfficialTemplate[]
  paging?: {
    cursors?: {
      before?: string
      after?: string
    }
    next?: string
  }
}

export class WhatsAppOfficialAPI {
  private accessToken: string
  private wabaId: string

  constructor(accessToken: string, wabaId: string) {
    this.accessToken = accessToken
    this.wabaId = wabaId
  }

  /**
   * Busca templates aprovados da API oficial do WhatsApp
   */
  async getTemplates(): Promise<WhatsAppOfficialTemplate[]> {
    try {
      const url = `https://graph.facebook.com/v17.0/${this.wabaId}/message_templates`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: FetchTemplatesResponse = await response.json()

      // Filtrar apenas templates aprovados
      return result.data.filter(template => template.status === 'APPROVED')
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      throw error
    }
  }

  /**
   * Envia mensagem template via API oficial
   */
  async sendTemplateMessage(
    phoneNumberId: string,
    to: string,
    templateName: string,
    languageCode: string,
    components?: Array<{
      type: string
      parameters?: Array<{
        type: string
        text?: string
      }>
    }>
  ) {
    try {
      const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`

      const payload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          ...(components && { components })
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API Error: ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao enviar mensagem template:', error)
      throw error
    }
  }

  /**
   * Valida se os tokens e IDs estão configurados corretamente
   */
  async validateConfig(): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v17.0/${this.wabaId}?fields=id,name`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao validar configuração:', error)
      return false
    }
  }
}

/**
 * Função utilitária para formatar número de telefone para API oficial
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')

  // Se começar com 55 (Brasil), mantém
  if (cleanPhone.startsWith('55')) {
    return cleanPhone
  }

  // Se não, adiciona código do Brasil
  return `55${cleanPhone}`
}

/**
 * Função para extrair variáveis de um template
 */
export function extractTemplateVariables(components: any[]): string[] {
  const variables: string[] = []

  components.forEach(component => {
    if (component.type === 'BODY' && component.parameters) {
      component.parameters.forEach((param: any, index: number) => {
        if (param.type === 'TEXT') {
          variables.push(`variavel${index + 1}`)
        }
      })
    }
  })

  return variables
}