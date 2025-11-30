'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import { useWorkspaceContext } from '../../contexts/WorkspaceContext'
import { supabase } from '../../lib/supabase'
import { User } from '../../lib/auth'
import { MessageCircle, Smartphone, QrCode, CheckCircle, AlertCircle, WifiOff, Eye, EyeOff, Trash2, RotateCcw, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  nome: string
  telefone: string
  status: 'created' | 'connecting' | 'connected' | 'disconnected'
  qrCode?: string
  baseUrl?: string
  apiKey?: string
}

export default function WhatsAppPage() {
  const { user } = useAuth()
  const { workspaceId } = useWorkspaceContext()
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [userInfo, setUserInfo] = useState<(User & { numero_instancias?: number }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null)

  // Formulário
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (user && workspaceId) {
      loadUserInstances()
    }
  }, [user, workspaceId])

  const checkInstancesStatus = async (instancesToCheck: WhatsAppInstance[]) => {
    for (const instance of instancesToCheck) {
      try {
        const response = await fetch(`/api/whatsapp/status?instanceId=${instance.id}`)
        const data = await response.json()

        if (data.success && data.data) {
          let status: 'created' | 'connecting' | 'connected' | 'disconnected' = 'disconnected'

          if (data.data.status_conexao === 'conectado' || data.data.api_status?.data?.status === 'connected') {
            status = 'connected'
          } else if (data.data.api_status?.data?.status === 'connecting') {
            status = 'connecting'
          } else {
            status = 'disconnected'
          }

          setInstances(prev => prev.map(inst =>
            inst.id === instance.id ? { ...inst, status } : inst
          ))
        }
      } catch (error) {
        // Silently handle status check errors
      }
    }
  }

  const loadUserInstances = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('numero_instancias')
        .eq('id', parseInt(user?.id || '0'))
        .single()

      if (!userError && user) {
        setUserInfo({
          ...user,
          numero_instancias: userData?.numero_instancias
        })
      }

      const { data: instancesData, error: instancesError } = await supabase
        .from('instancia_whtats')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (!instancesError && instancesData) {
        const mappedInstances = instancesData.map(inst => ({
          id: inst.id,
          instanceName: inst.instancia || '',
          nome: '',
          telefone: '',
          status: 'created' as const,
          baseUrl: inst.baseurl,
          apiKey: inst.apikey
        }))
        setInstances(mappedInstances)
        checkInstancesStatus(mappedInstances)
      }
    } catch (error) {
      // Handle loading error silently
    } finally {
      setLoading(false)
    }
  }

  const createInstance = async () => {
    if (!nome.trim() || !telefone.trim() || !senha.trim()) {
      alert('Preencha todos os campos')
      return
    }

    setCreating(true)

    try {
      const telefoneClean = telefone.replace(/\D/g, '')
      const instanceName = nome.toLowerCase().replace(/\s+/g, '') + telefoneClean

      const response = await fetch('/api/whatsapp/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          workspaceId,
          nomeInstancia: nome,
          instanciaNome: instanceName,
          apikey: senha
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar instância')
      }

      const { data: newInstance, error: saveError } = await supabase
        .from('instancia_whtats')
        .insert({
          user_id: parseInt(user?.id || '0'),
          workspace_id: workspaceId,
          instancia: instanceName,
          apikey: data.data?.uazapi_response?.token || senha,
          baseurl: 'https://dnxplataforma.uazapi.com'
        })
        .select()
        .single()

      if (saveError) {
        const { data: existingInstance } = await supabase
          .from('instancia_whtats')
          .select('*')
          .eq('instancia', instanceName)
          .single()

        if (existingInstance) {
          setInstances(prev => [{
            id: existingInstance.id,
            instanceName,
            nome,
            telefone,
            status: 'created' as const,
            baseUrl: existingInstance.baseurl,
            apiKey: existingInstance.apikey
          }, ...prev])
        }
      } else if (newInstance) {
        setInstances(prev => [{
          id: newInstance.id,
          instanceName,
          nome,
          telefone,
          status: 'created' as const,
          baseUrl: newInstance.baseurl,
          apiKey: newInstance.apikey
        }, ...prev])
      }

      setShowCreateForm(false)
      setNome('')
      setTelefone('')
      setSenha('')

      alert('Instância criada com sucesso! Agora você pode gerar o QR Code para conectar.')

    } catch (error) {
      alert(`Erro ao criar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setCreating(false)
    }
  }

  const generateQrCode = async (instance: WhatsAppInstance) => {
    if (!instance) return

    setConnecting(true)

    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: instance.id })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao conectar instância')
      }

      if (data.data?.status === 'connected') {
        setInstances(prev => prev.map(inst =>
          inst.id === instance.id ? { ...inst, status: 'connected' } : inst
        ))
        setSelectedInstance(prev => prev ? { ...prev, status: 'connected' } : null)
        alert('WhatsApp já está conectado!')
        return
      }

      let qrCodeData: string | null = null
      if (data.data?.qrCode) {
        qrCodeData = data.data.qrCode
        if (qrCodeData && !qrCodeData.startsWith('data:image')) {
          qrCodeData = `data:image/png;base64,${qrCodeData}`
        }
      }

      setInstances(prev => prev.map(inst =>
        inst.id === instance.id
          ? { ...inst, status: 'connecting', qrCode: qrCodeData || undefined }
          : inst
      ))

      setSelectedInstance(prev => prev ? {
        ...prev,
        status: 'connecting',
        qrCode: qrCodeData || undefined
      } : null)

      if (qrCodeData) {
        setShowQrCode(true)
      } else {
        alert('QR Code não foi gerado. Tente novamente em alguns segundos.')
      }

      startConnectionPolling(instance)

    } catch (error) {
      alert(`Erro ao gerar QR Code: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setConnecting(false)
    }
  }

  const startConnectionPolling = (instance: WhatsAppInstance) => {
    const pollInterval = setInterval(async () => {
      if (!instance || instance.status === 'connected') {
        clearInterval(pollInterval)
        return
      }

      try {
        const response = await fetch(`/api/whatsapp/status?instanceId=${instance.id}`)
        const data = await response.json()

        if (data.success && data.data) {
          if (data.data.status_conexao === 'conectado' || data.data.api_status?.data?.status === 'connected') {
            setInstances(prev => prev.map(inst =>
              inst.id === instance.id ? { ...inst, status: 'connected' } : inst
            ))

            if (selectedInstance?.id === instance.id) {
              setSelectedInstance(prev => prev ? { ...prev, status: 'connected' } : null)
            }

            setShowQrCode(false)
            alert('WhatsApp conectado com sucesso!')
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        // Continue polling despite errors
      }
    }, 3000)

    setTimeout(() => clearInterval(pollInterval), 300000)
  }

  const deleteInstance = async (instance: WhatsAppInstance) => {
    if (!instance) return
    if (!confirm('Tem certeza que deseja deletar esta instância? Esta ação não pode ser desfeita.')) return

    try {
      const response = await fetch(`/api/whatsapp/instances?instanceId=${instance.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao deletar instância')
      }

      await supabase
        .from('instancia_whtats')
        .delete()
        .eq('id', instance.id)

      setInstances(prev => prev.filter(inst => inst.id !== instance.id))

      if (selectedInstance?.id === instance.id) {
        setSelectedInstance(null)
        setShowQrCode(false)
      }

      alert('Instância deletada com sucesso!')

    } catch (error) {
      alert(`Erro ao deletar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const canCreateMore = () => {
    const maxInstances = userInfo?.numero_instancias || 1
    return instances.length < maxInstances
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" /> Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertCircle className="h-3 w-3 mr-1" /> Conectando...</Badge>
      case 'created':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><Smartphone className="h-3 w-3 mr-1" /> Criado</Badge>
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
            Gerencie suas conexões WhatsApp
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
            <h3 className="text-xl font-medium text-gray-900 mb-2">Configure seu primeiro WhatsApp</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Crie sua primeira instância WhatsApp para começar a enviar e receber mensagens.
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
                      <Smartphone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{instance.instanceName}</CardTitle>
                      <div className="mt-1">
                        {getStatusBadge(instance.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(instance.status === 'created' || instance.status === 'disconnected') && (
                      <Button
                        onClick={() => {
                          setSelectedInstance(instance)
                          generateQrCode(instance)
                        }}
                        disabled={connecting}
                        variant={instance.status === 'disconnected' ? 'outline' : 'default'}
                        className={instance.status === 'created' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {instance.status === 'disconnected' ? (
                          <><RotateCcw className="h-4 w-4 mr-2" />{connecting ? 'Reconectando...' : 'Reconectar'}</>
                        ) : (
                          <><QrCode className="h-4 w-4 mr-2" />{connecting ? 'Gerando...' : 'Conectar'}</>
                        )}
                      </Button>
                    )}

                    {instance.status === 'connecting' && (
                      <span className="text-sm text-blue-600">Escaneie o QR Code...</span>
                    )}

                    <Button
                      onClick={() => deleteInstance(instance)}
                      variant="destructive"
                      size="icon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Modal QR Code */}
      <Dialog open={showQrCode && !!selectedInstance?.qrCode} onOpenChange={setShowQrCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo com seu WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {selectedInstance?.qrCode && (
              <img
                src={selectedInstance.qrCode}
                alt="QR Code WhatsApp"
                className="w-64 h-64 border rounded-lg"
              />
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
              Preencha os dados para criar uma nova conexão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Minha Empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: 62999999999"
              />
              <p className="text-xs text-gray-500">Digite apenas números</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Token/Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite uma senha segura"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>

            {nome && telefone && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Nome da instância:</strong> {nome.toLowerCase().replace(/\s+/g, '') + telefone.replace(/\D/g, '')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowCreateForm(false)
              setNome('')
              setTelefone('')
              setSenha('')
            }}>
              Cancelar
            </Button>
            <Button
              onClick={createInstance}
              disabled={creating || !nome.trim() || !telefone.trim() || !senha.trim()}
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
