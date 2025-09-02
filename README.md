# 🏦 DNX Plataformas - CRM Limpa Nome

Sistema de CRM para recuperação de crédito e limpeza de nome com funil automatizado.

## 📊 Funcionalidades

- **Gestão de Leads**: Funil completo de novo lead até cliente fechado
- **WhatsApp Integration**: Automação via Evolution API
- **Controle de Consultas**: Pagamentos e relatórios de negativação
- **Multi-usuário**: Credenciais e configurações por usuário
- **Dashboard**: Métricas do funil de conversão (em desenvolvimento)

## 🔧 Tecnologias

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Evolution API (WhatsApp)

## 🚀 Deploy

Veja o arquivo `DEPLOY.md` para instruções completas de deployment.

**URL de Produção**: https://app.dnmarketing.com.br

## 📈 Funil CRM Limpa Nome

1. **Novo Lead** → **Qualificação**
2. **Qualificação** → **Pagamento Consulta**
3. **Pagamento** → **Consta Dívida** / **Não Consta Dívida**
4. **Consta Dívida** → **Enviado para Negociação**
5. **Negociação** → **Cliente Fechado**

## 💳 Tipos de Consulta

- **Consulta Básica**: R$ 30,00
- **Consulta Rating**: R$ 199,00

## 🏃‍♂️ Desenvolvimento

```bash
npm install
npm run dev
```

Acesse: `http://localhost:3000`

## 📋 Estrutura

```
├── app/                 # Páginas (App Router)
│   ├── leads/           # Gestão de leads
│   ├── configuracoes/   # Configurações do usuário
│   └── api/             # API routes
├── components/          # Componentes React
├── lib/                 # Configurações (Supabase, Evolution API)
├── database/            # Schema e seed data
├── Dockerfile           # Containerização
└── docker-compose.yml   # Orquestração
```

## 🗄️ Banco de Dados

- **users**: Usuários do sistema
- **configuracoes_credenciais**: APIs e configurações por usuário
- **leads**: Leads com funil completo
- **pagamentos_consultas**: Controle de pagamentos

## 🔐 Variáveis de Ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=https://enwxbkyvnrjderqdygtl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-supabase
DATABASE_URL=postgresql://...
DEFAULT_WHATSAPP_BASEURL=https://wsapi.dnmarketing.com.br
```