# 🚀 FASE 1: ANÁLISE E PLANEJAMENTO - GUIA DE EXECUÇÃO

> Tempo estimado: 2-3 horas
> Status: Pronto para executar
> Data: 2025-11-21

---

## 📋 Tarefas da FASE 1

```
[ ] 1.1 - Mapear Todas as Importações Críticas
[ ] 1.2 - Identificar Rotas Críticas
[ ] 1.3 - Criar Estratégia de Backup
[ ] 1.4 - Documentar Impactos
```

---

## ✅ TAREFA 1.1: Mapear Todas as Importações Críticas

### O que precisa ser mapeado?

#### 1.1.1 - Imports de `/lib/auth.ts`

**Arquivo crítico**: `/lib/auth.ts` - será significativamente modificado

Procure por todos os arquivos que usam:
```typescript
import { ... } from '@/lib/auth'
```

**Comando para encontrar**:
```bash
grep -r "from '@/lib/auth'" app/
grep -r "from '@/lib/auth" app/  # sem aspas fechadas
```

**Arquivos esperados que usam**:
- `/app/api/auth/login` - certamente usa
- `/middleware.ts` - certamente usa
- Qualquer page com login - provavelmente usa

**Saída esperada**:
```
app/api/auth/login/route.ts:5:import { validateUser, generateToken } from '@/lib/auth'
app/api/auth/logout/route.ts:3:import { validateToken } from '@/lib/auth'
middleware.ts:15:import { validateToken } from '@/lib/auth'
```

#### 1.1.2 - Imports de `/lib/supabase.ts`

**Arquivo crítico**: `/lib/supabase.ts` - será usado de forma mais padronizada

**Comando**:
```bash
grep -r "from '@/lib/supabase'" app/
grep -r "from '@/lib/supabase" app/
```

**O que procurar**:
- Quantos arquivos importam?
- Qual padrão usam? (`import { supabase }` vs `import { getSupabaseAdmin }`)
- Algum arquivo faz `createClientComponentClient()` ao invés de usar a lib?

#### 1.1.3 - Todos os console.log

**Propósito**: Identificar o escopo completo de limpeza

**Comando**:
```bash
grep -r "console\." app/ lib/ components/ --include="*.ts" --include="*.tsx" | wc -l
```

**Quebrar por tipo**:
```bash
# Contar por tipo
grep -r "console\.log" app/ lib/ components/ --include="*.ts" --include="*.tsx" | wc -l
grep -r "console\.error" app/ lib/ components/ --include="*.ts" --include="*.tsx" | wc -l
grep -r "console\.warn" app/ lib/ components/ --include="*.ts" --include="*.tsx" | wc -l
```

**Listar arquivos com mais console.log**:
```bash
grep -r "console\.log" app/ lib/ components/ --include="*.ts" --include="*.tsx" -l | while read file; do
  count=$(grep -c "console\.log" "$file")
  echo "$count - $file"
done | sort -rn | head -20
```

#### 1.1.4 - Verificar quais API routes checam permissões

**Comando**:
```bash
grep -r "view_usuarios_planos" app/api/ --include="*.ts"
```

**Procura por**:
```typescript
.from('view_usuarios_planos')
.eq('id', userId)
```

Anote quantos arquivos fazem isso (dica: serão consolidados depois)

### 📝 Documento de Saída: `DEPENDENCIAS_MAPEADAS.md`

Crie arquivo com resultado:

```markdown
# Dependências Mapeadas - FASE 1

## Importações de /lib/auth.ts

Total de arquivos afetados: X

Arquivos:
- app/api/auth/login/route.ts
- app/api/auth/logout/route.ts
- middleware.ts
- [listar todos]

Funções usadas:
- validateUser: X arquivos
- generateToken: X arquivos
- validateToken: X arquivos

## Importações de /lib/supabase.ts

Total de arquivos afetados: X

Padrões encontrados:
- Padrão 1: import { supabase } - X arquivos
- Padrão 2: import { getSupabaseAdmin } - X arquivos
- Padrão 3: createClientComponentClient - X arquivo

Anomalias:
- [ ] /app/admin/tipos-negocio/page.tsx usa createClientComponentClient (NÃO PADRONIZADO)

## Console.log Statistics

Total statements: 572
- console.log: XXX
- console.error: XXX
- console.warn: XXX

Top 5 files:
1. app/leads/page.tsx - 86 statements
2. app/relatorios/page.tsx - 44 statements
3. app/enriquecimento-api/page.tsx - 37 statements
4. app/extracao-leads/page.tsx - 36 statements
5. [...]

## API Routes com Permission Check

Total: 12+ routes

Files:
- app/api/datecode/route.ts
- app/api/datecode/cpf/route.ts
- app/api/datecode/consulta/route.ts
- [listar todas]

Padrão identificado:
```typescript
const { data: userPlan } = await getSupabaseAdmin()
  .from('view_usuarios_planos')
  .select('*')
  .eq('id', userId)
  .single()
```

Este padrão se repete em 12 lugares.
```

---

## ✅ TAREFA 1.2: Identificar Rotas Críticas

### O que é uma "rota crítica"?

São páginas/routes que são muito acessadas ou que, se quebrem, afetam usuário final.

### 1.2.1 - Mapear Navegação Principal

Abra `/components/Sidebar.tsx` e veja:
- Quais links estão lá?
- Qual é o fluxo do usuário?

**Exemplo do que procurar**:
```typescript
// Sidebar.tsx
<Link href="/leads">Leads</Link>
<Link href="/extracao-leads">Extração</Link>
<Link href="/admin">Admin</Link>
```

**Documento de Saída**:
```markdown
# Fluxo Principal de Navegação

## Home / Dashboard
- Rota: `/` (app/page.tsx)
- Acesso: Público / Logado?
- Depende de: [listar componentes]
- Risk de quebra: BAIXO

## Leads
- Rota: `/leads` (app/leads/page.tsx)
- Acesso: Logado
- Depende de: [listar]
- Risk de quebra: MÉDIO (componente grande, 86 console.logs)

## Admin
- Rotas: `/admin/planos`, `/admin/tipos-negocio`, `/configuracoes-admin`
- Acesso: Admin only
- Depende de: [listar]
- **NOTA**: 3 rotas para mesmo conteúdo!
- Risk de quebra: ALTO

## Fluxos Críticos a Testar Depois:
1. Login → Dashboard → Leads
2. Admin → Planos
3. Admin → Tipos de Negócio
4. Admin → Usuários
5. Extração → Upload File → Enriquecimento
6. WhatsApp → Enviar Mensagem
```

### 1.2.2 - Verificar Links para Admin Pages

```bash
# Procura quem linká para /admin/planos
grep -r "/admin/planos" app/ components/ --include="*.ts" --include="*.tsx"

# Procura quem linká para /admin/tipos-negocio
grep -r "/admin/tipos-negocio" app/ components/ --include="*.ts" --include="*.tsx"

# Procura quem linká para /configuracoes-admin
grep -r "/configuracoes-admin" app/ components/ --include="*.ts" --include="*.tsx"
```

**Anotação**: Esses links precisarão ser atualizados na FASE 4

---

## ✅ TAREFA 1.3: Criar Estratégia de Backup

### 3.1 - Verificar Status do Git

```bash
# Verificar status
git status

# Verificar branch atual
git branch -v

# Ver últimos commits
git log --oneline -10
```

**Deve retornar algo como**:
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

**Se houver arquivos modificados**:
```bash
# Commit ou discard antes de continuar
git add .
git commit -m "work in progress"
```

### 3.2 - Criar Branch de Trabalho

```bash
# Criar branch nova
git checkout -b reorganizacao/fase-1-analise

# Verificar que está na branch certa
git branch -v
```

**Saída esperada**:
```
* reorganizacao/fase-1-analise    57739c7 docs: adicionar documentação
  main                             57739c7 docs: adicionar documentação
```

### 3.3 - Backup Local

```bash
# Copiar projeto inteiro
# (Use seu explorer ou: cp -r . ../backup-dnx-before-reorganization)
```

Salve um backup manual em local seguro (drive externo, cloud, etc)

### 3.4 - Documentar Estratégia

```markdown
# Backup & Recovery Strategy

## Current Branch
- Main branch is clean and up-to-date
- Last commit: 57739c7 (docs)

## Work Branch
- Created: reorganizacao/fase-1-analise
- Purpose: Analysis phase of reorganization
- Will merge to: reorganizacao/main after all phases

## Backup Strategy
- Local backup: ../backup-dnx-before-reorganization/
- Remote backup: origin/main (always safe)
- Rollback: git reset --hard origin/main (if needed)

## Phase Flow
1. FASE 1 → reorganizacao/fase-1-analise
2. FASE 2 → reorganizacao/fase-2-seguranca
3. FASE 3 → reorganizacao/fase-3-limpeza
4. ... (each phase gets own branch)
5. Final → merge all to reorganizacao/main
6. Final → merge reorganizacao/main to main

## Breaking Changes Identified
[Will be filled during phase 1]
```

---

## ✅ TAREFA 1.4: Documentar Impactos

### 4.1 - Criar Documento de Impactos

**Arquivo**: `ANALISE_IMPACTOS.md`

```markdown
# Análise de Impactos - Reorganização

## Breaking Changes Previstos

### FASE 2: Segurança
- [ ] Bcrypt será introduzido - LOGIN PODE QUEBRAR
  - Impact: Crítico
  - Mitigation: Testar login antes de merge
  - Rollback: Revert commit de bcrypt

- [ ] Backup files serão deletados
  - Impact: Zero (eram backups)
  - Mitigation: Git history preserva

- [ ] JWT_SECRET será obrigatório
  - Impact: Dev pode quebrar se .env não tiver
  - Mitigation: Documentar em README

### FASE 4: Consolidação
- [ ] Admin pages serão consolidadas
  - /admin/planos - DELETADA
  - /admin/tipos-negocio - DELETADA
  - Impact: Alto (links podem quebrar)
  - Mitigation: Atualizar todos os links em Sidebar
  - Risk: User marcou bookmark antigo

- [ ] Datecode routes serão consolidadas
  - Impact: Médio (internos, se API não mudar)
  - Mitigation: Manter mesma interface

### FASE 5: Refactor
- [ ] Components moved
  - Impact: Alto (imports quebram)
  - Mitigation: Grep + find & replace
  - Validation: Build deve passar

## Files that Will Change Most

| File | Change Type | Impact | Risk |
|------|------------|--------|------|
| /lib/auth.ts | Rewrite | CRÍTICO | ALTA |
| /middleware.ts | Modify | ALTO | MÉDIA |
| /components/* | Reorganize | MÉDIO | MÉDIA |
| /app/api/datecode/* | Consolidate | MÉDIO | BAIXA |
| /app/admin/* | Delete | MÉDIO | BAIXA |

## Files That Should NOT Change

- /app/leads/page.tsx - (será só limpeza de logs)
- /app/configuracoes-admin/page.tsx - (será mantida, será a versão final)
- /lib/supabase.ts - (internamente, mas interface igual)
- /components/ui/* - (nenhuma mudança)

## Testing Strategy After Each Phase

### After FASE 2 (Security)
- [ ] Build passes: npm run build
- [ ] Type check passes: npm run type-check
- [ ] Login still works
- [ ] Logout still works

### After FASE 4 (Consolidation)
- All above, plus:
- [ ] Admin pages load
- [ ] All admin features work

### After FASE 5 (Refactor)
- All above, plus:
- [ ] All imports resolved
- [ ] All pages load
- [ ] No broken routes

### After FASE 6-7 (Patterns + Testing)
- [ ] No warnings in console
- [ ] All manual flows work
- [ ] Performance acceptable

## Communication Plan

- [ ] If team exists: notify them this is happening
- [ ] Document "do not deploy during this" period
- [ ] Create Slack/Discord message with timeline
```

---

## 📝 Checklist de Conclusão da FASE 1

```
TAREFA 1.1: Mapeamento de Importações
[ ] Identificado todos os arquivos que importam /lib/auth.ts
[ ] Identificado todos os arquivos que importam /lib/supabase.ts
[ ] Mapeado os 572 console.log statements
[ ] Identificado os 12+ API routes com permission checks
[ ] Criado documento DEPENDENCIAS_MAPEADAS.md

TAREFA 1.2: Identificação de Rotas Críticas
[ ] Mapeado fluxo principal de navegação
[ ] Verificado todos os links para admin pages
[ ] Documentado riscos de quebra por rota
[ ] Criado documento de FLUXOS_CRITICOS.md

TAREFA 1.3: Estratégia de Backup
[ ] Verificado status do git (limpo)
[ ] Criada branch reorganizacao/fase-1-analise
[ ] Feito backup local do projeto
[ ] Documentado recovery strategy

TAREFA 1.4: Documentação de Impactos
[ ] Documentados breaking changes previstos
[ ] Criado plano de testes para cada fase
[ ] Criado plano de comunicação (se houver team)
[ ] Criado documento ANALISE_IMPACTOS.md

DELIVERABLES:
[ ] DEPENDENCIAS_MAPEADAS.md
[ ] FLUXOS_CRITICOS.md
[ ] ANALISE_IMPACTOS.md
[ ] Branch reorganizacao/fase-1-analise criada e preparada
[ ] Backup local salvo

STATUS: ✅ PRONTO PARA FASE 2
```

---

## 🔗 Próximos Passos

Quando FASE 1 estiver 100% completa:

1. Revisar todos os 3 documentos criados
2. Fazer commit:
   ```bash
   git add DEPENDENCIAS_MAPEADAS.md FLUXOS_CRITICOS.md ANALISE_IMPACTOS.md
   git commit -m "docs: phase 1 analysis - dependency mapping and impact assessment"
   ```

3. Proceder para FASE 2: **Correções de Segurança Crítica**

---

## 💡 Dicas Importantes

- **Não modifique código ainda** - FASE 1 é só análise
- **Salve todos os resultados em arquivos** - Facilitam future reference
- **Se encontrar algo novo** - Anote e ajuste o plano geral
- **Commits frequentes** - Mesmo na análise, documente descobertas

---

Criado: 2025-11-21
Status: Pronto para execução