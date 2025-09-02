// Evolution API v2 Integration Service
const EVOLUTION_API_BASE_URL = 'https://wsapi.dnmarketing.com.br'
const EVOLUTION_API_KEY = '767cfac9-68c6-4d67-aff1-21d6c482c715'
const WEBHOOK_URL = 'https://webhooks.dnmarketing.com.br/webhook/c05a8122-fb58-4a3a-a2c1-73f492b95f11'

// Configuração padrão da Evolution API
export const DEFAULT_EVOLUTION_CONFIG = {
  baseUrl: EVOLUTION_API_BASE_URL,
  masterKey: EVOLUTION_API_KEY,
  webhookUrl: WEBHOOK_URL
}

export interface CreateInstancePayload {
  instanceName: string
  token: string
  nome?: string
  telefone?: string
}

export interface EvolutionResponse {
  success: boolean
  data?: any
  error?: string
}

export interface InstanceStatus {
  state: 'open' | 'close' | 'connecting' | 'disconnected'
  qr?: string
}

class EvolutionAPIService {
  private headers = {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY
  }

  async createInstance(payload: CreateInstancePayload): Promise<EvolutionResponse> {
    try {
      const requestBody = {
        instanceName: payload.instanceName,
        integration: 'WHATSAPP-BAILEYS',
        token: payload.token,
        qrcode: true,
        groupsIgnore: true,
        alwaysOnline: false,
        readMessages: true,
        proxyHost: 'p.webshare.io',
        webhook: {
          url: WEBHOOK_URL,
          events: ['MESSAGES_UPSERT']
        },
        proxyPort: '80',
        proxyProtocol: 'http',
        proxyUsername: 'dpaulflz-rotate',
        proxyPassword: 'mq45cez0q5vx'
      }

      console.log('Evolution API Request:', {
        url: `${EVOLUTION_API_BASE_URL}/instance/create`,
        headers: this.headers,
        body: requestBody
      })

      const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/create`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestBody)
      })

      console.log('Evolution API Response Status:', response.status)
      console.log('Evolution API Response Headers:', Object.fromEntries(response.headers.entries()))

      let result
      try {
        result = await response.json()
        console.log('Evolution API Response Body:', result)
      } catch (jsonError) {
        const textResult = await response.text()
        console.log('Evolution API Response Text:', textResult)
        throw new Error(`Resposta inválida da API: ${textResult}`)
      }
      
      // Evolution API às vezes retorna success mesmo com erro
      // Vamos considerar sucesso se status for 200-299 OU se result tem dados positivos
      if (response.ok || (result && (result.instanceName || result.instance))) {
        return {
          success: true,
          data: result
        }
      } else {
        throw new Error(result?.message || result?.error || `Erro HTTP ${response.status}`)
      }

    } catch (error) {
      console.error('Erro completo ao criar instância:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  async connectInstance(instanceName: string): Promise<EvolutionResponse> {
    try {
      const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao conectar instância')
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao conectar instância:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  async getConnectionState(instanceName: string): Promise<EvolutionResponse> {
    try {
      const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao verificar status da instância')
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

  async restartInstance(instanceName: string): Promise<EvolutionResponse> {
    try {
      const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao reiniciar instância')
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  async logoutInstance(instanceName: string): Promise<EvolutionResponse> {
    try {
      const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao desconectar instância')
      }

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Erro ao desconectar instância:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  async deleteInstance(instanceName: string): Promise<EvolutionResponse> {
    try {
      const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao deletar instância')
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
}

// Export singleton instance
export const evolutionAPI = new EvolutionAPIService()

// Função para criar cliente Evolution (para compatibilidade)
export function createEvolutionClient(config?: { baseUrl?: string; masterKey?: string }) {
  return new EvolutionAPIService()
}