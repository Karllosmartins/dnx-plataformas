'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Building, Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface CampoPersonalizado {
  nome: string;
  label: string;
  tipo: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'textarea';
  opcoes?: string[];
  obrigatorio: boolean;
  ajuda?: string;
}

interface MetricasConfig {
  campos_receita: string[];
  campos_conversao: string[];
  metricas_principais: string[];
}

interface TipoNegocio {
  id: number
  nome: string
  nome_exibicao: string
  descricao: string
  icone: string
  cor: string
  campos_personalizados: CampoPersonalizado[];
  status_personalizados: string[];
  metricas_config: MetricasConfig;
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export default function TiposNegocioSection() {
  const [tipos, setTipos] = useState<TipoNegocio[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<number | null>(null)
  const [criandoNovo, setCriandoNovo] = useState(false)
  const [tipoEditando, setTipoEditando] = useState<Partial<TipoNegocio>>({})

  useEffect(() => {
    carregarTipos()
  }, [])

  const carregarTipos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_negocio')
        .select('*')
        .order('ordem', { ascending: true })

      if (error) throw error

      // Converter campos JSON string para objetos
      const tiposProcessados = data?.map(tipo => ({
        ...tipo,
        campos_personalizados: typeof tipo.campos_personalizados === 'string'
          ? JSON.parse(tipo.campos_personalizados)
          : tipo.campos_personalizados || [],
        status_personalizados: typeof tipo.status_personalizados === 'string'
          ? JSON.parse(tipo.status_personalizados)
          : tipo.status_personalizados || [],
        metricas_config: typeof tipo.metricas_config === 'string'
          ? JSON.parse(tipo.metricas_config)
          : tipo.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] }
      })) || [];

      setTipos(tiposProcessados)
    } catch (error) {
      console.error('Erro ao carregar tipos:', error)
    } finally {
      setLoading(false)
    }
  }

  const salvarTipo = async (tipo: Partial<TipoNegocio>) => {
    try {
      if (!tipo.nome || !tipo.nome_exibicao) {
        alert('Nome e Nome de Exibição são obrigatórios')
        return
      }

      if (tipo.id) {
        // Editar
        const { error } = await supabase
          .from('tipos_negocio')
          .update(tipo)
          .eq('id', tipo.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('tipos_negocio')
          .insert([{ ...tipo, ordem: tipos.length + 1 }])

        if (error) throw error
      }

      await carregarTipos()
      setEditando(null)
      setCriandoNovo(false)
      setTipoEditando({})
    } catch (error) {
      console.error('Erro ao salvar tipo:', error)
      alert('Erro ao salvar tipo de negócio')
    }
  }

  const excluirTipo = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de negócio?')) return

    try {
      const { error } = await supabase
        .from('tipos_negocio')
        .delete()
        .eq('id', id)

      if (error) throw error
      await carregarTipos()
    } catch (error) {
      console.error('Erro ao excluir tipo:', error)
      alert('Erro ao excluir tipo de negócio')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building className="h-7 w-7 mr-3 text-blue-600" />
              Tipos de Negócio
            </h1>
            <p className="text-gray-600 mt-1">Configure tipos de negócio e suas características</p>
          </div>
          <button
            onClick={() => {
              setCriandoNovo(true)
              setTipoEditando({
                nome: '',
                nome_exibicao: '',
                descricao: '',
                icone: 'building',
                cor: '#3B82F6',
                campos_personalizados: [],
                status_personalizados: ['novo_lead', 'qualificacao', 'convertido'],
                metricas_config: {
                  campos_receita: [],
                  campos_conversao: [],
                  metricas_principais: []
                },
                ativo: true,
                ordem: tipos.length + 1
              })
            }}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Novo Tipo
          </button>
        </div>
      </div>

      {/* Formulário de Novo Tipo */}
      {criandoNovo && (
        <div className="mb-6">
          <TipoCard
            tipo={{} as TipoNegocio}
            isEditing={true}
            isNew={true}
            onSave={salvarTipo}
            onCancel={() => {
              setCriandoNovo(false)
              setTipoEditando({})
            }}
            editData={tipoEditando}
            setEditData={setTipoEditando}
          />
        </div>
      )}

      {/* Grid de Tipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tipos.map((tipo) => (
          <TipoCard
            key={tipo.id}
            tipo={tipo}
            isEditing={editando === tipo.id}
            onEdit={() => {
              setEditando(tipo.id)
              setTipoEditando(tipo)
            }}
            onSave={salvarTipo}
            onCancel={() => {
              setEditando(null)
              setTipoEditando({})
            }}
            onDelete={() => excluirTipo(tipo.id)}
            editData={tipoEditando}
            setEditData={setTipoEditando}
          />
        ))}
      </div>
    </div>
  )
}

interface TipoCardProps {
  tipo: TipoNegocio
  isEditing: boolean
  isNew?: boolean
  onEdit?: () => void
  onSave: (tipo: Partial<TipoNegocio>) => void
  onCancel: () => void
  onDelete?: () => void
  editData: Partial<TipoNegocio>
  setEditData: (data: Partial<TipoNegocio>) => void
}

function TipoCard({
  tipo,
  isEditing,
  isNew,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  editData,
  setEditData
}: TipoCardProps) {

  const handleSave = () => {
    onSave(editData)
  }

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Header do Card */}
        <div
          className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700"
          style={{
            background: `linear-gradient(135deg, ${tipo.cor} 0%, ${tipo.cor}dd 100%)`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h3 className="text-xl font-bold text-white">{tipo.nome_exibicao}</h3>
                <p className="text-white/80 text-sm">ID: {tipo.nome}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Editar tipo"
              >
                <Edit className="h-4 w-4 text-white" />
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Excluir tipo"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo do Card */}
        <div className="p-5">
          {tipo.descricao && (
            <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
              {tipo.descricao}
            </p>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tipo.campos_personalizados?.length || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Campos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tipo.status_personalizados?.length || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(tipo.metricas_config?.campos_receita?.length || 0) +
                 (tipo.metricas_config?.campos_conversao?.length || 0) +
                 (tipo.metricas_config?.metricas_principais?.length || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Métricas</div>
            </div>
          </div>

          {/* Status e Ordem */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
              tipo.ativo
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {tipo.ativo ? 'Ativo' : 'Inativo'}
            </span>
            <span className="text-sm font-medium text-gray-400">Ordem #{tipo.ordem}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen bg-white">
        {/* Header fixo */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center">
                <Building className="h-7 w-7 mr-3" />
                {isNew ? 'Criar Novo Tipo de Negócio' : 'Editar Tipo de Negócio'}
              </h3>
              <p className="text-blue-100 text-sm mt-1">Preencha as informações abaixo</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="max-w-7xl mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-200">Informações Básicas</h4>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Nome de Exibição *
            </label>
            <input
              type="text"
              value={editData.nome_exibicao || ''}
              onChange={(e) => setEditData({ ...editData, nome_exibicao: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Limpeza de Nome"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              ID do Tipo *
            </label>
            <input
              type="text"
              value={editData.nome || ''}
              onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: limpa_nome"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Descrição
            </label>
            <textarea
              value={editData.descricao || ''}
              onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Descrição do tipo de negócio"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Ícone
              </label>
              <select
                value={editData.icone || 'building'}
                onChange={(e) => setEditData({ ...editData, icone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="building">Building</option>
                <option value="scale">Scale</option>
                <option value="briefcase">Briefcase</option>
                <option value="users">Users</option>
                <option value="home">Home</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Cor
              </label>
              <input
                type="color"
                value={editData.cor || '#3B82F6'}
                onChange={(e) => setEditData({ ...editData, cor: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 h-10 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Ordem
              </label>
              <input
                type="number"
                min="1"
                value={editData.ordem || 1}
                onChange={(e) => setEditData({ ...editData, ordem: parseInt(e.target.value) || 1 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Status
              </label>
              <select
                value={editData.ativo ? 'true' : 'false'}
                onChange={(e) => setEditData({ ...editData, ativo: e.target.value === 'true' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campos Personalizados */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-200">Campos Personalizados</h4>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Configuração dos Campos
            </label>
            <textarea
              placeholder="Em desenvolvimento - Campos personalizados do CRM"
              value=""
              disabled
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        </div>

        {/* Status do Funil */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-200">Status do Funil</h4>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Status Personalizados
            </label>
            <textarea
              placeholder="Status do funil (um por linha)"
              value={editData.status_personalizados?.join('\n') || ''}
              onChange={(e) => setEditData({
                ...editData,
                status_personalizados: e.target.value.split('\n').filter(s => s.trim())
              })}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Ex: novo_lead, qualificacao, convertido
            </p>
          </div>
        </div>

        {/* Configuração de Métricas */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider pb-2 border-b border-gray-200">Métricas</h4>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Campos de Receita
            </label>
            <textarea
              placeholder="Campos de receita (um por linha)"
              value={editData.metricas_config?.campos_receita?.join('\n') || ''}
              onChange={(e) => setEditData({
                ...editData,
                metricas_config: {
                  ...editData.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                  campos_receita: e.target.value.split('\n').filter(s => s.trim())
                }
              })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Campos de Conversão
            </label>
            <textarea
              placeholder="Campos de conversão (um por linha)"
              value={editData.metricas_config?.campos_conversao?.join('\n') || ''}
              onChange={(e) => setEditData({
                ...editData,
                metricas_config: {
                  ...editData.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                  campos_conversao: e.target.value.split('\n').filter(s => s.trim())
                }
              })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Métricas Principais
            </label>
            <textarea
              placeholder="Métricas principais (uma por linha)"
              value={editData.metricas_config?.metricas_principais?.join('\n') || ''}
              onChange={(e) => setEditData({
                ...editData,
                metricas_config: {
                  ...editData.metricas_config || { campos_receita: [], campos_conversao: [], metricas_principais: [] },
                  metricas_principais: e.target.value.split('\n').filter(s => s.trim())
                }
              })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
          </div>
        </div>

        {/* Footer fixo */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-6 py-3 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center transition-colors font-medium"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors font-medium shadow-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Tipo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}