'use client'

import { useState } from 'react'
import { User } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Settings,
  Users,
  HelpCircle,
  BarChart3,
  LogOut,
  ChevronDown,
  Building2,
  CreditCard,
} from 'lucide-react'
import { MembersDialog } from './MembersDialog'
import { UsageReportDialog } from './UsageReportDialog'

interface UserMenuProps {
  user: User
  onLogout: () => void
  isCollapsed?: boolean
}

export function UserMenu({ user, onLogout, isCollapsed = false }: UserMenuProps) {
  const [membersOpen, setMembersOpen] = useState(false)
  const [usageOpen, setUsageOpen] = useState(false)

  const userInitials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const roleLabel = user.role === 'admin' ? 'Administrador' : 'Usuário'

  if (isCollapsed) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full p-0 hover:bg-sidebar-accent"
            >
              <Avatar className="h-9 w-9 border-2 border-sidebar-border cursor-pointer transition-transform hover:scale-105">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" side="right" sideOffset={8}>
            <UserMenuContent
              user={user}
              roleLabel={roleLabel}
              onLogout={onLogout}
              onOpenMembers={() => setMembersOpen(true)}
              onOpenUsage={() => setUsageOpen(true)}
            />
          </DropdownMenuContent>
        </DropdownMenu>

        <MembersDialog open={membersOpen} onOpenChange={setMembersOpen} />
        <UsageReportDialog open={usageOpen} onOpenChange={setUsageOpen} />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-auto p-2 justify-start gap-3 hover:bg-sidebar-accent group"
          >
            <Avatar className="h-10 w-10 border-2 border-sidebar-border transition-transform group-hover:scale-105">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {roleLabel}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" side="top" sideOffset={8}>
          <UserMenuContent
            user={user}
            roleLabel={roleLabel}
            onLogout={onLogout}
            onOpenMembers={() => setMembersOpen(true)}
            onOpenUsage={() => setUsageOpen(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <MembersDialog open={membersOpen} onOpenChange={setMembersOpen} />
      <UsageReportDialog open={usageOpen} onOpenChange={setUsageOpen} />
    </>
  )
}

function UserMenuContent({
  user,
  roleLabel,
  onLogout,
  onOpenMembers,
  onOpenUsage,
}: {
  user: User
  roleLabel: string
  onLogout: () => void
  onOpenMembers: () => void
  onOpenUsage: () => void
}) {
  const canManageMembers = user.role === 'admin'

  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs leading-none text-muted-foreground">
            {user.email}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Minha Conta</span>
        </DropdownMenuItem>

        {canManageMembers && (
          <DropdownMenuItem className="cursor-pointer" onClick={onOpenMembers}>
            <Users className="mr-2 h-4 w-4" />
            <span>Gerenciar Membros</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="cursor-pointer">
          <Building2 className="mr-2 h-4 w-4" />
          <span>Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem className="cursor-pointer" onClick={onOpenUsage}>
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Uso e Limites</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Plano e Faturamento</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuItem className="cursor-pointer">
        <HelpCircle className="mr-2 h-4 w-4" />
        <span>Ajuda e Suporte</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        onClick={onLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sair</span>
      </DropdownMenuItem>
    </>
  )
}
