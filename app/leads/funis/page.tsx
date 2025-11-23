'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/shared/AuthWrapper'
import { funisApi } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Check,
  X,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface Estagio {
  id: string
  funil_id: string
  nome: string
  cor: string
  ordem: number
}

interface Funil {
  id: string
  nome: string
  descricao?: string
  cor: string
  ordem: number
  ativo: boolean
  estagios?: Estagio[]
}

const CORES_DISPONIVEIS = [
  { nome: 'Azul', valor: '#3b82f6' },
  { nome: 'Verde', valor: '#10b981' },
  { nome: 'Vermelho', valor: '#ef4444' },
  { nome: 'Amarelo', valor: '#f59e0b' },
  { nome: 'Roxo', valor: '#8b5cf6' },
  { nome: 'Rosa', valor: '#ec4899' },
  { nome: 'Indigo', valor: '#6366f1' },
  { nome: 'Teal', valor: '#14b8a6' },
]

export default function FunisPage() {
  const { user } = useAuth()
  const [funis, setFunis] = useState<Funil[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFunil, setExpandedFunil] = useState<string | null>(null)

  // Estado para criação/edição de funil
  const [editingFunil, setEditingFunil] = useState<Funil | null>(null)
  const [showFunilForm, setShowFunilForm] = useState(false)
  const [funilForm, setFunilForm] = useState({
    nome: '',
    descricao: '',
    cor: '#3b82f6'
  })

  // Estado para criação/edição de estágio
  const [editingEstagio, setEditingEstagio] = useState<{ funilId: string, estagio: Estagio | null }>({ funilId: '', estagio: null })
  const [showEstagioForm, setShowEstagioForm] = useState(false)
  const [estagioForm, setEstagioForm] = useState({
    nome: '',
    cor: '#10b981'
  })

  useEffect(() => {
    if (user) {
      loadFunis()
    }
  }, [user])

  const loadFunis = async () => {
    try {
      setLoading(true)
      const response = await funisApi.list(true)

      if (response.success && response.data) {
        const funisData = Array.isArray(response.data) ? response.data : [response.data]
        setFunis(funisData as Funil[])
      }
    } catch (error) {
      console.error('Erro ao carregar funis:', error)
    } finally {
      setLoading(false)
    }
  }

  // CRUD de Funis
  const handleCreateFunil = async () => {
    try {
      const response = await funisApi.create(funilForm)

      if (response.success) {
        await loadFunis()
        setShowFunilForm(false)
        setFunilForm({ nome: '', descricao: '', cor: '#3b82f6' })
      }
    } catch (error) {
      console.error('Erro ao criar funil:', error)
    }
  }

  const handleUpdateFunil = async () => {
    if (!editingFunil) return

    try {
      const response = await funisApi.update(editingFunil.id, funilForm)

      if (response.success) {
        await loadFunis()
        setEditingFunil(null)
        setShowFunilForm(false)
        setFunilForm({ nome: '', descricao: '', cor: '#3b82f6' })
      }
    } catch (error) {
      console.error('Erro ao atualizar funil:', error)
    }
  }

  const handleDeleteFunil = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funil? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await funisApi.delete(id)

      if (response.success) {
        await loadFunis()
      }
    } catch (error) {
      console.error('Erro ao deletar funil:', error)
    }
  }

  const handleEditFunil = (funil: Funil) => {
    setEditingFunil(funil)
    setFunilForm({
      nome: funil.nome,
      descricao: funil.descricao || '',
      cor: funil.cor
    })
    setShowFunilForm(true)
  }

  // CRUD de Estágios
  const handleCreateEstagio = async () => {
    if (!editingEstagio.funilId) return

    try {
      const response = await funisApi.createEstagio(editingEstagio.funilId, estagioForm)

      if (response.success) {
        await loadFunis()
        setShowEstagioForm(false)
        setEditingEstagio({ funilId: '', estagio: null })
        setEstagioForm({ nome: '', cor: '#10b981' })
      }
    } catch (error) {
      console.error('Erro ao criar estágio:', error)
    }
  }

  const handleUpdateEstagio = async () => {
    if (!editingEstagio.funilId || !editingEstagio.estagio) return

    try {
      const response = await funisApi.updateEstagio(
        editingEstagio.funilId,
        editingEstagio.estagio.id,
        estagioForm
      )

      if (response.success) {
        await loadFunis()
        setShowEstagioForm(false)
        setEditingEstagio({ funilId: '', estagio: null })
        setEstagioForm({ nome: '', cor: '#10b981' })
      }
    } catch (error) {
      console.error('Erro ao atualizar estágio:', error)
    }
  }

  const handleDeleteEstagio = async (funilId: string, estagioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este estágio?')) {
      return
    }

    try {
      const response = await funisApi.deleteEstagio(funilId, estagioId)

      if (response.success) {
        await loadFunis()
      }
    } catch (error) {
      console.error('Erro ao deletar estágio:', error)
    }
  }

  const handleEditEstagio = (funilId: string, estagio: Estagio) => {
    setEditingEstagio({ funilId, estagio })
    setEstagioForm({
      nome: estagio.nome,
      cor: estagio.cor
    })
    setShowEstagioForm(true)
  }

  const handleAddEstagio = (funilId: string) => {
    setEditingEstagio({ funilId, estagio: null })
    setEstagioForm({ nome: '', cor: '#10b981' })
    setShowEstagioForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestão de Funis de Vendas
          </h1>
          <p className="text-gray-600">
            Organize seus leads em funis personalizados com estágios customizados
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/leads">
            <Button variant="outline">
              Voltar para Leads
            </Button>
          </Link>
          <Button onClick={() => setShowFunilForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Funil
          </Button>
        </div>
      </div>

      {/* Formulário de Funil */}
      {showFunilForm && (
        <Card className="mb-6 border-2 border-blue-500">
          <CardHeader>
            <CardTitle>{editingFunil ? 'Editar Funil' : 'Novo Funil'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Funil *</Label>
                <Input
                  id="nome"
                  value={funilForm.nome}
                  onChange={(e) => setFunilForm({ ...funilForm, nome: e.target.value })}
                  placeholder="Ex: Vendas Inbound"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={funilForm.descricao}
                  onChange={(e) => setFunilForm({ ...funilForm, descricao: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-2">
                  {CORES_DISPONIVEIS.map(cor => (
                    <button
                      key={cor.valor}
                      onClick={() => setFunilForm({ ...funilForm, cor: cor.valor })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        funilForm.cor === cor.valor ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFunilForm(false)
                    setEditingFunil(null)
                    setFunilForm({ nome: '', descricao: '', cor: '#3b82f6' })
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={editingFunil ? handleUpdateFunil : handleCreateFunil}>
                  <Check className="mr-2 h-4 w-4" />
                  {editingFunil ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Estágio */}
      {showEstagioForm && (
        <Card className="mb-6 border-2 border-green-500">
          <CardHeader>
            <CardTitle>{editingEstagio.estagio ? 'Editar Estágio' : 'Novo Estágio'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="estagio-nome">Nome do Estágio *</Label>
                <Input
                  id="estagio-nome"
                  value={estagioForm.nome}
                  onChange={(e) => setEstagioForm({ ...estagioForm, nome: e.target.value })}
                  placeholder="Ex: Qualificação"
                />
              </div>

              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-2">
                  {CORES_DISPONIVEIS.map(cor => (
                    <button
                      key={cor.valor}
                      onClick={() => setEstagioForm({ ...estagioForm, cor: cor.valor })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        estagioForm.cor === cor.valor ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEstagioForm(false)
                    setEditingEstagio({ funilId: '', estagio: null })
                    setEstagioForm({ nome: '', cor: '#10b981' })
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={editingEstagio.estagio ? handleUpdateEstagio : handleCreateEstagio}>
                  <Check className="mr-2 h-4 w-4" />
                  {editingEstagio.estagio ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Funis */}
      {funis.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Layers className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum funil criado ainda</h3>
            <p className="text-gray-600 mb-6">
              Crie seu primeiro funil para começar a organizar seus leads
            </p>
            <Button onClick={() => setShowFunilForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Funil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {funis.map(funil => (
            <Card key={funil.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: funil.cor }}
                    />
                    <div>
                      <CardTitle>{funil.nome}</CardTitle>
                      {funil.descricao && (
                        <CardDescription className="mt-1">{funil.descricao}</CardDescription>
                      )}
                    </div>
                    <Badge variant={funil.ativo ? 'default' : 'secondary'}>
                      {funil.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedFunil(expandedFunil === funil.id ? null : funil.id)}
                    >
                      {expandedFunil === funil.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {funil.estagios?.length || 0} estágios
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFunil(funil)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFunil(funil.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedFunil === funil.id && (
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Estágios do Funil</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddEstagio(funil.id)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Adicionar Estágio
                      </Button>
                    </div>

                    {funil.estagios && funil.estagios.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {funil.estagios.map(estagio => (
                          <div
                            key={estagio.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-white"
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: estagio.cor }}
                              />
                              <span className="text-sm font-medium">{estagio.nome}</span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEstagio(funil.id, estagio)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEstagio(funil.id, estagio.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum estágio criado. Adicione o primeiro estágio para este funil.
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
