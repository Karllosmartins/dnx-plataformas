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
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção de Planos */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Planos Disponíveis
              </h2>
            </div>
            <button
              onClick={() => setShowNewPlano(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Plano
            </button>
          </div>

          <div className="space-y-4">
            {showNewPlano && (
              <PlanoCard
                plano={{} as Plano}
                isEditing={true}
                isNew={true}
                onSave={handleSavePlano}
                onCancel={() => setShowNewPlano(false)}
              />
            )}

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
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Crown className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-semibold text-gray-900 capitalize">{plano.nome}</h3>
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              Plano de Acesso
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit className="h-4 w-4" />
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{plano.descricao}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries({
            'Dashboard': plano.acesso_dashboard,
            'CRM': plano.acesso_crm,
            'WhatsApp': plano.acesso_whatsapp,
            'Disparo Simples': plano.acesso_disparo_simples,
            'Disparo IA': plano.acesso_disparo_ia,
            'Agentes IA': plano.acesso_agentes_ia,
            'Extração': plano.acesso_extracao_leads,
            'Enriquecimento': plano.acesso_enriquecimento,
            'Consulta': plano.acesso_consulta,
            'Usuários': plano.acesso_usuarios,
          }).map(([feature, hasAccess]) => (
            <div key={feature} className="flex items-center">
              {hasAccess ? (
                <Check className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <X className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={hasAccess ? 'text-green-700' : 'text-red-700'}>
                {feature}
              </span>
            </div>
          ))}
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

