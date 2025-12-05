# PLANO DE AUDITORIA E CORREÇÕES - DNX Plataformas

## RESUMO EXECUTIVO

Auditoria completa do projeto identificou **85+ problemas** em 4 categorias principais:
1. **Segurança/Autenticação** - 18 problemas CRÍTICOS
2. **User vs Workspace** - 12 arquivos afetados
3. **Erros TypeScript/Runtime** - 39 problemas
4. **Código desnecessário** - 120+ console.logs, catch vazios

---

## 1. PROBLEMAS CRÍTICOS DE SEGURANÇA

### 1.1 Rotas Admin SEM Verificação de Role (CRÍTICO)

**Impacto**: Qualquer usuário pode acessar funcionalidades admin

| Arquivo | Problema |
|---------|----------|
| `app/api/admin/users/route.ts` | GET/POST sem verificar role admin |
| `app/api/admin/users/[id]/route.ts` | GET/PUT/DELETE sem verificar role admin |
| `app/api/admin/workspaces/route.ts` | GET/POST sem verificar role admin |
| `app/api/admin/workspaces/[id]/route.ts` | Todas operações sem verificar role |
| `app/api/admin/workspaces/[id]/members/route.ts` | Sem verificar role admin |
| `app/api/admin/tools/route.ts` | GET sem verificar role admin |

**Correção**: Adicionar verificação de role no início de cada rota admin

### 1.2 Webhooks SEM Autenticação (CRÍTICO)

| Arquivo | Problema |
|---------|----------|
| `app/api/webhooks/evolution/route.ts` | POST aceita qualquer requisição |
| `app/api/webhooks/uazapi/route.ts` | POST aceita qualquer requisição |

**Correção**: Implementar HMAC signature validation

### 1.3 API Key Profile Exposta (CRÍTICO)

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `app/api/profile/get-api-key/route.ts` | 18-29 | Retorna API key sem autenticação |

---

## 2. PROBLEMAS USER vs WORKSPACE

### 2.1 Rotas usando userId quando deveria usar workspaceId

| Arquivo | Linha | Problema | Ação |
|---------|-------|----------|------|
| `app/api/arquivos/route.ts` | 21, 56, 87 | Filtra por user_id | Mudar para workspace_id |
| `app/api/extracoes/route.ts` | 69, 106, 195, 340, 399 | Filtra por user_id | Mudar para workspace_id |
| `app/api/whatsapp/instances/route.ts` | 20, 47, 144 | Usa userId | Verificar se deve usar workspace_id |
| `app/api/whatsapp/status/route.ts` | 16, 168 | Usa userId | Verificar contexto |
| `app/api/whatsapp/create-instance/route.ts` | 173, 194 | Usa userId | Mudar para workspace_id |
| `app/api/datecode/cpf/route.ts` | 8 | Aceita userId | Mudar para workspace_id |
| `app/api/users/limits/route.ts` | 11 | searchParams.get('userId') | Mudar para workspace_id |
| `lib/datecode.ts` | 26 | .eq('user_id', userId) | Avaliar contexto |

### 2.2 Rotas que precisam validar se token corresponde ao userId

| Arquivo | Problema |
|---------|----------|
| `app/api/workspaces/current/route.ts` | Aceita qualquer userId |
| `app/api/extracoes/salvar-no-crm/route.ts` | 4 lugares com .eq('user_id') |

---

## 3. ERROS TYPESCRIPT E RUNTIME

### 3.1 Uso Excessivo de `any` (ALTA PRIORIDADE)

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `middleware.ts` | 97 | `userPermissions: any` |
| `lib/supabase.ts` | 186-187, 265, 276, 355 | Múltiplos `any` em tipos |
| `lib/datecode-handler.ts` | 24, 40, 74, 92-94 | Retornos com `any` |
| `app/extracao-leads/page.tsx` | 184, 251 | Arrays com `any` |
| `app/consulta/page.tsx` | 228 | Função com `any` |
| `components/features/consulta/ConsultaResultados.tsx` | 25 | Props `any` |

### 3.2 JSON.parse sem try/catch (MÉDIA PRIORIDADE)

| Arquivo | Linhas |
|---------|--------|
| `components/forms/LeadForm.tsx` | 102, 105, 137, 140, 173, 191, 194 |
| `app/configuracoes-admin/components/UsuariosSection.tsx` | 411 |
| `app/configuracoes-admin/components/TiposNegocioSection.tsx` | 62, 65, 68 |
| `app/extracao-leads/page.tsx` | 510, 658 |
| `app/integracoes/page.tsx` | 102, 152, 159, 163, 168 |
| `app/api/oauth/google-calendar/callback/route.ts` | 33 (CRÍTICO) |

### 3.3 Catch Blocks Vazios (erros silenciados)

| Arquivo | Linhas |
|---------|--------|
| `app/api/extracoes/salvar-no-crm/route.ts` | 39-41 |
| `app/api/extracoes/route.ts` | 135-136 |
| `app/api/vectorstores/route.ts` | 266-268 |
| `app/api/webhooks/evolution/route.ts` | 83-85, 112-114, 147-149, 224-226, 236-238, 248-250, 260-262 |

---

## 4. CÓDIGO DESNECESSÁRIO

### 4.1 Console.logs em Produção

**Total**: 120 ocorrências em 19 arquivos

| Arquivo | Quantidade |
|---------|------------|
| `lib/uazapi.ts` | 27 |
| `app/api/whatsapp/create-instance/route.ts` | 25 |
| `app/api/webhooks/uazapi/route.ts` | 13 |
| `lib/evolution-api.ts` | 12 |
| `lib/permissions.ts` | 10 |
| Outros (14 arquivos) | 33 |

### 4.2 TODOs Pendentes

| Arquivo | Linha | TODO |
|---------|-------|------|
| `components/user/UsageReportDialog.tsx` | 67 | Implementar contexto de workspace |
| `app/minha-conta/page.tsx` | 43 | Implementar atualização do perfil via API |

---

## 5. PLANO DE CORREÇÃO

### Fase 1: Segurança Crítica (URGENTE)

1. [ ] Adicionar verificação de role admin em todas as rotas `/api/admin/**`
2. [ ] Implementar HMAC validation nos webhooks
3. [ ] Proteger endpoint de API Key Profile
4. [ ] Validar que token corresponde ao userId em todas as rotas

### Fase 2: User vs Workspace

5. [ ] Migrar `app/api/arquivos/route.ts` para usar workspace_id
6. [ ] Migrar `app/api/extracoes/route.ts` para usar workspace_id
7. [ ] Revisar `app/api/whatsapp/*` para contexto correto
8. [ ] Atualizar `lib/datecode.ts` para workspace_id

### Fase 3: Qualidade de Código

9. [ ] Adicionar try/catch em todos os JSON.parse
10. [ ] Remover ou tratar catch blocks vazios
11. [ ] Criar tipos específicos para substituir `any`
12. [ ] Remover console.logs desnecessários (manter apenas em desenvolvimento)

### Fase 4: Melhorias

13. [ ] Implementar rate limiting
14. [ ] Adicionar logging estruturado
15. [ ] Implementar refresh token
16. [ ] Adicionar validação de inputs

---

## 6. ARQUIVOS PRIORITÁRIOS PARA CORREÇÃO

### Alta Prioridade (Segurança)
1. `app/api/admin/users/route.ts`
2. `app/api/admin/workspaces/route.ts`
3. `app/api/webhooks/evolution/route.ts`
4. `app/api/webhooks/uazapi/route.ts`
5. `app/api/profile/get-api-key/route.ts`

### Média Prioridade (User/Workspace)
6. `app/api/arquivos/route.ts`
7. `app/api/extracoes/route.ts`
8. `app/api/whatsapp/instances/route.ts`
9. `app/api/datecode/cpf/route.ts`
10. `lib/datecode.ts`

### Baixa Prioridade (Qualidade)
11. `components/forms/LeadForm.tsx`
12. `app/integracoes/page.tsx`
13. `lib/uazapi.ts`
14. `app/api/oauth/google-calendar/callback/route.ts`

---

## 7. ESTIMATIVA DE ESFORÇO

| Fase | Arquivos | Complexidade | Estimativa |
|------|----------|--------------|------------|
| Fase 1 | 6 | Alta | 15-20 correções |
| Fase 2 | 8 | Média | 25-30 correções |
| Fase 3 | 15 | Baixa-Média | 50+ correções |
| Fase 4 | - | Alta | Novo desenvolvimento |

**Total estimado**: 90-100 correções pontuais

---

## PRÓXIMOS PASSOS

1. Aprovar este plano
2. Iniciar pela Fase 1 (Segurança Crítica)
3. Testar cada correção individualmente
4. Fazer deploy gradual com monitoramento
