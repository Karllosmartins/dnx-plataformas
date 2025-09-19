'use client'

import { useState, useEffect } from 'react'
import { supabase, UsuarioComPlano, Plano } from '../../../lib/supabase'
import { Users, Edit, Save, X, Shield, UserX } from 'lucide-react'

export default function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<UsuarioComPlano[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<number | null>(null)

  useEffect(() => {
    fetchUsuarios()
    fetchPlanos()
  }, [])

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
    }
  }

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

  const handleChangeUserRole = async (userId: number, role: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)

      if (error) throw error

      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao alterar role do usuário:', error)
      alert('Erro ao alterar role do usuário')
    }
  }

  const handleToggleUserActive = async (userId: number, active: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active })
        .eq('id', userId)

      if (error) throw error

      await fetchUsuarios()
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error)
      alert('Erro ao alterar status do usuário')
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
      <div className="flex items-center mb-6">
        <Users className="h-5 w-5 mr-2 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Gerenciamento de Usuários
        </h2>
      </div>

      <div className="space-y-4">
        {usuarios.map((usuario) => (
          <UsuarioCard
            key={usuario.id}
            usuario={usuario}
            planos={planos}
            isEditing={editingUser === usuario.id}
            onEdit={() => setEditingUser(usuario.id)}
            onCancel={() => setEditingUser(null)}
            onChangePlan={handleChangeUserPlan}
            onChangeRole={handleChangeUserRole}
            onToggleActive={handleToggleUserActive}
          />
        ))}
      </div>
    </div>
  )
}

interface UsuarioCardProps {
  usuario: UsuarioComPlano
  planos: Plano[]
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onChangePlan: (userId: number, planoId: number) => void
  onChangeRole: (userId: number, role: string) => void
  onToggleActive: (userId: number, active: boolean) => void
}

function UsuarioCard({
  usuario,
  planos,
  isEditing,
  onEdit,
  onCancel,
  onChangePlan,
  onChangeRole,
  onToggleActive
}: UsuarioCardProps) {
  const [selectedPlan, setSelectedPlan] = useState(usuario.plano_id || '')
  const [selectedRole, setSelectedRole] = useState(usuario.role || 'user')

  const handleSave = async () => {
    if (selectedPlan !== usuario.plano_id && selectedPlan) {
      await onChangePlan(usuario.id, parseInt(selectedPlan.toString()))
    }
    if (selectedRole !== usuario.role) {
      await onChangeRole(usuario.id, selectedRole)
    }
    onCancel()
  }

  if (!isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <h3 className="font-medium text-gray-900 mr-3">{usuario.name}</h3>
              <div className="flex items-center space-x-2">
                {usuario.role === 'admin' && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </span>
                )}
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  usuario.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {usuario.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{usuario.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                {usuario.plano_nome || usuario.plano || 'Sem plano'}
              </span>
              {usuario.limite_leads && (
                <span className="text-xs text-gray-500">
                  Leads: {usuario.limite_leads}
                </span>
              )}
              {usuario.limite_consultas && (
                <span className="text-xs text-gray-500">
                  Consultas: {usuario.limite_consultas}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleActive(usuario.id, !usuario.active)}
              className={`p-2 rounded ${
                usuario.active
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-green-600 hover:text-green-800'
              }`}
              title={usuario.active ? 'Desativar usuário' : 'Ativar usuário'}
            >
              <UserX className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 p-2 rounded"
              title="Editar usuário"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{usuario.name}</h3>
          <p className="text-sm text-gray-600">{usuario.email}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plano
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecionar plano...</option>
              {planos.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'user')}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
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