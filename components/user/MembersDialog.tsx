'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthWrapper'
import { workspacesApi } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Crown,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface Member {
  id: string
  user_id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
}

interface MembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleConfig = {
  owner: { label: 'Proprietário', color: 'bg-amber-500', icon: Crown },
  admin: { label: 'Administrador', color: 'bg-blue-500', icon: Shield },
  member: { label: 'Membro', color: 'bg-green-500', icon: Users },
  viewer: { label: 'Visualizador', color: 'bg-gray-500', icon: Users },
}

export function MembersDialog({ open, onOpenChange }: MembersDialogProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      loadMembers()
    }
  }, [open])

  async function loadMembers() {
    setLoading(true)
    try {
      // TODO: Implementar contexto de workspace quando disponível
      const workspaceId = '1'
      const response = await workspacesApi.get(workspaceId)

      if (response.success && response.data) {
        const workspaceData = response.data as { members?: Member[] }
        setMembers(workspaceData.members || [])
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      setInviteError('Digite o email do usuário')
      return
    }

    setInviting(true)
    setInviteError('')
    setInviteSuccess(false)

    try {
      const workspaceId = '1'
      const response = await workspacesApi.inviteMember(workspaceId, {
        email: inviteEmail,
        role: inviteRole,
      })

      if (response.success) {
        setInviteSuccess(true)
        setInviteEmail('')
        setInviteRole('member')
        loadMembers()
        setTimeout(() => {
          setInviteOpen(false)
          setInviteSuccess(false)
        }, 1500)
      } else {
        setInviteError(response.error || 'Erro ao convidar membro')
      }
    } catch (error) {
      setInviteError('Erro ao convidar membro')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Tem certeza que deseja remover este membro?')) return

    try {
      const workspaceId = '1'
      const response = await workspacesApi.removeMember(workspaceId, memberId)

      if (response.success) {
        loadMembers()
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error)
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    try {
      const workspaceId = '1'
      const response = await workspacesApi.updateMemberRole(workspaceId, memberId, newRole)

      if (response.success) {
        loadMembers()
      }
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Membros
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova membros do seu workspace. Defina permissões de acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </div>
          <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Convidar Membro
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Convidar Novo Membro</SheetTitle>
                <SheetDescription>
                  Envie um convite por email para adicionar um novo membro ao workspace.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@exemplo.com"
                      className="pl-10"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">Administrador</div>
                            <div className="text-xs text-muted-foreground">
                              Acesso total, pode gerenciar membros
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-medium">Membro</div>
                            <div className="text-xs text-muted-foreground">
                              Pode criar e editar leads
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">Visualizador</div>
                            <div className="text-xs text-muted-foreground">
                              Apenas visualiza dados
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inviteError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {inviteError}
                  </div>
                )}

                {inviteSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Convite enviado com sucesso!
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <Separator />

        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum membro encontrado</p>
              <p className="text-sm text-muted-foreground">
                Convide pessoas para colaborar no seu workspace
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              {members.map((member) => {
                const config = roleConfig[member.role] || roleConfig.member
                const isCurrentUser = member.user_id === user?.id?.toString()
                const isOwner = member.role === 'owner'
                const canEdit = !isOwner && !isCurrentUser && user?.role === 'admin'

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{member.name}</p>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleUpdateRole(member.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="member">Membro</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={`${config.color} text-white`}
                        >
                          <config.icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      )}

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}