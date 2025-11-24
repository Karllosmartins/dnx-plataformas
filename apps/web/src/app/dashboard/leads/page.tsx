'use client'

import { useEffect, useState } from 'react'
import { leadsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search, Plus } from 'lucide-react'
import PlanProtection from '@/components/shared/PlanProtection'

interface Lead {
  id: number
  nome_cliente: string
  email_usuario?: string
  numero_formatado?: string
  created_at: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadLeads()
  }, [page, search])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const response = await leadsApi.list({ page, limit: 50, search: search || undefined })
      const responseData = response.data as { data?: Lead[]; totalPages?: number; success?: boolean } | Lead[]
      const data = Array.isArray(responseData) ? responseData : (responseData.data || [])
      const pages = Array.isArray(responseData) ? 1 : (responseData.totalPages || 1)
      setLeads(data as Lead[])
      setTotalPages(pages)
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PlanProtection feature="leads">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Gerencie todos os seus leads</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Lead
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou telefone..."
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum lead encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Telefone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">{lead.nome_cliente || '-'}</td>
                    <td className="px-4 py-3">{lead.email_usuario || '-'}</td>
                    <td className="px-4 py-3">{lead.numero_formatado || '-'}</td>
                    <td className="px-4 py-3">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1 hover:bg-muted disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">
            Pagina {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1 hover:bg-muted disabled:opacity-50"
          >
            Proxima
          </button>
        </div>
      )}
      </div>
    </PlanProtection>
  )
}
