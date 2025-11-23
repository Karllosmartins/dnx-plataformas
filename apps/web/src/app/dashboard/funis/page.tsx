'use client'

import { useEffect, useState } from 'react'
import { funisApi, estagiosApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Estagio {
  id: string
  nome: string
  cor: string
  ordem: number
}

interface Funil {
  id: string
  nome: string
  descricao?: string
  icone: string
  cor: string
  ativo: boolean
  estagios?: Estagio[]
}

export default function FunisPage() {
  const [funis, setFunis] = useState<Funil[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFunil, setExpandedFunil] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateEstagioModal, setShowCreateEstagioModal] = useState<string | null>(null)
  const [editingFunil, setEditingFunil] = useState<Funil | null>(null)

  useEffect(() => {
    loadFunis()
  }, [])

  const loadFunis = async () => {
    try {
      setLoading(true)
      const response = await funisApi.list(true)
      const responseData = response.data as { data?: Funil[]; success?: boolean } | Funil[]
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
      setFunis(data as Funil[])
    } catch (err) {
      console.error('Erro ao carregar funis:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFunil = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funil?')) return

    try {
      await funisApi.delete(id)
      loadFunis()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      alert(error.response?.data?.error || 'Erro ao excluir funil')
    }
  }

  const handleDeleteEstagio = async (funilId: string, estagioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este estagio?')) return

    try {
      await estagiosApi.delete(funilId, estagioId)
      loadFunis()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      alert(error.response?.data?.error || 'Erro ao excluir estagio')
    }
  }

  const toggleExpanded = (funilId: string) => {
    setExpandedFunil(expandedFunil === funilId ? null : funilId)
  }

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funis</h1>
          <p className="text-muted-foreground">
            Configure seus funis de vendas e estagios
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Funil
        </button>
      </div>

      {/* Lista de Funis */}
      {funis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum funil encontrado</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 flex items-center gap-2 text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro funil
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {funis.map((funil) => (
            <Card key={funil.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpanded(funil.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {expandedFunil === funil.id ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: funil.cor }}
                    />
                    <CardTitle className="text-lg">{funil.nome}</CardTitle>
                    {funil.descricao && (
                      <span className="text-sm text-muted-foreground">
                        - {funil.descricao}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {funil.estagios?.length || 0} estagios
                    </span>
                    <button
                      onClick={() => setEditingFunil(funil)}
                      className="rounded p-1 hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFunil(funil.id)}
                      className="rounded p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>

              {/* Estágios expandidos */}
              {expandedFunil === funil.id && (
                <CardContent>
                  <div className="space-y-2">
                    {funil.estagios?.map((estagio) => (
                      <div
                        key={estagio.id}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: estagio.cor }}
                          />
                          <span className="font-medium">{estagio.nome}</span>
                          <span className="text-sm text-muted-foreground">
                            (Ordem: {estagio.ordem})
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteEstagio(funil.id, estagio.id)}
                          className="rounded p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {/* Botão adicionar estágio */}
                    <button
                      onClick={() => setShowCreateEstagioModal(funil.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Estagio
                    </button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Criar Funil */}
      {showCreateModal && (
        <CreateFunilModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            loadFunis()
          }}
        />
      )}

      {/* Modal Criar Estágio */}
      {showCreateEstagioModal && (
        <CreateEstagioModal
          funilId={showCreateEstagioModal}
          estagiosCount={
            funis.find((f) => f.id === showCreateEstagioModal)?.estagios?.length || 0
          }
          onClose={() => setShowCreateEstagioModal(null)}
          onCreated={() => {
            setShowCreateEstagioModal(null)
            loadFunis()
          }}
        />
      )}
    </div>
  )
}

// Modal Criar Funil
function CreateFunilModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [cor, setCor] = useState('#3B82F6')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await funisApi.create({ nome, descricao, cor })
      onCreated()
    } catch (err) {
      console.error('Erro ao criar funil:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Criar Novo Funil</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
              placeholder="Ex: Vendas, Suporte..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descricao</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2"
              placeholder="Descricao do funil"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cor</label>
            <input
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal Criar Estágio
function CreateEstagioModal({
  funilId,
  estagiosCount,
  onClose,
  onCreated,
}: {
  funilId: string
  estagiosCount: number
  onClose: () => void
  onCreated: () => void
}) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState('#6B7280')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await estagiosApi.create(funilId, {
        nome,
        cor,
        ordem: estagiosCount + 1,
      })
      onCreated()
    } catch (err) {
      console.error('Erro ao criar estagio:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Criar Novo Estagio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
              placeholder="Ex: Novo Lead, Qualificacao..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Cor</label>
            <input
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
