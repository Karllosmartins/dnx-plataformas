'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import { useWorkspaceContext } from '../../contexts/WorkspaceContext'
import { supabase } from '../../lib/supabase'
import { MessageCircle, Smartphone, QrCode, CheckCircle, AlertCircle, WifiOff, Trash2, RotateCcw, Plus, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface WhatsAppInstance {
  id: number
  instanceName: string
  status: string
  isOfficialApi: boolean
  qrCode?: string
  pairCode?: string
  profileName?: string
  profilePicUrl?: string
  wabaId?: string
  phoneId?: string
  error?: string
}

interface WorkspaceInfo {
  limite_instancias: number
}

export default function WhatsAppPage() {
  const { user } = useAuth()
  const { workspaceId } = useWorkspaceContext()
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [connecting, setConnecting] = useState<number | null>(null)
  const [showQrCode, setShowQrCode] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null)

  // Formulário
  const [nome, setNome] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (user && workspaceId) {
      loadData()
    }
  }, [user, workspaceId])

  const loadData = async () => {
    try {
      // Buscar limite de instâncias do workspace
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('limite_instancias')
        .eq('id', workspaceId)
        .single()

      if (workspaceData) {
        setWorkspaceInfo({
          limite_instancias: workspaceData.limite_instancias || 1
        })
      }

      // Buscar instâncias via API
      const response = await fetch(`/api/whatsapp/create-instance?userId=${user?.id}&workspaceId=${workspaceId}`)
      const data = await response.json()

      if (data.success && data.instances) {
        setInstances(data.instances)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const createInstance = async () => {
    if (!nome.trim()) {
      alert('Digite um nome para a instância')
      return
    }

    setCreating(true)

    try {
      const instanceName = nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

      const response = await fetch('/api/whatsapp/create-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workspaceId,
          nomeInstancia: instanceName
        })
      })

      const data = await response.json()

      if (!data.success) {
        console.error('Erro detalhado:', data)
        throw new Error(data.error || data.details || 'Erro ao criar instância')
      }

      setShowCreateForm(false)
      setNome('')

      // Recarregar lista
      await loadData()

      alert('Instância criada com sucesso! Clique em "Conectar" para gerar o QR Code.')

    } catch (error) {
      alert(`Erro ao criar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setCreating(false)
    }
  }

  const connectInstance = async (instance: WhatsAppInstance) => {
    if (instance.isOfficialApi) {
      alert('Esta é uma instância da API oficial do WhatsApp e não requer QR Code.')
      return
    }

    setConnecting(instance.id)
    setSelectedInstance(instance)

    try {
      const response = await fetch('/api/whatsapp/create-instance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: instance.id })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao conectar')
      }

      if (data.isConnected) {
        // Atualizar status na lista
        setInstances(prev => prev.map(inst =>
          inst.id === instance.id ? {
            ...inst,
            status: 'connected',
            profileName: data.data?.profileName,
            profilePicUrl: data.data?.profilePicUrl
          } : inst
        ))
        alert('WhatsApp já está conectado!')
        return
      }

      // Mostrar QR Code
      let qrCodeData = data.data?.qrCode
      if (qrCodeData && !qrCodeData.startsWith('data:image')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`
      }

      setSelectedInstance({
        ...instance,
        status: 'connecting',
        qrCode: qrCodeData,
        pairCode: data.data?.pairCode
      })

      if (qrCodeData || data.data?.pairCode) {
        setShowQrCode(true)
        startConnectionPolling(instance)
      } else {
        alert('QR Code não foi gerado. Tente novamente.')
      }

    } catch (error) {
      alert(`Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setConnecting(null)
    }
  }

  const startConnectionPolling = (instance: WhatsAppInstance) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/create-instance?userId=${user?.id}&workspaceId=${workspaceId}`)
        const data = await response.json()

        if (data.success && data.instances) {
          const updatedInstance = data.instances.find((i: WhatsAppInstance) => i.id === instance.id)
          if (updatedInstance && updatedInstance.status === 'connected') {
            setInstances(data.instances)
            setShowQrCode(false)
            alert('WhatsApp conectado com sucesso!')
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        // Continue polling
      }
    }, 3000)

    // Parar após 5 minutos
    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const canCreateMore = () => {
    const maxInstances = workspaceInfo?.limite_instancias || 1
    return instances.length < maxInstances
  }

  const getStatusBadge = (instance: WhatsAppInstance) => {
    if (instance.isOfficialApi) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Globe className="h-3 w-3 mr-1" /> API Oficial</Badge>
    }

    switch (instance.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="h-3 w-3 mr-1" /> Conectando...</Badge>
      case 'created':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Smartphone className="h-3 w-3 mr-1" /> Criado</Badge>
      case 'erro':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>
      default:
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><WifiOff className="h-3 w-3 mr-1" /> Desconectado</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-green-600" />
            WhatsApp
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas conexões WhatsApp ({instances.length}/{workspaceInfo?.limite_instancias || 1})
          </p>
        </div>

        {canCreateMore() && (
          <Button onClick={() => setShowCreateForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Instância
          </Button>
        )}
      </div>

      {/* Lista de Instâncias ou Estado Vazio */}
      {instances.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <MessageCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Configure seu WhatsApp</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Crie sua instância WhatsApp para começar a enviar e receber mensagens.
            </p>
            {canCreateMore() && (
              <Button onClick={() => setShowCreateForm(true)} className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-5 w-5 mr-2" />
                Criar Instância
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {instance.profilePicUrl ? (
                        <img src={instance.profilePicUrl} alt="Profile" className="h-6 w-6 rounded-full" />
                      ) : instance.isOfficialApi ? (
                        <Globe className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Smartphone className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {instance.profileName || instance.instanceName}
                      </CardTitle>
                      {instance.profileName && instance.profileName !== instance.instanceName && (
                        <p className="text-sm text-gray-500">{instance.instanceName}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(instance)}
                        {instance.error && (
                          <span className="text-xs text-red-500">{instance.error}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!instance.isOfficialApi && (instance.status === 'created' || instance.status === 'disconnected' || instance.status === 'erro') && (
                      <Button
                        onClick={() => connectInstance(instance)}
                        disabled={connecting === instance.id}
                        variant={instance.status === 'disconnected' ? 'outline' : 'default'}
                        className={instance.status === 'created' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {instance.status === 'disconnected' || instance.status === 'erro' ? (
                          <><RotateCcw className="h-4 w-4 mr-2" />{connecting === instance.id ? 'Reconectando...' : 'Reconectar'}</>
                        ) : (
                          <><QrCode className="h-4 w-4 mr-2" />{connecting === instance.id ? 'Gerando...' : 'Conectar'}</>
                        )}
                      </Button>
                    )}

                    {!instance.isOfficialApi && instance.status === 'connecting' && (
                      <Button
                        onClick={() => connectInstance(instance)}
                        variant="outline"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Ver QR Code
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Modal QR Code */}
      <Dialog open={showQrCode && !!selectedInstance} onOpenChange={setShowQrCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp ou use o código de pareamento
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            {selectedInstance?.qrCode && (
              <img
                src={selectedInstance.qrCode}
                alt="QR Code WhatsApp"
                className="w-64 h-64 border rounded-lg"
              />
            )}
            {selectedInstance?.pairCode && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Ou use o código de pareamento:</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{selectedInstance.pairCode}</p>
              </div>
            )}
            {!selectedInstance?.qrCode && !selectedInstance?.pairCode && (
              <p className="text-gray-500">Gerando QR Code...</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQrCode(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Instância */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Instância WhatsApp</DialogTitle>
            <DialogDescription>
              Digite um nome para identificar sua conexão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Instância</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Minha Empresa"
              />
              <p className="text-xs text-gray-500">
                Este nome será usado para identificar sua conexão
              </p>
            </div>

            {nome && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>ID da instância:</strong> {nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowCreateForm(false)
              setNome('')
            }}>
              Cancelar
            </Button>
            <Button
              onClick={createInstance}
              disabled={creating || !nome.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating ? 'Criando...' : 'Criar Instância'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
