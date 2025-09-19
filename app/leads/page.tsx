'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase, Lead } from '../../lib/supabase'
import { useAuth } from '../../components/AuthWrapper'
import { getUserPlanInfo } from '../../lib/permissions'
import { Phone, User, Plus, DollarSign, FileText, AlertCircle, CheckCircle, Clock, Users, LayoutGrid, List, Search, Filter, X, BarChart3, TrendingUp, Calendar, FileBarChart, Target, Activity, MessageSquare, Download, Edit, Crown, Info } from 'lucide-react'

const STATUS_CONFIG = {
  // Status Limpa Nome
  'novo_lead': { label: 'Novo Lead', color: 'bg-blue-100 text-blue-800', icon: Users },
  'qualificacao': { label: 'Qualificação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'desqualificado': { label: 'Desqualificado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  'pagamento_consulta': { label: 'Pagamento Consulta', color: 'bg-purple-100 text-purple-800', icon: DollarSign },
  'nao_consta_divida': { label: 'Não Consta Dívida', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'consta_divida': { label: 'Consta Dívida', color: 'bg-orange-100 text-orange-800', icon: FileText },
  'enviado_para_negociacao': { label: 'Em Negociação', color: 'bg-indigo-100 text-indigo-800', icon: User },
  'cliente_fechado': { label: 'Cliente Fechado', color: 'bg-green-100 text-green-800', icon: CheckCircle },

  // Status Previdenciário
  'novo_caso': { label: 'Novo Caso', color: 'bg-blue-100 text-blue-800', icon: Users },
  'analise_viabilidade': { label: 'Análise Viabilidade', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'caso_viavel': { label: 'Caso Viável', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'caso_inviavel': { label: 'Caso Inviável', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  'contrato_enviado': { label: 'Contrato Enviado', color: 'bg-purple-100 text-purple-800', icon: FileText },
  'contrato_assinado': { label: 'Contrato Assinado', color: 'bg-indigo-100 text-indigo-800', icon: DollarSign },
  'processo_iniciado': { label: 'Processo Iniciado', color: 'bg-orange-100 text-orange-800', icon: Activity },
  'caso_finalizado': { label: 'Caso Finalizado', color: 'bg-green-100 text-green-800', icon: CheckCircle },

  // Status B2B
  'novo_contato': { label: 'Novo Contato', color: 'bg-blue-100 text-blue-800', icon: Users },
  'qualificacao_inicial': { label: 'Qualificação Inicial', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  'mapeando_decisor': { label: 'Mapeando Decisor', color: 'bg-orange-100 text-orange-800', icon: User },
  'contato_decisor': { label: 'Contato Decisor', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
  'apresentacao_realizada': { label: 'Apresentação Realizada', color: 'bg-indigo-100 text-indigo-800', icon: Activity },
  'proposta_enviada': { label: 'Proposta Enviada', color: 'bg-teal-100 text-teal-800', icon: FileText },
  'negociacao': { label: 'Negociação', color: 'bg-amber-100 text-amber-800', icon: MessageSquare },
  'negocio_fechado': { label: 'Negócio Fechado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

// Função para gerar config de status dinamicamente baseado no tipo de negócio
const generateStatusConfig = (status: string) => {
  // Se já existe no config estático, usar ele
  if (STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]) {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
  }

  // Gerar config baseado na nomenclatura do status
  let label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  let color = 'bg-gray-100 text-gray-800'
  let icon = FileText

  // Mapear cores e ícones baseados em palavras-chave
  if (status.includes('novo')) {
    color = 'bg-blue-100 text-blue-800'
    icon = Users
  } else if (status.includes('analise') || status.includes('qualific')) {
    color = 'bg-yellow-100 text-yellow-800'
    icon = Clock
  } else if (status.includes('viavel') || status.includes('divida') || status.includes('proposta')) {
    color = 'bg-orange-100 text-orange-800'
    icon = FileText
  } else if (status.includes('contrato') || status.includes('pagamento')) {
    color = 'bg-purple-100 text-purple-800'
    icon = DollarSign
  } else if (status.includes('negociacao') || status.includes('apresentacao')) {
    color = 'bg-indigo-100 text-indigo-800'
    icon = MessageSquare
  } else if (status.includes('finalizado') || status.includes('fechado') || status.includes('assinado')) {
    color = 'bg-green-100 text-green-800'
    icon = CheckCircle
  } else if (status.includes('inviavel') || status.includes('desqualificado') || status.includes('perdido')) {
    color = 'bg-red-100 text-red-800'
    icon = AlertCircle
  } else if (status.includes('processo') || status.includes('iniciado')) {
    color = 'bg-blue-100 text-blue-800'
    icon = Activity
  } else if (status.includes('agendada') || status.includes('agenda')) {
    color = 'bg-purple-100 text-purple-800'
    icon = Calendar
  }

  return { label, color, icon }
}

// Função para lógica automática de status B2B
// Deve ser chamada sempre que um lead B2B for atualizado
// Automaticamente muda status para 'contato_decisor' quando falando_com_responsavel = true
// E marca responsavel_encontrado = true em todos os contatos da mesma empresa
const handleB2BStatusLogic = async (leadData: any, isB2B: boolean) => {
  if (!isB2B || !leadData.falando_com_responsavel) {
    return leadData
  }

  // Se falando_com_responsavel for true, mudar status automaticamente
  if (leadData.falando_com_responsavel) {
    leadData.status_generico = 'contato_decisor'
  }

  // Atualizar demais contatos da mesma empresa com responsavel_encontrado
  if (leadData.nome_empresa || leadData.id_empresa) {
    try {
      let query = supabase
        .from('leads')
        .update({ responsavel_encontrado: true })
        .neq('id', leadData.id)

      // Construir a condição OR baseada nos campos disponíveis
      if (leadData.nome_empresa && leadData.id_empresa) {
        query = query.or(`nome_empresa.eq.${leadData.nome_empresa},id_empresa.eq.${leadData.id_empresa}`)
      } else if (leadData.nome_empresa) {
        query = query.eq('nome_empresa', leadData.nome_empresa)
      } else if (leadData.id_empresa) {
        query = query.eq('id_empresa', leadData.id_empresa)
      }

      const { error } = await query

      if (error) {
        console.error('Erro ao atualizar responsavel_encontrado:', error)
      } else {
        console.log('Demais contatos da empresa atualizados com responsavel_encontrado = true')
      }
    } catch (err) {
      console.error('Erro na atualização automática:', err)
    }
  }

  return leadData
}

interface CreateLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onLeadCreated: () => void
  userId?: string
}

function CreateLeadModal({ isOpen, onClose, onLeadCreated, userId }: CreateLeadModalProps) {
  const [formData, setFormData] = useState({
    nome_cliente: '',
    cpf: '',
    cpf_cnpj: '',
    nome_empresa: '',
    telefone: '',
    origem: 'WhatsApp',
    tipo_consulta_interesse: 'Consulta Rating',
    valor_estimado_divida: '',
    tempo_negativado: '',
    segmento_empresa: '',
    porte_empresa: 'pequena'
  })
  const [loading, setLoading] = useState(false)
  const [userTipoNegocio, setUserTipoNegocio] = useState<any>(null)

  // Buscar tipo de negócio do usuário
  useEffect(() => {
    if (userId && isOpen) {
      fetchUserTipoNegocio()
    }
  }, [userId, isOpen])

  const fetchUserTipoNegocio = async () => {
    console.log('Modal: Buscando tipo de negócio para userId:', userId)
    try {
      const { data, error } = await supabase
        .from('user_tipos_negocio')
        .select(`
          tipo_negocio_id,
          tipos_negocio!inner (
            id,
            nome,
            descricao
          )
        `)
        .eq('user_id', userId)
        .single()

      console.log('Modal: Resultado da busca:', data, 'Error:', error)

      if (error) throw error
      setUserTipoNegocio(data?.tipos_negocio)

      // Ajustar valor inicial baseado no tipo de negócio
      const tipoNegocio = Array.isArray(data?.tipos_negocio) ? data?.tipos_negocio[0] : data?.tipos_negocio
      if (tipoNegocio?.nome === 'previdenciario') {
        console.log('Modal: Configurando para previdenciário')
        setFormData(prev => ({ ...prev, tipo_consulta_interesse: 'Análise de Viabilidade' }))
      } else if (tipoNegocio?.nome === 'b2b') {
        console.log('Modal: Configurando para B2B')
        setFormData(prev => ({ ...prev, tipo_consulta_interesse: 'Prospecção', origem: 'LinkedIn' }))
      } else {
        console.log('Modal: Configurando para limpa nome')
        setFormData(prev => ({ ...prev, tipo_consulta_interesse: 'Consulta Rating' }))
      }
    } catch (error) {
      console.error('Erro ao buscar tipo de negócio:', error)
      // Fallback baseado no usuário
      if (userId === '28') {
        console.log('Modal: Configurando usuário 28 como previdenciário (fallback)')
        setUserTipoNegocio({ id: 2, nome: 'previdenciario', descricao: 'Advogado Previdenciário' })
        setFormData(prev => ({ ...prev, tipo_consulta_interesse: 'Análise de Viabilidade' }))
      } else {
        setUserTipoNegocio({ nome: 'limpa_nome' })
        setFormData(prev => ({ ...prev, tipo_consulta_interesse: 'Consulta Rating' }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    try {
      let leadData: any = {
        user_id: parseInt(userId || '0'),
        nome_cliente: formData.nome_cliente,
        telefone: formData.telefone,
        origem: formData.origem,
        status_generico: userTipoNegocio?.nome === 'previdenciario' ? 'novo_caso' : (userTipoNegocio?.nome === 'b2b' ? 'novo_contato' : 'novo_lead'),
        tipo_negocio_id: userTipoNegocio?.nome === 'previdenciario' ? 2 : (userTipoNegocio?.nome === 'b2b' ? 3 : 1)
      }

      // Campos específicos baseados no tipo de negócio
      if (userTipoNegocio?.nome === 'b2b') {
        leadData = {
          ...leadData,
          cpf_cnpj: formData.cpf_cnpj ? formData.cpf_cnpj.replace(/[^0-9]/g, '') : null,
          nome_empresa: formData.nome_empresa || null,
          responsavel_encontrado: false,
          falando_com_responsavel: false,
          dados_personalizados: {
            segmento_empresa: formData.segmento_empresa,
            porte_empresa: formData.porte_empresa,
            tipo_servico: formData.tipo_consulta_interesse
          }
        }
      } else if (userTipoNegocio?.nome === 'previdenciario') {
        leadData = {
          ...leadData,
          cpf: formData.cpf ? formData.cpf.replace(/[^0-9]/g, '') : null,
          dados_personalizados: {
            tipo_servico: formData.tipo_consulta_interesse,
            valor_estimado_caso: formData.valor_estimado_divida ? parseFloat(formData.valor_estimado_divida) : null,
            situacao_atual: formData.tempo_negativado || null
          }
        }
      } else {
        // Limpa nome
        leadData = {
          ...leadData,
          cpf: formData.cpf ? formData.cpf.replace(/[^0-9]/g, '') : null,
          dados_personalizados: {
            tipo_consulta_interesse: formData.tipo_consulta_interesse,
            valor_estimado_divida: formData.valor_estimado_divida ? parseFloat(formData.valor_estimado_divida) : null,
            tempo_negativado: formData.tempo_negativado || null
          }
        }
      }

      const { error } = await supabase
        .from('leads')
        .insert([leadData])

      if (error) throw error

      onLeadCreated()
      onClose()
      setFormData({
        nome_cliente: '',
        cpf: '',
        cpf_cnpj: '',
        nome_empresa: '',
        telefone: '',
        origem: 'WhatsApp',
        tipo_consulta_interesse: 'Consulta Rating',
        valor_estimado_divida: '',
        tempo_negativado: '',
        segmento_empresa: '',
        porte_empresa: 'pequena'
      })
    } catch (error) {
      console.error('Erro ao criar lead:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Criar Novo Lead</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.nome_cliente}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_cliente: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {userTipoNegocio?.nome === 'b2b' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0001-00"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome da empresa"
                  value={formData.nome_empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_empresa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origem
            </label>
            <select
              value={formData.origem}
              onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userTipoNegocio?.nome === 'b2b' ? (
                <>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Cold Calling">Cold Calling</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Evento">Evento</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Site">Site</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Outros">Outros</option>
                </>
              ) : (
                <>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Site">Site</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Google">Google</option>
                  <option value="Outros">Outros</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {userTipoNegocio?.nome === 'previdenciario' ? 'Tipo de Serviço' :
               userTipoNegocio?.nome === 'b2b' ? 'Tipo de Serviço' : 'Tipo de Consulta de Interesse'}
            </label>
            <select
              value={formData.tipo_consulta_interesse}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo_consulta_interesse: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userTipoNegocio?.nome === 'previdenciario' ? (
                <>
                  <option value="Análise de Viabilidade">Análise de Viabilidade</option>
                  <option value="Revisão de Benefício">Revisão de Benefício</option>
                  <option value="Recurso INSS">Recurso INSS</option>
                  <option value="Aposentadoria">Aposentadoria</option>
                  <option value="Auxílio Doença">Auxílio Doença</option>
                  <option value="BPC/LOAS">BPC/LOAS</option>
                </>
              ) : userTipoNegocio?.nome === 'b2b' ? (
                <>
                  <option value="Prospecção">Prospecção</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Software">Software/Tecnologia</option>
                  <option value="Marketing Digital">Marketing Digital</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Treinamento">Treinamento</option>
                  <option value="Outros Serviços">Outros Serviços</option>
                </>
              ) : (
                <>
                  <option value="Consulta Rating">Consulta Rating</option>
                  <option value="Consulta Completa">Consulta Completa</option>
                  <option value="Análise de Crédito">Análise de Crédito</option>
                  <option value="Limpa Nome">Limpa Nome</option>
                </>
              )}
            </select>
          </div>

          {userTipoNegocio?.nome === 'previdenciario' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor do Caso Estimado
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor_estimado_divida}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado_divida: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : userTipoNegocio?.nome === 'b2b' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Estimado
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor_estimado_divida}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado_divida: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Estimado da Dívida
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor_estimado_divida}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado_divida: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {userTipoNegocio?.nome === 'previdenciario' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Situação Atual
              </label>
              <input
                type="text"
                placeholder="Ex: Aposentado, Trabalhando, Afastado"
                value={formData.tempo_negativado}
                onChange={(e) => setFormData(prev => ({ ...prev, tempo_negativado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : userTipoNegocio?.nome === 'b2b' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segmento da Empresa
                </label>
                <select
                  value={formData.segmento_empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, segmento_empresa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o segmento</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="saude">Saúde</option>
                  <option value="educacao">Educação</option>
                  <option value="industria">Indústria</option>
                  <option value="varejo">Varejo</option>
                  <option value="servicos">Serviços</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porte da Empresa
                </label>
                <select
                  value={formData.porte_empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, porte_empresa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pequena">Pequena (até 99 funcionários)</option>
                  <option value="media">Média (100-499 funcionários)</option>
                  <option value="grande">Grande (500+ funcionários)</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Negativado
              </label>
              <input
                type="text"
                placeholder="Ex: 2 anos, 6 meses"
                value={formData.tempo_negativado}
                onChange={(e) => setFormData(prev => ({ ...prev, tempo_negativado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoConsultaFilter, setTipoConsultaFilter] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<'leads' | 'relatorios'>('leads')
  const [userTipoNegocio, setUserTipoNegocio] = useState<any>(null)
  const [userPlanInfo, setUserPlanInfo] = useState<any>(null)

  // Estados para edição de lead
  const [isEditingLead, setIsEditingLead] = useState(false)
  const [editLeadData, setEditLeadData] = useState<any>({})

  // Estados para drag and drop
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

  // Estado para modal de detalhes
  const [showLeadModal, setShowLeadModal] = useState(false)

  // Estados específicos para a aba Relatórios
  const [reportFilters, setReportFilters] = useState({
    campanha: '',
    origemFilter: 'todos',
    statusRelatorio: 'todos',
    tipoConsultaRelatorio: 'todos',
    dataInicioRelatorio: '',
    dataFimRelatorio: '',
    cnpj: '',
    valorMinimo: '',
    valorMaximo: ''
  })

  useEffect(() => {
    if (user) {
      fetchLeads()
      fetchUserTipoNegocio()
      fetchUserPlanInfo()
    }
  }, [user])

  const fetchUserTipoNegocio = async () => {
    if (!user) return

    console.log('Dashboard: Buscando tipo de negócio para usuário:', user.id)

    try {
      const { data, error } = await supabase
        .from('user_tipos_negocio')
        .select(`
          tipo_negocio_id,
          tipos_negocio!inner (
            id, nome, nome_exibicao, descricao, cor, icone,
            status_personalizados, campos_personalizados, metricas_config
          )
        `)
        .eq('user_id', user.id)
        .single()

      console.log('Dashboard: Resultado da busca:', data, 'Error:', error)

      if (error) throw error

      const tipoNegocio = data?.tipos_negocio as any
      if (tipoNegocio) {
        // Processar campos JSON
        const tipoProcessado = {
          ...tipoNegocio,
          status_personalizados: typeof tipoNegocio.status_personalizados === 'string'
            ? JSON.parse(tipoNegocio.status_personalizados)
            : tipoNegocio.status_personalizados || [],
          campos_personalizados: typeof tipoNegocio.campos_personalizados === 'string'
            ? JSON.parse(tipoNegocio.campos_personalizados)
            : tipoNegocio.campos_personalizados || [],
          metricas_config: typeof tipoNegocio.metricas_config === 'string'
            ? JSON.parse(tipoNegocio.metricas_config)
            : tipoNegocio.metricas_config || {}
        }
        setUserTipoNegocio(tipoProcessado)
        console.log('Dashboard: Tipo configurado:', tipoProcessado)
      }
    } catch (error) {
      console.error('Erro ao buscar tipo de negócio:', error)
      // Fallback baseado no usuário
      if (user.id === '28') {
        console.log('Dashboard: Configurando usuário 28 como previdenciário (fallback)')
        setUserTipoNegocio({
          id: 2,
          nome: 'previdenciario',
          nome_exibicao: 'Advogado Previdenciário',
          descricao: 'Advogado Previdenciário',
          status_personalizados: ['novo_caso', 'analise_viabilidade', 'caso_viavel', 'caso_inviavel', 'contrato_enviado', 'contrato_assinado', 'processo_iniciado', 'caso_finalizado']
        })
      } else {
        setUserTipoNegocio({
          nome: 'limpa_nome',
          nome_exibicao: 'Limpa Nome',
          status_personalizados: ['novo_lead', 'qualificacao', 'desqualificado', 'pagamento_consulta', 'nao_consta_divida', 'consta_divida', 'enviado_para_negociacao', 'cliente_fechado']
        })
      }
    }
  }

  const fetchUserPlanInfo = async () => {
    if (!user) return

    try {
      const planInfo = await getUserPlanInfo(user.id)
      setUserPlanInfo(planInfo)
      console.log('Plan info loaded:', planInfo)
    } catch (error) {
      console.error('Erro ao buscar informações do plano:', error)
    }
  }

  // Labels dinâmicos baseados no tipo de negócio
  const getMetricsLabels = () => {
    if (userTipoNegocio?.nome === 'previdenciario') {
      return {
        total: 'Total de Casos',
        qualificados: 'Em Análise de Viabilidade',
        pagouConsulta: 'Casos Viáveis',
        constaDivida: 'Contratos Assinados',
        clientesFechados: 'Casos Finalizados',
        receitaConsultas: 'Receita Consultorias',
        receitaContratos: 'Receita Casos',
        ticketMedio: 'Valor Médio por Caso'
      }
    } else if (userTipoNegocio?.nome === 'b2b') {
      return {
        total: 'Total de Contatos',
        qualificados: 'Qualificação Inicial',
        pagouConsulta: 'Apresentações Realizadas',
        constaDivida: 'Propostas Enviadas',
        clientesFechados: 'Negócios Fechados',
        receitaConsultas: 'Receita Apresentações',
        receitaContratos: 'Receita Contratos',
        ticketMedio: 'Ticket Médio por Deal'
      }
    } else if (userTipoNegocio?.nome === 'limpa_nome') {
      return {
        total: 'Total de Leads',
        qualificados: 'Qualificados',
        pagouConsulta: 'Pagaram Consulta',
        constaDivida: 'Consta Dívida',
        clientesFechados: 'Clientes Fechados',
        receitaConsultas: 'Receita Consultas',
        receitaContratos: 'Receita Contratos',
        ticketMedio: 'Ticket Médio'
      }
    }

    // Fallback genérico
    return {
      total: 'Total de Leads',
      qualificados: 'Qualificados',
      pagouConsulta: 'Em Andamento',
      constaDivida: 'Casos Viáveis',
      clientesFechados: 'Fechados',
      receitaConsultas: 'Receita Principal',
      receitaContratos: 'Receita Contratos',
      ticketMedio: 'Ticket Médio'
    }
  }

  // Função utilitária para obter status relevantes baseado no tipo de negócio
  const getRelevantStatuses = () => {
    if (!userTipoNegocio) {
      // Fallback para quando não há tipo de negócio carregado
      return ['novo_lead', 'qualificacao', 'desqualificado', 'pagamento_consulta', 'nao_consta_divida', 'consta_divida', 'enviado_para_negociacao', 'cliente_fechado']
    }

    // Se há status personalizados definidos no banco, usar eles
    if (userTipoNegocio.status_personalizados && userTipoNegocio.status_personalizados.length > 0) {
      return userTipoNegocio.status_personalizados
    }

    // Fallback baseado no nome do tipo
    if (userTipoNegocio.nome === 'previdenciario') {
      return ['novo_caso', 'analise_viabilidade', 'caso_viavel', 'caso_inviavel', 'contrato_enviado', 'contrato_assinado', 'processo_iniciado', 'caso_finalizado']
    } else if (userTipoNegocio.nome === 'b2b') {
      return ['novo_contato', 'qualificacao_inicial', 'mapeando_decisor', 'contato_decisor', 'apresentacao_realizada', 'proposta_enviada', 'negociacao', 'negocio_fechado']
    } else {
      // Limpa nome e outros
      return ['novo_lead', 'qualificacao', 'desqualificado', 'pagamento_consulta', 'nao_consta_divida', 'consta_divida', 'enviado_para_negociacao', 'cliente_fechado']
    }
  }

  const fetchLeads = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', parseInt(user.id || '0'))
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadLeadsCSV = () => {
    // Aplicar os mesmos filtros que estão sendo usados na visualização
    const filteredLeads = leads.filter(lead => {
      // Filtro por status
      const statusMatch = statusFilter === 'todos' ||
        (lead.status_generico || lead.status_limpa_nome) === statusFilter

      // Filtro por tipo de consulta
      const tipoConsultaMatch = tipoConsultaFilter === 'todos' ||
        (lead.tipo_consulta_interesse && lead.tipo_consulta_interesse.toLowerCase().includes(tipoConsultaFilter.toLowerCase()))

      // Filtro por nome e telefone (busca)
      const searchMatch = searchTerm === '' ||
        (lead.nome_cliente && lead.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.telefone && lead.telefone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.cpf && lead.cpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.cpf_cnpj && lead.cpf_cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.nome_empresa && lead.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtro por data
      let dateMatch = true
      if (startDate && lead.created_at) {
        const leadDate = new Date(lead.created_at)
        const filterStartDate = new Date(startDate)
        dateMatch = dateMatch && leadDate >= filterStartDate
      }
      if (endDate && lead.created_at) {
        const leadDate = new Date(lead.created_at)
        const filterEndDate = new Date(endDate + 'T23:59:59')
        dateMatch = dateMatch && leadDate <= filterEndDate
      }

      return statusMatch && tipoConsultaMatch && searchMatch && dateMatch
    })

    // Definir cabeçalhos baseados no tipo de negócio
    let headers: string[] = []
    let rows: string[][] = []

    if (userTipoNegocio?.nome === 'b2b') {
      headers = [
        'Nome do Cliente',
        'CNPJ',
        'Nome da Empresa',
        'Telefone',
        'Origem',
        'Status',
        'Responsável Encontrado',
        'Falando com Responsável',
        'Segmento da Empresa',
        'Porte da Empresa',
        'Budget Disponível',
        'Agente ID',
        'Follow-up Solicitado',
        'Data Follow-up',
        'Existe WhatsApp',
        'Nome da Campanha',
        'Status Disparo',
        'Data de Criação'
      ]

      rows = filteredLeads.map(lead => [
        lead.nome_cliente || '',
        lead.cpf_cnpj || '',
        lead.nome_empresa || '',
        lead.telefone || '',
        lead.origem || '',
        lead.status_generico || '',
        lead.responsavel_encontrado ? 'Sim' : 'Não',
        lead.falando_com_responsavel ? 'Sim' : 'Não',
        lead.dados_personalizados?.segmento_empresa || '',
        lead.dados_personalizados?.porte_empresa || '',
        lead.dados_personalizados?.budget_disponivel ? `R$ ${lead.dados_personalizados.budget_disponivel.toLocaleString('pt-BR')}` : '',
        lead.Agente_ID || '',
        lead.folowup_solicitado ? 'Sim' : 'Não',
        lead.data_folowup_solicitado || '',
        lead.existe_whatsapp ? 'Sim' : 'Não',
        lead.nome_campanha || '',
        lead.status_disparo || '',
        lead.created_at ? new Date(lead.created_at).toLocaleString('pt-BR') : ''
      ])
    } else if (userTipoNegocio?.nome === 'previdenciario') {
      headers = [
        'Nome do Cliente',
        'CPF',
        'Telefone',
        'Origem',
        'Status',
        'Tipo de Serviço',
        'Valor Estimado do Caso',
        'Situação Atual',
        'Tipo de Acidente',
        'Valor do Contrato',
        'Responsável',
        'Agente ID',
        'Follow-up Solicitado',
        'Data Follow-up',
        'Existe WhatsApp',
        'Nome da Campanha',
        'Status Disparo',
        'Data de Criação'
      ]

      rows = filteredLeads.map(lead => [
        lead.nome_cliente || '',
        lead.cpf || '',
        lead.telefone || '',
        lead.origem || '',
        lead.status_generico || '',
        lead.dados_personalizados?.tipo_servico || '',
        lead.dados_personalizados?.valor_estimado_caso ? `R$ ${lead.dados_personalizados.valor_estimado_caso.toLocaleString('pt-BR')}` : '',
        lead.dados_personalizados?.situacao_atual || '',
        lead.dados_personalizados?.tipo_acidente || '',
        lead.valor_contrato ? `R$ ${lead.valor_contrato.toLocaleString('pt-BR')}` : '',
        lead.dados_personalizados?.responsavel || '',
        lead.Agente_ID || '',
        lead.folowup_solicitado ? 'Sim' : 'Não',
        lead.data_folowup_solicitado || '',
        lead.existe_whatsapp ? 'Sim' : 'Não',
        lead.nome_campanha || '',
        lead.status_disparo || '',
        lead.created_at ? new Date(lead.created_at).toLocaleString('pt-BR') : ''
      ])
    } else {
      // Limpa Nome
      headers = [
        'Nome do Cliente',
        'CPF',
        'Telefone',
        'Origem',
        'Status',
        'Valor Estimado da Dívida',
        'Valor Real da Dívida',
        'Valor Pago Consulta',
        'Valor Contrato',
        'Tempo Negativado',
        'Tipo Consulta Interesse',
        'Órgãos Negativados',
        'Observações',
        'Agente ID',
        'Follow-up Solicitado',
        'Data Follow-up',
        'Existe WhatsApp',
        'Nome da Campanha',
        'Status Disparo',
        'Data de Criação'
      ]

      rows = filteredLeads.map(lead => [
        lead.nome_cliente || '',
        lead.cpf || '',
        lead.telefone || '',
        lead.origem || '',
        lead.status_limpa_nome || '',
        lead.valor_estimado_divida ? `R$ ${lead.valor_estimado_divida.toLocaleString('pt-BR')}` : '',
        lead.valor_real_divida ? `R$ ${lead.valor_real_divida.toLocaleString('pt-BR')}` : '',
        lead.valor_pago_consulta ? `R$ ${lead.valor_pago_consulta.toLocaleString('pt-BR')}` : '',
        lead.valor_contrato ? `R$ ${lead.valor_contrato.toLocaleString('pt-BR')}` : '',
        lead.tempo_negativado || '',
        lead.tipo_consulta_interesse || '',
        Array.isArray(lead.orgaos_negativados) ? lead.orgaos_negativados.join(', ') : '',
        lead.observacoes_limpa_nome || '',
        lead.Agente_ID || '',
        lead.folowup_solicitado ? 'Sim' : 'Não',
        lead.data_folowup_solicitado || '',
        lead.existe_whatsapp ? 'Sim' : 'Não',
        lead.nome_campanha || '',
        lead.status_disparo || '',
        lead.created_at ? new Date(lead.created_at).toLocaleString('pt-BR') : ''
      ])
    }

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)

    const tipoNegocio = userTipoNegocio?.nome || 'leads'
    const dataAtual = new Date().toISOString().split('T')[0]
    const filtroAplicado = searchTerm || statusFilter !== 'todos' || tipoConsultaFilter !== 'todos' || startDate || endDate ? '_filtrado' : ''

    link.setAttribute('download', `leads_${tipoNegocio}_${dataAtual}${filtroAplicado}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleAtendimentoFinalizado = async (leadId: number, currentValue: boolean | null) => {
    try {
      const newValue = !currentValue

      const { error } = await supabase
        .from('leads')
        .update({ atendimentofinalizado: newValue })
        .eq('id', leadId)

      if (error) {
        console.error('Erro ao atualizar atendimento finalizado:', error)
        return
      }

      // Atualizar o estado local
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId
            ? { ...lead, atendimentofinalizado: newValue }
            : lead
        )
      )
    } catch (error) {
      console.error('Erro ao alterar atendimento finalizado:', error)
    }
  }

  const startEditingLead = (lead: Lead) => {
    setEditLeadData({ ...lead })
    setIsEditingLead(true)
  }

  const cancelEditingLead = () => {
    setIsEditingLead(false)
    setEditLeadData({})
  }

  const saveEditedLead = async () => {
    if (!editLeadData.id) return

    try {
      // Preparar dados para atualização, removendo formatação se necessário
      const updateData = { ...editLeadData }

      // Remover formatação de CPF/CNPJ
      if (updateData.cpf) {
        updateData.cpf = updateData.cpf.replace(/[^0-9]/g, '')
      }
      if (updateData.cpf_cnpj) {
        updateData.cpf_cnpj = updateData.cpf_cnpj.replace(/[^0-9]/g, '')
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', editLeadData.id)

      if (error) {
        console.error('Erro ao atualizar lead:', error)
        return
      }

      // Atualizar o estado local
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === editLeadData.id ? { ...lead, ...updateData } : lead
        )
      )

      // Atualizar o lead selecionado
      if (selectedLead?.id === editLeadData.id) {
        setSelectedLead({ ...selectedLead, ...updateData })
      }

      // Sair do modo de edição
      setIsEditingLead(false)
      setEditLeadData({})
    } catch (error) {
      console.error('Erro ao salvar edição do lead:', error)
    }
  }

  const createSampleLeads = async () => {
    if (!user) {
      console.error('CreateSampleLeads: Usuário não encontrado')
      return
    }

    console.log('CreateSampleLeads: Iniciando para usuário:', user.id)

    // Primeiro buscar o tipo de negócio do usuário
    try {
      const { data: userTipoData, error: userTipoError } = await supabase
        .from('user_tipos_negocio')
        .select('tipos_negocio!inner(nome)')
        .eq('user_id', user.id)
        .single()

      console.log('CreateSampleLeads: Resultado da busca tipo:', userTipoData, 'Erro:', userTipoError)

      let tipoNegocio = 'limpa_nome'

      if (userTipoError) {
        console.log('CreateSampleLeads: Erro ao buscar tipo, usando fallback')
        // Fallback baseado no usuário
        if (user.id === '28') {
          tipoNegocio = 'previdenciario'
          console.log('CreateSampleLeads: Usuário 28 detectado, usando previdenciário')
        }
      } else {
        const tipoNegocioData = Array.isArray(userTipoData?.tipos_negocio) ? userTipoData?.tipos_negocio[0] : userTipoData?.tipos_negocio
        tipoNegocio = tipoNegocioData?.nome || 'limpa_nome'
      }

      console.log('CreateSampleLeads: Tipo detectado:', tipoNegocio)
      
      let sampleLeads: any[] = []

      if (tipoNegocio === 'previdenciario') {
        sampleLeads = [
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Maria Santos Silva',
            cpf: '12345678901',
            telefone: '(11) 99999-9999',
            origem: 'WhatsApp',
            status_generico: 'novo_caso',
            tipo_negocio_id: 2,
            dados_personalizados: {
              tipo_acidente: 'trabalho',
              situacao_atual: 'Aposentada',
              tipo_servico: 'Análise de Viabilidade',
              valor_estimado_caso: 25000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'José Oliveira Costa',
            cpf: '98765432100',
            telefone: '(11) 88888-8888',
            origem: 'Site',
            status_generico: 'analise_viabilidade',
            tipo_negocio_id: 2,
            dados_personalizados: {
              tipo_acidente: 'doenca_ocupacional',
              situacao_atual: 'Trabalhando',
              tipo_servico: 'Revisão de Benefício',
              valor_estimado_caso: 18000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Ana Paula Ferreira',
            cpf: '45678912345',
            telefone: '(21) 77777-7777',
            origem: 'Indicação',
            status_generico: 'caso_viavel',
            tipo_negocio_id: 2,
            dados_personalizados: {
              tipo_acidente: 'invalidez',
              situacao_atual: 'Afastado',
              tipo_servico: 'Recurso INSS',
              valor_estimado_caso: 35000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Roberto Silva Machado',
            cpf: '65432198700',
            telefone: '(85) 55555-5555',
            origem: 'Indicação',
            status_generico: 'contrato_enviado',
            tipo_negocio_id: 2,
            dados_personalizados: {
              tipo_acidente: 'transito',
              situacao_atual: 'Trabalhando',
              tipo_servico: 'Auxílio Doença',
              valor_estimado_caso: 28000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Carlos Eduardo Lima',
            cpf: '78912345678',
            telefone: '(31) 66666-6666',
            origem: 'WhatsApp',
            status_generico: 'caso_finalizado',
            tipo_negocio_id: 2,
            dados_personalizados: {
              tipo_acidente: 'trabalho',
              situacao_atual: 'Aposentado',
              tipo_servico: 'Aposentadoria',
              valor_estimado_caso: 42000.00,
              valor_contrato: 8500.00,
              responsavel: 'Especialista Previdenciário'
            }
          }
        ]
      } else if (tipoNegocio === 'b2b') {
        // Dados para B2B
        sampleLeads = [
          {
            user_id: parseInt(user.id),
            nome_cliente: 'João Silva - TechCorp',
            cpf_cnpj: '12345678000190',
            telefone: '(11) 3333-3333',
            origem: 'LinkedIn',
            status_generico: 'novo_contato',
            nome_empresa: 'TechCorp Solutions Ltda',
            id_empresa: 'TECH001',
            responsavel_encontrado: false,
            falando_com_responsavel: false,
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'tecnologia',
              porte_empresa: 'media',
              budget_disponivel: 150000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Maria Santos - Ind. XYZ',
            cpf_cnpj: '23456789000101',
            telefone: '(11) 4444-4444',
            origem: 'Site',
            status_generico: 'qualificacao_inicial',
            nome_empresa: 'Indústria XYZ Ltda',
            id_empresa: 'IND001',
            responsavel_encontrado: true,
            falando_com_responsavel: false,
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'industria',
              porte_empresa: 'grande',
              budget_disponivel: 250000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Carlos Oliveira - HealthCare',
            cpf_cnpj: '34567890000112',
            telefone: '(21) 5555-5555',
            origem: 'Evento',
            status_generico: 'contato_decisor',
            nome_empresa: 'Health Care Plus S.A.',
            id_empresa: 'HEALTH001',
            responsavel_encontrado: true,
            falando_com_responsavel: true,
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'saude',
              porte_empresa: 'media',
              budget_disponivel: 80000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Ana Costa - EduTech',
            cpf_cnpj: '45678901000123',
            telefone: '(31) 6666-6666',
            origem: 'Indicação',
            status_generico: 'contato_decisor',
            nome_empresa: 'EduTech Brasil Ltda',
            id_empresa: 'EDU001',
            responsavel_encontrado: true,
            falando_com_responsavel: true,
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'educacao',
              porte_empresa: 'pequena',
              budget_disponivel: 60000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Roberto Lima - Comercial ABC',
            cpf_cnpj: '56789012000134',
            telefone: '(21) 7777-7777',
            origem: 'Cold Calling',
            status_generico: 'apresentacao_realizada',
            nome_empresa: 'Comercial ABC S.A.',
            id_empresa: 'COM001',
            responsavel_encontrado: true,
            falando_com_responsavel: false,
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'varejo',
              porte_empresa: 'media',
              budget_disponivel: 90000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Consultoria Premium',
            telefone: '(85) 8888-8888',
            origem: 'LinkedIn',
            status_generico: 'proposta_enviada',
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'servicos',
              porte_empresa: 'pequena',
              budget_disponivel: 120000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'FinanceGroup Corp',
            telefone: '(11) 9999-9999',
            origem: 'Indicação',
            status_generico: 'negociacao',
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'financeiro',
              porte_empresa: 'grande',
              budget_disponivel: 300000.00
            }
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Grupo Empresarial Mega',
            telefone: '(85) 1111-1111',
            origem: 'Evento',
            status_generico: 'negocio_fechado',
            tipo_negocio_id: 3,
            dados_personalizados: {
              segmento_empresa: 'industria',
              porte_empresa: 'multinacional',
              budget_disponivel: 500000.00,
              valor_contrato: 480000.00,
              responsavel: 'Especialista B2B'
            }
          }
        ]
      } else {
        // Dados para limpa nome
        sampleLeads = [
          {
            user_id: parseInt(user.id),
            nome_cliente: 'João Silva Santos',
            cpf: '12345678901',
            telefone: '(11) 99999-9999',
            origem: 'WhatsApp',
            status_limpa_nome: 'qualificacao',
            valor_estimado_divida: 15000.00,
            tempo_negativado: '2 anos',
            tipo_consulta_interesse: 'Consulta Rating',
            tipo_negocio_id: 1,
            dados_personalizados: {}
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Maria Oliveira',
            cpf: '98765432100',
            telefone: '(11) 88888-8888',
            origem: 'Site',
            status_limpa_nome: 'pagamento_consulta',
            valor_estimado_divida: 8500.00,
            tempo_negativado: '1 ano e 6 meses',
            tipo_consulta_interesse: 'Consulta Completa',
            valor_pago_consulta: 199.00,
            tipo_negocio_id: 1,
            dados_personalizados: {}
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Carlos Eduardo',
            cpf: '45678912345',
            telefone: '(21) 77777-7777',
            origem: 'Indicação',
            status_limpa_nome: 'consta_divida',
            valor_estimado_divida: 12000.00,
            valor_real_divida: 11547.85,
            valor_pago_consulta: 199.00,
            tempo_negativado: '3 anos',
            tipo_consulta_interesse: 'Limpa Nome',
            orgaos_negativados: ['SPC', 'SERASA', 'Banco do Brasil'],
            tipo_negocio_id: 1,
            dados_personalizados: {}
          },
          {
            user_id: parseInt(user.id),
            nome_cliente: 'Ana Paula Costa',
            cpf: '78912345678',
            telefone: '(31) 66666-6666',
            origem: 'WhatsApp',
            status_limpa_nome: 'cliente_fechado',
            valor_estimado_divida: 20000.00,
            valor_real_divida: 18750.00,
            valor_pago_consulta: 199.00,
            valor_contrato: 2500.00,
            tempo_negativado: '4 anos',
            tipo_consulta_interesse: 'Análise de Crédito',
            vendedor_responsavel: 'Vendedor Principal',
            tipo_negocio_id: 1,
            dados_personalizados: {}
          }
        ]
      }

      console.log('CreateSampleLeads: Inserindo leads:', sampleLeads.length, 'leads')
      console.log('CreateSampleLeads: Dados a inserir:', JSON.stringify(sampleLeads, null, 2))

      const { data, error } = await supabase
        .from('leads')
        .insert(sampleLeads)
        .select()

      console.log('CreateSampleLeads: Resultado da inserção:', { data, error })

      if (error) {
        console.error('CreateSampleLeads: Erro na inserção:', error)
        throw error
      }
      
      console.log('CreateSampleLeads: Leads criados com sucesso!')
      fetchLeads()
    } catch (error) {
      console.error('Erro ao criar leads de exemplo:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const config = generateStatusConfig(status)
    const IconComponent = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const filteredLeads = leads.filter(lead => {
    // Filtro por status
    const statusMatch = statusFilter === 'todos' ||
      (lead.status_generico || lead.status_limpa_nome) === statusFilter
    
    // Filtro por tipo de consulta
    const tipoConsultaMatch = tipoConsultaFilter === 'todos' || 
      (lead.tipo_consulta_interesse && lead.tipo_consulta_interesse.toLowerCase().includes(tipoConsultaFilter.toLowerCase()))
    
    // Filtro por nome e telefone (busca)
    const searchMatch = searchTerm === '' ||
      (lead.nome_cliente && lead.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.telefone && lead.telefone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.cpf && lead.cpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.cpf_cnpj && lead.cpf_cnpj.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.nome_empresa && lead.nome_empresa.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Filtro por data
    let dateMatch = true
    if (startDate && lead.created_at) {
      const leadDate = new Date(lead.created_at)
      const filterStartDate = new Date(startDate)
      dateMatch = dateMatch && leadDate >= filterStartDate
    }
    if (endDate && lead.created_at) {
      const leadDate = new Date(lead.created_at)
      const filterEndDate = new Date(endDate + 'T23:59:59')
      dateMatch = dateMatch && leadDate <= filterEndDate
    }
    
    return statusMatch && tipoConsultaMatch && searchMatch && dateMatch
  })

  const getUniqueConsultaTypes = () => {
    const types = leads
      .map(lead => lead.tipo_consulta_interesse)
      .filter(type => type && type.trim() !== '')
    return [...new Set(types)]
  }

  // Função para calcular métricas avançadas de relatório
  const calculateAdvancedMetrics = (filteredLeads: Lead[]) => {
    const total = filteredLeads.length
    if (total === 0) return {
      tempoMedioResposta: 0,
      taxaResposta: 0,
      taxaSucesso: 0,
      totalContatos: 0,
      contatosComResposta: 0,
      casosSucesso: 0
    }

    // Calcular tempo médio de resposta usando user_lastinteraction quando disponível
    const leadsComResposta = filteredLeads.filter(lead => {
      // Usar user_lastinteraction se disponível, senão usar updated_at
      const hasInteraction = lead.user_lastinteraction ||
        (lead.updated_at && new Date(lead.updated_at) > new Date(lead.created_at || ''))

      const notNewLead = (lead.status_generico || lead.status_limpa_nome) !== 'novo_lead' &&
        (lead.status_generico || lead.status_limpa_nome) !== 'novo_caso' &&
        (lead.status_generico || lead.status_limpa_nome) !== 'novo_contato'

      return lead.created_at && hasInteraction && notNewLead
    })

    const temposResposta = leadsComResposta.map(lead => {
      const criacao = new Date(lead.created_at!)
      // Priorizar user_lastinteraction sobre updated_at para calcular tempo real de resposta do usuário
      const resposta = new Date(lead.user_lastinteraction || lead.updated_at!)
      return (resposta.getTime() - criacao.getTime()) / (1000 * 60 * 60) // em horas
    })

    const tempoMedioResposta = temposResposta.length > 0
      ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length
      : 0

    // Taxa de resposta mais precisa: leads que tiveram user_lastinteraction ou mudança de status
    const leadsComInteracaoUsuario = filteredLeads.filter(lead =>
      lead.user_lastinteraction ||
      ((lead.status_generico || lead.status_limpa_nome) &&
       (lead.status_generico || lead.status_limpa_nome) !== 'novo_lead' &&
       (lead.status_generico || lead.status_limpa_nome) !== 'novo_caso' &&
       (lead.status_generico || lead.status_limpa_nome) !== 'novo_contato')
    )

    const contatosComResposta = leadsComInteracaoUsuario.length
    const taxaResposta = total > 0 ? (contatosComResposta / total * 100) : 0

    // Taxa de sucesso (leads que chegaram ao final do funil com sucesso)
    const casosSucesso = filteredLeads.filter(lead =>
      (lead.status_generico || lead.status_limpa_nome) === 'cliente_fechado' ||
      (lead.status_generico || lead.status_limpa_nome) === 'caso_finalizado' ||
      (userTipoNegocio?.nome === 'previdenciario' && lead.dados_personalizados?.valor_contrato && lead.dados_personalizados.valor_contrato > 0)
    ).length

    const taxaSucesso = total > 0 ? (casosSucesso / total * 100) : 0

    // Taxa específica de interação do usuário (apenas user_lastinteraction)
    const leadsComInteracaoReal = filteredLeads.filter(lead => lead.user_lastinteraction)
    const taxaInteracaoUsuario = total > 0 ? (leadsComInteracaoReal.length / total * 100) : 0

    return {
      tempoMedioResposta: Math.round(tempoMedioResposta * 10) / 10,
      taxaResposta: Math.round(taxaResposta * 10) / 10,
      taxaSucesso: Math.round(taxaSucesso * 10) / 10,
      taxaInteracaoUsuario: Math.round(taxaInteracaoUsuario * 10) / 10,
      totalContatos: total,
      contatosComResposta,
      leadsComInteracaoReal: leadsComInteracaoReal.length,
      casosSucesso
    }
  }

  // Funções para cálculos de relatórios
  const calculateMetrics = (filteredLeads: Lead[]) => {
    const total = filteredLeads.length

    let qualificados, pagouConsulta, constaDivida, clientesFechados

    if (userTipoNegocio?.nome === 'previdenciario') {
      // Métricas para previdenciário
      qualificados = filteredLeads.filter(lead =>
        lead.status_generico === 'analise_viabilidade' ||
        lead.status_generico === 'caso_viavel' ||
        lead.status_generico === 'contrato_enviado' ||
        lead.status_generico === 'contrato_assinado' ||
        lead.status_generico === 'caso_finalizado'
      ).length

      pagouConsulta = filteredLeads.filter(lead =>
        lead.status_generico === 'caso_viavel' ||
        lead.status_generico === 'contrato_enviado' ||
        lead.status_generico === 'contrato_assinado' ||
        lead.status_generico === 'caso_finalizado'
      ).length

      constaDivida = filteredLeads.filter(lead =>
        lead.status_generico === 'contrato_assinado' ||
        lead.status_generico === 'caso_finalizado'
      ).length

      clientesFechados = filteredLeads.filter(lead =>
        lead.status_generico === 'caso_finalizado'
      ).length
    } else if (userTipoNegocio?.nome === 'b2b') {
      // Métricas para B2B
      qualificados = filteredLeads.filter(lead =>
        lead.status_generico === 'qualificacao_inicial' ||
        lead.status_generico === 'mapeando_decisor' ||
        lead.status_generico === 'contato_decisor' ||
        lead.status_generico === 'apresentacao_realizada' ||
        lead.status_generico === 'proposta_enviada' ||
        lead.status_generico === 'negociacao' ||
        lead.status_generico === 'negocio_fechado'
      ).length

      pagouConsulta = filteredLeads.filter(lead =>
        lead.status_generico === 'apresentacao_realizada' ||
        lead.status_generico === 'proposta_enviada' ||
        lead.status_generico === 'negociacao' ||
        lead.status_generico === 'negocio_fechado'
      ).length

      constaDivida = filteredLeads.filter(lead =>
        lead.status_generico === 'proposta_enviada' ||
        lead.status_generico === 'negociacao' ||
        lead.status_generico === 'negocio_fechado'
      ).length

      clientesFechados = filteredLeads.filter(lead =>
        lead.status_generico === 'negocio_fechado'
      ).length
    } else {
      // Métricas para limpa nome (estrutura original)
      qualificados = filteredLeads.filter(lead => (lead.status_generico || lead.status_limpa_nome) !== 'desqualificado').length
      pagouConsulta = filteredLeads.filter(lead => lead.valor_pago_consulta && lead.valor_pago_consulta > 0).length
      constaDivida = filteredLeads.filter(lead => (lead.status_generico || lead.status_limpa_nome) === 'consta_divida').length
      clientesFechados = filteredLeads.filter(lead => (lead.status_generico || lead.status_limpa_nome) === 'cliente_fechado').length
    }
    
    const receitaConsultas = userTipoNegocio?.nome === 'previdenciario'
      ? filteredLeads
          .filter(lead => lead.dados_personalizados?.valor_consulta)
          .reduce((acc, lead) => acc + (lead.dados_personalizados?.valor_consulta || 0), 0)
      : filteredLeads
          .filter(lead => lead.valor_pago_consulta)
          .reduce((acc, lead) => acc + (lead.valor_pago_consulta || 0), 0)

    const receitaContratos = userTipoNegocio?.nome === 'previdenciario'
      ? filteredLeads
          .filter(lead => lead.dados_personalizados?.valor_contrato)
          .reduce((acc, lead) => acc + (lead.dados_personalizados?.valor_contrato || 0), 0)
      : filteredLeads
          .filter(lead => lead.valor_contrato)
          .reduce((acc, lead) => acc + (lead.valor_contrato || 0), 0)
    
    const ticketMedio = clientesFechados > 0 ? receitaContratos / clientesFechados : 0

    return {
      total,
      qualificados,
      pagouConsulta,
      constaDivida,
      clientesFechados,
      receitaConsultas,
      receitaContratos,
      ticketMedio,
      conversaoQualificacao: total > 0 ? (qualificados / total * 100) : 0,
      conversaoPagamento: qualificados > 0 ? (pagouConsulta / qualificados * 100) : 0,
      conversaoDivida: pagouConsulta > 0 ? (constaDivida / pagouConsulta * 100) : 0,
      conversaoFechamento: constaDivida > 0 ? (clientesFechados / constaDivida * 100) : 0
    }
  }

  const getFilteredLeadsForReport = () => {
    return leads.filter(lead => {
      const campanhaMatch = !reportFilters.campanha || 
        (lead.nome_campanha && lead.nome_campanha.toLowerCase().includes(reportFilters.campanha.toLowerCase()))
      
      const origemMatch = reportFilters.origemFilter === 'todos' || lead.origem === reportFilters.origemFilter
      const statusMatch = reportFilters.statusRelatorio === 'todos' ||
        (lead.status_generico || lead.status_limpa_nome) === reportFilters.statusRelatorio
      const tipoConsultaMatch = reportFilters.tipoConsultaRelatorio === 'todos' || lead.tipo_consulta_interesse === reportFilters.tipoConsultaRelatorio
      
      const cnpjMatch = !reportFilters.cnpj ||
        (lead.cpf && lead.cpf.replace(/\D/g, '').includes(reportFilters.cnpj.replace(/\D/g, ''))) ||
        (lead.cpf_cnpj && lead.cpf_cnpj.replace(/\D/g, '').includes(reportFilters.cnpj.replace(/\D/g, '')))
      
      let valorMatch = true
      if (reportFilters.valorMinimo && lead.valor_estimado_divida) {
        valorMatch = valorMatch && lead.valor_estimado_divida >= parseFloat(reportFilters.valorMinimo)
      }
      if (reportFilters.valorMaximo && lead.valor_estimado_divida) {
        valorMatch = valorMatch && lead.valor_estimado_divida <= parseFloat(reportFilters.valorMaximo)
      }

      let dateMatch = true
      if (reportFilters.dataInicioRelatorio && lead.created_at) {
        const leadDate = new Date(lead.created_at)
        const filterStartDate = new Date(reportFilters.dataInicioRelatorio)
        dateMatch = dateMatch && leadDate >= filterStartDate
      }
      if (reportFilters.dataFimRelatorio && lead.created_at) {
        const leadDate = new Date(lead.created_at)
        const filterEndDate = new Date(reportFilters.dataFimRelatorio + 'T23:59:59')
        dateMatch = dateMatch && leadDate <= filterEndDate
      }
      
      return campanhaMatch && origemMatch && statusMatch && tipoConsultaMatch && cnpjMatch && valorMatch && dateMatch
    })
  }

  // Função para renderizar campos personalizados
  const renderCustomFields = (lead: Lead) => {
    if (!lead.dados_personalizados) {
      return <div className="text-gray-500 text-sm">Nenhum campo personalizado</div>
    }

    try {
      const leadData = typeof lead.dados_personalizados === 'string'
        ? JSON.parse(lead.dados_personalizados)
        : lead.dados_personalizados

      // Se não há dados, mostrar mensagem
      if (!leadData || Object.keys(leadData).length === 0) {
        return <div className="text-gray-500 text-sm">Nenhum campo personalizado</div>
      }

      // Mapeamento de labels bonitos para os campos
      const fieldLabels: Record<string, string> = {
        'tipo_servico': 'Tipo de Serviço',
        'tipo_acidente': 'Tipo de Acidente',
        'situacao_atual': 'Situação Atual',
        'valor_estimado_caso': 'Valor Estimado do Caso',
        'segmento_empresa': 'Segmento da Empresa',
        'porte_empresa': 'Porte da Empresa',
        'budget_disponivel': 'Budget Disponível',
        'contrato_assinado': 'Contrato Assinado',
        'beneficios_interesse': 'Benefícios de Interesse',
        'tempo_negativado': 'Tempo Negativado',
        'orgaos_negativados': 'Órgãos Negativados'
      }

      return (
        <div className="space-y-3">
          {Object.entries(leadData).map(([key, value]) => {
            if (!value) return null

            const label = fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

            return (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 font-medium">{label}:</span>
                <span className="text-gray-900">
                  {typeof value === 'number' && key.includes('valor')
                    ? `R$ ${value.toLocaleString('pt-BR')}`
                    : Array.isArray(value)
                    ? value.join(', ')
                    : String(value)}
                </span>
              </div>
            )
          })}
        </div>
      )
    } catch (error) {
      console.error('Erro ao processar dados personalizados:', error)
      return <div className="text-gray-500 text-sm">Erro ao carregar dados personalizados</div>
    }
  }

  // Função para salvar edição do lead
  const saveLeadEdition = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(editLeadData)
        .eq('id', editLeadData.id)

      if (error) {
        console.error('Erro ao salvar lead:', error)
        return
      }

      // Atualizar estado local
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === editLeadData.id
            ? { ...lead, ...editLeadData }
            : lead
        )
      )

      // Atualizar lead selecionado
      setSelectedLead({ ...selectedLead, ...editLeadData })
      setIsEditingLead(false)

    } catch (error) {
      console.error('Erro ao salvar lead:', error)
    }
  }

  // Função para mover lead entre estágios
  const moveLeadToStatus = async (leadId: number, newStatus: string) => {
    try {
      const statusField = userTipoNegocio?.nome === 'b2b' ? 'status_generico' : 'status_limpa_nome'

      const { error } = await supabase
        .from('leads')
        .update({ [statusField]: newStatus })
        .eq('id', leadId)

      if (error) {
        console.error('Erro ao mover lead:', error)
        return
      }

      // Atualizar estado local
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId
            ? { ...lead, [statusField]: newStatus }
            : lead
        )
      )
    } catch (error) {
      console.error('Erro ao mover lead:', error)
    }
  }

  const renderKanbanView = () => {
    const relevantStatuses = getRelevantStatuses()
    const statusGroups = relevantStatuses.map((status: string) => ({
      status,
      config: generateStatusConfig(status),
      leads: filteredLeads.filter(lead => (lead.status_generico || lead.status_limpa_nome) === status)
    }))

    // Debug: verificar se selectedLead está definido
    console.log('Selected lead no Kanban:', selectedLead?.nome_cliente || 'nenhum')

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {statusGroups.map(({ status, config, leads: statusLeads }: { status: string, config: any, leads: any[] }) => (
          <div
            key={status}
            className="flex-shrink-0 w-80"
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverStatus(status)
            }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => {
              e.preventDefault()
              if (draggedLead && draggedLead.id) {
                const currentStatus = draggedLead.status_generico || draggedLead.status_limpa_nome
                if (currentStatus !== status) {
                  moveLeadToStatus(draggedLead.id, status)
                }
              }
              setDraggedLead(null)
              setDragOverStatus(null)
            }}
          >
            <div className={`bg-white rounded-lg shadow transition-all duration-200 ${
              dragOverStatus === status ? 'ring-2 ring-blue-400 bg-blue-50' : ''
            }`}>
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <config.icon className="h-5 w-5 text-gray-500" />
                    <h3 className="font-medium text-gray-900">{config.label}</h3>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {statusLeads.length}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {statusLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedLead(lead)}
                    onDragEnd={() => {
                      setDraggedLead(null)
                      setDragOverStatus(null)
                    }}
                    className={`rounded-lg p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                      selectedLead?.id === lead.id ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-50'
                    } ${
                      draggedLead?.id === lead.id ? 'opacity-50 scale-95' : 'hover:bg-gray-100 hover:shadow-md'
                    }`}
                    style={{ borderLeftColor: config.color.includes('blue') ? '#3B82F6' :
                             config.color.includes('yellow') ? '#F59E0B' :
                             config.color.includes('red') ? '#EF4444' :
                             config.color.includes('purple') ? '#8B5CF6' :
                             config.color.includes('orange') ? '#F97316' :
                             config.color.includes('indigo') ? '#6366F1' : '#10B981' }}
                    onClick={() => {
                      console.log('Card clicado:', lead.nome_cliente, lead.id)
                      setSelectedLead(lead)
                      setShowLeadModal(true)
                    }}
                  >
                    <div className="space-y-3">
                      {/* Cabeçalho do card com indicadores visuais */}
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight">
                          {lead.nome_cliente || 'Nome não informado'}
                        </h4>
                        <div className="flex items-center space-x-2 ml-2">
                          <div className="flex space-x-1">
                            {lead.existe_whatsapp && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="WhatsApp disponível"></div>
                            )}
                            {lead.folowup_solicitado && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full" title="Follow-up solicitado"></div>
                            )}
                            {lead.Agente_ID && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Agente atribuído"></div>
                            )}
                            {userTipoNegocio?.nome === 'b2b' && lead.responsavel_encontrado && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full" title="Responsável encontrado"></div>
                            )}
                            {userTipoNegocio?.nome === 'b2b' && lead.falando_com_responsavel && (
                              <div className="w-2 h-2 bg-red-500 rounded-full" title="Falando com responsável"></div>
                            )}
                          </div>
                          {/* Toggle Atendimento IA */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleAtendimentoFinalizado(lead.id, lead.atendimentofinalizado)
                            }}
                            className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              lead.atendimentofinalizado
                                ? 'bg-red-500'
                                : 'bg-green-500'
                            }`}
                            title={lead.atendimentofinalizado ? 'IA Desativada (Clique para ativar)' : 'IA Ativa (Clique para desativar)'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                lead.atendimentofinalizado ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          {/* Botão de Edição */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLead(lead)
                              setEditLeadData(lead)
                              setIsEditingLead(true)
                              setShowLeadModal(true)
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar lead"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Informações de contato */}
                      {lead.telefone && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{lead.telefone}</span>
                        </div>
                      )}

                      {/* Informações do negócio */}
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Origem:</span>
                          <span className="text-gray-900 font-medium">{lead.origem || '-'}</span>
                        </div>

                        {/* Informações específicas para B2B */}
                        {userTipoNegocio?.nome === 'b2b' && (
                          <>
                            {lead.nome_empresa && (
                              <div className="flex items-center justify-between">
                                <span>Empresa:</span>
                                <span className="text-gray-900 font-medium text-right text-xs truncate ml-1" title={lead.nome_empresa}>
                                  {lead.nome_empresa.length > 12 ? `${lead.nome_empresa.substring(0, 12)}...` : lead.nome_empresa}
                                </span>
                              </div>
                            )}
                            {lead.cpf_cnpj && (
                              <div className="flex items-center justify-between">
                                <span>{(lead.nome_empresa || (lead.cpf_cnpj && lead.cpf_cnpj.includes('/'))) ? 'CNPJ:' : 'CPF:'}</span>
                                <span className="text-gray-900 font-medium">{lead.cpf_cnpj}</span>
                              </div>
                            )}
                          </>
                        )}

                        {lead.nome_campanha && (
                          <div className="flex items-center justify-between">
                            <span>Campanha:</span>
                            <span className="text-gray-900 font-medium text-right text-xs truncate ml-1" title={lead.nome_campanha}>
                              {lead.nome_campanha.length > 15 ? `${lead.nome_campanha.substring(0, 15)}...` : lead.nome_campanha}
                            </span>
                          </div>
                        )}
                        {lead.Agente_ID && (
                          <div className="flex items-center justify-between">
                            <span>Agente:</span>
                            <span className="text-blue-600 font-medium">{lead.Agente_ID}</span>
                          </div>
                        )}
                      </div>

                      {/* Valor financeiro */}
                      {lead.valor_estimado_divida && (
                        <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                          {formatCurrency(lead.valor_estimado_divida)}
                        </div>
                      )}

                      {/* Follow-up e última interação */}
                      {(lead.data_folowup_solicitado || lead.user_lastinteraction) && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded space-y-1">
                          {lead.data_folowup_solicitado && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-orange-500" />
                              <span>Follow-up: {formatDate(lead.data_folowup_solicitado)}</span>
                            </div>
                          )}
                          {lead.user_lastinteraction && (
                            <div className="flex items-center">
                              <Activity className="h-3 w-3 mr-1 text-gray-400" />
                              <span>Última: {formatDate(lead.user_lastinteraction)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Data de criação */}
                      <div className="text-xs text-gray-400">
                        Criado: {formatDate(lead.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                {statusLeads.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <config.icon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhum lead</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderReportsTab = () => {
    const filteredReportLeads = getFilteredLeadsForReport()
    const metrics = calculateMetrics(filteredReportLeads)
    const advancedMetrics = calculateAdvancedMetrics(filteredReportLeads)

    return (
      <div className="space-y-6">
        {/* Filtros da aba Relatórios */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <FileBarChart className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Filtros de Relatório</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campanha</label>
              <input
                type="text"
                placeholder="Nome da campanha..."
                value={reportFilters.campanha}
                onChange={(e) => setReportFilters(prev => ({ ...prev, campanha: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <select
                value={reportFilters.origemFilter}
                onChange={(e) => setReportFilters(prev => ({ ...prev, origemFilter: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todas</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Site">Site</option>
                <option value="Indicação">Indicação</option>
                <option value="Telefone">Telefone</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Google">Google</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={reportFilters.statusRelatorio}
                onChange={(e) => setReportFilters(prev => ({ ...prev, statusRelatorio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                {getRelevantStatuses().map((status: string) => {
                  const config = generateStatusConfig(status)
                  return (
                    <option key={status} value={status}>{config.label}</option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Consulta</label>
              <select
                value={reportFilters.tipoConsultaRelatorio}
                onChange={(e) => setReportFilters(prev => ({ ...prev, tipoConsultaRelatorio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                {getUniqueConsultaTypes().map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={reportFilters.dataInicioRelatorio}
                onChange={(e) => setReportFilters(prev => ({ ...prev, dataInicioRelatorio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={reportFilters.dataFimRelatorio}
                onChange={(e) => setReportFilters(prev => ({ ...prev, dataFimRelatorio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={reportFilters.cnpj}
                onChange={(e) => setReportFilters(prev => ({ ...prev, cnpj: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={reportFilters.valorMinimo}
                onChange={(e) => setReportFilters(prev => ({ ...prev, valorMinimo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={reportFilters.valorMaximo}
                onChange={(e) => setReportFilters(prev => ({ ...prev, valorMaximo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Exibindo {filteredReportLeads.length} leads dos {leads.length} totais
            </div>
            <button
              onClick={() => setReportFilters({
                campanha: '',
                origemFilter: 'todos',
                statusRelatorio: 'todos',
                tipoConsultaRelatorio: 'todos',
                dataInicioRelatorio: '',
                dataFimRelatorio: '',
                cnpj: '',
                valorMinimo: '',
                valorMaximo: ''
              })}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Indicadores principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{metrics.total}</h3>
                <p className="text-sm text-gray-600">{getMetricsLabels().total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{metrics.qualificados}</h3>
                <p className="text-sm text-gray-600">{getMetricsLabels().qualificados}</p>
                <p className="text-xs text-yellow-600 font-medium">{metrics.conversaoQualificacao.toFixed(1)}% conversão</p>
              </div>
              <Target className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{metrics.pagouConsulta}</h3>
                <p className="text-sm text-gray-600">{getMetricsLabels().pagouConsulta}</p>
                <p className="text-xs text-purple-600 font-medium">{metrics.conversaoPagamento.toFixed(1)}% conversão</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{metrics.clientesFechados}</h3>
                <p className="text-sm text-gray-600">{getMetricsLabels().clientesFechados}</p>
                <p className="text-xs text-green-600 font-medium">{metrics.conversaoFechamento.toFixed(1)}% conversão</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Tempo Médio de Resposta</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{advancedMetrics.tempoMedioResposta}h</p>
            <p className="text-sm text-gray-600">Baseado em {advancedMetrics.contatosComResposta} {userTipoNegocio?.nome === 'previdenciario' ? 'casos com resposta' : 'leads respondidos'}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Taxa de Resposta</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{advancedMetrics.taxaResposta}%</p>
            <p className="text-sm text-gray-600">{advancedMetrics.contatosComResposta} de {advancedMetrics.totalContatos} contatos responderam</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Taxa de Sucesso</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{advancedMetrics.taxaSucesso}%</p>
            <p className="text-sm text-gray-600">{advancedMetrics.casosSucesso} {userTipoNegocio?.nome === 'previdenciario' ? 'casos finalizados' : 'clientes fechados'} com sucesso</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Activity className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Interação do Usuário</h3>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{advancedMetrics.taxaInteracaoUsuario}%</p>
            <p className="text-sm text-gray-600">{advancedMetrics.leadsComInteracaoReal} de {advancedMetrics.totalContatos} leads tiveram interação</p>
          </div>
        </div>

        {/* Funil de conversão */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Activity className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Funil de Conversão</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="font-medium text-gray-900">{getMetricsLabels().total}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900">{metrics.total}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-sm text-gray-600">100%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="font-medium text-gray-900">{getMetricsLabels().qualificados}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900">{metrics.qualificados}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${metrics.conversaoQualificacao}%` }}></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.conversaoQualificacao.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="font-medium text-gray-900">{userTipoNegocio?.nome === 'previdenciario' ? 'Casos Viáveis' : getMetricsLabels().pagouConsulta}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900">{metrics.pagouConsulta}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${metrics.conversaoPagamento}%` }}></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.conversaoPagamento.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="font-medium text-gray-900">{getMetricsLabels().constaDivida}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900">{metrics.constaDivida}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${metrics.conversaoDivida}%` }}></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.conversaoDivida.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="font-medium text-gray-900">{getMetricsLabels().clientesFechados}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900">{metrics.clientesFechados}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics.conversaoFechamento}%` }}></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.conversaoFechamento.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <LayoutGrid className="h-6 w-6 text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Status</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getRelevantStatuses().map((status: string) => {
                const config = generateStatusConfig(status)
                const count = filteredReportLeads.filter(lead =>
                  (lead.status_generico === status) || (lead.status_limpa_nome === status)
                ).length
                const percentage = metrics.total > 0 ? (count / metrics.total * 100) : 0
                const IconComponent = config.icon

                return (
                <div key={status} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{config.label}</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        config.color.includes('blue') ? 'bg-blue-500' :
                        config.color.includes('yellow') ? 'bg-yellow-500' :
                        config.color.includes('red') ? 'bg-red-500' :
                        config.color.includes('purple') ? 'bg-purple-500' :
                        config.color.includes('orange') ? 'bg-orange-500' :
                        config.color.includes('indigo') ? 'bg-indigo-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{percentage.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lista detalhada de leads filtrados */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Leads Filtrados ({filteredReportLeads.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Estimado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredReportLeads.slice(0, 50).map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.nome_cliente || '-'}</div>
                      <div className="text-sm text-gray-500">{lead.cpf || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.telefone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.origem || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lead.status_generico || lead.status_limpa_nome || 'novo_lead')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(lead.valor_estimado_divida)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReportLeads.length > 50 && (
              <div className="px-6 py-4 bg-gray-50 text-sm text-gray-600">
                Mostrando 50 de {filteredReportLeads.length} leads. Use os filtros para refinar sua busca.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando leads...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DNX Operações Inteligentes</h1>
          <p className="text-gray-600 mt-2">
            Gestão completa de leads e relatórios de performance
          </p>
          {userPlanInfo && (
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
                <Crown className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">
                  Plano: {userPlanInfo.plano_nome || 'Personalizado'}
                </span>
              </div>
              {userPlanInfo.limite_leads && (
                <div className="flex items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Limite Leads: {userPlanInfo.limite_leads}
                  </span>
                </div>
              )}
              {userPlanInfo.limite_consultas && (
                <div className="flex items-center bg-purple-50 text-purple-700 px-3 py-2 rounded-lg border border-purple-200">
                  <Search className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Limite Consultas: {userPlanInfo.limite_consultas}
                  </span>
                </div>
              )}
              {userPlanInfo.limite_instancias && (
                <div className="flex items-center bg-orange-50 text-orange-700 px-3 py-2 rounded-lg border border-orange-200">
                  <Activity className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Instâncias: {userPlanInfo.limite_instancias}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        {activeTab === 'leads' && (
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            {/* Toggle de visualização */}
            <div className="flex items-center bg-white rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {leads.length === 0 && (
              <button
                onClick={createSampleLeads}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Criar Leads de Exemplo
              </button>
            )}
            {leads.length > 0 && (
              <button
                onClick={downloadLeadsCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar CSV
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </button>
          </div>
        )}
      </div>

      {/* Sistema de Abas */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('leads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'leads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Gestão de Leads</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('relatorios')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'relatorios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Relatórios</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'leads' ? (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="space-y-4">
              {/* Linha 1: Busca e toggle de filtros */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, telefone ou CPF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros {showFilters ? 'Menos' : 'Mais'}
                </button>
              </div>

              {/* Linha 2: Filtros expandidos */}
              {showFilters && (
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todos">Todos ({leads.length})</option>
                      {getRelevantStatuses().map((status: string) => {
                          const config = generateStatusConfig(status)
                          const count = leads.filter(lead => (lead.status_generico || lead.status_limpa_nome) === status).length
                          return (
                            <option key={status} value={status}>
                              {config.label} ({count})
                            </option>
                          )
                        })}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Tipo Consulta:</span>
                    <select
                      value={tipoConsultaFilter}
                      onChange={(e) => setTipoConsultaFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todos">Todos</option>
                      {getUniqueConsultaTypes().map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Data início:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Data fim:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('todos')
                      setTipoConsultaFilter('todos')
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

              {/* Resumo dos resultados */}
              <div className="text-sm text-gray-600">
                {filteredLeads.length !== leads.length && (
                  <span>Mostrando {filteredLeads.length} de {leads.length} leads</span>
                )}
                {filteredLeads.length === leads.length && (
                  <span>Total: {leads.length} leads</span>
                )}
              </div>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
              <p className="text-gray-600 mb-4">
                Comece criando seus primeiros leads ou importe leads de exemplo.
              </p>
              <button
                onClick={createSampleLeads}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Leads de Exemplo
              </button>
            </div>
          ) : (
            <>
              {viewMode === 'kanban' ? (
                <div>
                  {renderKanbanView()}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Lista de Leads */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                          Leads ({filteredLeads.length})
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                        {filteredLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                            onClick={() => setSelectedLead(lead)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {lead.nome_cliente || 'Nome não informado'}
                                  </h4>
                                  {/* Toggle Atendimento IA */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleAtendimentoFinalizado(lead.id, lead.atendimentofinalizado)
                                    }}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      lead.atendimentofinalizado
                                        ? 'bg-red-500'
                                        : 'bg-green-500'
                                    }`}
                                    title={lead.atendimentofinalizado ? 'IA Desativada (Clique para ativar)' : 'IA Ativa (Clique para desativar)'}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        lead.atendimentofinalizado ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                  {lead.cpf && <div>CPF: {lead.cpf}</div>}
                                  {lead.telefone && (
                                    <div className="flex items-center">
                                      <Phone className="h-4 w-4 mr-1" />
                                      {lead.telefone}
                                    </div>
                                  )}
                                  <div>Origem: {lead.origem || '-'}</div>
                                  {lead.tipo_consulta_interesse && <div>Consulta: {lead.tipo_consulta_interesse}</div>}
                                  {lead.valor_estimado_divida && (
                                    <div className="font-medium text-green-600">
                                      Valor estimado: {formatCurrency(lead.valor_estimado_divida)}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                  <div className="text-xs text-gray-500">
                                    {formatDate(lead.created_at)}
                                  </div>
                                </div>
                              </div>

                              <div className="ml-4">
                                {getStatusBadge(lead.status_generico || lead.status_limpa_nome || 'novo_lead')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Lead */}
                  <div className="lg:col-span-1">
                    {selectedLead ? (
                      <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">
                            Detalhes do Lead
                          </h3>
                          {!isEditingLead ? (
                            <button
                              onClick={() => startEditingLead(selectedLead)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              Editar
                            </button>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={saveEditedLead}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={cancelEditingLead}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6 space-y-6">
                          {/* Status atual */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Status Atual</h4>
                            {!isEditingLead ? (
                              getStatusBadge(selectedLead.status_generico || selectedLead.status_limpa_nome || 'novo_lead')
                            ) : (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Alterar Status</label>
                                <select
                                  value={editLeadData.status_generico || editLeadData.status_limpa_nome || ''}
                                  onChange={(e) => {
                                    const newStatus = e.target.value
                                    if (userTipoNegocio?.nome === 'b2b') {
                                      setEditLeadData((prev: any) => ({ ...prev, status_generico: newStatus, status_limpa_nome: null }))
                                    } else if (userTipoNegocio?.nome === 'previdenciario') {
                                      setEditLeadData((prev: any) => ({ ...prev, status_generico: newStatus, status_limpa_nome: null }))
                                    } else {
                                      setEditLeadData((prev: any) => ({ ...prev, status_limpa_nome: newStatus, status_generico: null }))
                                    }
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {userTipoNegocio?.nome === 'b2b' && (
                                    <>
                                      <option value="novo_contato">Novo Contato</option>
                                      <option value="qualificacao_inicial">Qualificação Inicial</option>
                                      <option value="mapeando_decisor">Mapeando Decisor</option>
                                      <option value="contato_decisor">Contato Decisor</option>
                                      <option value="apresentacao_realizada">Apresentação Realizada</option>
                                      <option value="proposta_enviada">Proposta Enviada</option>
                                      <option value="negociacao">Negociação</option>
                                      <option value="negocio_fechado">Negócio Fechado</option>
                                    </>
                                  )}
                                  {userTipoNegocio?.nome === 'previdenciario' && (
                                    <>
                                      <option value="novo_caso">Novo Caso</option>
                                      <option value="analise_viabilidade">Análise Viabilidade</option>
                                      <option value="caso_viavel">Caso Viável</option>
                                      <option value="caso_inviavel">Caso Inviável</option>
                                      <option value="contrato_enviado">Contrato Enviado</option>
                                      <option value="contrato_assinado">Contrato Assinado</option>
                                      <option value="processo_iniciado">Processo Iniciado</option>
                                      <option value="caso_finalizado">Caso Finalizado</option>
                                    </>
                                  )}
                                  {(!userTipoNegocio?.nome || userTipoNegocio?.nome === 'limpa_nome') && (
                                    <>
                                      <option value="novo_lead">Novo Lead</option>
                                      <option value="qualificacao">Qualificação</option>
                                      <option value="desqualificado">Desqualificado</option>
                                      <option value="pagamento_consulta">Pagamento Consulta</option>
                                      <option value="nao_consta_divida">Não Consta Dívida</option>
                                      <option value="consta_divida">Consta Dívida</option>
                                      <option value="enviado_para_negociacao">Em Negociação</option>
                                      <option value="cliente_fechado">Cliente Fechado</option>
                                    </>
                                  )}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Informações básicas */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Informações Pessoais
                            </h4>
                            {!isEditingLead ? (
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">Nome:</span> <span className="ml-2 text-gray-900">{selectedLead.nome_cliente || '-'}</span></div>
                                {(selectedLead.nome_empresa || (selectedLead.cpf_cnpj && selectedLead.cpf_cnpj.includes('/'))) ? (
                                  <div><span className="text-gray-500">CNPJ:</span> <span className="ml-2 text-gray-900">{selectedLead.cpf_cnpj || '-'}</span></div>
                                ) : (
                                  <div><span className="text-gray-500">CPF:</span> <span className="ml-2 text-gray-900">{selectedLead.cpf_cnpj || selectedLead.cpf || '-'}</span></div>
                                )}
                                <div><span className="text-gray-500">Telefone:</span> <span className="ml-2 text-gray-900">{selectedLead.telefone || '-'}</span></div>
                                <div><span className="text-gray-500">Origem:</span> <span className="ml-2 text-gray-900">{selectedLead.origem || '-'}</span></div>
                                {selectedLead.Agente_ID && <div><span className="text-gray-500">Agente ID:</span> <span className="ml-2 text-gray-900">{selectedLead.Agente_ID}</span></div>}
                                {selectedLead.nome_campanha && <div><span className="text-gray-500">Campanha:</span> <span className="ml-2 text-gray-900">{selectedLead.nome_campanha}</span></div>}
                                <div><span className="text-gray-500">WhatsApp:</span> <span className="ml-2 text-gray-900">{selectedLead.existe_whatsapp ? 'Sim' : 'Não'}</span></div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                  <input
                                    type="text"
                                    value={editLeadData.nome_cliente || ''}
                                    onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, nome_cliente: e.target.value }))}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                {userTipoNegocio?.nome === 'b2b' ? (
                                  <>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ</label>
                                      <input
                                        type="text"
                                        value={editLeadData.cpf_cnpj || ''}
                                        onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, cpf_cnpj: e.target.value }))}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="00.000.000/0001-00"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Nome da Empresa</label>
                                      <input
                                        type="text"
                                        value={editLeadData.nome_empresa || ''}
                                        onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, nome_empresa: e.target.value }))}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                                    <input
                                      type="text"
                                      value={editLeadData.cpf || ''}
                                      onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, cpf: e.target.value }))}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="000.000.000-00"
                                    />
                                  </div>
                                )}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                                  <input
                                    type="text"
                                    value={editLeadData.telefone || ''}
                                    onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, telefone: e.target.value }))}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="(11) 99999-9999"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Origem</label>
                                  <select
                                    value={editLeadData.origem || ''}
                                    onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, origem: e.target.value }))}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Selecione</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Site">Site</option>
                                    <option value="Indicação">Indicação</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Cold Calling">Cold Calling</option>
                                    <option value="Evento">Evento</option>
                                    <option value="Outros">Outros</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Agente ID</label>
                                  <input
                                    type="text"
                                    value={editLeadData.Agente_ID || ''}
                                    onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, Agente_ID: e.target.value }))}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Campanha</label>
                                  <input
                                    type="text"
                                    value={editLeadData.nome_campanha || ''}
                                    onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, nome_campanha: e.target.value }))}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                                  <select
                                    value={editLeadData.existe_whatsapp ? 'true' : 'false'}
                                    onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, existe_whatsapp: e.target.value === 'true' }))}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="false">Não</option>
                                    <option value="true">Sim</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Informações B2B */}
                          {(selectedLead.nome_empresa || selectedLead.responsavel_encontrado !== null || selectedLead.falando_com_responsavel !== null || userTipoNegocio?.nome === 'b2b') && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Informações Empresariais
                              </h4>
                              {!isEditingLead ? (
                                <div className="space-y-2 text-sm">
                                  {selectedLead.nome_empresa && (
                                    <div><span className="text-gray-500">Empresa:</span> <span className="ml-2 text-gray-900">{selectedLead.nome_empresa}</span></div>
                                  )}
                                  {selectedLead.responsavel_encontrado !== null && (
                                    <div>
                                      <span className="text-gray-500">Responsável encontrado:</span>
                                      <span className={`ml-2 font-medium ${selectedLead.responsavel_encontrado ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedLead.responsavel_encontrado ? 'Sim' : 'Não'}
                                      </span>
                                    </div>
                                  )}
                                  {selectedLead.falando_com_responsavel !== null && (
                                    <div>
                                      <span className="text-gray-500">Falando com responsável:</span>
                                      <span className={`ml-2 font-medium ${selectedLead.falando_com_responsavel ? 'text-green-600' : 'text-orange-600'}`}>
                                        {selectedLead.falando_com_responsavel ? 'Sim' : 'Não'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Responsável encontrado</label>
                                    <select
                                      value={editLeadData.responsavel_encontrado ? 'true' : 'false'}
                                      onChange={(e) => setEditLeadData((prev: any) => ({
                                        ...prev,
                                        responsavel_encontrado: e.target.value === 'true'
                                      }))}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="false">Não</option>
                                      <option value="true">Sim</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Falando com responsável</label>
                                    <select
                                      value={editLeadData.falando_com_responsavel ? 'true' : 'false'}
                                      onChange={(e) => setEditLeadData((prev: any) => ({
                                        ...prev,
                                        falando_com_responsavel: e.target.value === 'true'
                                      }))}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="false">Não</option>
                                      <option value="true">Sim</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Informações financeiras */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Informações Financeiras
                            </h4>
                            <div className="space-y-2 text-sm">
                              {userTipoNegocio?.nome === 'previdenciario' ? (
                                <>
                                  {selectedLead.dados_personalizados?.valor_estimado_caso && <div><span className="text-gray-500">Valor estimado do caso:</span> <span className="ml-2 text-gray-900">{formatCurrency(selectedLead.dados_personalizados.valor_estimado_caso)}</span></div>}
                                  {selectedLead.dados_personalizados?.valor_consulta && <div><span className="text-gray-500">Valor consulta:</span> <span className="ml-2 text-blue-600 font-medium">{formatCurrency(selectedLead.dados_personalizados.valor_consulta)}</span></div>}
                                  {selectedLead.dados_personalizados?.valor_contrato && <div><span className="text-gray-500">Valor contrato:</span> <span className="ml-2 text-green-600 font-medium">{formatCurrency(selectedLead.dados_personalizados.valor_contrato)}</span></div>}
                                </>
                              ) : (
                                <>
                                  {selectedLead.valor_estimado_divida && <div><span className="text-gray-500">Valor estimado:</span> <span className="ml-2 text-gray-900">{formatCurrency(selectedLead.valor_estimado_divida)}</span></div>}
                                  {selectedLead.valor_real_divida && <div><span className="text-gray-500">Valor real:</span> <span className="ml-2 text-gray-900">{formatCurrency(selectedLead.valor_real_divida)}</span></div>}
                                  {selectedLead.valor_pago_consulta && <div><span className="text-gray-500">Consulta paga:</span> <span className="ml-2 text-gray-900">{formatCurrency(selectedLead.valor_pago_consulta)}</span></div>}
                                  {selectedLead.valor_contrato && <div><span className="text-gray-500">Valor contrato:</span> <span className="ml-2 text-green-600 font-medium">{formatCurrency(selectedLead.valor_contrato)}</span></div>}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Informações específicas */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Detalhes Específicos</h4>
                            <div className="space-y-2 text-sm">
                              {userTipoNegocio?.nome === 'previdenciario' ? (
                                <>
                                  {selectedLead.dados_personalizados?.tipo_acidente && <div><span className="text-gray-500">Tipo de acidente:</span> <span className="ml-2 text-gray-900">{selectedLead.dados_personalizados.tipo_acidente}</span></div>}
                                  {selectedLead.dados_personalizados?.situacao_atual && <div><span className="text-gray-500">Situação atual:</span> <span className="ml-2 text-gray-900">{selectedLead.dados_personalizados.situacao_atual}</span></div>}
                                  {selectedLead.dados_personalizados?.tipo_servico && <div><span className="text-gray-500">Tipo de serviço:</span> <span className="ml-2 text-gray-900">{selectedLead.dados_personalizados.tipo_servico}</span></div>}
                                  {selectedLead.dados_personalizados?.responsavel && <div><span className="text-gray-500">Responsável:</span> <span className="ml-2 text-gray-900">{selectedLead.dados_personalizados.responsavel}</span></div>}
                                </>
                              ) : (
                                <>
                                  {selectedLead.tempo_negativado && <div><span className="text-gray-500">Tempo negativado:</span> <span className="ml-2 text-gray-900">{selectedLead.tempo_negativado}</span></div>}
                                  {selectedLead.tipo_consulta_interesse && <div><span className="text-gray-500">Tipo consulta:</span> <span className="ml-2 text-gray-900">{selectedLead.tipo_consulta_interesse}</span></div>}
                                  {selectedLead.motivo_desqualificacao && <div><span className="text-gray-500">Motivo desqualificação:</span> <span className="ml-2 text-red-600">{selectedLead.motivo_desqualificacao}</span></div>}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Informações de Follow-up e Contato */}
                          {(selectedLead.folowup_solicitado || selectedLead.data_folowup_solicitado || selectedLead.status_disparo || selectedLead.user_lastinteraction) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Agendamentos e Contatos
                              </h4>
                              <div className="space-y-2 text-sm">
                                {selectedLead.folowup_solicitado && (
                                  <div><span className="text-gray-500">Follow-up solicitado:</span> <span className="ml-2 text-green-600 font-medium">Sim</span></div>
                                )}
                                {selectedLead.data_folowup_solicitado && (
                                  <div><span className="text-gray-500">Data follow-up:</span> <span className="ml-2 text-gray-900">{formatDate(selectedLead.data_folowup_solicitado)}</span></div>
                                )}
                                {selectedLead.status_disparo && (
                                  <div><span className="text-gray-500">Status disparo:</span> <span className="ml-2 text-gray-900">{selectedLead.status_disparo}</span></div>
                                )}
                                {selectedLead.user_lastinteraction && (
                                  <div><span className="text-gray-500">Última interação:</span> <span className="ml-2 text-gray-900">{formatDate(selectedLead.user_lastinteraction)}</span></div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Órgãos negativados */}
                          {selectedLead.orgaos_negativados && selectedLead.orgaos_negativados.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Órgãos Negativados</h4>
                              <div className="flex flex-wrap gap-1">
                                {selectedLead.orgaos_negativados.map((orgao, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                                    {orgao}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-center text-gray-500">
                          <User className="h-12 w-12 mx-auto mb-4" />
                          <p>Selecione um lead da lista para ver os detalhes</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        renderReportsTab()
      )}

      {/* Modal de detalhes do lead */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-white">
                  <User className="h-6 w-6 mr-3" />
                  <div>
                    <h2 className="text-xl font-semibold">{selectedLead.nome_cliente || 'Lead Selecionado'}</h2>
                    <p className="text-blue-100 text-sm">{userTipoNegocio?.nome_exibicao}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {!isEditingLead && (
                    <button
                      onClick={() => {
                        setEditLeadData(selectedLead)
                        setIsEditingLead(true)
                      }}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowLeadModal(false)
                      setSelectedLead(null)
                      setIsEditingLead(false)
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {!isEditingLead ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Informações Pessoais */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-600" />
                      Informações Pessoais
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Nome:</span>
                        <span className="text-gray-900">{selectedLead.nome_cliente || '-'}</span>
                      </div>
                      {selectedLead.cpf && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">CPF:</span>
                          <span className="text-gray-900">{selectedLead.cpf}</span>
                        </div>
                      )}
                      {selectedLead.cpf_cnpj && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">{selectedLead.nome_empresa ? 'CNPJ:' : 'CPF/CNPJ:'}</span>
                          <span className="text-gray-900">{selectedLead.cpf_cnpj}</span>
                        </div>
                      )}
                      {selectedLead.nome_empresa && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Empresa:</span>
                          <span className="text-gray-900">{selectedLead.nome_empresa}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Telefone:</span>
                        <span className="text-gray-900">{selectedLead.telefone || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Origem:</span>
                        <span className="text-gray-900">{selectedLead.origem || '-'}</span>
                      </div>
                      <div className="mt-4">
                        <span className="text-gray-600 font-medium">Status:</span>
                        <div className="mt-2">{getStatusBadge(selectedLead.status_generico || selectedLead.status_limpa_nome || 'novo_lead')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Informações Financeiras */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      Informações Financeiras
                    </h4>
                    <div className="space-y-3 text-sm">
                      {selectedLead.valor_estimado_divida ? (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Valor estimado:</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(selectedLead.valor_estimado_divida)}</span>
                        </div>
                      ) : (
                        <div className="text-gray-500">Sem informações financeiras</div>
                      )}
                      {selectedLead.valor_real_divida && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Valor real:</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(selectedLead.valor_real_divida)}</span>
                        </div>
                      )}
                      {selectedLead.valor_pago_consulta && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Consulta paga:</span>
                          <span className="text-blue-600 font-semibold">{formatCurrency(selectedLead.valor_pago_consulta)}</span>
                        </div>
                      )}
                      {selectedLead.valor_contrato && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Valor contrato:</span>
                          <span className="text-green-600 font-bold">{formatCurrency(selectedLead.valor_contrato)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Campos Personalizados */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      Detalhes Específicos
                    </h4>
                    <div className="text-sm">
                      {renderCustomFields(selectedLead)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900">Editando Lead</h4>

                  {/* Status atual */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Status Atual</h4>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Alterar Status</label>
                      <select
                        value={editLeadData.status_generico || editLeadData.status_limpa_nome || ''}
                        onChange={(e) => {
                          const newStatus = e.target.value
                          if (userTipoNegocio?.nome === 'b2b') {
                            setEditLeadData((prev: any) => ({ ...prev, status_generico: newStatus, status_limpa_nome: null }))
                          } else if (userTipoNegocio?.nome === 'previdenciario') {
                            setEditLeadData((prev: any) => ({ ...prev, status_generico: newStatus, status_limpa_nome: null }))
                          } else {
                            setEditLeadData((prev: any) => ({ ...prev, status_limpa_nome: newStatus, status_generico: null }))
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {getRelevantStatuses().map((status: string) => {
                          const config = generateStatusConfig(status)
                          return (
                            <option key={status} value={status}>{config.label}</option>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Informações básicas */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Informações Pessoais
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                        <input
                          type="text"
                          value={editLeadData.nome_cliente || ''}
                          onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, nome_cliente: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {userTipoNegocio?.nome === 'b2b' ? (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ</label>
                            <input
                              type="text"
                              value={editLeadData.cpf_cnpj || ''}
                              onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, cpf_cnpj: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="00.000.000/0001-00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nome da Empresa</label>
                            <input
                              type="text"
                              value={editLeadData.nome_empresa || ''}
                              onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, nome_empresa: e.target.value }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                          <input
                            type="text"
                            value={editLeadData.cpf || editLeadData.cpf_cnpj || ''}
                            onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, cpf: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                        <input
                          type="text"
                          value={editLeadData.telefone || ''}
                          onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, telefone: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Origem</label>
                        <select
                          value={editLeadData.origem || ''}
                          onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, origem: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Site">Site</option>
                          <option value="Indicação">Indicação</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Cold Calling">Cold Calling</option>
                          <option value="Evento">Evento</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Agente ID</label>
                        <input
                          type="text"
                          value={editLeadData.Agente_ID || ''}
                          onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, Agente_ID: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Campanha</label>
                        <input
                          type="text"
                          value={editLeadData.nome_campanha || ''}
                          onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, nome_campanha: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                        <select
                          value={editLeadData.existe_whatsapp ? 'true' : 'false'}
                          onChange={(e) => setEditLeadData((prev: any) => ({ ...prev, existe_whatsapp: e.target.value === 'true' }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="false">Não</option>
                          <option value="true">Sim</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Informações B2B */}
                  {userTipoNegocio?.nome === 'b2b' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Informações Empresariais
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Responsável encontrado</label>
                          <select
                            value={editLeadData.responsavel_encontrado ? 'true' : 'false'}
                            onChange={(e) => setEditLeadData((prev: any) => ({
                              ...prev,
                              responsavel_encontrado: e.target.value === 'true'
                            }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="false">Não</option>
                            <option value="true">Sim</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Falando com responsável</label>
                          <select
                            value={editLeadData.falando_com_responsavel ? 'true' : 'false'}
                            onChange={(e) => setEditLeadData((prev: any) => ({
                              ...prev,
                              falando_com_responsavel: e.target.value === 'true'
                            }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="false">Não</option>
                            <option value="true">Sim</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer com botões quando está editando */}
              {isEditingLead && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditingLead(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveLeadEdition}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de criar lead */}
      {showCreateForm && (
        <CreateLeadModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onLeadCreated={fetchLeads}
          userId={user?.id}
        />
      )}
    </div>
  )
}