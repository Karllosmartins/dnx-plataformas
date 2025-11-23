# 📋 Backlog do Projeto DNX CRM

> **Última atualização**: 2025-11-23
> **Status**: Em desenvolvimento ativo

---

## 🎯 Prioridade ALTA

### 1. Clarificação de Limites de Workspace
**Status**: 🔴 Pendente - Definição Importante

**Contexto**:
- `limite_leads`: Limite de leads **cadastrados** na base (não importa a origem)
- `limite_consultas`: Limite **unificado** para:
  - Consultas à API DataCode
  - Extrações de leads
  - Enriquecimento de dados

**Ação necessária**:
- [ ] Renomear `limite_consultas` para `limite_operacoes_datecode` (mais claro)
- [ ] Ou criar contadores separados: `consultas_realizadas`, `extracoes_realizadas`, `enriquecimentos_realizados`
- [ ] Definir se haverá limite compartilhado ou limites individuais por operação

---

### 2. Integração com API DataCode
**Status**: 🔴 Não iniciado - Prioridade ALTA

#### 2.1 Criar API Wrapper DataCode
**Objetivo**: Centralizar todas as operações com DataCode em nossa API

**Endpoints a criar**:
```typescript
// apps/api/src/routes/datecode.ts

POST   /api/datecode/consulta         // Consulta CPF/CNPJ
POST   /api/datecode/extracao          // Extração de leads
POST   /api/datecode/enriquecimento    // Enriquecimento de dados
GET    /api/datecode/historico         // Histórico de operações
```

**Funcionalidades**:
- [ ] Verificar limite de operações do workspace ANTES de chamar DataCode
- [ ] Incrementar contador `consultas_realizadas` após operação bem-sucedida
- [ ] Armazenar histórico de todas as operações (auditoria)
- [ ] Retornar erro 403 quando limite atingido
- [ ] Criar tabela `datecode_operations` para histórico:
  ```sql
  CREATE TABLE datecode_operations (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id),
    user_id INTEGER REFERENCES users(id),
    operation_type TEXT, -- 'consulta', 'extracao', 'enriquecimento'
    request_data JSONB,
    response_data JSONB,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP
  );
  ```

**Estimativa**: 2-3 dias

---

#### 2.2 Auto-cadastro de Leads
**Objetivo**: Leads vindos da DataCode devem ser automaticamente cadastrados na base

**Fluxo**:
1. Operação na API DataCode retorna dados
2. Sistema valida se lead já existe (por CPF/CNPJ)
3. Se não existe:
   - Cadastra novo lead
   - Associa ao workspace do usuário
   - Popula campos com dados da DataCode
   - Incrementa `leads_consumidos` do workspace
4. Se existe:
   - Atualiza dados (enriquecimento)
   - Não incrementa contador

**Campos a mapear**:
```typescript
interface LeadDataCode {
  // Campos da DataCode -> Campos do nosso Lead
  cpf_cnpj: string
  nome: string
  telefone?: string
  email?: string
  endereco?: object
  dividas?: array
  score?: number
  // ... outros campos da DataCode
}
```

**Tasks**:
- [ ] Criar função `createLeadFromDataCode(data, workspaceId, userId)`
- [ ] Mapear todos os campos da API DataCode para nossa estrutura
- [ ] Adicionar campo `origem: 'datecode_consulta' | 'datecode_extracao' | 'datecode_enriquecimento'`
- [ ] Adicionar campo `datecode_data: JSONB` para armazenar resposta completa
- [ ] Criar lógica de deduplicação (evitar duplicatas)

**Estimativa**: 2 dias

---

### 3. Migrar Disparos para Sistema Interno
**Status**: 🔴 Não iniciado - Prioridade ALTA

#### 3.1 Contextualização
**Situação atual**: Disparos são enviados para N8N (sistema externo)
**Objetivo**: Migrar tudo para nosso backend para ter controle total e relatórios unificados

#### 3.2 Tipos de Disparo a Migrar

##### A. Disparo Simples
**Funcionalidades**:
- [ ] Envio de mensagens em massa via WhatsApp
- [ ] Seleção de leads da base
- [ ] Templates de mensagem
- [ ] Agendamento de disparos
- [ ] Controle de velocidade (rate limiting)
- [ ] Logs de envio/entrega/leitura

**Tabelas necessárias**:
```sql
CREATE TABLE campanhas_disparo (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  nome TEXT,
  tipo TEXT, -- 'simples', 'ia', 'api_oficial'
  status TEXT, -- 'rascunho', 'agendada', 'em_andamento', 'concluida'
  template_mensagem TEXT,
  leads_alvo INTEGER[],
  total_leads INTEGER,
  enviados INTEGER,
  entregues INTEGER,
  lidos INTEGER,
  erros INTEGER,
  agendado_para TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE disparos_log (
  id UUID PRIMARY KEY,
  campanha_id UUID,
  lead_id INTEGER,
  mensagem TEXT,
  status TEXT, -- 'enviado', 'entregue', 'lido', 'erro'
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP
);
```

**Estimativa**: 3-4 dias

---

##### B. Disparo com IA
**Funcionalidades**:
- [ ] Tudo do Disparo Simples +
- [ ] Personalização de mensagem por IA (OpenAI/Gemini)
- [ ] Contexto do lead injetado na mensagem
- [ ] Variáveis dinâmicas (nome, dívida, etc)
- [ ] A/B testing de mensagens

**Tasks adicionais**:
- [ ] Integrar com OpenAI/Gemini para geração
- [ ] Criar templates com placeholders
- [ ] Sistema de variáveis customizadas
- [ ] Limitar tokens consumidos por disparo

**Estimativa**: 2-3 dias

---

##### C. Disparo via API Oficial WhatsApp
**Funcionalidades**:
- [ ] Tudo do Disparo Simples +
- [ ] Suporte a templates oficiais do WhatsApp
- [ ] Aprovação de templates no Meta
- [ ] Envio via WhatsApp Business API
- [ ] Webhooks para status de mensagens
- [ ] Botões interativos e listas

**Tasks adicionais**:
- [ ] Integrar com WhatsApp Business API
- [ ] Criar gerenciamento de templates
- [ ] Sistema de aprovação de templates
- [ ] Webhook receiver para status
- [ ] Suporte a mídia (imagens, PDFs)

**Estimativa**: 4-5 dias

---

#### 3.3 API de Disparos Unificada

**Endpoints**:
```typescript
// apps/api/src/routes/disparos.ts

POST   /api/disparos/campanhas          // Criar campanha
GET    /api/disparos/campanhas          // Listar campanhas
GET    /api/disparos/campanhas/:id      // Detalhes da campanha
PUT    /api/disparos/campanhas/:id      // Atualizar campanha
DELETE /api/disparos/campanhas/:id      // Deletar campanha
POST   /api/disparos/campanhas/:id/iniciar   // Iniciar disparo
POST   /api/disparos/campanhas/:id/pausar    // Pausar disparo
GET    /api/disparos/campanhas/:id/logs      // Logs da campanha
GET    /api/disparos/relatorio           // Relatório geral
```

**Estimativa total disparos**: 8-10 dias

---

### 4. Relatórios Unificados
**Status**: 🟡 Parcialmente implementado

**Objetivo**: Com disparos no backend, criar relatórios completos

**Métricas a adicionar**:
- [ ] Taxa de conversão por campanha
- [ ] ROI de campanhas (se houver custo)
- [ ] Melhor horário para disparo
- [ ] Taxa de resposta por template
- [ ] Funil completo: Lead → Mensagem → Resposta → Conversão
- [ ] Leads por origem (DataCode, Manual, Importação, etc)

**Estimativa**: 2 dias

---

## 🟢 Prioridade MÉDIA

### 5. Frontend - Dashboard de Consumo do Workspace
**Status**: 🟡 Backend pronto, frontend pendente

**Componentes a criar**:
- [ ] Card de limites do workspace no dashboard
- [ ] Barra de progresso visual (leads, consultas, instâncias)
- [ ] Alertas quando próximo do limite (80%, 90%, 100%)
- [ ] Botão "Upgrade de Plano"
- [ ] Histórico de consumo mensal

**Localização**: `app/dashboard/page.tsx` ou nova página `app/workspace/consumo/page.tsx`

**Estimativa**: 1-2 dias

---

### 6. Sistema de Notificações
**Status**: 🔴 Não iniciado

**Tipos de notificação**:
- [ ] Limite de leads/consultas atingindo 80%
- [ ] Limite atingido (100%)
- [ ] Disparo concluído
- [ ] Erro em campanha de disparo
- [ ] Novos leads cadastrados via DataCode

**Canais**:
- [ ] Notificações in-app
- [ ] Email
- [ ] WhatsApp (meta)

**Estimativa**: 3 dias

---

## 🔵 Backlog / Ideias Futuras

### 7. Melhorias de UX
- [ ] Onboarding para novos usuários
- [ ] Tour guiado do sistema
- [ ] Templates de funis prontos
- [ ] Importação de leads via CSV/Excel
- [ ] Exportação de relatórios PDF

### 8. Integrações
- [ ] Zapier
- [ ] Google Sheets
- [ ] CRM externos (RD Station, HubSpot)
- [ ] Calendly para agendamentos

### 9. Otimizações
- [ ] Cache de consultas frequentes
- [ ] Lazy loading de leads
- [ ] Compressão de imagens
- [ ] CDN para assets estáticos

---

## 📊 Estimativas Totais

| Item | Estimativa | Prioridade |
|------|-----------|-----------|
| API DataCode + Auto-cadastro | 4-5 dias | 🔴 ALTA |
| Migração Disparos (completa) | 8-10 dias | 🔴 ALTA |
| Relatórios Unificados | 2 dias | 🔴 ALTA |
| Dashboard Consumo Workspace | 1-2 dias | 🟢 MÉDIA |
| Sistema de Notificações | 3 dias | 🟢 MÉDIA |

**Total Prioridade ALTA**: ~14-17 dias de desenvolvimento
**Total Geral**: ~18-22 dias

---

## 🎯 Próximos Passos Recomendados

1. **Executar migration 002** no banco de dados
2. **Testar** sistema de limites de workspace
3. **Desenvolver API DataCode** (alta prioridade)
4. **Migrar Disparo Simples** primeiro (base para os outros)
5. **Adicionar Disparo IA e API Oficial** incrementalmente

---

## 📝 Notas

- Todas as estimativas são para 1 desenvolvedor full-time
- Estimativas incluem: desenvolvimento, testes, documentação
- Não incluem: code review, ajustes pós-deploy, treinamento de usuários
- Prioridades podem ser ajustadas conforme necessidade do negócio
