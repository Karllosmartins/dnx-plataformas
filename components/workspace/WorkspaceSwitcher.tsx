'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthWrapper'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
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
  const { currentWorkspace, switchWorkspace, loading: contextLoading } = useWorkspaceContext()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [user?.id])

  async function loadWorkspaces() {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      // Carregar lista de workspaces
      const response = await workspacesApi.list()

      if (response.success && response.data) {
        const workspacesData = Array.isArray(response.data)
          ? response.data
          : [response.data]

        setWorkspaces(workspacesData as Workspace[])
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitch(workspace: Workspace) {
    if (currentWorkspace && workspace.id === String(currentWorkspace.id)) return

    setSwitching(true)
    try {
      await switchWorkspace(Number(workspace.id))
    } catch (error) {
      // Silently handle error
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

  if (loading || contextLoading) {
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

  // Usar o workspace do contexto para exibir o atual
  const displayWorkspace = currentWorkspace
    ? { id: String(currentWorkspace.id), name: currentWorkspace.name, slug: currentWorkspace.slug, plano_nome: currentWorkspace.plano_nome }
    : workspaces[0]

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
                {displayWorkspace ? getWorkspaceInitials(displayWorkspace.name) : 'WS'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" className="w-64">
          <WorkspaceMenuContent
            workspaces={workspaces}
            currentWorkspace={displayWorkspace}
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
              {displayWorkspace ? getWorkspaceInitials(displayWorkspace.name) : 'WS'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">
              {displayWorkspace?.name || 'Selecionar Workspace'}
            </p>
            {displayWorkspace?.plano_nome && (
              <p className="text-xs text-muted-foreground truncate">
                {displayWorkspace.plano_nome}
              </p>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <WorkspaceMenuContent
          workspaces={workspaces}
          currentWorkspace={displayWorkspace}
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
