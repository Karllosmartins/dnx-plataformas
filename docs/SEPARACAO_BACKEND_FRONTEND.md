# 🔄 Plano de Separação Backend/Frontend

> **Data**: 2025-11-21
> **Status**: 📋 Planejamento
> **Prioridade**: ALTA
> **Estimativa**: 16-24 horas

---

## 🎯 OBJETIVO

Separar a aplicação monolítica Next.js atual em:
- **Backend**: API REST pura (Node.js + Express ou Next.js API-only)
- **Frontend**: Aplicação React/Next.js consumindo a API

---

## 📊 SITUAÇÃO ATUAL

### Arquitetura Monolítica Next.js 14

```
dnx_recuperacao_credito/
├── app/
│   ├── (pages)               ← Frontend
│   └── api/                  ← Backend
│       ├── auth/
│       ├── datecode/
│       ├── whatsapp/
│       └── ...
├── components/               ← Frontend
├── lib/                      ← Shared (Backend + Frontend)
└── middleware.ts             ← Backend
```

**Problemas**:
- ❌ Backend e Frontend no mesmo repositório
- ❌ Difícil escalar independentemente
- ❌ Deploy único (tudo ou nada)
- ❌ Difícil adicionar novos clientes (mobile app, CLI, etc)
- ❌ Difícil trabalhar com times separados

---

## 🏗️ ARQUITETURA PROPOSTA

### Opção 1: Monorepo (Recomendada)

```
dnx-plataformas/
├── apps/
│   ├── api/                  ← Backend (Express + TypeScript)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                  ← Frontend (Next.js)
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── package.json
│       └── next.config.js
│
├── packages/
│   ├── types/                ← Tipos compartilhados
│   ├── config/               ← ESLint, TypeScript configs
│   └── utils/                ← Utilitários compartilhados
│
├── package.json              ← Root (turbo ou nx)
└── docker-compose.yml        ← Orchestração
```

**Vantagens**:
- ✅ Código compartilhado (types, utils)
- ✅ Um único repositório
- ✅ Deploys independentes
- ✅ Escalabilidade por serviço
- ✅ Ferramentas: Turb repo, NX

---

### Opção 2: Multi-repo (Não recomendada)

```
repos/
├── dnx-api/                  ← Repositório separado
└── dnx-web/                  ← Repositório separado
```

**Desvantagens**:
- ❌ Sincronização de tipos manual
- ❌ Mais complexo de manter
- ❌ Versioning mais difícil

---

## 🔄 PLANO DE MIGRAÇÃO (Opção 1 - Monorepo)

### FASE 1: Setup Monorepo (4-6 horas)

#### 1.1 Criar estrutura base
```bash
mkdir -p apps/api apps/web packages/types packages/config
```

#### 1.2 Setup Turborepo ou NX
```bash
npx create-turbo@latest
# ou
npx create-nx-workspace@latest
```

#### 1.3 Configurar workspace
- `package.json` root com workspaces
- Scripts compartilhados (build, dev, test)
- ESLint e TypeScript configs compartilhados

**Entregável**: Estrutura monorepo funcional

---

### FASE 2: Migração do Backend (6-8 horas)

#### 2.1 Criar API Express
```typescript
// apps/api/src/server.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())

// Import routes
import authRoutes from './routes/auth'
import datecodeRoutes from './routes/datecode'
// ...

app.use('/api/auth', authRoutes)
app.use('/api/datecode', datecodeRoutes)
// ...

app.listen(3001, () => {
  console.log('API running on http://localhost:3001')
})
```

#### 2.2 Migrar rotas da API
- [ ] `/api/auth/*` → `apps/api/src/routes/auth/`
- [ ] `/api/datecode/*` → `apps/api/src/routes/datecode/`
- [ ] `/api/whatsapp/*` → `apps/api/src/routes/whatsapp/`
- [ ] `/api/vectorstores/*` → `apps/api/src/routes/vectorstores/`
- [ ] `/api/arquivos/*` → `apps/api/src/routes/arquivos/`

#### 2.3 Migrar lib/ para services/
```
lib/auth.ts          → apps/api/src/services/auth.service.ts
lib/datecode-handler → apps/api/src/services/datecode.service.ts
lib/supabase.ts      → apps/api/src/services/database.service.ts
```

#### 2.4 Migrar middleware
```
middleware.ts → apps/api/src/middleware/auth.middleware.ts
```

**Entregável**: API REST funcionando independentemente

---

### FASE 3: Migração do Frontend (4-6 horas)

#### 3.1 Mover aplicação Next.js
```bash
# Copiar estrutura atual para apps/web
cp -r app/ apps/web/app/
cp -r components/ apps/web/components/
cp next.config.js apps/web/
```

#### 3.2 Criar API client
```typescript
// apps/web/lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const apiClient = {
  async get(endpoint: string) {
    const res = await fetch(`${API_URL}${endpoint}`)
    return res.json()
  },

  async post(endpoint: string, data: any) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  // ... put, delete, etc
}
```

#### 3.3 Substituir imports de lib/
```typescript
// Antes
import { authService } from '@/lib/auth'

// Depois
import { authService } from '@/lib/api-client'
```

**Entregável**: Frontend consumindo API separada

---

### FASE 4: Tipos Compartilhados (2-3 horas)

#### 4.1 Criar package de tipos
```typescript
// packages/types/src/index.ts
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export interface DatecodeConsulta {
  cpf: string
  nome: string
  // ...
}

// ... todos os tipos
```

#### 4.2 Usar nos dois lados
```typescript
// apps/api/src/routes/auth.ts
import type { User } from '@dnx/types'

// apps/web/app/usuarios/page.tsx
import type { User } from '@dnx/types'
```

**Entregável**: Types sincronizados entre API e Web

---

### FASE 5: Docker & Deploy (3-4 horas)

#### 5.1 Dockerfiles separados
```yaml
# apps/api/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
EXPOSE 3001

# apps/web/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
EXPOSE 3000
```

#### 5.2 Docker Compose atualizado
```yaml
version: '3.8'

services:
  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - dnnet

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:3001
    depends_on:
      - api
    networks:
      - dnnet

networks:
  dnnet:
    external: true
```

**Entregável**: Deploy de API e Web independentes

---

## 📊 COMPARAÇÃO: Antes vs Depois

| Aspecto | Monolítico (Atual) | Separado (Proposto) |
|---------|-------------------|---------------------|
| **Deploy** | Tudo junto | Independente por serviço |
| **Escalabilidade** | Horizontal (toda app) | Horizontal + Vertical (por serviço) |
| **Time** | Full-stack em tudo | Especialização possível |
| **Novos clientes** | Difícil (acoplado) | Fácil (API REST pública) |
| **Testes** | Acoplados | Isolados |
| **Performance** | Média | Otimizada por camada |

---

## 🚀 BENEFÍCIOS IMEDIATOS

### Para Desenvolvimento
1. ✅ **Times independentes**: Frontend e Backend podem trabalhar em paralelo
2. ✅ **Testes isolados**: Cada lado testa independentemente
3. ✅ **Deploy separado**: Bug no frontend não afeta backend
4. ✅ **Escalabilidade**: Escalar API independente do frontend

### Para Novos Recursos
1. ✅ **API pública**: Facilita criar app mobile
2. ✅ **Webhooks**: Clientes podem consumir via webhook
3. ✅ **CLI tool**: Ferramenta de linha de comando usando mesma API
4. ✅ **Integrações**: Parceiros podem integrar facilmente

---

## ⚠️ CONSIDERAÇÕES

### O que NÃO mudar (por enquanto)
- ❌ Não migrar para microserviços (overkill)
- ❌ Não trocar Supabase (funciona bem)
- ❌ Não reescrever tudo (migração incremental)

### Compatibilidade retroativa
- ✅ Manter rotas `/api/*` funcionando temporariamente
- ✅ Proxy de Next.js para API durante transição
- ✅ Feature flags para ativar nova arquitetura gradualmente

---

## 📅 CRONOGRAMA PROPOSTO

| Fase | Duração | Quando Fazer |
|------|---------|--------------|
| FASE 1: Setup Monorepo | 4-6h | Semana 1 |
| FASE 2: Migração Backend | 6-8h | Semana 1-2 |
| FASE 3: Migração Frontend | 4-6h | Semana 2 |
| FASE 4: Tipos Compartilhados | 2-3h | Semana 2 |
| FASE 5: Docker & Deploy | 3-4h | Semana 3 |
| **TOTAL** | **19-27h** | **3 semanas** |

---

## 🛠️ TECNOLOGIAS

### Backend (API)
- **Runtime**: Node.js 20
- **Framework**: Express.js 5.0
- **Language**: TypeScript
- **Validation**: Zod
- **Auth**: JWT (jose)
- **Database**: Supabase (mantido)
- **Logging**: Pino (já instalado)

### Frontend (Web)
- **Framework**: Next.js 14.2+
- **Language**: TypeScript
- **Styling**: Tailwind CSS (mantido)
- **State**: React hooks + Context
- **API Client**: Fetch API nativo + wrapper

### Monorepo
- **Tool**: Turborepo (recomendado) ou NX
- **Package Manager**: npm workspaces
- **Versioning**: Conventional commits

---

## 🎯 MÉTRICAS DE SUCESSO

- [ ] API roda independente em porta 3001
- [ ] Web consome API via HTTP
- [ ] Types compartilhados funcionando
- [ ] Deploy separado no Docker Swarm
- [ ] Testes passando (quando implementados)
- [ ] Performance mantida ou melhorada
- [ ] Zero downtime durante migração

---

## 📝 PRÓXIMOS PASSOS

### Imediato (após correções de segurança)
1. Decidir: Turborepo ou NX?
2. Criar branch `feature/monorepo-migration`
3. Executar FASE 1

### Médio Prazo
4. Migrar rotas gradualmente (feature by feature)
5. Testar em staging
6. Deploy em produção com proxy

### Longo Prazo
7. Remover código legado monolítico
8. Adicionar app mobile (React Native)
9. Criar CLI tool
10. API pública para parceiros

---

**Criado**: 2025-11-21
**Autor**: Claude + Nilcilene
**Status**: Documento de planejamento
**Próxima revisão**: Após correções de segurança
