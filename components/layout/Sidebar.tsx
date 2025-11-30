'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useWorkspaceContext } from '../../contexts/WorkspaceContext'
import { User } from '../../lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart3,
  Users,
  Target,
  Home,
  Send,
  Menu,
  X,
  MessageCircle,
  Bot,
  Database,
  Search,
  Plug,
  FileText,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserMenu } from '@/components/user/UserMenu'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, feature: 'dashboard' as const },
  { name: 'CRM', href: '/leads', icon: Users, feature: 'crm' as const },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, feature: 'dashboard' as const },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageCircle, feature: 'whatsapp' as const },
  { name: 'Agentes IA', href: '/agentes-ia', icon: Bot, feature: 'agentesIA' as const },
  { name: 'Disparo Simples', href: '/disparo-simples', icon: Send, feature: 'disparoSimples' as const },
  { name: 'Disparo com IA', href: '/disparo-ia', icon: Bot, feature: 'disparoIA' as const },
  { name: 'Enriquecimento API', href: '/enriquecimento-api', icon: Database, feature: 'enriquecimentoAPI' as const },
  { name: 'Consulta', href: '/consulta', icon: Search, feature: 'consulta' as const },
  { name: 'Extração Leads', href: '/extracao-leads', icon: Target, feature: 'extracaoLeads' as const },
  { name: 'Integrações', href: '/integracoes', icon: Plug, feature: 'integracoes' as const },
  { name: 'Arquivos', href: '/arquivos', icon: FileText, feature: 'arquivos' as const },
]

interface SidebarProps {
  user?: User
  onLogout?: () => void
  onCollapseChange?: (collapsed: boolean) => void
}

export default function Sidebar({ user, onLogout, onCollapseChange }: SidebarProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 bg-sidebar px-4 py-3 shadow-sm lg:hidden border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Abrir sidebar</span>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-sm font-semibold text-sidebar-foreground">
          DNX Plataformas
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Fechar sidebar</span>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent
                pathname={pathname}
                user={user}
                onLogout={onLogout}
                isCollapsed={false}
                setIsCollapsed={() => {}}
                onCollapseChange={onCollapseChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? 'lg:w-[70px]' : 'lg:w-72'
      )}>
        <SidebarContent
          pathname={pathname}
          user={user}
          onLogout={onLogout}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onCollapseChange={onCollapseChange}
        />
      </div>
    </>
  )
}

function SidebarContent({
  pathname,
  user,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  onCollapseChange
}: {
  pathname: string
  user?: User
  onLogout?: () => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  onCollapseChange?: (collapsed: boolean) => void
}) {
  // Usar WorkspaceContext ao invés de fazer chamada de API separada
  const { currentWorkspace, loading, hasFeatureAccess } = useWorkspaceContext()

  const filteredNavigation = navigation.filter(item => {
    const isAdmin = user?.role === 'admin'

    // Admin sempre tem acesso total
    if (isAdmin) {
      return true
    }

    // Se ainda está carregando, não mostrar nada
    if (loading) {
      return false
    }

    // Verificar se tem workspace com permissões
    if (!currentWorkspace) {
      return false
    }

    // Verificar permissão do workspace usando o contexto
    return hasFeatureAccess(item.feature)
  })

  return (
    <div className={cn(
      "flex h-full flex-col bg-sidebar border-r border-sidebar-border",
      isCollapsed ? 'items-center' : ''
    )}>
      {/* Header com Logo */}
      <div className={cn(
        "flex h-16 shrink-0 items-center border-b border-sidebar-border",
        isCollapsed ? 'flex-col justify-center gap-2 px-2 py-3' : 'justify-between px-4'
      )}>
        {!isCollapsed ? (
          <>
            {/* Logo preta para light mode */}
            <Image
              className="h-10 w-auto dark:hidden"
              src="/logo-preta.webp"
              alt="DNX Plataformas"
              width={200}
              height={40}
              priority
            />
            {/* Logo branca para dark mode */}
            <Image
              className="h-10 w-auto hidden dark:block"
              src="/logo-branca.webp"
              alt="DNX Plataformas"
              width={200}
              height={40}
              priority
            />
          </>
        ) : (
          <Image
            className="h-8 w-8"
            src="/sublogo.png"
            alt="DNX"
            width={32}
            height={32}
            priority
          />
        )}

        {/* Botões de ação - Theme Toggle e Collapse */}
        <div className={cn(
          "flex items-center gap-1",
          isCollapsed && 'flex-row'
        )}>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newCollapsed = !isCollapsed
              setIsCollapsed(newCollapsed)
              onCollapseChange?.(newCollapsed)
            }}
            className="hidden lg:flex h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className={cn(
        "border-b border-sidebar-border p-3",
        isCollapsed && "flex justify-center px-2"
      )}>
        <WorkspaceSwitcher isCollapsed={isCollapsed} />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-1", isCollapsed ? 'px-2' : 'px-3')}>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary-foreground")} />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Menu */}
      {user && onLogout && (
        <div className={cn(
          "border-t border-sidebar-border p-3",
          isCollapsed && "flex flex-col items-center px-2"
        )}>
          <UserMenu
            user={user}
            onLogout={onLogout}
            isCollapsed={isCollapsed}
          />
        </div>
      )}
    </div>
  )
}
