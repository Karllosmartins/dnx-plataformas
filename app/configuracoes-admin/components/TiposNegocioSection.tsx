'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Building, Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface TipoNegocio {
  id: number
  nome: string
  nome_exibicao: string
  descricao: string
  icone: string
  cor: string
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
      setTipos(data || [])
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Building className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Tipos de Negócio
          </h2>
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
              ativo: true
            })
          }}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Tipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {criandoNovo && (
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
        )}
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
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: tipo.cor }}
          >
            <Building className="h-4 w-4" />
          </div>
          <div className="flex space-x-1">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 p-1"
            >
              <Edit className="h-4 w-4" />
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1">{tipo.nome_exibicao}</h3>
        <p className="text-sm text-gray-600 mb-2">{tipo.nome}</p>
        {tipo.descricao && (
          <p className="text-xs text-gray-500 mb-2">{tipo.descricao}</p>
        )}

        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs rounded-full ${
            tipo.ativo
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {tipo.ativo ? 'Ativo' : 'Inativo'}
          </span>
          <span className="text-xs text-gray-400">#{tipo.ordem}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nome de Exibição
          </label>
          <input
            type="text"
            value={editData.nome_exibicao || ''}
            onChange={(e) => setEditData({ ...editData, nome_exibicao: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Ex: Limpeza de Nome"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Nome do Sistema
          </label>
          <input
            type="text"
            value={editData.nome || ''}
            onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Ex: limpa_nome"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={editData.descricao || ''}
            onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            rows={2}
            placeholder="Descrição do tipo de negócio"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Cor
            </label>
            <input
              type="color"
              value={editData.cor || '#3B82F6'}
              onChange={(e) => setEditData({ ...editData, cor: e.target.value })}
              className="w-full border border-gray-300 rounded px-1 py-1 h-8"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={editData.ativo ? 'true' : 'false'}
              onChange={(e) => setEditData({ ...editData, ativo: e.target.value === 'true' })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
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