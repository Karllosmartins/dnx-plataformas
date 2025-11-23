'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/shared/AuthWrapper'
import { camposApi, funisApi } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Type,
  Hash,
  Calendar,
  List,
  FileText,
  ToggleLeft,
  X,
} from 'lucide-react'
import Link from 'next/link'

interface Campo {
  id: string
  nome: string
  tipo: string
  obrigatorio: boolean
  opcoes?: string[]
  funil_id?: string
  ordem?: number
}

interface Funil {
  id: string
  nome: string
  cor: string
}

const TIPOS_CAMPO = [
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'number', label: 'Numero', icon: Hash },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'select', label: 'Selecao', icon: List },
  { value: 'textarea', label: 'Texto Longo', icon: FileText },
  { value: 'boolean', label: 'Sim/Nao', icon: ToggleLeft },
]

export default function CamposPage() {
  const { user } = useAuth()
  const [campos, setCampos] = useState<Campo[]>([])
  const [funis, setFunis] = useState<Funil[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estado do formulario
  const [showForm, setShowForm] = useState(false)
  const [editingCampo, setEditingCampo] = useState<Campo | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'text',
    obrigatorio: false,
    funil_id: '',
    opcoes: [] as string[],
  })
  const [novaOpcao, setNovaOpcao] = useState('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [camposRes, funisRes] = await Promise.all([
        camposApi.list(),
        funisApi.list(false),
      ])

      if (camposRes.success && camposRes.data) {
        setCampos(camposRes.data as Campo[])
      }
      if (funisRes.success && funisRes.data) {
        setFunis(funisRes.data as Funil[])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampo = async () => {
    if (!formData.nome.trim()) return

    setSaving(true)
    try {
      const payload = {
        nome: formData.nome,
        tipo: formData.tipo,
        obrigatorio: formData.obrigatorio,
        funil_id: formData.funil_id || null,
        opcoes: formData.tipo === 'select' ? formData.opcoes : undefined,
      }

      const response = await camposApi.create(payload)
      if (response.success) {
        loadData()
        resetForm()
      } else {
        alert(response.error || 'Erro ao criar campo')
      }
    } catch (error) {
      console.error('Erro ao criar campo:', error)
      alert('Erro ao criar campo')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCampo = async () => {
    if (!editingCampo || !formData.nome.trim()) return

    setSaving(true)
    try {
      const payload = {
        nome: formData.nome,
        tipo: formData.tipo,
        obrigatorio: formData.obrigatorio,
        funil_id: formData.funil_id || null,
        opcoes: formData.tipo === 'select' ? formData.opcoes : undefined,
      }

      const response = await camposApi.update(editingCampo.id, payload)
      if (response.success) {
        loadData()
        resetForm()
      } else {
        alert(response.error || 'Erro ao atualizar campo')
      }
    } catch (error) {
      console.error('Erro ao atualizar campo:', error)
      alert('Erro ao atualizar campo')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCampo = async (campoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return

    try {
      const response = await camposApi.delete(campoId)
      if (response.success) {
        loadData()
      } else {
        alert(response.error || 'Erro ao excluir campo')
      }
    } catch (error) {
      console.error('Erro ao excluir campo:', error)
      alert('Erro ao excluir campo')
    }
  }

  const handleEditCampo = (campo: Campo) => {
    setEditingCampo(campo)
    setFormData({
      nome: campo.nome,
      tipo: campo.tipo,
      obrigatorio: campo.obrigatorio,
      funil_id: campo.funil_id || '',
      opcoes: campo.opcoes || [],
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingCampo(null)
    setFormData({
      nome: '',
      tipo: 'text',
      obrigatorio: false,
      funil_id: '',
      opcoes: [],
    })
    setNovaOpcao('')
  }

  const handleAddOpcao = () => {
    if (novaOpcao.trim() && !formData.opcoes.includes(novaOpcao.trim())) {
      setFormData((prev) => ({
        ...prev,
        opcoes: [...prev.opcoes, novaOpcao.trim()],
      }))
      setNovaOpcao('')
    }
  }

  const handleRemoveOpcao = (opcao: string) => {
    setFormData((prev) => ({
      ...prev,
      opcoes: prev.opcoes.filter((o) => o !== opcao),
    }))
  }

  const getTipoInfo = (tipo: string) => {
    return TIPOS_CAMPO.find((t) => t.value === tipo) || TIPOS_CAMPO[0]
  }

  const getFunilNome = (funilId?: string) => {
    if (!funilId) return 'Global'
    const funil = funis.find((f) => f.id === funilId)
    return funil?.nome || 'Desconhecido'
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Campos Personalizados
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie campos customizados para seus leads
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Campo
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingCampo ? 'Editar Campo' : 'Novo Campo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nome">Nome do Campo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex: Valor do Contrato"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Tipo do Campo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CAMPO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex items-center gap-2">
                          <tipo.icon className="h-4 w-4" />
                          {tipo.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Funil (opcional)</Label>
                <Select
                  value={formData.funil_id || 'global'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, funil_id: value === 'global' ? '' : value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Global (todos os funis)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (todos os funis)</SelectItem>
                    {funis.map((funil) => (
                      <SelectItem key={funil.id} value={funil.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: funil.cor }}
                          />
                          {funil.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="obrigatorio"
                  checked={formData.obrigatorio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      obrigatorio: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="obrigatorio">Campo obrigatorio</Label>
              </div>
            </div>

            {/* Opcoes para campo de selecao */}
            {formData.tipo === 'select' && (
              <div>
                <Label>Opcoes</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={novaOpcao}
                      onChange={(e) => setNovaOpcao(e.target.value)}
                      placeholder="Nova opcao"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddOpcao()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddOpcao} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.opcoes.map((opcao) => (
                      <Badge key={opcao} variant="secondary" className="gap-1">
                        {opcao}
                        <button
                          type="button"
                          onClick={() => handleRemoveOpcao(opcao)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                onClick={editingCampo ? handleUpdateCampo : handleCreateCampo}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCampo ? 'Salvar' : 'Criar Campo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Campos */}
      <Card>
        <CardHeader>
          <CardTitle>Campos Cadastrados</CardTitle>
          <CardDescription>
            {campos.length} campo(s) configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campos.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Type className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">Nenhum campo personalizado</p>
              <Button
                variant="link"
                onClick={() => setShowForm(true)}
                className="mt-2"
              >
                Criar primeiro campo
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {campos.map((campo) => {
                const tipoInfo = getTipoInfo(campo.tipo)
                const TipoIcon = tipoInfo.icon
                return (
                  <div
                    key={campo.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <TipoIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {campo.nome}
                          </span>
                          {campo.obrigatorio && (
                            <Badge variant="destructive" className="text-xs">
                              Obrigatorio
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{tipoInfo.label}</span>
                          <span>-</span>
                          <span>{getFunilNome(campo.funil_id)}</span>
                          {campo.tipo === 'select' && campo.opcoes && (
                            <>
                              <span>-</span>
                              <span>{campo.opcoes.length} opcoes</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCampo(campo)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCampo(campo.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
