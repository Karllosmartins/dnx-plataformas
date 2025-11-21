# 🗺️ ROADMAP VISUAL - Reorganização do Projeto

## Timeline de Execução

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DIA 1: FUNDAÇÕES (Análise + Segurança + Limpeza)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE 1 (2-3h)          FASE 2 (2-3h)         FASE 3 (3-4h)               │
│  ┌──────────────┐       ┌──────────────┐      ┌──────────────┐            │
│  │ Análise &    │       │ Segurança    │      │ Debug Code   │            │
│  │ Planejamento │──────▶│ Crítica      │─────▶│ Limpeza      │            │
│  │              │       │              │      │              │            │
│  │ • Mapear     │       │ • Backup     │      │ • Remove     │            │
│  │   imports    │       │   files      │      │   572 logs   │            │
│  │ • Branch     │       │ • JWT_SECRET │      │ • Código     │            │
│  │ • Backup     │       │ • Bcrypt     │      │   comentado  │            │
│  └──────────────┘       └──────────────┘      └──────────────┘            │
│                                                                              │
│  Status: ⬜⬜⬜⬜⬜                                                           │
│  Commits: 3 pequenos                                                       │
│  Risk: MÉDIO (segurança é crítica)                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  DIA 2: CONSOLIDAÇÃO (Duplicação + Arquitetura)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE 4 (4-5h)          FASE 5 (6-8h)                                      │
│  ┌──────────────┐       ┌──────────────┐                                   │
│  │ Consolidação │       │ Refactor     │                                   │
│  │ Duplicação   │──────▶│ Arquitetural │                                   │
│  │              │       │              │                                   │
│  │ • Datecode   │       │ • Components │                                   │
│  │   routes     │       │   estrutura  │                                   │
│  │ • Admin      │       │ • API utils  │                                   │
│  │   pages      │       │ • Tipos DB   │                                   │
│  │ • Permission │       │ • Componentes│                                   │
│  │   checks     │       │   gigantes   │                                   │
│  └──────────────┘       └──────────────┘                                   │
│                                                                              │
│  Status: ⬜⬜⬜⬜⬜                                                           │
│  Commits: 6 estruturais                                                    │
│  Risk: ALTO (muitas mudanças, imports afetados)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  DIA 3: PADRONIZAÇÃO + VALIDAÇÃO (Padrões + Testes)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FASE 6 (4-6h)          FASE 7 (3-4h)        FASE 8 (2-3h)               │
│  ┌──────────────┐       ┌──────────────┐     ┌──────────────┐            │
│  │ Padronização │       │ Testes &     │     │ Documentação │            │
│  │ de Padrões   │──────▶│ Validação    │────▶│ Final        │            │
│  │              │       │              │     │              │            │
│  │ • Error      │       │ • Type check │     │ • Docs       │            │
│  │   handling   │       │ • Lint       │     │ • Cleanup    │            │
│  │ • Logging    │       │ • Build      │     │ • Merge      │            │
│  │ • Types      │       │ • Manual     │     │ • Issues     │            │
│  │   TypeScript │       │   tests      │     │   follow-up  │            │
│  └──────────────┘       └──────────────┘     └──────────────┘            │
│                                                                              │
│  Status: ⬜⬜⬜⬜⬜                                                           │
│  Commits: 3-4 padrões                                                      │
│  Risk: BAIXO (adiciona valor, não quebra)                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Dependência Entre Fases

```
FASE 1 (Análise)
  │
  ├─────────┬──────────┬──────────┐
  │         │          │          │
  ▼         ▼          ▼          ▼
FASE 2   FASE 3    FASE 4     (paralelo)
(Segurança) (Debug)   (Dups)
  │         │          │
  └─────────┼──────────┘
           │
           ▼
         FASE 5 (Refactor)
           │
           ▼
         FASE 6 (Padrões)
           │
           ▼
         FASE 7 (Testes)
           │
           ▼
         FASE 8 (Docs)
```

**Legenda**:
- Fases 2, 3, 4 podem rodar com pouca interdependência
- Fases 5, 6, 7, 8 devem rodar em sequência

---

## 🎯 Mudanças por Estrutura

### Estrutura de Pastas (ANTES vs DEPOIS)

```
ANTES:
components/
  ├── ui/
  ├── forms/
  ├── AuthWrapper.tsx        ← Tá aqui
  ├── Sidebar.tsx            ← Tá aqui
  ├── MetricCard.tsx         ← Tá aqui
  ├── ModalCriarExtracao.tsx ← Tá aqui
  ├── VectorStoreManager.tsx ← Tá aqui
  ├── WhatsAppConnection.tsx ← Tá aqui
  └── 22+ componentes misturados

DEPOIS:
components/
  ├── ui/                    (sem mudanças)
  │   ├── Button.tsx
  │   ├── Input.tsx
  │   └── ...
  ├── layout/                (novo)
  │   ├── AuthWrapper.tsx    ← Movido
  │   ├── Sidebar.tsx        ← Movido
  │   └── ...
  ├── forms/                 (sem mudanças)
  │   ├── LeadForm.tsx
  │   └── ...
  ├── features/              (novo - organiza por feature)
  │   ├── whatsapp/
  │   │   └── WhatsAppConnection.tsx  ← Movido
  │   ├── vectorstore/
  │   │   └── VectorStoreManager.tsx  ← Movido
  │   ├── extracao/
  │   │   └── ModalCriarExtracao.tsx  ← Movido
  │   └── leads/
  │       └── MetricCard.tsx          ← Movido
  └── shared/                (novo - HOCs, providers)
      ├── PlanProtection.tsx
      └── DynamicBusinessTypeProvider.tsx
```

### API Routes (ANTES vs DEPOIS)

```
ANTES:
app/api/datecode/
  ├── route.ts        (CNPJ - 150 linhas com lógica duplicada)
  ├── cpf/route.ts    (CPF - 150 linhas com lógica duplicada)
  └── consulta/route.ts (Generic - 150 linhas com lógica duplicada)

  Total: ~450 linhas de código duplicado

DEPOIS:
app/api/datecode/
  ├── route.ts        (Usa handleDatecodeRequest)
  ├── cpf/route.ts    (Usa handleDatecodeRequest)
  └── consulta/route.ts (Usa handleDatecodeRequest)

lib/
  └── datecode-handler.ts (handleDatecodeRequest)

  Total: ~150 linhas de código reutilizável + 50 em handler
```

### Admin Pages (ANTES vs DEPOIS)

```
ANTES:
app/admin/
  ├── planos/page.tsx        (Standalone page)
  └── tipos-negocio/page.tsx  (Standalone page)

app/configuracoes-admin/
  ├── page.tsx                (Unified page com tabs)
  └── components/
      ├── PlanosSection.tsx    (Duplica admin/planos)
      ├── TiposNegocioSection.tsx (Duplica admin/tipos-negocio)
      └── UsuariosSection.tsx

DEPOIS:
app/configuracoes-admin/     (única source of truth)
  ├── page.tsx
  └── components/
      ├── PlanosSection.tsx
      ├── TiposNegocioSection.tsx
      └── UsuariosSection.tsx

app/admin/
  ├── (removido)
```

---

## 💾 Impacto em Banco de Dados

### Migrações Necessárias

```sql
-- Nenhuma migração de schema necessária
-- Mas: fazer HASH de todas as senhas existentes

-- Script de migração (executar após deploy de código novo):
UPDATE usuarios
SET password = hash_password(password)
WHERE password_hashed = false;

UPDATE usuarios
SET password_hashed = true;
```

---

## 🔐 Impacto em Segurança

### Antes vs Depois

| Item | Antes | Depois |
|------|-------|--------|
| **Senhas** | Plain text | Bcrypt hash |
| **JWT Secret** | Default 'secret' | Obrigatório em prod |
| **Backup Files** | No git ⚠️ | No git ✓ |
| **Console.log** | 572 statements | <50 |
| **Types** | Muitos `any` | Tipado |

---

## ✅ Checklist de Execução

### Dia 1
- [ ] FASE 1 completa - Análise feita, branch criada
- [ ] FASE 2 completa - Segurança fixa
- [ ] FASE 3 completa - Debug code removido
- [ ] Todos os 3 commits de segurança feitos
- [ ] Build passando (`npm run build`)

### Dia 2
- [ ] FASE 4 completa - Duplicação consolidada
- [ ] FASE 5 completa - Arquitetura refatorada
- [ ] Todos os 6 commits estruturais feitos
- [ ] Imports todos atualizados
- [ ] Build passando
- [ ] Manual testing de fluxos críticos

### Dia 3
- [ ] FASE 6 completa - Padrões implementados
- [ ] FASE 7 completa - Testes passando
- [ ] FASE 8 completa - Documentação atualizada
- [ ] Merge para main
- [ ] Issues de follow-up criadas

---

## 🚨 Riscos e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---|---|---|
| Login quebra após bcrypt | ALTA | CRÍTICO | Backup da DB, teste antes de merge |
| Imports quebrados após refactor | ALTA | ALTO | Grep para validar, build check |
| Feature desaparece | MÉDIA | ALTO | Testes manuais de cada feature |
| Merge conflict | BAIXA | MÉDIO | Branch exclusiva, ninguém faz push |
| Performance piora | BAIXA | MÉDIO | Bundle size check, lighthouse |

---

## 📈 Métricas de Sucesso

Depois de completo, você terá:

✅ **Código mais seguro**
- Zero plain text passwords
- Zero exposed secrets
- Backup files removidos

✅ **Código mais limpo**
- 90% dos console.logs removidos
- Código duplicado reduzido em 75%
- 3 arquivos deletados (duplicações)

✅ **Código mais organizado**
- Components em pastas lógicas
- API routes padronizadas
- Tipos TypeScript consistentes

✅ **Código mais mantível**
- Padrões claros e documentados
- Logging apropriado
- Error handling standardizado

---

## 🎓 Lições Aprendidas para o Futuro

1. **Não deixar código debug em produção** - Setup linting para console.log
2. **Nunca duplicar lógica** - Usar shared utils desde o início
3. **Estrutura clara desde o começo** - Evita refactor grande depois
4. **Testes desde o início** - Teria pego muitos desses problemas
5. **Code review stricto** - Peer review prévine bagunça
