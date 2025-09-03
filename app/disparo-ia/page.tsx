'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { supabase, AgenteIA } from '../../lib/supabase'
import PlanProtection from '../../components/PlanProtection'
import { Upload, Bot, FileText, Users, Calendar, Sparkles } from 'lucide-react'

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

export default function DisparoIAPage() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [agentes, setAgentes] = useState<AgenteIA[]>([])
  
  // Debug: log quando agentes mudarem
  useEffect(() => {
    console.log('Estado agentes atualizado:', agentes)
  }, [agentes])
  const [loading, setLoading] = useState(true)
  
  // Formulário
  const [nomeCampanha, setNomeCampanha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [contextoIA, setContextoIA] = useState('')
  const [agenteSelected, setAgenteSelected] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvContacts, setCsvContacts] = useState<CsvContact[]>([])
  const [sending, setSending] = useState(false)
  const [sendingProgress, setSendingProgress] = useState(0)

  useEffect(() => {
    if (user) {
      fetchCampaigns()
      fetchAgentes()
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
        .ilike('origem', '%IA%') // Filtrar apenas campanhas com IA
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
            origem: lead.origem || 'Disparo com IA'
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

  const fetchAgentes = async () => {
    if (!user) {
      console.log('fetchAgentes: usuário não encontrado')
      return
    }

    console.log('fetchAgentes: buscando agentes para user_id:', user.id)
    
    try {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('user_id', user.id)
        .eq('estagio', 'ativo')
        .order('nome')

      console.log('fetchAgentes: resultado:', { data, error })

      if (error) {
        console.error('fetchAgentes: erro na query:', error)
        return
      }

      if (data) {
        console.log('fetchAgentes: definindo agentes:', data)
        setAgentes(data)
      } else {
        console.log('fetchAgentes: nenhum dado retornado')
      }
    } catch (error) {
      console.error('fetchAgentes: erro na execução:', error)
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

  const generateAIMessage = async (baseMessage: string, contexto: string, nome: string) => {
    // Simulação de geração de mensagem por IA
    const variations = [
      `${baseMessage.replace('{nome}', nome)} 😊`,
      `Oi ${nome}! ${baseMessage.replace('Olá {nome}', '').trim()} ✨`,
      `${nome}, ${baseMessage.replace('Olá {nome}', '').toLowerCase().trim()} 🎯`,
      `E aí, ${nome}! ${baseMessage.replace('Olá {nome}', '').trim()} 🚀`
    ]
    
    await new Promise(resolve => setTimeout(resolve, 800))
    return variations[Math.floor(Math.random() * variations.length)]
  }

  const executeCampaign = async () => {
    if (!nomeCampanha.trim() || !mensagem.trim() || !contextoIA.trim() || csvContacts.length === 0) {
      alert('Preencha todos os campos e faça upload do CSV')
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
        origem: 'Disparo com IA',
        nome_campanha: nomeCampanha,
        status_limpa_nome: 'novo_lead',
        observacoes_limpa_nome: `Campanha IA: ${nomeCampanha} | Contexto: ${contextoIA}`,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('leads')
        .insert(leadsToInsert)

      if (insertError) throw insertError

      setSendingProgress(30) // Leads inseridos

      // Fazer um único POST com o arquivo CSV original
      try {
        if (!csvFile) throw new Error('Arquivo CSV não encontrado')

        setSendingProgress(50) // Progresso inicial

        // Criar FormData para enviar o arquivo binário
        const formData = new FormData()
        formData.append('planilha', csvFile)
        formData.append('campanha', nomeCampanha)
        formData.append('contexto_ia', contextoIA)
        formData.append('usuario_id', user?.id?.toString() || '')
        formData.append('tipo', 'disparo_ia')
        formData.append('total_contatos', csvContacts.length.toString())
        formData.append('mensagem', mensagem)
        formData.append('agente_id', agenteSelected || '')

        const response = await fetch('https://webhooks.dnmarketing.com.br/webhook/2b00d2ba-f923-44be-9dc1-b725566e9dr1', {
          method: 'POST',
          body: formData // Sem Content-Type para FormData
        })

        console.log(`Enviado arquivo CSV completo: ${csvFile.name} com ${csvContacts.length} contatos para campanha: ${nomeCampanha}`)

        setSendingProgress(100) // Concluído

        // Simular delay para mostrar o progresso
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error('Erro ao enviar planilha:', error)
        throw error
      }

      alert('Campanha com IA enviada com sucesso!')
      
      // Limpar formulário
      setNomeCampanha('')
      setMensagem('')
      setContextoIA('')
      setAgenteSelected('')
      setCsvFile(null)
      setCsvContacts([])
      
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

  const isDisabled = sending

  return (
    <PlanProtection feature="disparoIA">
      <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Bot className="h-8 w-8 mr-3 text-purple-600" />
          Disparo com IA
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Envie mensagens personalizadas usando inteligência artificial
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Envio */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-purple-600" />
              Nova Campanha com IA
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={nomeCampanha}
                  onChange={(e) => setNomeCampanha(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Campanha IA Vendas"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem Base
                </label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Olá {nome}, temos uma oferta especial para você!"
                  disabled={isDisabled}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> para personalizar com o nome do contato
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contexto para IA
                </label>
                <textarea
                  value={contextoIA}
                  onChange={(e) => setContextoIA(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Você é um vendedor carismático promovendo serviços de limpeza de nome. Seja persuasivo mas respeitoso..."
                  disabled={isDisabled}
                />
                <p className="text-sm text-purple-600 mt-1">
                  🤖 A IA usará este contexto para personalizar cada mensagem de forma única
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agente IA (Opcional)
                </label>
                <select
                  value={agenteSelected}
                  onChange={(e) => setAgenteSelected(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isDisabled}
                >
                  <option value="">Sem agente específico</option>
                  {agentes.length > 0 ? (
                    agentes.map((agente) => (
                      <option key={agente.id} value={agente.agente_id}>
                        {agente.nome} - {agente.funcao}
                      </option>
                    ))
                  ) : (
                    <option disabled>Nenhum agente encontrado - Crie um agente em Configurações</option>
                  )}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  <Bot className="h-3 w-3 inline mr-1" />
                  Selecione um agente para usar suas configurações específicas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lista de Contatos (CSV)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-purple-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-purple-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                        <span>Fazer upload do arquivo</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="sr-only"
                          disabled={isDisabled}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">CSV com colunas: nome,telefone</p>
                  </div>
                </div>
                
                {csvFile && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-md">
                    <p className="text-sm text-purple-800">
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
                    <span className="text-sm text-gray-700">Enviando campanha...</span>
                    <span className="text-sm text-gray-700">{sendingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${sendingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    📁 Enviando arquivo CSV com dados da campanha...
                  </p>
                </div>
              )}

              <button
                onClick={executeCampaign}
                disabled={isDisabled || !nomeCampanha.trim() || !mensagem.trim() || !contextoIA.trim() || csvContacts.length === 0}
                className="w-full flex items-center justify-center bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                {sending ? (
                  <>
                    <Bot className="h-5 w-5 mr-2 animate-pulse" />
                    Enviando ({sendingProgress}%)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Enviar com IA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Histórico de Campanhas */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campanhas com IA</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((campaign, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 truncate flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                        {campaign.origem}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma campanha IA encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </PlanProtection>
  )
}