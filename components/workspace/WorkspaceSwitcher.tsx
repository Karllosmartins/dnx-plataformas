'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthWrapper'
import { workspacesApi } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react'

interface Workspace {
  id: string
  name: string
  slug: string
  plano_nome?: string
}

interface WorkspaceSwitcherProps {
  isCollapsed?: boolean
}

export function WorkspaceSwitcher({ isCollapsed = false }: WorkspaceSwitcherProps) {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  async function loadWorkspaces() {
    try {
      const response = await workspacesApi.list()

      if (response.success && response.data) {
        const workspacesData = Array.isArray(response.data)
          ? response.data
          : [response.data]

        setWorkspaces(workspacesData as Workspace[])

        // Definir workspace atual (primeiro por padrão ou baseado no usuário)
        if (workspacesData.length > 0) {
          setCurrentWorkspace(workspacesData[0] as Workspace)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitch(workspace: Workspace) {
    if (workspace.id === currentWorkspace?.id) return

    setSwitching(true)
    try {
      const response = await workspacesApi.switchWorkspace(workspace.id)

      if (response.success) {
        setCurrentWorkspace(workspace)
        // Recarregar a página para atualizar todos os dados
        window.location.reload()
      }
    } catch (error) {
      console.error('Erro ao trocar workspace:', error)
    } finally {
      setSwitching(false)
    }
  }

  function getWorkspaceInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-2 py-1.5",
        isCollapsed && "justify-center"
      )}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (workspaces.length === 0) {
    return null
  }

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 w-10 rounded-lg p-0"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {currentWorkspace ? getWorkspaceInitials(currentWorkspace.name) : 'WS'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" className="w-64">
          <WorkspaceMenuContent
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            switching={switching}
            onSwitch={handleSwitch}
            getInitials={getWorkspaceInitials}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-2 justify-start gap-3 hover:bg-sidebar-accent group"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {currentWorkspace ? getWorkspaceInitials(currentWorkspace.name) : 'WS'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">
              {currentWorkspace?.name || 'Selecionar Workspace'}
            </p>
            {currentWorkspace?.plano_nome && (
              <p className="text-xs text-muted-foreground truncate">
                {currentWorkspace.plano_nome}
              </p>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <WorkspaceMenuContent
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          switching={switching}
          onSwitch={handleSwitch}
          getInitials={getWorkspaceInitials}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function WorkspaceMenuContent({
  workspaces,
  currentWorkspace,
  switching,
  onSwitch,
  getInitials,
}: {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  switching: boolean
  onSwitch: (workspace: Workspace) => void
  getInitials: (name: string) => string
}) {
  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        Workspaces
      </DropdownMenuLabel>

      {workspaces.map((workspace) => {
        const isActive = workspace.id === currentWorkspace?.id

        return (
          <DropdownMenuItem
            key={workspace.id}
            className="cursor-pointer"
            onClick={() => onSwitch(workspace)}
            disabled={switching}
          >
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={cn(
                  "text-xs font-semibold",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {getInitials(workspace.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{workspace.name}</p>
                {workspace.plano_nome && (
                  <p className="text-xs text-muted-foreground">{workspace.plano_nome}</p>
                )}
              </div>
              {isActive && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        )
      })}

    </>
  )
}