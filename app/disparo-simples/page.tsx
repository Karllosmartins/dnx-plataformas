'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { supabase } from '../../lib/supabase'
import { Upload, Send, FileText, Users, Calendar, CheckCircle, AlertTriangle, Bot, MessageCircle, Image, X } from 'lucide-react'

interface CsvContact {
  telefone: string
  nome: string
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
}

export default function DisparoSimplesPage() {
  const { user } = useAuth()
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

  useEffect(() => {
    if (user) {
      fetchCampaigns()
      fetchInstances()
    }
  }, [user])

  const fetchCampaigns = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('nome_campanha, created_at, origem')
        .eq('user_id', user.id)
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
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('instancia_whtats')
        .select('id, instancia')
        .eq('user_id', parseInt(user.id || '0'))
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

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // Assumindo CSV com cabeçalho: nome,telefone
      const contacts: CsvContact[] = []
      for (let i = 1; i < lines.length; i++) {
        const [nome, telefone] = lines[i].split(',').map(item => item.trim().replace(/"/g, ''))
        if (telefone && nome) {
          contacts.push({ telefone, nome })
        }
      }
      
      setCsvContacts(contacts)
    }
    reader.readAsText(file)
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

  const processMessage = (message: string, nome: string) => {
    return message.replace(/{nome}/g, nome)
  }

  const executeCampaign = async () => {
    if (!nomeCampanha.trim() || !mensagem.trim() || !selectedInstance || csvContacts.length === 0) {
      alert('Preencha todos os campos, selecione uma instância WhatsApp e faça upload do CSV')
      return
    }

    setSending(true)
    setSendingProgress(0)

    try {
      // Inserir leads na tabela primeiro
      const leadsToInsert = csvContacts.map(contato => ({
        user_id: user?.id,
        nome_cliente: contato.nome,
        telefone: contato.telefone,
        numero_formatado: contato.telefone.replace(/\D/g, ''),
        origem: 'Disparo Simples',
        nome_campanha: nomeCampanha,
        status_limpa_nome: 'novo_lead',
        observacoes_limpa_nome: `Campanha: ${nomeCampanha}`,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('leads')
        .insert(leadsToInsert)

      if (insertError) throw insertError

      // Enviar mensagens
      for (let i = 0; i < csvContacts.length; i++) {
        const contato = csvContacts[i]
        const mensagemPersonalizada = processMessage(mensagem, contato.nome)
        
        try {
          // Se há imagem selecionada, enviar com FormData
          if (selectedImage) {
            const formData = new FormData()
            formData.append('telefone', contato.telefone)
            formData.append('nome', contato.nome)
            formData.append('mensagem', mensagemPersonalizada)
            formData.append('campanha', nomeCampanha)
            formData.append('usuario_id', user?.id || '')
            formData.append('tipo', 'disparo_simples_imagem')
            formData.append('image', selectedImage)

            const response = await fetch('https://webhooks.dnmarketing.com.br/webhook/2b00d2ba-f923-44be-9dc1-b725566e8deb', {
              method: 'POST',
              body: formData
            })
          } else {
            // Enviar apenas texto como antes
            const response = await fetch('https://webhooks.dnmarketing.com.br/webhook/2b00d2ba-f923-44be-9dc1-b725566e8deb', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telefone: contato.telefone,
                nome: contato.nome,
                mensagem: mensagemPersonalizada,
                campanha: nomeCampanha,
                usuario_id: user?.id,
                tipo: 'disparo_simples'
              })
            })
          }

          console.log(`Enviado para ${contato.nome} (${contato.telefone}):`, mensagemPersonalizada)

          // Atualizar progresso
          setSendingProgress(Math.round(((i + 1) / csvContacts.length) * 100))

          // Delay entre mensagens (1 segundo)
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`Erro ao enviar para ${contato.nome}:`, error)
        }
      }

      alert('Campanha enviada com sucesso!')
      
      // Limpar formulário
      setNomeCampanha('')
      setMensagem('')
      setCsvFile(null)
      setCsvContacts([])
      setSelectedImage(null)
      setImagePreview(null)
      
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
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disparo Simples</h1>
        <p className="mt-2 text-sm text-gray-700">
          Envie mensagens em massa para sua lista de contatos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Envio */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Nova Campanha</h3>
            
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

              {/* Seção de Upload de Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="inline h-4 w-4 mr-1" />
                  Imagem (Opcional)
                </label>
                
                {!imagePreview ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Image className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageCircle className="inline h-4 w-4 mr-1" />
                  Instância WhatsApp
                </label>
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                  required
                >
                  <option value="">Selecione uma instância</option>
                  {instances.map((instance) => (
                    <option key={instance.id} value={instance.instancia}>
                      {instance.instancia}
                    </option>
                  ))}
                </select>
                {instances.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    Nenhuma instância WhatsApp encontrada. Configure uma instância primeiro.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lista de Contatos (CSV)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
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
                    <p className="text-xs text-gray-500">CSV com colunas: nome,telefone</p>
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

              {csvContacts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Pré-visualização ({csvContacts.length} contatos)
                  </h4>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {csvContacts.slice(0, 5).map((contact, index) => (
                      <div key={index} className="text-sm text-gray-600 py-1">
                        {contact.nome} - {contact.telefone}
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
                disabled={sending || !nomeCampanha.trim() || !mensagem.trim() || csvContacts.length === 0}
                className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
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