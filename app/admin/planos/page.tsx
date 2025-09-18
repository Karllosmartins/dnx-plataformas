'use client'

import { useState, useEffect } from 'react'
import { supabase, Plano, UsuarioComPlano } from '@/lib/supabase'
import { hasFeatureAccess } from '@/lib/permissions'
import { useAuth } from '@/hooks/useAuth'
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

export default function AdminPlanosPage() {
  const { user } = useAuth()
  const [planos, setPlanos] = useState<Plano[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioComPlano[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlano, setEditingPlano] = useState<number | null>(null)
  const [showNewPlano, setShowNewPlano] = useState(false)

  // Verificar se o usuário tem acesso
  if (!user || !hasFeatureAccess(user, 'usuarios')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchPlanos()
    fetchUsuarios()
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
    }
  }

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('view_usuarios_planos')
        .select('*')
        .order('name')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
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

  const handleChangeUserPlan = async (userId: number, planoId: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ plano_id: planoId })
        .eq('id', userId)

      if (error) throw error

      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao alterar plano do usuário:', error)
      alert('Erro ao alterar plano do usuário')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Crown className="h-8 w-8 mr-3 text-yellow-500" />
                Administração de Planos
              </h1>
              <p className="mt-2 text-gray-600">
                Gerencie planos, permissões e usuários do sistema
              </p>
            </div>
            <button
              onClick={() => setShowNewPlano(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Seção de Planos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Planos Disponíveis
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
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

                {showNewPlano && (
                  <PlanoCard
                    plano={{} as Plano}
                    isEditing={true}
                    isNew={true}
                    onSave={handleSavePlano}
                    onCancel={() => setShowNewPlano(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Seção de Usuários */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Usuários e Planos
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {usuarios.map((usuario) => (
                  <UsuarioCard
                    key={usuario.id}
                    usuario={usuario}
                    planos={planos}
                    onChangePlan={handleChangeUserPlan}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="font-semibold text-gray-900 capitalize">{plano.nome}</h3>
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              R$ {plano.valor_mensal}/mês
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
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do plano"
            value={formData.nome || ''}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Valor mensal"
            value={formData.valor_mensal || ''}
            onChange={(e) => setFormData({ ...formData, valor_mensal: parseFloat(e.target.value) || 0 })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <textarea
          placeholder="Descrição do plano"
          value={formData.descricao || ''}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          rows={2}
        />

        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { key: 'acesso_dashboard', label: 'Dashboard' },
            { key: 'acesso_crm', label: 'CRM' },
            { key: 'acesso_whatsapp', label: 'WhatsApp' },
            { key: 'acesso_disparo_simples', label: 'Disparo Simples' },
            { key: 'acesso_disparo_ia', label: 'Disparo IA' },
            { key: 'acesso_agentes_ia', label: 'Agentes IA' },
            { key: 'acesso_extracao_leads', label: 'Extração' },
            { key: 'acesso_enriquecimento', label: 'Enriquecimento' },
            { key: 'acesso_usuarios', label: 'Usuários' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={formData[key as keyof Plano] as boolean}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                className="mr-1"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          >
            <Save className="h-3 w-3 mr-1" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

interface UsuarioCardProps {
  usuario: UsuarioComPlano
  planos: Plano[]
  onChangePlan: (userId: number, planoId: number) => void
}

function UsuarioCard({ usuario, planos, onChangePlan }: UsuarioCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{usuario.name}</h3>
          <p className="text-sm text-gray-600">{usuario.email}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
            {usuario.plano_nome || usuario.plano}
          </span>
          <select
            value={usuario.plano_id || ''}
            onChange={(e) => onChangePlan(usuario.id, parseInt(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">Selecionar plano</option>
            {planos.map((plano) => (
              <option key={plano.id} value={plano.id}>
                {plano.nome} - R$ {plano.valor_mensal}/mês
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}