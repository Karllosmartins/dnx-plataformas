# 🏦 DNX Plataformas - CRM Recuperação de Crédito

Sistema completo de CRM especializado em recuperação de crédito com IA integrada, desenvolvido com Next.js, TypeScript e Supabase.

## 🚀 Funcionalidades

### 📊 Dashboard & Analytics
- Métricas em tempo real de conversão
- Funil de vendas com acompanhamento por estágios
- Relatórios financeiros e de produtividade

### 👥 CRM Completo
- Gestão de leads com pipeline personalizado
- Qualificação automática via IA
- Histórico completo de interações
- Funil: **Novo Lead** → **Qualificação** → **Pagamento** → **Negociação** → **Cliente Fechado**

### 🤖 Agentes IA
- Agentes especializados por função (vendas, suporte, qualificação)
- **Vector Store**: Upload e gestão de documentos por agente
- Integração OpenAI GPT + Gemini
- Prompts personalizáveis para cada agente

### 📱 WhatsApp Business
- Múltiplas instâncias por usuário
- Automação de campanhas e respostas
- Integração Evolution API

### 🎯 Extração de Leads
- API Profile integrada para dados de crédito
- Filtros avançados para extração em massa
- Histórico de contagens e downloads

### 🏢 Sistema Multi-tenant
- Isolamento total de dados por usuário
- Planos diferenciados (Básico, Premium, Enterprise)
- Controle de acesso granular por funcionalidade

## 🛠 Stack Tecnológico

```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes + Node.js
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth
AI:        OpenAI GPT + Vector Stores + Gemini
WhatsApp:  Evolution API
Deploy:    Docker + Portainer
```

## 📋 Arquitetura do Banco

### Principais Tabelas
- `users` - Usuários e planos de acesso
- `leads` - Pipeline completo de vendas
- `agentes_ia` - Configuração de agentes IA
- `user_agent_vectorstore` - Vector Stores por agente
- `configuracoes_credenciais` - APIs e tokens de integração
- `contagens_profile` / `extracoes_profile` - Sistema de extração
- `instancia_whatsapp` - Instâncias WhatsApp por usuário

## 🚀 Quick Start

```bash
# Clone o repositório
git clone <repo-url>
cd dnx_recuperacao_credito

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute em desenvolvimento
npm run dev
```

## 🔧 Recursos Principais

### Vector Store IA
- Upload de documentos específicos por agente
- Busca semântica em documentos
- Integração com OpenAI Assistants v2
- Suporte a PDF, TXT, DOC, DOCX, MD

### Sistema de Permissões
```
Básico:     Dashboard, CRM, WhatsApp, Disparo Simples
Premium:    + Disparo com IA, Extração Limitada  
Enterprise: + Agentes IA, Vector Store, Usuários, Extração Ilimitada
```

### APIs Integradas
- **OpenAI**: GPT + Vector Stores + Assistants
- **Google Gemini**: Modelo alternativo de IA
- **Evolution API**: WhatsApp Business
- **Profile API**: Dados de crédito e negativação
- **ElevenLabs**: Síntese de voz
- **FireCrawl**: Web scraping

## 💳 Tipos de Consulta

- **Consulta Básica**: R$ 30,00 - Verificação básica de dívidas
- **Consulta Rating**: R$ 199,00 - Análise completa de crédito

## 📚 Documentação

- [🚀 Deploy Portainer](PORTAINER-DEPLOY.md) - Configuração de produção
- [🤖 Claude Code](CLAUDE.md) - Configurações de desenvolvimento  
- [📊 Métricas](metricas_dashboard_crm_limpa_nome.md) - KPIs do sistema

## 🏗️ Estrutura do Projeto

```
dnx_recuperacao_credito/
├── app/                     # App Router (Next.js 14)
│   ├── agentes-ia/          # Gestão de agentes IA + Vector Store
│   ├── leads/               # CRM e pipeline de vendas
│   ├── extracao-leads/      # Extração via API Profile
│   ├── whatsapp/            # Gestão de instâncias WhatsApp
│   ├── configuracoes/       # Configurações do usuário
│   └── api/                 # API Routes
│       ├── vectorstores/    # APIs Vector Store
│       ├── whatsapp/        # APIs WhatsApp
│       └── extracoes/       # APIs extração Profile
├── components/              # Componentes React reutilizáveis
├── lib/                     # Configurações (Supabase, utils)
└── database/               # Schema SQL
```

## 🌐 URLs

- **Produção**: https://app.dnxplataformas.com.br
- **Desenvolvimento**: http://localhost:3000

## 🔐 Variáveis de Ambiente

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://enwxbkyvnrjderqdygtl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-token-supabase
SUPABASE_SERVICE_ROLE_KEY=seu-service-key

# Evolution API (WhatsApp)
DEFAULT_WHATSAPP_BASEURL=https://wsapi.dnmarketing.com.br

# Opcional - para desenvolvimento
DATABASE_URL=postgresql://usuario:senha@host:5432/database
```

---

**DNX Plataformas** - Tecnologia especializada em recuperação de crédito 🚀