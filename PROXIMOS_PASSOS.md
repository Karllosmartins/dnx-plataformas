# 🚀 PRÓXIMOS PASSOS - Roadmap de Melhorias

> **Última atualização**: 2025-11-21
> **Status após reorganização**: ✅ Sistema funcionando em produção

---

## ✅ COMPLETO

- [x] Reorganização completa (8 fases)
- [x] Implementação de bcrypt para senhas
- [x] JWT_SECRET obrigatório em produção
- [x] Migração de senhas de 10 usuários
- [x] Deploy na VPS com Docker Swarm
- [x] Sistema funcionando em produção

---

## 🔥 PRIORIDADE ALTA (Fazer em breve)

### 1. ✅ Atualizar para Node.js 20
**Status**: ✅ Concluído (docker-compose.local.yml atualizado)
**Ação necessária**: Copiar arquivo atualizado para VPS e fazer redeploy

```bash
# Na VPS - Atualizar o stack no Portainer com a nova versão
```

**Por quê**: Node 18 será descontinuado pelo Supabase

---

### 2. ⚠️ Corrigir vulnerabilidades npm
**Status**: ⏳ Pendente
**Comando**:
```bash
npm audit fix
```

**Vulnerabilidades atuais**: 4 (1 moderate, 2 high, 1 critical)

---

### 3. 🧪 Implementar Testes Automatizados
**Status**: ⏳ Pendente
**Estimativa**: 8-12 horas

**Tarefas**:
- [ ] Setup Jest + React Testing Library
- [ ] Testes unitários para:
  - `lib/auth.ts` (hashPassword, verifyPassword)
  - `lib/api-utils/error-handler.ts`
  - `lib/api-utils/response.ts`
  - `lib/datecode-handler.ts`
  - `lib/permissions-middleware.ts`
- [ ] Testes de integração para API routes:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/datecode/consulta`
- [ ] Testes E2E (Playwright):
  - Fluxo de login
  - Fluxo de consulta Datecode

**Por quê**: Prevenir bugs em produção e facilitar refatorações

---

## 📊 PRIORIDADE MÉDIA (Próximas 2-4 semanas)

### 4. 📦 Migração do Supabase Auth Helpers
**Status**: ⏳ Pendente
**Estimativa**: 2-3 horas

**Ação**:
```bash
npm uninstall @supabase/auth-helpers-nextjs @supabase/auth-helpers-shared
npm install @supabase/ssr
```

Atualizar imports e uso no código.

**Por quê**: Pacote atual está deprecado

---

### 5. 🗑️ Remover campo `plano` legado
**Status**: ⏳ Pendente
**Estimativa**: 1-2 horas

**Ação**:
1. Verificar se todos os lugares usam `plano_id`
2. Criar migration para remover coluna `plano`
3. Atualizar código se necessário

**Por quê**: Padronização e limpeza do schema

---

### 6. 📊 Expandir uso do Pino Logger
**Status**: ⏳ Pendente (Pino já instalado)
**Estimativa**: 4-6 horas

**Ação**:
- [ ] Substituir `console.log` restantes por `logger.info/debug`
- [ ] Substituir `console.error` por `logger.error`
- [ ] Adicionar correlation IDs para requests
- [ ] Integrar com serviço de logging externo (Logtail, Papertrail)

**Por quê**: Melhor debugging e troubleshooting em produção

---

### 7. 📚 Documentação de API (OpenAPI/Swagger)
**Status**: ⏳ Pendente
**Estimativa**: 6-8 horas

**Ação**:
- [ ] Setup Swagger UI
- [ ] Criar spec OpenAPI para todas as rotas:
  - Auth routes
  - Datecode routes
  - WhatsApp routes
  - Vectorstore routes
  - File routes
- [ ] Documentar payloads, responses e errors

**Por quê**: Facilitar integração e onboarding de desenvolvedores

---

## 🔮 PRIORIDADE BAIXA (Futuro)

### 8. 🔍 Monitoramento e Error Tracking
**Status**: ⏳ Pendente
**Estimativa**: 4-6 horas

**Ferramentas sugeridas**:
- **Sentry**: Error tracking e stack traces
- **UptimeRobot/Pingdom**: Uptime monitoring
- **Vercel Analytics**: Performance monitoring

**Ação**:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

### 9. ⚡ Otimizações de Performance
**Status**: ⏳ Pendente
**Estimativa**: 8-12 horas

**Ações**:
- [ ] Code splitting por rota
- [ ] Lazy loading de componentes pesados
- [ ] Otimização de imagens com `next/image`
- [ ] Implementar ISR onde aplicável
- [ ] Caching estratégico (Redis?)
- [ ] Análise de bundle size

---

### 10. 🛡️ Rate Limiting
**Status**: ⏳ Pendente
**Estimativa**: 2-4 horas

**Ação**:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Implementar rate limiting em:
- `/api/auth/login` (prevenir brute force)
- `/api/datecode/*` (proteger consumo de créditos)
- `/api/whatsapp/*` (proteger API externa)

---

### 11. 💾 Backup Automatizado
**Status**: ⏳ Pendente
**Estimativa**: 4-6 horas

**Ações**:
- [ ] Script de backup diário do Supabase (pg_dump)
- [ ] Backup de arquivos do Backblaze B2
- [ ] Armazenamento de backups (S3, Google Drive)
- [ ] Teste de restore periódico (mensal)
- [ ] Documentação do processo de restore

---

### 12. 🔄 CI/CD Pipeline
**Status**: ⏳ Pendente
**Estimativa**: 6-8 horas

**Ação**: Setup GitHub Actions

**Workflows**:
1. **Pull Request**:
   ```yaml
   - Lint
   - Type-check
   - Run tests
   - Build verification
   ```

2. **Merge to main**:
   ```yaml
   - Run all checks
   - Build Docker image
   - Push to registry
   - Notify success/failure
   ```

3. **Manual deploy**:
   ```yaml
   - Deploy to VPS
   - Run migrations
   - Health check
   ```

---

## 📊 MÉTRICAS DE PROGRESSO

### Segurança
- ✅ Bcrypt implementado
- ✅ JWT_SECRET obrigatório
- ✅ Senhas migradas (10/10 usuários)
- ⏳ Rate limiting
- ⏳ Monitoramento de erros

### Qualidade de Código
- ✅ Console.logs reduzidos (74%)
- ✅ Código duplicado reduzido (80%)
- ✅ Error handling padronizado
- ✅ Logging estruturado (Pino instalado)
- ⏳ Testes automatizados
- ⏳ Documentação de API

### Performance
- ✅ Build otimizado
- ⏳ Code splitting
- ⏳ Lazy loading
- ⏳ Caching

### DevOps
- ✅ Deploy manual funcionando
- ⏳ CI/CD pipeline
- ⏳ Backup automatizado
- ⏳ Monitoring

---

## 🎯 RECOMENDAÇÃO DE EXECUÇÃO

### Semana 1-2
1. ✅ Node 20 (copiar docker-compose para VPS)
2. Corrigir vulnerabilidades npm
3. Começar testes automatizados

### Semana 3-4
4. Migração Supabase Auth Helpers
5. Remover campo `plano` legado
6. Expandir Pino logger

### Mês 2
7. Documentação OpenAPI
8. Setup Sentry
9. Rate limiting

### Mês 3+
10. Otimizações de performance
11. Backup automatizado
12. CI/CD pipeline

---

## 📝 NOTAS

- Este documento é um guia vivo e deve ser atualizado conforme tarefas são completadas
- Prioridades podem mudar baseado em necessidades do negócio
- Sempre fazer backup antes de mudanças críticas
- Testar em ambiente de staging quando disponível

---

**Criado**: 2025-11-21
**Última atualização**: 2025-11-21
**Próxima revisão**: 2025-11-28
