# Guia de Implementação - API Oficial WhatsApp

Este documento fornece instruções detalhadas para implementar funcionalidades com a API Oficial do WhatsApp baseado na implementação existente do sistema DNX Recuperação Crédito.

## 📋 Índice

1. [Configuração Base da API](#configuração-base-da-api)
2. [Disparo Simples](#disparo-simples)
3. [Disparo com IA](#disparo-com-ia)
4. [Enriquecimento de Dados](#enriquecimento-de-dados)
5. [Estrutura de Templates](#estrutura-de-templates)
6. [Webhooks e Integrações](#webhooks-e-integrações)
7. [Tratamento de Erros](#tratamento-de-erros)

## 🔧 Configuração Base da API

### 1. Classe Principal WhatsAppOfficialAPI

Crie a classe base para interagir com a API oficial do WhatsApp:

```typescript
// lib/whatsapp-official-api.ts
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

      const result = await response.json()
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
}
```

### 2. Configuração de Instâncias

Configure as instâncias do WhatsApp com suporte à API oficial:

```typescript
interface WhatsAppInstance {
  id: number
  instancia: string
  is_official_api?: boolean
  waba_id?: string
  apikey?: string
}
```

### 3. Funções Utilitárias

```typescript
/**
 * Formatar número para API oficial
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')

  if (cleanPhone.startsWith('55')) {
    return cleanPhone
  }

  return `55${cleanPhone}`
}

/**
 * Extrair variáveis de template
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
```

## 📱 Disparo Simples

### 1. Interface do Usuário

Implemente abas para Evolution API e API Oficial:

```tsx
// Abas de seleção
<div className="border-b border-gray-200 mb-6">
  <nav className="-mb-px flex space-x-8">
    {instances.some(i => !i.is_official_api) && (
      <button
        onClick={() => handleTabChange('evolution')}
        className={`py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === 'evolution'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <MessageCircle className="h-4 w-4 inline mr-2" />
        Evolution API
      </button>
    )}
    {instances.some(i => i.is_official_api) && (
      <button
        onClick={() => handleTabChange('official')}
        className={`py-2 px-1 border-b-2 font-medium text-sm ${
          activeTab === 'official'
            ? 'border-green-500 text-green-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Smartphone className="h-4 w-4 inline mr-2" />
        API Oficial WhatsApp
      </button>
    )}
  </nav>
</div>
```

### 2. Seleção de Templates

Para API oficial, implemente seleção de templates aprovados:

```tsx
{activeTab === 'official' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      <Smartphone className="inline h-4 w-4 mr-1" />
      Template Aprovado
    </label>
    <select
      value={selectedTemplate}
      onChange={(e) => handleTemplateChange(e.target.value)}
      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      disabled={sending || loadingTemplates}
      required
    >
      <option value="">
        {loadingTemplates ? 'Carregando templates...' : 'Selecione um template'}
      </option>
      {availableTemplates.map((template) => (
        <option key={template.name} value={template.name}>
          {template.name} ({template.language})
        </option>
      ))}
    </select>
  </div>
)}
```

### 3. Preview do Template

Mostre preview da mensagem que será enviada:

```tsx
{activeTab === 'official' && selectedTemplate && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
    <h4 className="text-sm font-medium text-blue-800 mb-3">
      Preview da Mensagem que será Enviada
    </h4>
    {(() => {
      const template = availableTemplates.find(t => t.name === selectedTemplate)
      if (!template) return null

      return (
        <div className="bg-white rounded-lg p-3 border border-blue-300">
          {template.components.map((component, index) => {
            if (component.type === 'HEADER') {
              if (component.format === 'IMAGE' && component.example?.header_handle?.[0]) {
                return (
                  <div key={index} className="mb-2">
                    <img
                      src={component.example.header_handle[0]}
                      alt="Template Header"
                      className="w-full max-h-48 object-contain rounded border bg-gray-50"
                    />
                  </div>
                )
              } else if (component.text) {
                return (
                  <div key={index} className="font-bold text-gray-800 mb-2">
                    {component.text}
                  </div>
                )
              }
            }
            if (component.type === 'BODY' && component.text) {
              let bodyText = component.text
              templateVariables.forEach((variable, varIndex) => {
                bodyText = bodyText.replace(`{{${varIndex + 1}}}`, `{${variable}}`)
              })
              return (
                <div key={index} className="text-gray-700 mb-2 whitespace-pre-wrap">
                  {bodyText}
                </div>
              )
            }
            return null
          })}
        </div>
      )
    })()}
  </div>
)}
```

### 4. Processamento do Envio

```tsx
const executeCampaign = async () => {
  // Validações específicas por tipo de API
  if (activeTab === 'official') {
    if (!nomeCampanha.trim() || !selectedTemplate || !selectedInstance || csvContacts.length === 0) {
      alert('Preencha todos os campos, selecione um template e faça upload do CSV')
      return
    }
  } else {
    if (!nomeCampanha.trim() || !mensagem.trim() || !selectedInstance || csvContacts.length === 0) {
      alert('Preencha todos os campos, selecione uma instância WhatsApp e faça upload do CSV')
      return
    }
  }

  const formData = new FormData()
  formData.append('planilha', csvFile!)
  formData.append('campanha', nomeCampanha)
  formData.append('usuario_id', user?.id?.toString() || '')
  formData.append('instancia', selectedInstance)
  formData.append('total_contatos', csvContacts.length.toString())

  if (activeTab === 'official') {
    // API Oficial do WhatsApp
    formData.append('tipo_api', 'oficial')
    formData.append('template_name', selectedTemplate)
    formData.append('campo_disparo', 'oficial')

    const instance = instances.find(i => i.instancia === selectedInstance)
    if (instance) {
      formData.append('waba_id', instance.waba_id || '')
      formData.append('access_token', instance.apikey || '')
    }
  } else {
    // Evolution API
    formData.append('tipo_api', 'evolution')
    formData.append('mensagem', mensagem)
    formData.append('campo_disparo', 'simples')
  }

  const webhookUrl = 'https://webhooks.dnmarketing.com.br/webhook/01f9f188-2117-49ed-a95d-1466fee6a5f9'
  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })
}
```

## 🤖 Disparo com IA

### 1. Configuração com Agentes IA

Para disparo com IA, adicione suporte a agentes:

```tsx
// Seleção de agente IA
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <Bot className="inline h-4 w-4 mr-1" />
    Agente IA (Opcional)
  </label>
  <select
    value={agenteSelected}
    onChange={(e) => setAgenteSelected(e.target.value)}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
    disabled={isDisabled}
  >
    <option value="">Sem agente específico</option>
    {agentes.map((agente) => (
      <option key={agente.id} value={agente.agente_id}>
        {agente.nome} - {agente.funcao}
      </option>
    ))}
  </select>
</div>

// Campo de contexto IA
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Contexto para IA
  </label>
  <textarea
    value={contextoIA}
    onChange={(e) => setContextoIA(e.target.value)}
    rows={3}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    placeholder="Ex: Você é um vendedor carismático promovendo serviços de limpeza de nome..."
    disabled={isDisabled}
  />
  <p className="text-sm text-purple-600 mt-1">
    🤖 A IA usará este contexto para personalizar cada mensagem de forma única
  </p>
</div>
```

### 2. Envio com IA

```tsx
const executeCampaign = async () => {
  const formData = new FormData()
  formData.append('planilha', csvFile)
  formData.append('campanha', nomeCampanha)
  formData.append('contexto_ia', contextoIA)
  formData.append('usuario_id', user?.id?.toString() || '')
  formData.append('total_contatos', csvContacts.length.toString())
  formData.append('instancia', selectedInstance)
  formData.append('campo_disparo', 'ia')

  if (activeTab === 'official') {
    // API Oficial do WhatsApp
    formData.append('tipo_api', 'oficial')
    formData.append('template_name', selectedTemplate)

    const instance = instances.find(i => i.instancia === selectedInstance)
    if (instance) {
      formData.append('waba_id', instance.waba_id || '')
      formData.append('access_token', instance.apikey || '')
    }
  } else {
    // Evolution API
    formData.append('tipo_api', 'evolution')
    formData.append('mensagem', mensagem)
    formData.append('agente_id', agenteSelected || '')
  }

  // Webhook específico para IA
  const webhookUrl = activeTab === 'official'
    ? 'https://webhooks.dnmarketing.com.br/webhook/01f9f188-2117-49ed-a95d-1466fee6a5f9'
    : 'https://webhooks.dnmarketing.com.br/webhook/2b00d2ba-f923-44be-9dc1-b725566e9dr1'

  const response = await fetch(webhookUrl, {
    method: 'POST',
    body: formData
  })
}
```

## 📊 Enriquecimento de Dados

### 1. Configuração da API de Enriquecimento

```tsx
const buscarDadosEmpresa = async (cnpj: string) => {
  try {
    const response = await fetch('/api/datecode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cnpj: cnpj,
        userId: user?.id
      })
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Erro ao buscar dados da empresa ${cnpj}:`, error)
    return null
  }
}
```

### 2. Processamento de Dados

```tsx
const iniciarEnriquecimento = async () => {
  setEnriquecendo(true)
  setEtapaAtual('enriquecendo')

  const empresasEnriquecidas: EmpresaEnriquecida[] = []

  for (let i = 0; i < cnpjs.length; i++) {
    const cnpj = cnpjs[i]
    setStatusEnriquecimento(`Consultando empresa ${i + 1}/${cnpjs.length}: ${cnpj}`)

    try {
      const dadosEmpresa = await buscarDadosEmpresa(cnpj)
      const dadosEmpresaItem = Array.isArray(dadosEmpresa) ? dadosEmpresa[0] : dadosEmpresa

      if (dadosEmpresaItem && (dadosEmpresaItem.empresa || dadosEmpresaItem.razaoSocial)) {
        const empresaInfo = dadosEmpresaItem.empresa || dadosEmpresaItem

        const empresa: EmpresaEnriquecida = {
          cnpj: empresaInfo.cnpj || cnpj,
          razaoSocial: empresaInfo.razaoSocial || 'Empresa não identificada',
          nomeFantasia: empresaInfo.nomeFantasia || null,
          telefones: dadosEmpresaItem.telefones || [],
          emails: dadosEmpresaItem.emails || [],
          socios: [],
          totalContatos: 0
        }

        // Processar sócios...
        const sociosData = dadosEmpresaItem.receitaFederal?.socios || dadosEmpresaItem.socios || []

        for (const socio of sociosData) {
          const cpfSocio = socio.cpfCnpj || socio.cpf
          if (cpfSocio && cpfSocio.toString().replace(/\D/g, '').length === 11) {
            const dadosSocio = await buscarDadosSocio(cpfSocio)
            // Processar dados do sócio...
          }
        }

        empresa.totalContatos = empresa.telefones.length +
                               empresa.socios.reduce((total, socio) => total + socio.telefones.length, 0)

        empresasEnriquecidas.push(empresa)
        await cadastrarContatos(empresa)
      }
    } catch (error) {
      console.error(`Erro ao processar CNPJ ${cnpj}:`, error)
    }

    setProgressoEnriquecimento(((i + 1) / cnpjs.length) * 100)
  }

  setEmpresasEnriquecidas(empresasEnriquecidas)
  setEnriquecendo(false)
  setEtapaAtual('resultados')
}
```

### 3. Cadastro de Contatos

```tsx
const upsertContato = async (contato: any, tipo: string) => {
  const userId = parseInt(user?.id || '0')

  const { data: existingLead, error: searchError } = await supabase
    .from('leads')
    .select('id')
    .eq('user_id', userId)
    .eq('telefone', contato.telefone)
    .maybeSingle()

  if (existingLead) {
    // Atualizar lead existente
    const { error } = await supabase
      .from('leads')
      .update(contato)
      .eq('id', existingLead.id)
  } else {
    // Inserir novo lead
    const { error } = await supabase.from('leads').insert(contato)
  }
}
```

## 📋 Estrutura de Templates

### 1. Validação de Templates

```tsx
const handleTemplateChange = (templateName: string) => {
  setSelectedTemplate(templateName)

  const template = availableTemplates.find(t => t.name === templateName)
  if (template) {
    // Extrair variáveis do template
    const variables: string[] = []
    template.components.forEach(component => {
      if (component.type === 'BODY' && component.parameters) {
        component.parameters.forEach((_, index) => {
          variables.push(`variavel${index + 1}`)
        })
      }
    })
    setTemplateVariables(variables)
  }
}
```

### 2. Informações sobre CSV

```tsx
{activeTab === 'official' && selectedTemplate && templateVariables.length > 0 && (
  <div className="bg-green-50 border border-green-200 rounded-md p-4">
    <h4 className="text-sm font-medium text-green-800 mb-2">
      📋 Estrutura do CSV para este template:
    </h4>
    <p className="text-sm text-green-700">
      O arquivo CSV deve conter as colunas: <code className="bg-green-100 px-1 rounded">telefone</code>
      {templateVariables.map((variable, index) => (
        <span key={index}>, <code className="bg-green-100 px-1 rounded">{variable}</code></span>
      ))}
    </p>
    <p className="text-xs text-green-600 mt-1">
      Exemplo: nome,telefone,variavel1,variavel2 (na primeira linha)
    </p>
  </div>
)}
```

## 🔗 Webhooks e Integrações

### 1. URLs de Webhook por Funcionalidade

```typescript
const webhookUrls = {
  disparo_simples: 'https://webhooks.dnmarketing.com.br/webhook/01f9f188-2117-49ed-a95d-1466fee6a5f9',
  disparo_ia_evolution: 'https://webhooks.dnmarketing.com.br/webhook/2b00d2ba-f923-44be-9dc1-b725566e9dr1',
  disparo_ia_oficial: 'https://webhooks.dnmarketing.com.br/webhook/01f9f188-2117-49ed-a95d-1466fee6a5f9',
  enriquecimento: 'https://webhooks.dnmarketing.com.br/webhook/49c846c0-3853-4dc9-85db-0824cd1d7c6e'
}
```

### 2. Payload para Diferentes Tipos

```typescript
// Para API Oficial
const officialApiPayload = {
  tipo_api: 'oficial',
  template_name: selectedTemplate,
  waba_id: instance.waba_id,
  access_token: instance.apikey,
  campo_disparo: 'oficial' // ou 'ia'
}

// Para Evolution API
const evolutionApiPayload = {
  tipo_api: 'evolution',
  mensagem: mensagem,
  campo_disparo: 'simples', // ou 'ia'
  agente_id: agenteSelected
}
```

## ⚠️ Tratamento de Erros

### 1. Validação de API

```typescript
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
```

### 2. Estados de Loading

```tsx
// Loading de templates
{loadingTemplates && (
  <div className="mt-2 flex items-center text-sm text-gray-500">
    <div className="animate-spin h-4 w-4 border-b-2 border-green-500 rounded-full mr-2"></div>
    Buscando templates aprovados...
  </div>
)}

// Progresso de envio
{sending && (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-700">Enviando mensagens...</span>
      <span className="text-sm text-gray-700">{sendingProgress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${sendingProgress}%` }}
      ></div>
    </div>
  </div>
)}
```

## 🎯 Considerações Importantes

1. **Autenticação**: Sempre validar tokens antes de fazer chamadas
2. **Rate Limiting**: Implementar delays entre chamadas para evitar bloqueios
3. **Templates**: Só usar templates aprovados pelo WhatsApp
4. **Formatação**: Números devem estar no formato internacional (55...)
5. **Fallback**: Sempre ter fallback para Evolution API em caso de erro
6. **Logs**: Implementar logging detalhado para debug
7. **Validação**: Validar dados antes de enviar para webhooks

## 📱 Exemplo de Uso Completo

```typescript
// 1. Inicializar API
const api = new WhatsAppOfficialAPI(accessToken, wabaId)

// 2. Buscar templates
const templates = await api.getTemplates()

// 3. Validar configuração
const isValid = await api.validateConfig()

// 4. Enviar mensagem
if (isValid && templates.length > 0) {
  await api.sendTemplateMessage(
    phoneNumberId,
    formatPhoneForWhatsApp(phone),
    templateName,
    'pt_BR',
    [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: 'João' },
          { type: 'text', text: 'Empresa XYZ' }
        ]
      }
    ]
  )
}
```

Este guia fornece uma base sólida para implementar as funcionalidades da API Oficial do WhatsApp em qualquer aplicação, seguindo as melhores práticas e padrões estabelecidos.