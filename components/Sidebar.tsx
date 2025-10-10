'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { hasFeatureAccess } from '../lib/permissions'
import { supabase, User } from '../lib/supabase'
import {
  BarChart3,
  Users,
  MessageSquare,
  Target,
  Calendar,
  Settings,
  Home,
  Send,
  Menu,
  X,
  LogOut,
  MessageCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
  Plug,
  FileText
} from 'lucide-react'

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
  { name: 'Configurações', href: '/configuracoes-admin', icon: Settings, feature: 'usuarios' as const, adminOnly: true },
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
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-400 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Abrir sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-white">
          DNX Plataformas
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Fechar sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
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
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-72'
      }`}>
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
  const [userWithPlan, setUserWithPlan] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUserWithPlan() {
      if (!user?.id) {
        return
      }

      try {
        const { data, error } = await supabase
          .from('view_usuarios_planos')
          .select('*')
          .eq('id', parseInt(user.id?.toString() || '0'))
          .single()

        if (!error && data) {
          // Garantir que o objeto tenha as propriedades necessárias
          const userWithPlanData = {
            ...user,
            ...data,
            // Garantir que as propriedades de plano existam
            acesso_consulta: data.acesso_consulta || false,
            acesso_integracoes: data.acesso_integracoes || false,
            acesso_dashboard: data.acesso_dashboard || false,
            acesso_crm: data.acesso_crm || false,
            acesso_whatsapp: data.acesso_whatsapp || false,
            acesso_disparo_simples: data.acesso_disparo_simples || false,
            acesso_disparo_ia: data.acesso_disparo_ia || false,
            acesso_agentes_ia: data.acesso_agentes_ia || false,
            acesso_extracao_leads: data.acesso_extracao_leads || false,
            acesso_enriquecimento: data.acesso_enriquecimento || false,
            acesso_usuarios: data.acesso_usuarios || false,
            acesso_arquivos: data.acesso_arquivos || false
          }
          setUserWithPlan(userWithPlanData)
        } else {
          // Fallback para user básico
          setUserWithPlan(user)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        setUserWithPlan(user)
      }
    }

    fetchUserWithPlan()
  }, [user?.id])

  // Filtrar navegação baseada nas permissões do usuário
  const filteredNavigation = navigation.filter(item => {
    if (!userWithPlan) return false

    // Se é um item apenas para admin, verificar se o usuário é admin
    if (item.adminOnly && userWithPlan.role !== 'admin') {
      return false
    }

    return hasFeatureAccess(userWithPlan, item.feature)
  })
  return (
    <div className={`flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 pb-4 transition-all duration-300 ${
      isCollapsed ? 'px-2' : 'px-6'
    }`}>
      {/* Logo e Botão Collapse */}
      <div className="flex h-16 shrink-0 items-center justify-between">
        {!isCollapsed ? (
          <Image
            className="h-12 w-auto"
            src="/logo-branca.webp"
            alt="DNX Plataformas"
            width={240}
            height={48}
            priority
          />
        ) : (
          <div className="flex items-center justify-center w-full">
            <Image
              className="h-10 w-10"
              src="/sublogo.png"
              alt="DNX"
              width={40}
              height={40}
              priority
            />
          </div>
        )}
        
        {/* Botão de Collapse - apenas no desktop */}
        <button
          onClick={() => {
            const newCollapsed = !isCollapsed
            setIsCollapsed(newCollapsed)
            onCollapseChange?.(newCollapsed)
          }}
          className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors ${
            isCollapsed ? 'ml-0' : 'ml-4'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className={`space-y-1 ${isCollapsed ? '-mx-1' : '-mx-2'}`}>
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex rounded-md text-sm font-semibold leading-6 transition-colors ${
                        isCollapsed 
                          ? 'p-2 justify-center' 
                          : 'gap-x-3 p-2'
                      } ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {!isCollapsed && (
                        <span className="transition-opacity duration-300">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          
          {/* User info and logout */}
          {user && (
            <li className="mt-auto">
              <div className="border-t border-gray-700 pt-4">
                {isCollapsed ? (
                  <div className="flex flex-col items-center gap-y-2 px-2 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800" title={user.name}>
                      <span className="text-sm font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={onLogout}
                      className="text-gray-400 hover:text-white"
                      title="Sair"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
                      <span className="text-sm font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.role}</div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="text-gray-400 hover:text-white"
                      title="Sair"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          )}
        </ul>
      </nav>
    </div>
  )
}