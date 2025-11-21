# 📋 PLANO DETALHADO DE REORGANIZAÇÃO - DNX Recuperação Crédito

> **Data**: 2025-11-21
> **Status**: Em Planejamento
> **Prioridade**: CRÍTICA
> **Tempo Estimado**: 3-4 dias de trabalho intenso

---

## 🎯 OBJETIVO

Transformar o codebase de um estado "funcional mas bagunçado" para um estado "bem organizado, seguro e mantível".

---

## 📊 ESTRUTURA DO PLANO

O plano está dividido em **8 FASES** com escopo, tarefas e métricas claras:

### **FASE 1: Análise e Planejamento (2-3 horas)**
### **FASE 2: Correções de Segurança Crítica (2-3 horas)**
### **FASE 3: Limpeza de Debug Code (3-4 horas)**
### **FASE 4: Consolidação de Duplicação (4-5 horas)**
### **FASE 5: Refactor Arquitetural (6-8 horas)**
### **FASE 6: Padronização de Padrões (4-6 horas)**
### **FASE 7: Testes e Validação (3-4 horas)**
### **FASE 8: Documentação e Limpeza Final (2-3 horas)**

**Total Estimado**: 26-36 horas de trabalho estruturado

---

## 🔴 FASE 1: ANÁLISE E PLANEJAMENTO (2-3 horas)

### Objetivo
Mapear exatamente quais arquivos serão tocados e quais dependências existem.

### Tarefas

#### 1.1 - Mapear Todas as Importações Críticas
- [ ] Verificar todos os imports de `/lib/auth.ts` (quantos arquivos usam?)
- [ ] Verificar todos os imports de `/lib/supabase.ts` (quantos arquivos usam?)
- [ ] Listar todos os arquivos que fazem console.log
- [ ] Listar todos os API routes que checam permissões

**Ferramentas**: Grep em padrões específicos
**Saída**: Relatório de dependências

#### 1.2 - Identificar Rotas Críticas
- [ ] Quais páginas dependem de `/admin/planos`?
- [ ] Quais páginas dependem de `/admin/tipos-negocio`?
- [ ] Qual é o fluxo de navegação do admin?

**Ferramentas**: Verificação manual + Grep
**Saída**: Diagrama de fluxo de navegação

#### 1.3 - Criar Estratégia de Backup
- [ ] Criar branch `reorganizacao/main` para trabalho
- [ ] Garantir que main está committed e clean
- [ ] Fazer backup local do projeto

**Ferramentas**: Git
**Saída**: Branch criada, local seguro

#### 1.4 - Documentar Impactos
- [ ] Criar documento de "breaking changes" previstos
- [ ] Identificar arquivos que precisarão ser atualizados após cada mudança

**Ferramentas**: Análise manual
**Saída**: Documento de impactos

---

## 🔒 FASE 2: CORREÇÕES DE SEGURANÇA CRÍTICA (2-3 horas)

### Objetivo
Corrigir as 3 vulnerabilidades críticas antes de continuar.

### Tarefas

#### 2.1 - Remover Arquivos de Backup com Credenciais
- [ ] Deletar `.env.local.backup`
- [ ] Deletar `.env.production.local.backup`
- [ ] Adicionar `*.backup` ao `.gitignore`
- [ ] Verificar git history (se estava lá antes)
- [ ] Commit: "security: remove backup files with credentials"

**Impacto**: ZERO em funcionalidade
**Arquivos Afetados**: 2 arquivos deletados
**Tempo**: 10 minutos

#### 2.2 - Corrigir JWT_SECRET Padrão
- [ ] Modificar `middleware.ts` linha 57 para usar valor obrigatório
- [ ] Adicionar validação no startup

```typescript
// ANTES:
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

// DEPOIS:
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET env var é obrigatória em produção')
}
```

- [ ] Verificar `.env.example` tem `JWT_SECRET`
- [ ] Commit: "security: enforce JWT_SECRET requirement"

**Impacto**: ZERO em dev (usa default), BLOQUEIA em prod sem env var
**Arquivos Afetados**: 1 arquivo (`middleware.ts`)
**Tempo**: 15 minutos

#### 2.3 - Implementar Bcrypt para Senhas (MAIOR IMPACTO)
- [ ] Adicionar `bcrypt` ao `package.json`
- [ ] Criar nova função em `/lib/auth.ts`:

```typescript
import bcrypt from 'bcrypt'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

- [ ] Modificar `/app/api/auth/login` para usar `verifyPassword()`
- [ ] Modificar endpoints de criação de usuário para usar `hashPassword()`
- [ ] Rodar script de migração: fazer hash de todas as senhas existentes
- [ ] Testar login
- [ ] Commit: "security: implement bcrypt password hashing"

**Impacto**: CRÍTICO - Afeta login
**Arquivos Afetados**: `/lib/auth.ts`, `/app/api/auth/login`, script de migração
**Tempo**: 1-1.5 horas

#### 2.4 - Verificação Final de Segurança
- [ ] Rodar `npm audit` e documentar resultado
- [ ] Revisar variáveis de ambiente críticas

**Tempo**: 15 minutos

---

## 🧹 FASE 3: LIMPEZA DE DEBUG CODE (3-4 horas)

### Objetivo
Remover os 572+ console.log statements e código comentado.

### Tarefas

#### 3.1 - Remover Console.logs por Categoria
- [ ] **Tipo 1: Logs simples** - Remover completamente
  ```typescript
  console.log('Debug info') → REMOVER
  ```

- [ ] **Tipo 2: Logs de erro úteis** - Manter (mas standardizar depois)
  ```typescript
  console.error('Erro ao buscar:', error) → REVISAR, manter só úteis
  ```

- [ ] **Tipo 3: Logs de fluxo** - Remover
  ```typescript
  console.log('Iniciando processo...') → REMOVER
  ```

**Estratégia**:
1. Executar Grep para listar todos os console.log por arquivo
2. Para cada arquivo top 10 (37+ logs cada):
   - Revisar manualmente
   - Remover debug code óbvio
   - Manter apenas logs de erro crítico
3. Commit por arquivo ou grupo de arquivos

**Arquivos Críticos** (mais de 35 logs cada):
- `/app/enriquecimento-api/page.tsx` (37 logs)
- `/app/relatorios/page.tsx` (44 logs)
- `/app/leads/page.tsx` (86 logs)
- `/app/extracao-leads/page.tsx` (36 logs)

**Tempo**: ~45 minutos por arquivo com 35+ logs = 3-4 horas total

#### 3.2 - Remover Código Comentado
- [ ] Grep para encontrar padrões de código comentado
- [ ] Revisar e remover
- [ ] Manter apenas comentários úteis

**Tempo**: 30 minutos

#### 3.3 - Limpar TODO Comments
- [ ] Encontrar todos os TODOs: `/app/leads/page.tsx:334`
- [ ] Criar issues no GitHub para cada TODO (se importante)
- [ ] Remover comentários do código

**Tempo**: 15 minutos

---

## 🔗 FASE 4: CONSOLIDAÇÃO DE DUPLICAÇÃO (4-5 horas)

### Objetivo
Eliminar código duplicado mantendo funcionalidade.

### Tarefas

#### 4.1 - Consolidar Rotas Datecode (1.5-2 horas)
**Arquivos Afetados**:
- `/app/api/datecode/route.ts`
- `/app/api/datecode/cpf/route.ts`
- `/app/api/datecode/consulta/route.ts`

**Estratégia**:
1. Criar função centralizada em `/lib/datecode-handler.ts`:
```typescript
export async function handleDatecodeRequest(
  userId: string,
  requestType: 'cnpj' | 'cpf' | 'consulta',
  payload: Record<string, any>
): Promise<any> {
  // Lógica centralizada: user validation, permission check, API call
}
```

2. Refatorar 3 rotas para usarem função centralizada
3. Testar cada rota
4. Commit: "refactor: consolidate datecode API routes"

**Tempo**: 1.5-2 horas

#### 4.2 - Consolidar Admin Pages (1.5-2 horas)
**Arquivos Afetados**:
- `/app/admin/planos/page.tsx` → **DELETAR**
- `/app/admin/tipos-negocio/page.tsx` → **DELETAR**
- `/app/configuracoes-admin/page.tsx` → **MANTER** (é a versão final)

**Estratégia**:
1. Verificar se `/configuracoes-admin` tem TODAS as features
2. Atualizar navigation/sidebar para apontar para `/configuracoes-admin`
3. Testar navegação
4. Deletar 2 arquivos antigos
5. Commit: "refactor: consolidate admin pages into configuracoes-admin"

**Dependências a Revisar**:
- Navigation links
- Admin menu items
- Any direct links in components

**Tempo**: 1.5-2 horas

#### 4.3 - Centralizar Permission Checking (1-1.5 horas)
**Objetivo**: Extrair a lógica que está duplicada em 12+ API routes

**Estratégia**:
1. Criar `/lib/permissions-middleware.ts`:
```typescript
export async function verifyUserPlanAccess(
  userId: string,
  feature: 'datecode' | 'whatsapp' | 'extract',
  limit?: { current: number; max: number }
): Promise<{ allowed: boolean; reason?: string }> {
  // Centralizada validation
}
```

2. Atualizar todos os API routes para usar
3. Testar cada rota
4. Commit: "refactor: centralize permission checking logic"

**Tempo**: 1-1.5 horas

---

## 🏗️ FASE 5: REFACTOR ARQUITETURAL (6-8 horas)

### Objetivo
Reorganizar estrutura de pastas e componentes para melhor manutenibilidade.

### Tarefas

#### 5.1 - Reorganizar `/components` (2-3 horas)
**Estrutura Atual** (bagunçada):
```
/components
  ├── ui/
  ├── forms/
  ├── Sidebar.tsx
  ├── AuthWrapper.tsx
  ├── MetricCard.tsx
  ├── ModalCriarExtracao.tsx
  ├── VectorStoreManager.tsx
  ├── WhatsAppConnection.tsx
  └── 20+ outros componentes
```

**Estrutura Nova**:
```
/components
  ├── ui/                           # Generic UI primitives
  │   ├── Button.tsx
  │   ├── Input.tsx
  │   ├── Card.tsx
  │   └── ... (sem mudanças)
  ├── layout/                       # Layout components
  │   ├── Sidebar.tsx
  │   ├── Header.tsx
  │   └── MainLayout.tsx
  ├── forms/                        # Form components
  │   ├── LeadForm.tsx
  │   ├── DynamicFormFields.tsx
  │   └── ... (sem mudanças)
  ├── features/                     # Feature-specific components
  │   ├── whatsapp/
  │   │   └── WhatsAppConnection.tsx
  │   ├── vectorstore/
  │   │   └── VectorStoreManager.tsx
  │   ├── extracao/
  │   │   └── ModalCriarExtracao.tsx
  │   └── leads/
  │       └── MetricCard.tsx
  └── shared/                       # HOCs, wrappers, providers
      ├── AuthWrapper.tsx
      ├── PlanProtection.tsx
      └── DynamicBusinessTypeProvider.tsx
```

**Passos**:
1. Criar estrutura de pastas
2. Mover cada arquivo para seu local novo
3. Atualizar imports em TODOS os arquivos que usam esses componentes
4. Testar que nada quebrou
5. Commit: "refactor: reorganize components directory structure"

**Tempo**: 2-3 horas (refactor de imports é demorado)

#### 5.2 - Criar `/lib/api-utils` (1-1.5 horas)
**Objetivo**: Centralizar lógica comum de API routes

**Criar**:
```
/lib/api-utils/
  ├── response.ts          # Standardized responses
  ├── error-handler.ts     # Standardized error handling
  ├── permissions.ts       # Permission/quota checks
  └── validators.ts        # Input validation
```

**Exemplo - response.ts**:
```typescript
export class ApiResponse {
  static success<T>(data: T, statusCode = 200) {
    return NextResponse.json({ success: true, data }, { status: statusCode })
  }

  static error(message: string, statusCode = 400) {
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
```

**Atualizar todos os API routes para usar**

**Tempo**: 1-1.5 horas

#### 5.3 - Refatorar Componentes Gigantes (1-2 horas)
**Alvo**:
- `/app/configuracoes-admin/components/UsuariosSection.tsx` (1500+ linhas)
- `/app/leads/page.tsx` (800+ linhas)

**Estratégia**: Quebrar em componentes menores
- `UsuariosSection` → `UsuariosTable`, `UsuarioForm`, `UsuarioActions`
- `leads/page` → `LeadsTable`, `LeadsFilters`, `LeadsActions`

**Tempo**: 1-2 horas

#### 5.4 - Criar `/lib/database-types` (1 hora)
**Objetivo**: Centralizar tipos TypeScript para tabelas

**Criar**:
```typescript
// lib/database-types/users.ts
export interface User {
  id: string
  email: string
  // ...
}

// lib/database-types/leads.ts
export interface Lead {
  id: string
  titulo: string
  // ...
}
```

**Tempo**: 1 hora

---

## 📏 FASE 6: PADRONIZAÇÃO DE PADRÕES (4-6 horas)

### Objetivo
Estabelecer padrões consistentes em todo o código.

### Tarefas

#### 6.1 - Padronizar Respostas de Erro (1.5 horas)
**Criar** `/lib/api-utils/error-handler.ts`:
```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  console.error('Unexpected error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Usar em todos os API routes**

**Tempo**: 1.5 horas

#### 6.2 - Implementar Logging Apropriado (2-2.5 horas)
**Adicionar ao package.json**: `pino` (logger leve)

**Criar** `/lib/logger.ts`:
```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

export default logger
```

**Usar em places com console.log importantes**:
```typescript
// ANTES:
console.log('Usuário logado:', email)

// DEPOIS:
logger.info({ email }, 'Usuário logado com sucesso')
```

**Tempo**: 2-2.5 horas

#### 6.3 - Padronizar Tipos TypeScript (1-1.5 horas)
**Objetivo**: Reduzir uso de `any`

**Estratégia**:
1. Listar todos os `any` no codebase
2. Para cada um, criar tipo apropriado
3. Exemplo:
```typescript
// ANTES:
dados_personalizados?: any

// DEPOIS:
dados_personalizados?: Record<string, string | number | boolean>
```

**Tempo**: 1-1.5 horas

---

## ✅ FASE 7: TESTES E VALIDAÇÃO (3-4 horas)

### Objetivo
Garantir que nada quebrou durante refactor.

### Tarefas

#### 7.1 - Verificação de Build (30 minutos)
```bash
npm run type-check  # Sem erros TypeScript?
npm run lint        # Sem problemas ESLint?
npm run build       # Build completa?
```

#### 7.2 - Teste Manual de Fluxos Críticos (2 horas)
- [ ] Login ainda funciona?
- [ ] Criação de lead ainda funciona?
- [ ] Extração de dados (Datecode) funciona?
- [ ] Admin pages funcionam?
- [ ] WhatsApp funciona?
- [ ] Navegação entre páginas funciona?

#### 7.3 - Verificação de Imports (1 hora)
- [ ] Após refactor de components, verificar que todos os imports estão corretos
- [ ] Usar Grep para encontrar imports quebrados

#### 7.4 - Performance Check (30 minutos)
- [ ] Verificar que bundle size não aumentou significativamente
- [ ] Verificar que performance não piorou

**Tempo**: 3-4 horas

---

## 📚 FASE 8: DOCUMENTAÇÃO E LIMPEZA FINAL (2-3 horas)

### Objetivo
Documentar mudanças e fazer limpeza final.

### Tarefas

#### 8.1 - Atualizar Documentação (1 hora)
- [ ] Criar `/docs/ARQUITETURA_REORGANIZADA.md` documentando nova estrutura
- [ ] Atualizar README com estrutura correta
- [ ] Remover/atualizar docs desatualizados

#### 8.2 - Limpeza de .env (30 minutos)
- [ ] Remover variáveis não usadas do `.env.example`
- [ ] Adicionar novas variáveis necessárias (LOG_LEVEL, etc)

#### 8.3 - Commit Final e Merge (30 minutos)
```bash
# Verificar tudo está working
git status

# Criar commit final
git commit -m "refactor: complete project reorganization"

# Fazer merge para main
git checkout main
git pull
git merge reorganizacao/main
git push
```

#### 8.4 - Criar Issue de Follow-up (30 minutos)
- [ ] Criar issue para testes automatizados (próxima prioridade)
- [ ] Documentar que sistema de planos ainda precisa migração completa
- [ ] Listar technical debts restantes

**Tempo**: 2-3 horas

---

## 🎯 RESUMO E CHECKLIST

### Métricas de Sucesso

| Métrica | Antes | Depois | Status |
|---------|-------|--------|--------|
| Senhas em plain text | 1 | 0 | ✓ |
| Console.log statements | 572 | <50 | ✓ |
| Código duplicado (LOC) | ~500+ | <100 | ✓ |
| Admin pages | 3 | 1 | ✓ |
| Component files em root | 22 | 0 | ✓ |
| Datecode routes | 3 | 1 | ✓ |
| TypeScript errors | ? | 0 | ✓ |

### Commits Esperados

1. `security: remove backup files with credentials`
2. `security: enforce JWT_SECRET requirement`
3. `security: implement bcrypt password hashing`
4. `refactor: consolidate datecode API routes`
5. `refactor: consolidate admin pages into configuracoes-admin`
6. `refactor: centralize permission checking logic`
7. `refactor: reorganize components directory structure`
8. `refactor: create centralized API utilities`
9. `refactor: break down large components`
10. `refactor: standardize error handling`
11. `refactor: implement proper logging`
12. `refactor: complete project reorganization`

### Próximas Prioridades Após Este Plano

1. **Testes Automatizados** - Setup Jest + React Testing Library
2. **Migração de Planos** - Completar migração do sistema de planos
3. **API Documentation** - OpenAPI/Swagger spec
4. **E2E Tests** - Setup Playwright ou Cypress
5. **Performance Optimization** - Code splitting, lazy loading

---

## 📝 NOTAS IMPORTANTES

- **Branch Strategy**: Trabalhar em `reorganizacao/main` até tudo estar pronto
- **Backup**: Fazer commits frequentes (a cada tarefa pequena concluída)
- **Testing**: Testar localmente após cada fase
- **Team Communication**: Se houver time, comunicar mudanças de estrutura
- **Rollback Plan**: Se algo quebrar, usar `git reset --hard` ou reverter commits específicos

---

## ⏱️ CRONOGRAMA RECOMENDADO

- **Dia 1**: Fases 1-3 (Análise + Segurança + Debug)
- **Dia 2**: Fases 4-5 (Duplicação + Refactor)
- **Dia 3**: Fases 6-7 (Padronização + Testes)
- **Dia 4 (opcional)**: Fase 8 + Fine-tuning

**Total**: 3-4 dias de trabalho intenso (ou 1-2 semanas trabalhando algumas horas por dia)

---

Documento criado em 2025-11-21
Última atualização: 2025-11-21