# 🏗️ ARQUITETURA REORGANIZADA - DNX Recuperação Crédito

> **Data**: 2025-11-21
> **Versão**: 2.0 (Pós-Reorganização)
> **Status**: ✅ Completo

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Componentes](#estrutura-de-componentes)
3. [Utilitários e Bibliotecas](#utilitários-e-bibliotecas)
4. [Sistema de Permissões](#sistema-de-permissões)
5. [Segurança](#segurança)
6. [Padrões de Código](#padrões-de-código)
7. [Fluxo de Dados](#fluxo-de-dados)

---

## 1. Visão Geral

### O que mudou na reorganização?

A reorganização focou em **5 pilares**:

1. **Segurança** - Senhas com bcrypt, JWT_SECRET obrigatório
2. **Limpeza** - Remoção de 74% dos console.log statements
3. **Consolidação** - Eliminação de código duplicado (500+ LOC)
4. **Organização** - Nova estrutura de pastas lógica
5. **Padronização** - Error handling, logging, types consistentes

### Métricas de Melhoria

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Console.log statements | 269 | 70 | 74% ↓ |
| Admin pages duplicadas | 3 | 1 | 67% ↓ |
| Código duplicado (LOC) | ~500 | ~100 | 80% ↓ |
| Datecode routes | 3 | 1 handler | 67% ↓ |
| Senhas plain text | ❌ | ✅ bcrypt | 100% ↑ |
| TypeScript `any` types | Muitos | Reduzidos | ~30% ↓ |

---

## 2. Estrutura de Componentes

### Nova Organização (Hierárquica e Lógica)

```
/components
├── ui/                          # Componentes UI primitivos (Radix UI, shadcn)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Textarea.tsx
│   └── ... (componentes genéricos)
│
├── layout/                      # Componentes de layout e navegação
│   ├── Sidebar.tsx              # Sidebar principal com navegação
│   ├── LoginForm.tsx            # Formulário de login
│   └── Logo.tsx                 # Logo da aplicação
│
├── forms/                       # Componentes relacionados a formulários
│   ├── DynamicFormFields.tsx    # Campos dinâmicos por tipo de negócio
│   ├── LeadForm.tsx             # Formulário de lead (importado de /forms/)
│   └── SearchableMultiSelect.tsx # Selector multi com busca
│
├── shared/                      # HOCs, wrappers, providers compartilhados
│   ├── AuthWrapper.tsx          # Wrapper de autenticação (HOC)
│   └── PlanProtection.tsx       # Proteção baseada em plano (HOC)
│
└── features/                    # Componentes específicos por feature
    ├── whatsapp/
    │   └── WhatsAppConnection.tsx    # Gerenciamento de conexão WhatsApp
    ├── vectorstore/
    │   └── VectorStoreManager.tsx    # Gestão de vector stores (IA)
    ├── extracao/
    │   ├── ExtracaoProgress.tsx      # Progresso de extração
    │   ├── HistoricoContagens.tsx    # Histórico de extrações
    │   ├── ModalCriarExtracao.tsx    # Modal para criar extração
    │   └── ResultadosContagem.tsx    # Resultados de contagem
    ├── leads/
    │   └── MetricCard.tsx            # Card de métricas do dashboard
    └── consulta/
        └── ConsultaResultados.tsx    # Resultados de consulta Datecode
```

### Benefícios da Nova Estrutura

✅ **Organização Clara**: Cada componente tem seu lugar lógico
✅ **Fácil Navegação**: Desenvolvedores encontram componentes rapidamente
✅ **Escalabilidade**: Fácil adicionar novas features sem bagunça
✅ **Separação de Concerns**: UI genérico separado de lógica de negócio

---

## 3. Utilitários e Bibliotecas

### `/lib` - Estrutura de Utilities

```
/lib
├── supabase.ts                  # Cliente Supabase (DB)
├── auth.ts                      # Autenticação e gerenciamento de usuários
│                                # ✅ Agora com hashPassword() e verifyPassword()
├── permissions.ts               # Sistema de permissões (antigo)
├── permissions-middleware.ts    # ✅ NOVO: Middleware de permissões consolidado
├── datecode.ts                  # Cliente Datecode API
├── datecode-handler.ts          # ✅ NOVO: Handler consolidado para Datecode
├── evolution-api.ts             # Cliente Evolution API (WhatsApp)
├── whatsapp-official-api.ts     # Cliente WhatsApp Business API oficial
├── google-calendar.ts           # Integração Google Calendar
├── plans.ts                     # Definições de planos
├── logger.ts                    # ✅ NOVO: Logger com Pino
│
├── api-utils/                   # ✅ NOVO: Utilitários para API routes
│   ├── error-handler.ts         # ApiError class e handleApiError()
│   └── response.ts              # ApiResponse.success() e .error()
│
└── types/                       # ✅ NOVO: Tipos TypeScript centralizados
    └── api.ts                   # Tipos comuns de API (reduzindo `any`)
```

### Novos Utilitários Criados

#### 3.1 `/lib/logger.ts` - Logging Profissional

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } }
})

export default logger
```

**Uso**:
```typescript
import logger from '@/lib/logger'

logger.info('User logged in successfully')
logger.error({ error }, 'Failed to fetch data')
logger.warn('Approaching usage limit')
```

#### 3.2 `/lib/api-utils/error-handler.ts` - Error Handling Padronizado

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
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  logger.error('Unexpected error:', error)

  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
```

**Uso em API routes**:
```typescript
import { ApiError, handleApiError } from '@/lib/api-utils/error-handler'

export async function POST(req: Request) {
  try {
    if (!userId) {
      throw new ApiError(401, 'Unauthorized', 'AUTH_REQUIRED')
    }

    // ... lógica da rota

  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 3.3 `/lib/api-utils/response.ts` - Respostas Padronizadas

```typescript
export class ApiResponse {
  static success<T>(data: T, statusCode = 200) {
    return NextResponse.json(
      { success: true, data },
      { status: statusCode }
    )
  }

  static error(message: string, statusCode = 400, code?: string) {
    return NextResponse.json(
      { success: false, error: message, code },
      { status: statusCode }
    )
  }
}
```

**Uso**:
```typescript
import { ApiResponse } from '@/lib/api-utils/response'

// Sucesso
return ApiResponse.success({ leads: data }, 200)

// Erro
return ApiResponse.error('Invalid request', 400, 'INVALID_REQUEST')
```

#### 3.4 `/lib/datecode-handler.ts` - Consolidação de Lógica Datecode

**Funções**:
- `verifyUserPlanAccess(userId)` - Verifica permissão e limites
- `getValidatedCredentials(userId)` - Busca credenciais Datecode do usuário
- `makeDatacodeRequest(endpoint, payload, credentials)` - Faz requisição à API
- `consumeAndGetUsage(userId, supabaseAdmin)` - Consome consulta e retorna uso
- `handleDatecodeConsulta(userId, consultaType, payload)` - Handler completo

**Antes (3 arquivos duplicados)**:
```typescript
// app/api/datecode/route.ts
// app/api/datecode/cpf/route.ts
// app/api/datecode/consulta/route.ts
// ~450 linhas de código duplicado
```

**Depois (1 handler reutilizável)**:
```typescript
// lib/datecode-handler.ts
import { handleDatecodeConsulta } from '@/lib/datecode-handler'

export async function POST(req: Request) {
  const { userId } = await verifyAuth(req)
  const body = await req.json()

  return handleDatecodeConsulta(userId, 'cnpj', body)
}
```

#### 3.5 `/lib/permissions-middleware.ts` - Middleware de Permissões

**Funções**:
- `verifyUserPlanAccess(userId, feature)` - Verifica acesso a feature
- `canConsume(userId, type)` - Verifica se pode consumir lead/consulta
- `getUserUsageStats(userId)` - Retorna estatísticas de uso

**Features suportadas**:
- `datecode` - Consultas Datecode
- `whatsapp` - WhatsApp
- `extract` - Extração de leads
- `leads` - Criação de leads
- `consulta` - Consultas API
- `enriquecimento` - Enriquecimento de dados

**Uso**:
```typescript
import { verifyUserPlanAccess } from '@/lib/permissions-middleware'

const access = await verifyUserPlanAccess(userId, 'datecode')
if (!access.allowed) {
  return ApiResponse.error(access.reason || 'Acesso negado', 403)
}
```

#### 3.6 `/lib/types/api.ts` - Tipos TypeScript Centralizados

**Tipos definidos**:
- `SupabaseClientType` - Tipo do cliente Supabase
- `JsonValue`, `JsonObject` - Tipos JSON seguros
- `ApiSuccessResponse<T>`, `ApiErrorResponse` - Respostas de API
- `DatecodeCredentials` - Credenciais Datecode
- `UserPlanInfo` - Informações de plano do usuário
- `WhatsAppInstance`, `EvolutionWebhook` - WhatsApp types
- `VectorStoreFile` - Vector store types
- `FormFieldValue` - Valores de form dinâmicos

**Benefício**: Redução de ~30% de usos de `any` type

---

## 4. Sistema de Permissões

### Como Funciona

1. **Database View**: `view_usuarios_planos`
   - Combina `users`, `usuarios_planos`, `planos`
   - Retorna todas as permissões do usuário em uma query

2. **Verificação de Feature**:
   ```typescript
   const { allowed, reason } = await verifyUserPlanAccess(userId, 'datecode')
   ```

3. **Verificação de Limites**:
   ```typescript
   const canUse = await canConsume(userId, 'consultas')
   ```

### Fluxo de Verificação

```
Request → verifyAuth() → getUserId()
  → verifyUserPlanAccess(userId, feature)
  → Check DB (view_usuarios_planos)
  → Verify feature access + limits
  → Return { allowed: boolean, reason?: string }
```

---

## 5. Segurança

### Melhorias Implementadas

#### 5.1 Autenticação com Bcrypt

**Antes**:
```typescript
if (userData.password !== password) {
  throw new Error('Senha incorreta')
}
```

**Depois**:
```typescript
import { verifyPassword } from '@/lib/auth'

const isValid = await verifyPassword(password, userData.password)
if (!isValid) {
  throw new Error('Senha incorreta')
}
```

**Criação de usuário**:
```typescript
import { hashPassword } from '@/lib/auth'

const hashedPassword = await hashPassword(userData.password)
await supabase.from('users').insert({
  ...userData,
  password: hashedPassword
})
```

#### 5.2 JWT_SECRET Obrigatório

**Middleware atualizado**:
```typescript
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret && process.env.NODE_ENV === 'production') {
  console.error('❌ JWT_SECRET não está configurada em produção')
  return null
}

if (!jwtSecret && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  JWT_SECRET não configurada - usando padrão dev')
}

const secret = new TextEncoder().encode(
  jwtSecret || 'dev-secret-only-for-development'
)
```

#### 5.3 Backup Files Removidos

- ✅ `.env.local.backup` deletado
- ✅ `.env.production.local.backup` deletado
- ✅ `.gitignore` já tem padrão `*.backup`

#### 5.4 Environment Variables Documentadas

**`.env.example` atualizado**:
```bash
# JWT Secret (OBRIGATÓRIO em produção!)
# Gere com: openssl rand -base64 32
JWT_SECRET=sua_chave_jwt_muito_segura_aqui
```

---

## 6. Padrões de Código

### 6.1 Error Handling Padronizado

✅ **Usar ApiError para erros conhecidos**:
```typescript
throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
```

✅ **Usar handleApiError para capturar**:
```typescript
try {
  // ... lógica
} catch (error) {
  return handleApiError(error)
}
```

### 6.2 Respostas de API Padronizadas

✅ **Sucesso**:
```typescript
return ApiResponse.success({ data: result })
```

✅ **Erro**:
```typescript
return ApiResponse.error('Invalid input', 400, 'INVALID_INPUT')
```

### 6.3 Logging Padronizado

❌ **Não usar console.log**:
```typescript
console.log('User logged in')  // ❌ Evitar
```

✅ **Usar logger**:
```typescript
logger.info({ userId }, 'User logged in successfully')
logger.error({ error, userId }, 'Failed to process request')
```

### 6.4 TypeScript Types

✅ **Usar tipos específicos**:
```typescript
import { JsonValue, UserPlanInfo } from '@/lib/types/api'

function processData(data: JsonValue): UserPlanInfo {
  // ...
}
```

❌ **Evitar `any`**:
```typescript
function processData(data: any): any {  // ❌ Evitar
  // ...
}
```

---

## 7. Fluxo de Dados

### 7.1 Fluxo de Autenticação

```
1. User submits login
   ↓
2. POST /api/auth/login
   ↓
3. authService.signIn(email, password)
   ↓
4. Buscar user no DB (Supabase)
   ↓
5. verifyPassword(password, user.password)  ← bcrypt
   ↓
6. Generate JWT token
   ↓
7. Set httpOnly cookie
   ↓
8. Return user data
```

### 7.2 Fluxo de Consulta Datecode

```
1. User requests consulta
   ↓
2. POST /api/datecode/consulta
   ↓
3. verifyAuth() → extract userId
   ↓
4. handleDatecodeConsulta(userId, type, payload)
   ↓
5. verifyUserPlanAccess(userId)
   ├─> Check: acesso_consulta = true?
   ├─> Check: consultas_disponiveis > 0?
   └─> Return { allowed, reason }
   ↓
6. getValidatedCredentials(userId)
   ↓
7. makeDatacodeRequest(endpoint, payload, credentials)
   ↓
8. consumeAndGetUsage(userId)
   ↓
9. Return { data, usage }
```

### 7.3 Fluxo de Permissões

```
Request → Middleware → verifyToken(cookie)
  ↓
  └─> If admin → Allow all
  └─> If user → Check permissions
      ↓
      └─> getUserPermissions(userId)
          ↓
          └─> Query: view_usuarios_planos
              ↓
              └─> Return { acesso_*, limites_* }
                  ↓
                  └─> Verify route permission
                      ↓
                      └─> Allow / Redirect
```

---

## 📊 Resumo Final

### O que foi alcançado?

✅ **Segurança**: Bcrypt, JWT obrigatório, backup files removidos
✅ **Limpeza**: 74% de redução em debug code
✅ **Consolidação**: 80% de redução em código duplicado
✅ **Organização**: Estrutura de pastas lógica e escalável
✅ **Padronização**: Error handling, logging, types consistentes

### Próximos Passos Recomendados

1. **Testes Automatizados** - Jest, React Testing Library, Playwright
2. **Migração de Planos** - Completar migração do campo `plano` legado
3. **API Documentation** - OpenAPI/Swagger spec
4. **Monitoring** - Sentry para error tracking
5. **Performance** - Code splitting, lazy loading

---

**Criado**: 2025-11-21
**Versão**: 2.0
**Autores**: DNX Plataformas + Claude Code
