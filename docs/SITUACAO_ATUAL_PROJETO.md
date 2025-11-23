# 🗺️ Panorama Geral do Projeto DNX CRM

> **Data**: 2025-11-23
> **Versão**: 1.0
> **Status**: 🟢 Em Desenvolvimento Ativo

---

## 📊 Resumo Executivo

### Status Geral
- **Progresso**: ~65% completo
- **Fase atual**: Refatoração de arquitetura (User-based → Workspace-based)
- **Deploy**: Em produção (branch main)
- **Última build**: ✅ Bem-sucedida

### Saúde do Projeto
| Aspecto | Status | Nota |
|---------|--------|------|
| **Backend (API)** | 🟢 Saudável | Express + Supabase funcionando |
| **Frontend** | 🟡 Parcial | Next.js funcional, algumas páginas pendentes |
| **Banco de Dados** | 🟢 Estruturado | Schema bem definido, migration pendente |
| **Autenticação** | 🟢 Funcionando | JWT via API Express |
| **Multi-tenancy** | 🟡 Em transição | Estrutura criada, migrando limites |

---

## 🏗️ Arquitetura Atual

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│           FRONTEND (Next.js 14)         │
│  - App Router                           │
│  - TypeScript                           │
│  - Tailwind CSS + shadcn/ui             │
│  - Client Components                    │
└──────────────┬──────────────────────────┘
               │ HTTP/REST
               │ JWT Bearer Token
┌──────────────▼──────────────────────────┐
│         BACKEND (Express API)           │
│  - Node.js + TypeScript                 │
│  - JWT Authentication Middleware        │
│  - Workspace Middleware                 │
│  - API Routes (Modular)                 │
└──────────────┬──────────────────────────┘
               │ Supabase Client
               │ (RLS disabled, API-level auth)
┌──────────────▼──────────────────────────┐
│        DATABASE (Supabase/Postgres)     │
│  - Multi-tenant (workspace_id)          │
│  - Funis & Estágios                     │
│  - Campos Personalizados                │
│  - Users & Workspaces                   │
└─────────────────────────────────────────┘
```

### Estrutura de Pastas

```
dnx_recuperacao_credito/
├── app/                          # Frontend (Next.js App Router)
│   ├── page.tsx                  # ✅ Dashboard principal
│   ├── leads/
│   │   ├── page.tsx              # ✅ Lista de leads (com filtros)
│   │   └── funis/page.tsx        # ✅ Gerenciamento de funis
│   ├── relatorios/page.tsx       # ✅ Relatórios e métricas
│   ├── usuarios/page.tsx         # ✅ Gestão de usuários
│   └── ...                       # Outras páginas
│
├── apps/
│   ├── api/                      # Backend (Express API)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts       # ✅ Autenticação JWT
│   │   │   │   ├── leads.ts      # ✅ CRUD leads + limites workspace
│   │   │   │   ├── funis.ts      # ✅ CRUD funis
│   │   │   │   ├── workspaces.ts # ✅ Gestão workspaces
│   │   │   │   └── ...
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts       # ✅ JWT validation
│   │   │   │   └── workspace.ts  # ✅ Workspace extraction
│   │   │   └── server.ts         # ✅ Express app
│   │   └── migrations/
│   │       ├── 001_create_workspaces_fixed.sql  # ✅ Executada
│   │       └── 002_move_limits_to_workspace.sql # ⏳ Pendente
│   │
│   └── web/                      # Outro frontend (duplicado)
│       └── src/app/dashboard/    # Dashboard alternativo
│
├── lib/
│   ├── api.ts                    # ✅ API client (axios)
│   ├── auth.ts                   # ✅ Auth service
│   └── supabase.ts               # ✅ Supabase client + types
│
└── components/
    ├── ui/                       # ✅ shadcn/ui components
    ├── shared/                   # ✅ AuthWrapper, etc
    └── features/                 # Feature components
```

---

## ✅ Funcionalidades Implementadas

### 1. **Sistema de Autenticação**
- ✅ Login/Logout via API Express
- ✅ JWT tokens (armazenados em localStorage)
- ✅ Middleware de autenticação
- ✅ Proteção de rotas
- ✅ Session persistence

### 2. **Multi-Tenancy (Workspaces)**
- ✅ Estrutura de workspaces e membros
- ✅ Roles: owner, admin, member, viewer
- ✅ Workspace switching
- ✅ Middleware automático de workspace
- 🟡 Limites movendo para workspace (migration pendente)

### 3. **CRM - Gestão de Leads**
- ✅ CRUD completo de leads
- ✅ Campos personalizados (dinâmicos)
- ✅ Filtros avançados:
  - Por funil e estágio
  - Por campanha e origem
  - Por data (DatePicker)
  - Busca por nome/email/telefone
- ✅ Paginação (até 500 leads por página)
- ✅ Visualizações: Lista e Kanban
- ✅ Modal de criação/edição
- ✅ Drawer de visualização detalhada
- ✅ **Verificação de limite de workspace** (novo)

### 4. **Sistema de Funis**
- ✅ CRUD de funis
- ✅ CRUD de estágios
- ✅ Drag & drop para ordenação
- ✅ Cores customizadas
- ✅ Ativar/desativar funis e estágios
- ✅ Associação de leads a funis/estágios
- ✅ Filtrado por workspace

### 5. **Campos Personalizados**
- ✅ Criar campos globais ou por funil
- ✅ Tipos: texto, número, data, select, textarea, boolean
- ✅ Armazenamento em JSONB (`dados_personalizados`)
- ✅ Renderização dinâmica no frontend

### 6. **Relatórios**
- ✅ Métricas gerais (total leads, conversão)
- ✅ Funil de conversão (com estágios reais)
- ✅ Filtros (campanha, origem, funil, estágio, datas, CNPJ)
- ✅ Gráficos (recharts)
- ✅ Visualização de funil
- ❌ Status antigo removido

### 7. **Gestão de Usuários**
- ✅ Listar usuários
- ✅ Criar/editar usuários
- ✅ Roles (admin/user)
- ✅ Ativar/desativar
- 🟡 Planos (ainda vinculados a user, migrando para workspace)

---

## 🟡 Funcionalidades Parcialmente Implementadas

### 1. **Sistema de Planos**
- ✅ Tabela `planos` criada
- ✅ Planos: básico, premium1, premium2, enterprise
- ✅ Controle de acessos por plano
- 🟡 Limites ainda em `users`, migrando para `workspaces`
- ⏳ Migration 002 pendente de execução

### 2. **Limites de Workspace**
- ✅ Migration criada (002)
- ✅ API de leads verifica limite antes de criar
- ✅ Contador incrementado automaticamente
- ⏳ **Precisa executar migration no banco**
- ⏳ Frontend não exibe limites ainda

### 3. **Dashboard de Consumo**
- ✅ Backend preparado (API workspaces retorna limites)
- ❌ Frontend não implementado

---

## ❌ Funcionalidades NÃO Implementadas

### 1. **Integração DataCode**
- ❌ API wrapper não criada
- ❌ Auto-cadastro de leads não implementado
- ❌ Histórico de operações não existe
- ❌ Verificação de limites de consultas não implementada

### 2. **Sistema de Disparos Interno**
- ❌ Tudo ainda vai para N8N (externo)
- ❌ Sem controle de campanhas
- ❌ Sem logs de disparo
- ❌ Sem relatórios de disparos

### 3. **Notificações**
- ❌ Sem sistema de notificações
- ❌ Sem alertas de limite
- ❌ Sem emails automáticos

### 4. **Onboarding**
- ❌ Sem tour guiado
- ❌ Sem templates prontos
- ❌ Sem wizard de configuração

---

## 🗄️ Estado do Banco de Dados

### Migrations Executadas
1. ✅ **001_create_workspaces_fixed.sql**
   - Criou tabelas `workspaces` e `workspace_members`
   - Adicionou `current_workspace_id` em users

### Migrations Pendentes
1. ⏳ **002_move_limits_to_workspace.sql**
   - Adiciona campos de limite e consumo em workspaces
   - Migra dados de users para workspaces
   - Cria funções helper
   - **Precisa ser executada MANUALMENTE**

### Schema Principal

```sql
-- Workspaces (multi-tenancy)
workspaces (
  id UUID,
  name TEXT,
  slug TEXT UNIQUE,
  plano_id BIGINT → planos(id),
  settings JSONB,
  -- Novos campos (após migration 002):
  limite_leads INTEGER,
  limite_consultas INTEGER,
  limite_instancias INTEGER,
  leads_consumidos INTEGER,
  consultas_realizadas INTEGER,
  instancias_ativas INTEGER,
  ultimo_reset_contagem TIMESTAMP,
  plano_customizado JSONB
)

-- Membros do workspace
workspace_members (
  id UUID,
  workspace_id UUID → workspaces(id),
  user_id INTEGER → users(id),
  role TEXT, -- 'owner', 'admin', 'member', 'viewer'
  permissions JSONB,
  joined_at TIMESTAMP
)

-- Usuários
users (
  id SERIAL,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT, -- 'admin', 'user'
  active BOOLEAN,
  current_workspace_id UUID → workspaces(id),
  plano_id BIGINT, -- Deprecated, movendo para workspace
  limite_leads INTEGER, -- Deprecated
  limite_consultas INTEGER, -- Deprecated
  leads_consumidos INTEGER, -- Deprecated
  consultas_realizadas INTEGER -- Deprecated
)

-- Planos
planos (
  id SERIAL,
  nome TEXT UNIQUE,
  descricao TEXT,
  -- Acessos
  acesso_dashboard BOOLEAN,
  acesso_crm BOOLEAN,
  acesso_whatsapp BOOLEAN,
  acesso_disparo_simples BOOLEAN,
  acesso_disparo_ia BOOLEAN,
  acesso_agentes_ia BOOLEAN,
  acesso_extracao_leads BOOLEAN,
  acesso_enriquecimento BOOLEAN,
  acesso_usuarios BOOLEAN,
  acesso_consulta BOOLEAN,
  acesso_integracoes BOOLEAN,
  acesso_arquivos BOOLEAN,
  -- Limites
  limite_leads INTEGER,
  limite_consultas INTEGER,
  limite_instancias INTEGER,
  ativo BOOLEAN
)

-- Leads
leads (
  id SERIAL,
  workspace_id UUID → workspaces(id),
  user_id INTEGER → users(id),
  nome_cliente TEXT,
  telefone TEXT,
  email_usuario TEXT,
  cpf_cnpj TEXT,
  origem TEXT,
  nome_campanha TEXT,
  funil_id UUID → funis(id),
  estagio_id UUID → funil_estagios(id),
  dados_personalizados JSONB, -- Campos dinâmicos
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Funis
funis (
  id UUID,
  workspace_id UUID → workspaces(id),
  nome TEXT,
  descricao TEXT,
  cor TEXT,
  ordem INTEGER,
  ativo BOOLEAN
)

-- Estágios dos Funis
funil_estagios (
  id UUID,
  funil_id UUID → funis(id),
  nome TEXT,
  cor TEXT,
  ordem INTEGER,
  ativo BOOLEAN
)

-- Campos Personalizados
campos_personalizados (
  id SERIAL,
  workspace_id UUID → workspaces(id),
  nome TEXT,
  tipo TEXT, -- 'texto', 'numero', 'data', 'select', 'textarea', 'boolean'
  opcoes JSONB, -- Para tipo 'select'
  obrigatorio BOOLEAN,
  global BOOLEAN,
  funil_id UUID, -- NULL se global
  ativo BOOLEAN
)
```

---

## 📈 Commits Recentes (Últimas 24h)

| Commit | Descrição | Status |
|--------|-----------|--------|
| `1151736` | fix: filtrar funis por workspace no relatório | ✅ Pushed |
| `8369a96` | feat: migrar limites de usuário para workspace | ✅ Pushed |
| `42915f6` | refactor: remover filtro de status do relatório | ✅ Pushed |
| `ca8e51e` | fix: corrigir tipos TypeScript para funis no relatório | ✅ Pushed |
| `e8b5b9a` | feat: modernizar relatórios com funis e estágios reais | ✅ Pushed |

---

## 🔧 Configuração Atual

### Ambiente de Desenvolvimento
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Next.js**: 14.0.0
- **React**: 18.2.0
- **TypeScript**: 5.2.2

### Variáveis de Ambiente Necessárias

```bash
# .env.local (frontend)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# .env (backend)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
PORT=3001
```

---

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia tudo (turbo)
npm run dev:web          # Só frontend
npm run dev:api          # Só backend

# Build
npm run build            # Build tudo
npm run build:web        # Build frontend
npm run build:api        # Build backend

# Produção
npm run start:web        # Start frontend
npm run start:api        # Start backend

# Outros
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

---

## ⚠️ Problemas Conhecidos

### 1. Build Warnings (Não bloqueantes)
```
⚠️ Custom webpack configuration detected
⚠️ Non-standard NODE_ENV value
⚠️ React Hook useEffect missing dependencies (múltiplos)
```
**Impacto**: Nenhum, aplicação funciona normalmente

### 2. Migration Pendente
```
🔴 Migration 002 NÃO executada no banco de produção
```
**Impacto**: Sistema de limites workspace não está ativo
**Ação**: Executar manualmente no Supabase

### 3. Estrutura Duplicada
```
⚠️ Existem 2 frontends: /app e /apps/web/src/app
```
**Impacto**: Confusão, mas /app é o principal
**Ação futura**: Limpar /apps/web ou consolidar

---

## 📊 Métricas de Código

### Estrutura
- **Total de arquivos**: ~150 arquivos TypeScript/React
- **Linhas de código**: ~15.000 linhas (estimado)
- **Componentes UI**: ~40 componentes shadcn/ui
- **Rotas API**: 8 arquivos de rotas

### Qualidade
- **TypeScript**: Strict mode ✅
- **ESLint**: Configurado ✅
- **Type Coverage**: ~85%
- **Build Status**: ✅ Passando
- **Testes**: ❌ Não implementados

---

## 🎯 Próximas Ações (Ordenadas por Prioridade)

### Imediato (Esta semana)
1. ⚠️ **Executar Migration 002** no banco
2. 🧪 **Testar** criação de leads com limite
3. 📝 **Validar** que funis aparecem corretamente no relatório

### Curto Prazo (1-2 semanas)
1. 🔌 **Desenvolver API DataCode** (consulta, extração, enriquecimento)
2. 🤖 **Auto-cadastro de leads** da DataCode
3. 📊 **Dashboard de consumo** do workspace (frontend)

### Médio Prazo (3-4 semanas)
1. 📤 **Migrar Disparo Simples** para backend
2. 🤖 **Migrar Disparo IA** para backend
3. 📱 **Migrar Disparo API Oficial** para backend
4. 📈 **Relatórios unificados** de disparos

### Longo Prazo (1-2 meses)
1. 🔔 **Sistema de notificações**
2. 📥 **Importação CSV** de leads
3. 🎓 **Onboarding** de usuários
4. 🧪 **Testes automatizados**

---

## 💡 Recomendações Técnicas

### Dívida Técnica
1. **Consolidar frontends**: Decidir entre /app e /apps/web
2. **Adicionar testes**: Jest + React Testing Library
3. **Melhorar error handling**: Tratamento mais robusto
4. **Adicionar logging**: Winston ou Pino no backend
5. **Cache**: Redis para consultas frequentes

### Performance
1. **Lazy loading**: Componentes pesados
2. **Virtualização**: Listas longas de leads
3. **Debounce**: Inputs de busca
4. **CDN**: Assets estáticos

### Segurança
1. **Rate limiting**: Proteger APIs
2. **Input validation**: Zod no backend
3. **CSRF protection**: Tokens para forms
4. **Helmet.js**: Headers de segurança

---

## 📞 Pontos de Contato

### Documentação
- 📋 [Backlog](./BACKLOG.md)
- 📝 [CLAUDE.md](../CLAUDE.md) - Instruções para IA
- 🗺️ Este arquivo - Panorama geral

### Repositório
- 🌐 GitHub: [Karllosmartins/dnx-plataformas](https://github.com/Karllosmartins/dnx-plataformas)
- 🔥 Branch principal: `main`

---

## ✅ Conclusão

### Status Atual
O projeto está em **bom estado de desenvolvimento**, com:
- ✅ Arquitetura sólida (Express + Next.js + Supabase)
- ✅ Autenticação funcionando
- ✅ Multi-tenancy estruturado
- ✅ CRM funcional com funis e estágios
- ✅ Relatórios básicos implementados
- 🟡 Migrando para modelo workspace-based (65% completo)

### Próximo Marco
**Meta**: Concluir migração workspace-based e integração DataCode
**Prazo estimado**: 2-3 semanas
**Entregas**:
1. Sistema de limites workspace ativo
2. API DataCode funcionando
3. Auto-cadastro de leads
4. Dashboard de consumo

### Visão de Longo Prazo
- Sistema 100% interno (sem dependências de N8N)
- Relatórios completos e unificados
- Multi-tenancy robusto
- Escalável para centenas de workspaces

**Status Geral**: 🟢 **SAUDÁVEL** - Progredindo conforme planejado
