'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import { useWorkspaceContext } from '../../contexts/WorkspaceContext'
import { supabase, WhatsAppTemplate } from '../../lib/supabase'
import { WhatsAppOfficialAPI, WhatsAppOfficialTemplate } from '../../lib/whatsapp-official-api'
import { Upload, Send, FileText, Users, Calendar, CheckCircle, AlertTriangle, Bot, MessageCircle, Image, X, Smartphone, Phone, Loader2 } from 'lucide-react'

interface CsvContact {
  telefone: string
  nome: string
  hasWhatsApp?: boolean
  verifiedName?: string
  checked?: boolean
}

interface Campaign {
  nome_campanha: string
  contatos_count: number
  data_criacao: string
  origem: string
}

interface WhatsAppInstance {
  id: number
  instancia: string
  is_official_api?: boolean
  waba_id?: string
  apikey?: string
}

export default function DisparoSimplesPage() {
  const { user } = useAuth()
  const { workspaceId } = useWorkspaceContext()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [loading, setLoading] = useState(true)
  
  // Formulário
  const [nomeCampanha, setNomeCampanha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [selectedInstance, setSelectedInstance] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvContacts, setCsvContacts] = useState<CsvContact[]>([])
  const [sending, setSending] = useState(false)
  const [sendingProgress, setSendingProgress] = useState(0)
  
  // Estados para imagens
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Estados para API oficial do WhatsApp
  const [activeTab, setActiveTab] = useState<'evolution' | 'official'>('evolution')
  const [availableTemplates, setAvailableTemplates] = useState<WhatsAppOfficialTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templateVariables, setTemplateVariables] = useState<string[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Estados para verificação de WhatsApp
  const [checkingWhatsApp, setCheckingWhatsApp] = useState(false)
  const [checkProgress, setCheckProgress] = useState(0)
  const [whatsAppStats, setWhatsAppStats] = useState({ total: 0, valid: 0, invalid: 0 })

  useEffect(() => {
    if (user && workspaceId) {
      fetchCampaigns()
      fetchInstances()
    }
  }, [user, workspaceId])

  // Definir aba padrão baseada nas instâncias disponíveis
  useEffect(() => {
    if (instances.length > 0) {
      const hasEvolution = instances.some(i => !i.is_official_api)
      const hasOfficial = instances.some(i => i.is_official_api)

      // Se só tem oficial, definir como oficial
      if (hasOfficial && !hasEvolution) {
        setActiveTab('official')
      }
      // Se só tem evolution, definir como evolution
      else if (hasEvolution && !hasOfficial) {
        setActiveTab('evolution')
      }
      // Se não tem instância selecionada, limpar
      if (selectedInstance) {
        const selectedInstanceData = instances.find(i => i.instancia === selectedInstance)
        if (selectedInstanceData) {
          const correctTab = selectedInstanceData.is_official_api ? 'official' : 'evolution'
          if (activeTab !== correctTab) {
            setActiveTab(correctTab)
          }
        }
      }
    }
  }, [instances, selectedInstance])

  const fetchCampaigns = async () => {
    if (!user || !workspaceId) return

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('nome_campanha, created_at, origem')
        .eq('workspace_id', workspaceId)
        .not('nome_campanha', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Agrupar por nome_campanha e contar contatos
      const campaignMap = new Map()
      data?.forEach(lead => {
        const key = lead.nome_campanha
        if (campaignMap.has(key)) {
          campaignMap.set(key, {
            ...campaignMap.get(key),
            contatos_count: campaignMap.get(key).contatos_count + 1
          })
        } else {
          campaignMap.set(key, {
            nome_campanha: lead.nome_campanha,
            contatos_count: 1,
            data_criacao: lead.created_at,
            origem: lead.origem || 'Disparo Simples'
          })
        }
      })

      setCampaigns(Array.from(campaignMap.values()))
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInstances = async () => {
    if (!user || !workspaceId) return

    try {
      const { data, error } = await supabase
        .from('instancia_whtats')
        .select('id, instancia, is_official_api, waba_id, apikey')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setInstances(data || [])
      // Selecionar automaticamente a primeira instância se houver apenas uma
      if (data && data.length === 1) {
        setSelectedInstance(data[0].instancia)
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    // Resetar estatísticas de WhatsApp
    setWhatsAppStats({ total: 0, valid: 0, invalid: 0 })
    setCheckProgress(0)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())

      // Assumindo CSV com cabeçalho: nome,telefone
      const contacts: CsvContact[] = []
      for (let i = 1; i < lines.length; i++) {
        const [nome, telefone] = lines[i].split(',').map(item => item.trim().replace(/"/g, ''))
        if (telefone && nome) {
          contacts.push({ telefone, nome, checked: false })
        }
      }

      setCsvContacts(contacts)
    }
    reader.readAsText(file)
  }

  // Verificar se números possuem WhatsApp
  const checkWhatsAppNumbers = async () => {
    if (!selectedInstance || csvContacts.length === 0) {
      alert('Selecione uma instância WhatsApp e carregue um arquivo CSV primeiro')
      return
    }

    // Encontrar a instância selecionada
    const instance = instances.find(i => i.instancia === selectedInstance)
    if (!instance) {
      alert('Instância não encontrada')
      return
    }

    // API oficial não suporta verificação de números
    if (instance.is_official_api) {
      alert('A API oficial do WhatsApp não suporta verificação de números. Os contatos serão enviados sem verificação prévia.')
      return
    }

    setCheckingWhatsApp(true)
    setCheckProgress(0)

    try {
      const batchSize = 50 // Verificar 50 números por vez
      const totalBatches = Math.ceil(csvContacts.length / batchSize)
      let validCount = 0
      let invalidCount = 0
      const updatedContacts = [...csvContacts]

      for (let batch = 0; batch < totalBatches; batch++) {
        const start = batch * batchSize
        const end = Math.min(start + batchSize, csvContacts.length)
        const batchNumbers = csvContacts.slice(start, end).map(c => c.telefone)

        // Chamar API de verificação
        const response = await fetch('/api/whatsapp/check-numbers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: instance.id,
            numbers: batchNumbers
          })
        })

        const result = await response.json()

        if (result.success && Array.isArray(result.data)) {
          // Atualizar contatos com resultado da verificação
          result.data.forEach((check: { number: string; isInWhatsapp: boolean; verifiedName?: string }) => {
            const contactIndex = updatedContacts.findIndex(c =>
              c.telefone.replace(/\D/g, '').includes(check.number.replace(/\D/g, '').slice(-8)) ||
              check.number.replace(/\D/g, '').includes(c.telefone.replace(/\D/g, '').slice(-8))
            )
            if (contactIndex !== -1) {
              updatedContacts[contactIndex] = {
                ...updatedContacts[contactIndex],
                hasWhatsApp: check.isInWhatsapp,
                verifiedName: check.verifiedName,
                checked: true
              }
              if (check.isInWhatsapp) {
                validCount++
              } else {
                invalidCount++
              }
            }
          })
        }

        // Atualizar progresso
        const progress = Math.round(((batch + 1) / totalBatches) * 100)
        setCheckProgress(progress)
        setCsvContacts([...updatedContacts])

        // Pequeno delay entre lotes para não sobrecarregar a API
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      setWhatsAppStats({
        total: csvContacts.length,
        valid: validCount,
        invalid: invalidCount
      })

    } catch (error) {
      console.error('Erro ao verificar números:', error)
      alert('Erro ao verificar números de WhatsApp')
    } finally {
      setCheckingWhatsApp(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, etc.)')
      return
    }

    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB')
      return
    }

    setSelectedImage(file)

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const fetchTemplates = async (instanceId: number) => {
    const instance = instances.find(i => i.id === instanceId)
    if (!instance || !instance.is_official_api || !instance.waba_id || !instance.apikey) {
      return
    }

    setLoadingTemplates(true)
    try {
      const api = new WhatsAppOfficialAPI(instance.apikey, instance.waba_id)
      const templates = await api.getTemplates()
      setAvailableTemplates(templates)
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      alert('Erro ao buscar templates da API oficial do WhatsApp')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleInstanceChange = (instanceId: string) => {
    setSelectedInstance(instanceId)

    // Limpar templates anteriores
    setAvailableTemplates([])
    setSelectedTemplate('')
    setTemplateVariables([])

    const instance = instances.find(i => i.instancia === instanceId)
    // Se a instância suporta API oficial e a aba oficial está ativa, buscar templates
    if (instance?.is_official_api && activeTab === 'official') {
      fetchTemplates(instance.id)
    }
  }

  const handleTabChange = (tab: 'evolution' | 'official') => {
    setActiveTab(tab)

    // Se mudou para aba oficial e tem instância selecionada, buscar templates
    if (tab === 'official' && selectedInstance) {
      const instance = instances.find(i => i.instancia === selectedInstance)
      if (instance?.is_official_api) {
        fetchTemplates(instance.id)
      }
    }

    // Limpar campos específicos da aba anterior
    if (tab === 'evolution') {
      setSelectedTemplate('')
      setTemplateVariables([])
      setAvailableTemplates([])
    } else {
      // Limpar campos da Evolution API se necessário
    }
  }

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

  const processMessage = (message: string, nome: string) => {
    return message.replace(/{nome}/g, nome)
  }

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

    setSending(true)
    setSendingProgress(0)

    try {
      // Inserir/Atualizar leads (verificar se existe para o mesmo usuário)
      for (const contato of csvContacts) {
        try {
          // Verificar se lead já existe para este workspace e telefone
          const { data: existingLead, error: searchError } = await supabase
            .from('leads')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('telefone', contato.telefone)
            .maybeSingle()

          if (searchError) {
            console.error('Erro ao buscar lead existente:', searchError)
            continue
          }

          const leadData: Record<string, unknown> = {
            workspace_id: workspaceId,
            nome_cliente: contato.nome,
            telefone: contato.telefone,
            numero_formatado: contato.telefone.replace(/\D/g, ''),
            origem: 'Disparo Simples',
            nome_campanha: nomeCampanha,
            status_limpa_nome: 'novo_lead',
            observacoes_limpa_nome: `Campanha: ${nomeCampanha}`,
            updated_at: new Date().toISOString()
          }

          // Adicionar informação de verificação de WhatsApp se disponível
          if (contato.checked !== undefined) {
            leadData.existe_whatsapp = contato.hasWhatsApp ?? null
          }

          if (existingLead) {
            // Atualizar lead existente
            const { error: updateError } = await supabase
              .from('leads')
              .update(leadData)
              .eq('id', existingLead.id)

            if (updateError) {
              console.error('Erro ao atualizar lead:', updateError)
            }
          } else {
            // Inserir novo lead
            const { error: insertError } = await supabase
              .from('leads')
              .insert([{ ...leadData, created_at: new Date().toISOString() }])

            if (insertError) {
              console.error('Erro ao inserir lead:', insertError)
            }
          }
        } catch (error) {
          console.error('Erro ao processar lead:', error)
          // Continuar com os outros contatos mesmo se um falhar
        }
      }

      // Enviar via webhook para n8n
      try {
        const formData = new FormData()
        formData.append('planilha', csvFile!)
        formData.append('campanha', nomeCampanha)
        formData.append('workspace_id', workspaceId || '')
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
            formData.append('access_token', instance.apikey || '') // apikey já é o token
          }

          // Adicionar imagem se selecionada
          if (selectedImage) {
            formData.append('image', selectedImage)
            formData.append('tipo_disparo', 'imagem')
          } else {
            formData.append('tipo_disparo', 'texto')
          }
        } else {
          // Evolution API
          formData.append('tipo_api', 'evolution')
          formData.append('mensagem', mensagem)
          formData.append('campo_disparo', 'simples')

          if (selectedImage) {
            formData.append('image', selectedImage)
            formData.append('tipo_disparo', 'imagem')
          } else {
            formData.append('tipo_disparo', 'texto')
          }
        }

        const webhookUrl = 'https://webhooks.dnmarketing.com.br/webhook/01f9f188-2117-49ed-a95d-1466fee6a5f9'
        const response = await fetch(webhookUrl, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          console.log('Campanha enviada com sucesso para o n8n')
        } else {
          throw new Error('Erro na resposta do webhook')
        }

        setSendingProgress(100)
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error('Erro ao enviar campanha:', error)
        throw error
      }

      alert('Campanha enviada com sucesso!')
      
      // Limpar formulário
      setNomeCampanha('')
      setMensagem('')
      setCsvFile(null)
      setCsvContacts([])
      setSelectedImage(null)
      setImagePreview(null)
      setSelectedTemplate('')
      setTemplateVariables([])
      setAvailableTemplates([])
      
      // Recarregar campanhas
      fetchCampaigns()

    } catch (error) {
      console.error('Erro ao executar campanha:', error)
      alert('Erro ao executar campanha')
    } finally {
      setSending(false)
      setSendingProgress(0)
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Disparo Simples</h1>
        <p className="mt-2 text-sm text-gray-700">
          Envie mensagens em massa para sua lista de contatos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Envio */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Nova Campanha</h3>

            {/* Abas de Tipos de API */}
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

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={nomeCampanha}
                  onChange={(e) => setNomeCampanha(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Promoção Black Friday"
                  disabled={sending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageCircle className="inline h-4 w-4 mr-1" />
                  Instância WhatsApp
                </label>
                <select
                  value={selectedInstance}
                  onChange={(e) => handleInstanceChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                  required
                >
                  <option value="">Selecione uma instância</option>
                  {instances
                    .filter(instance => activeTab === 'official' ? instance.is_official_api : !instance.is_official_api)
                    .map((instance) => (
                    <option key={instance.id} value={instance.instancia}>
                      {instance.instancia} {instance.is_official_api ? '(API Oficial)' : '(Evolution API)'}
                    </option>
                  ))}
                </select>
                {instances.filter(instance => activeTab === 'official' ? instance.is_official_api : !instance.is_official_api).length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    Nenhuma instância {activeTab === 'official' ? 'API Oficial' : 'Evolution API'} encontrada. Configure uma instância primeiro.
                  </p>
                )}
              </div>

              {/* Campo Mensagem - apenas para Evolution API */}
              {activeTab === 'evolution' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Olá {nome}, temos uma oferta especial para você!"
                    disabled={sending}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> para personalizar com o nome do contato
                  </p>
                </div>
              )}

              {/* Seleção de Template - apenas para API Oficial */}
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
                  {loadingTemplates && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <div className="animate-spin h-4 w-4 border-b-2 border-green-500 rounded-full mr-2"></div>
                      Buscando templates aprovados...
                    </div>
                  )}
                  <p className="text-sm text-green-600 mt-1">
                    📋 Apenas templates aprovados pelo WhatsApp podem ser usados
                  </p>
                </div>
              )}

              {/* Preview do Template - apenas para API Oficial */}
              {activeTab === 'official' && selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
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
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
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
                            // Substituir variáveis por exemplos
                            templateVariables.forEach((variable, varIndex) => {
                              bodyText = bodyText.replace(`{{${varIndex + 1}}}`, `{${variable}}`)
                            })
                            return (
                              <div key={index} className="text-gray-700 mb-2 whitespace-pre-wrap">
                                {bodyText}
                              </div>
                            )
                          }
                          if (component.type === 'FOOTER' && component.text) {
                            return (
                              <div key={index} className="text-xs text-gray-500 mt-2">
                                {component.text}
                              </div>
                            )
                          }
                          if (component.type === 'BUTTONS' && component.buttons) {
                            return (
                              <div key={index} className="mt-3 space-y-1">
                                {component.buttons.map((button, btnIndex) => (
                                  <div key={btnIndex} className="text-center">
                                    <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded text-sm">
                                      {button.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    )
                  })()}
                  <p className="text-xs text-blue-600 mt-2">
                    ℹ️ As variáveis {'{'}variavel1{'},'} {'{'}variavel2{'}'} etc. serão substituídas pelos dados do CSV
                  </p>
                </div>
              )}

              {/* Seção de Upload de Imagem - para API Oficial */}
              {activeTab === 'official' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Image className="inline h-4 w-4 mr-1" />
                    Imagem (Opcional)
                  </label>

                  {!imagePreview ? (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                      <div className="space-y-2 text-center">
                        <Image className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex justify-center text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                            <span>Selecionar imagem</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="sr-only"
                              disabled={sending}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="mt-1 border-2 border-gray-300 rounded-md p-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-40 mx-auto rounded-md object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        disabled={sending}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="mt-2 text-sm text-gray-600 text-center">
                        ✓ {selectedImage?.name} ({((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Seção de Upload de Imagem - apenas para Evolution API */}
              {activeTab === 'evolution' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="inline h-4 w-4 mr-1" />
                  Imagem (Opcional)
                </label>
                
                {!imagePreview ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-2 text-center">
                      <Image className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="flex justify-center text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Selecionar imagem</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                            disabled={sending}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="mt-1 border-2 border-gray-300 rounded-md p-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-40 mx-auto rounded-md object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      disabled={sending}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="mt-2 text-sm text-gray-600 text-center">
                      ✓ {selectedImage?.name} ({((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>
                )}
              </div>
              )}


              {/* Informações sobre variáveis do template - apenas para API Oficial */}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lista de Contatos (CSV)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex justify-center text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Fazer upload do arquivo</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="sr-only"
                          disabled={sending}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      {activeTab === 'official'
                        ? 'CSV com colunas: nome,telefone,variavel1,variavel2,etc'
                        : 'CSV com colunas: nome,telefone'}
                    </p>
                  </div>
                </div>
                
                {csvFile && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                      ✓ Arquivo carregado: {csvFile.name} ({csvContacts.length} contatos)
                    </p>
                  </div>
                )}
              </div>

              {/* Seção de Verificação de WhatsApp */}
              {csvContacts.length > 0 && activeTab === 'evolution' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-sm font-medium text-blue-800">Verificação de WhatsApp</h4>
                    </div>
                    <button
                      onClick={checkWhatsAppNumbers}
                      disabled={checkingWhatsApp || sending || !selectedInstance}
                      className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {checkingWhatsApp ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Verificando... {checkProgress}%
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Verificar Números
                        </>
                      )}
                    </button>
                  </div>

                  {checkingWhatsApp && (
                    <div className="mb-3">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${checkProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {whatsAppStats.total > 0 && (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-md p-2">
                        <p className="text-lg font-semibold text-gray-800">{whatsAppStats.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="bg-white rounded-md p-2">
                        <p className="text-lg font-semibold text-green-600">{whatsAppStats.valid}</p>
                        <p className="text-xs text-gray-500">Com WhatsApp</p>
                      </div>
                      <div className="bg-white rounded-md p-2">
                        <p className="text-lg font-semibold text-red-600">{whatsAppStats.invalid}</p>
                        <p className="text-xs text-gray-500">Sem WhatsApp</p>
                      </div>
                    </div>
                  )}

                  {whatsAppStats.total === 0 && !checkingWhatsApp && (
                    <p className="text-xs text-blue-600">
                      Clique em "Verificar Números" para validar quais contatos possuem WhatsApp antes de enviar a campanha.
                    </p>
                  )}
                </div>
              )}

              {csvContacts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Pré-visualização ({csvContacts.length} contatos)
                  </h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {csvContacts.slice(0, 5).map((contact, index) => (
                      <div key={index} className="text-sm text-gray-600 py-1 flex items-center justify-between">
                        <span>{contact.nome} - {contact.telefone}</span>
                        {contact.checked && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${contact.hasWhatsApp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {contact.hasWhatsApp ? '✓ WhatsApp' : '✗ Sem WhatsApp'}
                          </span>
                        )}
                      </div>
                    ))}
                    {csvContacts.length > 5 && (
                      <div className="text-sm text-gray-500 py-1">
                        ... e mais {csvContacts.length - 5} contatos
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              <button
                onClick={executeCampaign}
                disabled={
                  sending ||
                  !nomeCampanha.trim() ||
                  csvContacts.length === 0 ||
                  (activeTab === 'evolution' && !mensagem.trim()) ||
                  (activeTab === 'official' && !selectedTemplate)
                }
                className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium text-white ${
                  activeTab === 'official'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300'
                } disabled:cursor-not-allowed`}
              >
                {sending ? (
                  <>
                    <Send className="h-5 w-5 mr-2 animate-pulse" />
                    Enviando ({sendingProgress}%)
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Enviar Campanha
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Histórico de Campanhas */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campanhas Anteriores</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((campaign, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {campaign.nome_campanha}
                    </h4>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {campaign.contatos_count} contatos
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(campaign.data_criacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                        {campaign.origem}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma campanha encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}