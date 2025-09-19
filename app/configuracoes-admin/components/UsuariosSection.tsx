'use client'

import { useState, useEffect } from 'react'
import { supabase, UsuarioComPlano, Plano } from '../../../lib/supabase'
import { Users, Edit, Save, X, Shield, UserX, Plus } from 'lucide-react'

export default function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<UsuarioComPlano[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<number | null>(null)
  const [showNewUser, setShowNewUser] = useState(false)

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

  const handleUpdateUser = async (userId: number, userData: {
    name?: string
    email?: string
    cpf?: string
    telefone?: string
    limite_leads?: number
    limite_consultas?: number
  }) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      await fetchUsuarios()
      setEditingUser(null)
      alert('Usuário atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('Erro ao atualizar usuário')
    }
  }

  const handleCreateUser = async (userData: {
    name: string
    email: string
    password: string
    role: 'admin' | 'user'
    plano_id?: number
    cpf?: string
    telefone?: string
  }) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          plano_id: userData.plano_id,
          cpf: userData.cpf || null,
          telefone: userData.telefone || null,
          active: true,
          limite_leads: 1000,
          limite_consultas: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      await fetchUsuarios()
      setShowNewUser(false)
      alert('Usuário criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário')
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gerenciamento de Usuários
          </h2>
        </div>
        <button
          onClick={() => setShowNewUser(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Usuário
        </button>
      </div>

      <div className="space-y-4">
        {showNewUser && (
          <NovoUsuarioCard
            planos={planos}
            onSave={handleCreateUser}
            onCancel={() => setShowNewUser(false)}
          />
        )}

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
            onUpdateUser={handleUpdateUser}
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
  onUpdateUser: (userId: number, userData: {
    name?: string
    email?: string
    cpf?: string
    telefone?: string
    limite_leads?: number
    limite_consultas?: number
  }) => void
}

function UsuarioCard({
  usuario,
  planos,
  isEditing,
  onEdit,
  onCancel,
  onChangePlan,
  onChangeRole,
  onToggleActive,
  onUpdateUser
}: UsuarioCardProps) {
  const [selectedPlan, setSelectedPlan] = useState(usuario.plano_id || '')
  const [selectedRole, setSelectedRole] = useState(usuario.role || 'user')
  const [formData, setFormData] = useState({
    name: usuario.name || '',
    email: usuario.email || '',
    cpf: usuario.cpf || '',
    telefone: usuario.telefone || '',
    limite_leads: usuario.limite_leads || 1000,
    limite_consultas: usuario.limite_consultas || 100
  })

  const handleSave = async () => {
    // Atualizar plano se mudou
    if (selectedPlan !== usuario.plano_id && selectedPlan) {
      await onChangePlan(usuario.id, parseInt(selectedPlan.toString()))
    }

    // Atualizar role se mudou
    if (selectedRole !== usuario.role) {
      await onChangeRole(usuario.id, selectedRole)
    }

    // Atualizar outros dados se mudaram
    const hasChanges =
      formData.name !== usuario.name ||
      formData.email !== usuario.email ||
      formData.cpf !== (usuario.cpf || '') ||
      formData.telefone !== (usuario.telefone || '') ||
      formData.limite_leads !== usuario.limite_leads ||
      formData.limite_consultas !== usuario.limite_consultas

    if (hasChanges) {
      await onUpdateUser(usuario.id, formData)
    } else {
      onCancel()
    }
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
          <h3 className="font-medium text-gray-900 mb-4">Editando: {usuario.name}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limite de Leads
            </label>
            <input
              type="number"
              value={formData.limite_leads}
              onChange={(e) => setFormData({ ...formData, limite_leads: parseInt(e.target.value) || 0 })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limite de Consultas
            </label>
            <input
              type="number"
              value={formData.limite_consultas}
              onChange={(e) => setFormData({ ...formData, limite_consultas: parseInt(e.target.value) || 0 })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
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

interface NovoUsuarioCardProps {
  planos: Plano[]
  onSave: (userData: {
    name: string
    email: string
    password: string
    role: 'admin' | 'user'
    plano_id?: number
    cpf?: string
    telefone?: string
  }) => void
  onCancel: () => void
}

function NovoUsuarioCard({ planos, onSave, onCancel }: NovoUsuarioCardProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    plano_id: '',
    cpf: '',
    telefone: ''
  })

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    onSave({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      plano_id: formData.plano_id ? parseInt(formData.plano_id) : undefined,
      cpf: formData.cpf || undefined,
      telefone: formData.telefone || undefined
    })
  }

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 mb-4">Criar Novo Usuário</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Senha do usuário"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Função
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plano
            </label>
            <select
              value={formData.plano_id}
              onChange={(e) => setFormData({ ...formData, plano_id: e.target.value })}
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
            onClick={handleSubmit}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <Save className="h-3 w-3 mr-1" />
            Criar Usuário
          </button>
        </div>
      </div>
    </div>
  )
}