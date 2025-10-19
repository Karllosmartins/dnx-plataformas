'use client'

import { useState, useEffect } from 'react'
import { supabase, Plano } from '../../../lib/supabase'
import { useAuth } from '../../../components/AuthWrapper'
import {
  Crown,
  Users,
  Settings,
  DollarSign,
  Check,
  X,
  Edit,
  Save,
  Plus,
  Trash2
} from 'lucide-react'

export default function PlanosSection() {
  const { user } = useAuth()
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlano, setEditingPlano] = useState<number | null>(null)
  const [showNewPlano, setShowNewPlano] = useState(false)

  useEffect(() => {
    fetchPlanos()
  }, [])

  const fetchPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('nome')

      if (error) throw error
      setPlanos(data || [])
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlano = async (plano: Partial<Plano>) => {
    try {
      const { error } = await supabase
        .from('planos')
        .upsert([plano])

      if (error) throw error

      await fetchPlanos()
      setEditingPlano(null)
      setShowNewPlano(false)
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
      alert('Erro ao salvar plano')
    }
  }

  const handleDeletePlano = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return

    try {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchPlanos()
    } catch (error) {
      console.error('Erro ao excluir plano:', error)
      alert('Erro ao excluir plano')
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
              <Crown className="h-7 w-7 mr-3 text-blue-600" />
              Gerenciamento de Planos
            </h1>
            <p className="text-gray-600 mt-1">Configure planos e permissões de acesso</p>
          </div>
          <button
            onClick={() => setShowNewPlano(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Novo Plano
          </button>
        </div>
      </div>

      {/* Formulário de Novo Plano */}
      {showNewPlano && (
        <div className="mb-6">
          <PlanoCard
            plano={{} as Plano}
            isEditing={true}
            isNew={true}
            onSave={handleSavePlano}
            onCancel={() => setShowNewPlano(false)}
          />
        </div>
      )}

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            isEditing={editingPlano === plano.id}
            onEdit={() => setEditingPlano(plano.id)}
            onSave={handleSavePlano}
            onCancel={() => setEditingPlano(null)}
            onDelete={() => handleDeletePlano(plano.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Componentes auxiliares (copiados da página anterior)
interface PlanoCardProps {
  plano: Plano
  isEditing: boolean
  isNew?: boolean
  onEdit?: () => void
  onSave: (plano: Partial<Plano>) => void
  onCancel: () => void
  onDelete?: () => void
}

function PlanoCard({ plano, isEditing, isNew, onEdit, onSave, onCancel, onDelete }: PlanoCardProps) {
  const [formData, setFormData] = useState(plano)

  useEffect(() => {
    setFormData(plano)
  }, [plano])

  const handleSave = () => {
    onSave(formData)
  }

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Header do Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h3 className="text-xl font-bold text-white capitalize">{plano.nome}</h3>
                <p className="text-blue-100 text-sm">Plano de Acesso</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Editar plano"
              >
                <Edit className="h-4 w-4 text-white" />
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Excluir plano"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo do Card */}
        <div className="p-5">
          {plano.descricao && (
            <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
              {plano.descricao}
            </p>
          )}

          {/* Limites */}
          <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{plano.limite_leads || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{plano.limite_consultas || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Consultas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{plano.limite_instancias || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Instâncias</div>
            </div>
          </div>

          {/* Permissões */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Permissões</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries({
                '📊 Dashboard': plano.acesso_dashboard,
                '👥 CRM': plano.acesso_crm,
                '💬 WhatsApp': plano.acesso_whatsapp,
                '📤 Disparo Simples': plano.acesso_disparo_simples,
                '🤖 Disparo IA': plano.acesso_disparo_ia,
                '🎯 Agentes IA': plano.acesso_agentes_ia,
                '🔍 Extração': plano.acesso_extracao_leads,
                '✨ Enriquecimento': plano.acesso_enriquecimento,
                '🔎 Consulta': plano.acesso_consulta,
                '🔌 Integrações': plano.acesso_integracoes,
                '📁 Arquivos': plano.acesso_arquivos,
                '⚙️ Usuários': plano.acesso_usuarios,
              }).map(([feature, hasAccess]) => (
                <div
                  key={feature}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    hasAccess ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className={hasAccess ? 'text-green-900 font-medium' : 'text-gray-400'}>
                    {feature}
                  </span>
                  {hasAccess ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-300" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nome do Plano
          </label>
          <input
            type="text"
            placeholder="Ex: Premium, Enterprise, etc."
            value={formData.nome || ''}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            placeholder="Descreva as características deste plano"
            value={formData.descricao || ''}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Limites do Plano
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Leads
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData.limite_leads || ''}
                onChange={(e) => setFormData({ ...formData, limite_leads: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Consultas
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData.limite_consultas || ''}
                onChange={(e) => setFormData({ ...formData, limite_consultas: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Instâncias
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData.limite_instancias || ''}
                onChange={(e) => setFormData({ ...formData, limite_instancias: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Selecione as abas que este plano terá acesso:
          </label>
          <div className="space-y-2">
            {[
              { key: 'acesso_dashboard', label: 'Dashboard', icon: '📊' },
              { key: 'acesso_crm', label: 'CRM', icon: '👥' },
              { key: 'acesso_whatsapp', label: 'WhatsApp', icon: '💬' },
              { key: 'acesso_disparo_simples', label: 'Disparo Simples', icon: '📤' },
              { key: 'acesso_disparo_ia', label: 'Disparo com IA', icon: '🤖' },
              { key: 'acesso_agentes_ia', label: 'Agentes IA', icon: '🎯' },
              { key: 'acesso_extracao_leads', label: 'Extração de Leads', icon: '🔍' },
              { key: 'acesso_enriquecimento', label: 'Enriquecimento', icon: '✨' },
              { key: 'acesso_consulta', label: 'Consulta', icon: '🔎' },
              { key: 'acesso_integracoes', label: 'Integrações', icon: '🔌' },
              { key: 'acesso_arquivos', label: 'Arquivos', icon: '📁' },
              { key: 'acesso_usuarios', label: 'Gerenciar Usuários', icon: '⚙️' },
            ].map(({ key, label, icon }) => (
              <label
                key={key}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData[key as keyof Plano]
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData[key as keyof Plano] as boolean}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="ml-3 text-lg">{icon}</span>
                <span className={`ml-2 text-sm font-medium ${
                  formData[key as keyof Plano] ? 'text-green-900' : 'text-gray-700'
                }`}>
                  {label}
                </span>
                {formData[key as keyof Plano] && (
                  <Check className="ml-auto h-4 w-4 text-green-600" />
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Plano
          </button>
        </div>
      </div>
    </div>
  )
}

