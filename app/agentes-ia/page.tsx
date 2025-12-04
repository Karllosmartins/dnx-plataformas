'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import { useWorkspaceContext } from '../../contexts/WorkspaceContext'
import { supabase, AgenteIA, Tool, UserTool, InstanciaWhats } from '../../lib/supabase'
import PlanProtection from '../../components/shared/PlanProtection'
import VectorStoreManager from '../../components/features/vectorstore/VectorStoreManager'
import {
  Plus,
  Edit2,
  Trash2,
  Bot,
  Wrench,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react'

// Componentes shadcn
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { Separator } from '../../components/ui/separator'
import { ScrollArea } from '../../components/ui/scroll-area'

export default function AgentesIAPage() {
  const { user: currentUser } = useAuth()
  const { workspaceId } = useWorkspaceContext()
  const [agentes, setAgentes] = useState<AgenteIA[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAgent, setEditingAgent] = useState<AgenteIA | null>(null)
  const [tools, setTools] = useState<Tool[]>([])
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [showAgentTools, setShowAgentTools] = useState<{[key: number]: boolean}>({})
  const [instancias, setInstancias] = useState<InstanciaWhats[]>([])
  const [showAgentInstance, setShowAgentInstance] = useState<{[key: number]: boolean}>({})

  useEffect(() => {
    if (currentUser && workspaceId) {
      loadAgentes()
      loadTools()
      loadUserTools()
      loadInstancias()
    }
  }, [currentUser, workspaceId])

  const loadAgentes = async () => {
    if (!currentUser || !workspaceId) return

    try {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (data) {
        setAgentes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTools = async () => {
    if (!currentUser) return

    try {
      // Buscar todas as tools disponíveis
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('nome')

      if (error) throw error
      if (data) {
        setTools(data)
      }
    } catch (error) {
      console.error('Erro ao carregar tools:', error)
    }
  }

  const loadUserTools = async () => {
    if (!currentUser || !workspaceId) return

    try {
      const { data, error } = await supabase
        .from('user_tools')
        .select('*')
        .eq('workspace_id', workspaceId)

      if (error) throw error
      if (data) {
        setUserTools(data)
      }
    } catch (error) {
      console.error('Erro ao carregar user_tools:', error)
    }
  }

  const loadInstancias = async () => {
    if (!currentUser || !workspaceId) return

    try {
      const { data, error } = await supabase
        .from('instancia_whtats')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setInstancias(data)
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    }
  }

  const toggleAgentTool = async (agentId: number, toolId: number, currentState: boolean) => {
    if (!currentUser || !workspaceId) return

    try {
      // Buscar registro específico para este agente e ferramenta
      const existingAgentTool = userTools.find(ut =>
        ut.tool_id === toolId &&
        ut.agente_id === agentId
      )

      if (existingAgentTool) {
        // Já existe registro para este agente - alternar status
        const { error } = await supabase
          .from('user_tools')
          .update({ is_active: !currentState })
          .eq('id', existingAgentTool.id)

        if (error) throw error
      } else {
        // Não existe registro para este agente - criar novo
        const { error } = await supabase
          .from('user_tools')
          .insert([{
            user_id: parseInt(currentUser.id),
            workspace_id: workspaceId,
            tool_id: toolId,
            agente_id: agentId,
            is_active: true
          }])

        if (error) throw error
      }

      // Recarregar user_tools
      loadUserTools()
    } catch (error) {
      console.error('Erro ao alterar status da tool:', error)
      alert('Erro ao alterar status da ferramenta')
    }
  }

  const isAgentToolActive = (agentId: number, toolId: number): boolean => {
    const userTool = userTools.find(ut =>
      ut.tool_id === toolId &&
      ut.agente_id === agentId
    )
    // A ferramenta está ativa para este agente se existe um registro ativo
    return userTool?.is_active === true
  }

  const updateAgentInstance = async (agentId: number, instanciaId: number | null) => {
    if (!currentUser || !workspaceId) return

    try {
      // Primeiro, desvincula o agente de qualquer instância anterior
      await supabase
        .from('instancia_whtats')
        .update({ agante_id: null })
        .eq('agante_id', agentId)
        .eq('workspace_id', workspaceId)

      // Se uma nova instância foi selecionada, vincula a ela
      if (instanciaId) {
        const { error } = await supabase
          .from('instancia_whtats')
          .update({ agante_id: agentId })
          .eq('id', instanciaId)
          .eq('workspace_id', workspaceId)

        if (error) throw error
      }

      // Recarregar instâncias para atualizar a UI
      loadInstancias()
      alert('Instância do agente atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar instância do agente:', error)
      alert('Erro ao atualizar instância do agente')
    }
  }

  const getAgentInstance = (agentId: number): InstanciaWhats | null => {
    return instancias.find(inst => inst.agante_id === agentId) || null
  }

  const saveAgent = async (agentData: Partial<AgenteIA>) => {
    if (!currentUser || !workspaceId) return

    try {
      const dataToSave = {
        ...agentData,
        user_id: currentUser.id,
        workspace_id: workspaceId
      }

      if (editingAgent && editingAgent.id > 0) {
        // Update
        const { error } = await supabase
          .from('agentes_ia')
          .update(dataToSave)
          .eq('id', editingAgent.id)
      } else {
        // Insert
        const { error } = await supabase
          .from('agentes_ia')
          .insert([dataToSave])
      }

      alert('Agente salvo com sucesso!')
      setEditingAgent(null)
      loadAgentes()
    } catch (error) {
      console.error('Erro ao salvar agente:', error)
      alert('Erro ao salvar agente')
    }
  }

  const deleteAgent = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este agente? Isso também removerá o Vector Store e ferramentas associadas.')) return

    try {
      // 1. Deletar ferramentas do agente (user_tools)
      try {
        const { error: toolsError } = await supabase
          .from('user_tools')
          .delete()
          .eq('agente_id', id)
          .eq('workspace_id', workspaceId)

        if (toolsError) {
          console.warn('Erro ao deletar ferramentas do agente:', toolsError)
        }
      } catch (toolsError) {
        console.warn('Erro ao processar ferramentas, mas continuando:', toolsError)
      }

      // 2. Deletar o vector store associado (se existir)
      try {
        const vectorStoreResponse = await fetch(`/api/vectorstores?userId=${currentUser?.id}&agentId=${id}`)
        const vectorStoreData = await vectorStoreResponse.json()

        if (vectorStoreData.hasVectorStore && vectorStoreData.vectorStore) {
          // Deletar vector store da OpenAI e do banco
          const deleteResponse = await fetch('/api/vectorstores', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser?.id,
              agentId: id,
              vectorStoreId: vectorStoreData.vectorStore.vectorstore_id
            })
          })

          if (!deleteResponse.ok) {
            console.warn('Erro ao deletar vector store, mas continuando com exclusão do agente')
          }
        }
      } catch (vectorStoreError) {
        console.warn('Erro ao processar vector store, mas continuando com exclusão do agente:', vectorStoreError)
      }

      // 3. Deletar o agente
      const { error } = await supabase
        .from('agentes_ia')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Agente e todos os recursos associados excluídos com sucesso!')
      loadAgentes()
      loadUserTools() // Recarregar ferramentas para atualizar UI
    } catch (error) {
      console.error('Erro ao excluir agente:', error)
      alert('Erro ao excluir agente')
    }
  }

  const getStatusBadgeVariant = (estagio: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (estagio) {
      case 'ativo': return 'default'
      case 'desenvolvimento': return 'secondary'
      case 'teste': return 'outline'
      case 'inativo': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (estagio: string): string => {
    switch (estagio) {
      case 'ativo': return 'Ativo'
      case 'desenvolvimento': return 'Em Desenvolvimento'
      case 'teste': return 'Teste'
      case 'inativo': return 'Inativo'
      default: return estagio
    }
  }

  const createNewAgent = () => {
    setEditingAgent({
      id: 0,
      nome: '',
      funcao: '',
      prompt: '',
      estagio: 'ativo',
      user_id: Number(currentUser?.id) || 0,
      workspace_id: workspaceId || undefined,
      created_at: new Date().toISOString()
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="text-sm text-muted-foreground">Carregando agentes...</p>
        </div>
      </div>
    )
  }

  return (
    <PlanProtection feature="agentesIA">
      <TooltipProvider>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Agentes IA</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie seus agentes de inteligência artificial para automação
                </p>
              </div>
            </div>
            <Button onClick={createNewAgent} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agente
            </Button>
          </div>

          {/* Lista de Agentes */}
          {agentes.length > 0 ? (
            <div className="grid gap-6">
              {agentes.map((agente) => (
                <Card key={agente.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
                          <Bot className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-xl">{agente.nome}</CardTitle>
                            <Badge variant={getStatusBadgeVariant(agente.estagio)}>
                              {getStatusLabel(agente.estagio)}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">{agente.funcao}</CardDescription>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAgent(agente)}
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="ml-2 hidden sm:inline">Editar</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar agente</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteAgent(agente.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="ml-2 hidden sm:inline">Excluir</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir agente</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Prompt */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h5 className="text-sm font-medium mb-2">Prompt do Agente:</h5>
                      <ScrollArea className="h-24">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {agente.prompt}
                        </p>
                      </ScrollArea>
                    </div>

                    {/* Metadados */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>ID: {agente.id}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>Criado em {new Date(agente.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <Separator />

                    {/* Vector Store Manager */}
                    <VectorStoreManager agentId={agente.id} />

                    {/* Seção WhatsApp - Collapsible */}
                    <Collapsible
                      open={showAgentInstance[agente.id]}
                      onOpenChange={(open) => setShowAgentInstance({
                        ...showAgentInstance,
                        [agente.id]: open
                      })}
                    >
                      <Card className="border-green-200 bg-green-50/50">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="py-3 cursor-pointer hover:bg-green-100/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-sm">Instância WhatsApp</span>
                                {getAgentInstance(agente.id) && (
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                    Conectado
                                  </Badge>
                                )}
                              </div>
                              {showAgentInstance[agente.id] ? (
                                <ChevronUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Selecionar Instância WhatsApp:</Label>
                                <Select
                                  value={getAgentInstance(agente.id)?.id?.toString() || 'none'}
                                  onValueChange={(value) => {
                                    const instanciaId = value === 'none' ? null : parseInt(value)
                                    updateAgentInstance(agente.id, instanciaId)
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Nenhuma instância selecionada" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Nenhuma instância</SelectItem>
                                    {instancias.map((instancia) => (
                                      <SelectItem key={instancia.id} value={instancia.id.toString()}>
                                        {instancia.instancia} {instancia.is_official_api ? '(API Oficial)' : '(UAZAPI)'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {getAgentInstance(agente.id) && (
                                <div className="p-3 bg-green-100 rounded-lg text-sm">
                                  <p><strong>Instância vinculada:</strong> {getAgentInstance(agente.id)?.instancia}</p>
                                  <p><strong>Tipo:</strong> {getAgentInstance(agente.id)?.is_official_api ? 'API Oficial do WhatsApp' : 'UAZAPI'}</p>
                                </div>
                              )}

                              {instancias.length === 0 && (
                                <div className="text-center py-3 text-sm text-muted-foreground">
                                  <p>Nenhuma instância WhatsApp configurada.</p>
                                  <Button variant="link" asChild className="text-green-600 h-auto p-0 mt-1">
                                    <a href="/whatsapp">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Criar nova instância
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>

                    {/* Seção Ferramentas - Collapsible */}
                    <Collapsible
                      open={showAgentTools[agente.id]}
                      onOpenChange={(open) => setShowAgentTools({
                        ...showAgentTools,
                        [agente.id]: open
                      })}
                    >
                      <Card className="border-blue-200 bg-blue-50/50">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="py-3 cursor-pointer hover:bg-blue-100/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-blue-600" />
                                <span className="font-medium text-sm">Ferramentas do Agente</span>
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                  {userTools.filter(ut => ut.agente_id === agente.id && ut.is_active).length} ativas
                                </Badge>
                              </div>
                              {showAgentTools[agente.id] ? (
                                <ChevronUp className="h-4 w-4 text-blue-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {tools.map((tool) => {
                                const isActive = isAgentToolActive(agente.id, tool.id)
                                return (
                                  <div
                                    key={tool.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                      isActive
                                        ? 'bg-white border-blue-200'
                                        : 'bg-white/50 border-gray-200'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1 mr-3">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <h6 className="text-sm font-medium truncate cursor-help">
                                            {tool.nome}
                                          </h6>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p className="max-w-xs">{tool.nome}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <p className="text-xs text-muted-foreground truncate">{tool.type}</p>
                                    </div>

                                    <Switch
                                      checked={isActive}
                                      onCheckedChange={() => toggleAgentTool(agente.id, tool.id, isActive)}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State */
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-purple-100 rounded-full mb-6">
                  <Bot className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum agente configurado</h3>
                <p className="text-muted-foreground text-center max-w-md mb-8">
                  Crie seu primeiro agente IA para começar a automatizar suas tarefas.
                  Agentes podem ser usados para vendas, suporte, qualificação de leads e muito mais.
                </p>
                <Button size="lg" onClick={createNewAgent} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Agente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Modal de Edição de Agente */}
          <AgentModal
            agent={editingAgent}
            onSave={saveAgent}
            onClose={() => setEditingAgent(null)}
          />
        </div>
      </TooltipProvider>
    </PlanProtection>
  )
}

// Componente Modal para Agente
function AgentModal({
  agent,
  onSave,
  onClose
}: {
  agent: AgenteIA | null
  onSave: (data: Partial<AgenteIA>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    nome: '',
    funcao: '',
    prompt: '',
    estagio: 'ativo'
  })

  useEffect(() => {
    if (agent) {
      setFormData({
        nome: agent.nome || '',
        funcao: agent.funcao || '',
        prompt: agent.prompt || '',
        estagio: agent.estagio || 'ativo'
      })
    }
  }, [agent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!agent) return null

  return (
    <Dialog open={!!agent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bot className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {agent.id && agent.id > 0 ? 'Editar Agente IA' : 'Criar Novo Agente IA'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações e o comportamento do seu agente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Agente *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Agente de Vendas"
                required
              />
              <p className="text-xs text-muted-foreground">
                O ID do agente será gerado automaticamente ao criar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estagio">Status do Agente</Label>
              <Select
                value={formData.estagio}
                onValueChange={(value) => setFormData({...formData, estagio: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="desenvolvimento">Em Desenvolvimento</SelectItem>
                  <SelectItem value="teste">Teste</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="funcao">Função do Agente *</Label>
            <Input
              id="funcao"
              value={formData.funcao}
              onChange={(e) => setFormData({...formData, funcao: e.target.value})}
              placeholder="Especialista em vendas e conversão de leads"
              required
            />
            <p className="text-xs text-muted-foreground">
              Descreva brevemente qual é o papel deste agente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt do Agente *</Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => setFormData({...formData, prompt: e.target.value})}
              rows={12}
              className="font-mono text-sm"
              placeholder={`Você é um agente especialista em vendas focado em recuperação de crédito. Seu objetivo é qualificar leads e converter em clientes...

Suas responsabilidades incluem:
- Analisar o perfil do lead
- Fazer perguntas qualificadoras
- Apresentar soluções adequadas
- Conduzir para o fechamento

Seja sempre profissional, empático e focado em resultados.`}
              required
            />
            <p className="text-xs text-muted-foreground">
              Define como o agente deve se comportar e responder. Seja específico e detalhado.
            </p>
          </div>

          <Separator />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {agent.id && agent.id > 0 ? 'Atualizar Agente' : 'Criar Agente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
