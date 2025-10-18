# 🚀 Business Man - Plataforma Multinegocios Inteligente

<div align="center">

![Business Man](https://img.shields.io/badge/Business%20Man-Plataforma%20Inteligente-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green?style=for-the-badge&logo=supabase)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=openai)

**Plataforma completa de gestão multinegocios com inteligência artificial e análise de dados avançada**

[Documentação](#-documentação) • [Recursos](#-recursos-principais) • [Instalação](#-instalação) • [Tecnologias](#-tecnologias)

</div>

---

## 📋 Sobre o Projeto

**Business Man** é uma plataforma SaaS completa para gestão de múltiplos tipos de negócios, integrando **Inteligência Artificial**, **Análise de Dados** e **Automação de Processos** em um único ecossistema.

### 🎯 Visão Geral

Projetada para empresas que gerenciam diferentes verticais de negócio, a plataforma oferece:

- 🤖 **Agentes de IA Especializados** - Automação inteligente de processos
- 📊 **Inteligência de Dados** - Consulta e enriquecimento via Datecode API
- 💼 **Multinegocios** - Suporte a diversos tipos de negócio simultaneamente
- 📱 **Integração WhatsApp** - Comunicação automatizada via Evolution API
- 🔐 **Gestão Multiusuário** - Sistema de permissões e planos flexíveis
- 📈 **Analytics Avançado** - Dashboards e relatórios em tempo real

---

## ✨ Recursos Principais

### 🤖 Agentes de Inteligência Artificial

- **Agentes Conversacionais**: Atendimento automatizado via WhatsApp
- **Processamento de Linguagem Natural**: Compreensão de contexto e intenções
- **Integração OpenAI/Gemini**: Suporte para múltiplos modelos de IA
- **Raciocínio Avançado**: Reasoning effort configurável por usuário
- **Memory & Context**: Manutenção de contexto em conversas longas

### 📊 Inteligência de Dados

#### Consulta e Enriquecimento (Datecode API)

- ✅ **Consulta por CPF/CNPJ** - Validação e enriquecimento de dados cadastrais
- ✅ **Consulta por Telefone** - Pesquisa inversa de telefones
- ✅ **Consulta por Email** - Validação e descoberta de proprietários
- ✅ **Consulta por Placa** - Pesquisa de proprietários de veículos
- ✅ **Consulta por Nome + Localização** - Busca avançada com geolocalização
- ✅ **Credenciais por Usuário** - Cada usuário pode ter suas próprias credenciais
- ✅ **Fallback Inteligente** - Sistema de credenciais com fallback automático

### 💼 Gestão Multinegocios

#### Tipos de Negócio Suportados

- 🏠 **Imóveis** - Gestão de leads imobiliários
- 🚗 **Veículos** - Leads e consultas automotivas
- 💳 **Recuperação de Crédito** - Gestão de dívidas e acordos
- 📚 **Educação** - Leads educacionais e cursos
- 🏥 **Saúde** - Agendamentos e leads médicos
- 🛍️ **Varejo** - E-commerce e vendas
- ⚖️ **Jurídico** - Gestão de clientes e processos
- 💰 **Financeiro** - Investimentos e consultorias
- 🏢 **Empresarial** - Serviços B2B
- ✨ **Personalizado** - Tipos customizáveis

#### Sistema de Planos

| Plano | Leads/mês | Consultas/mês | Instâncias WhatsApp | Recursos |
|-------|-----------|---------------|---------------------|----------|
| **Básico** | 1.000 | 100 | 1 | Essencial |
| **Premium** | 10.000 | 1.000 | 3 | Avançado |
| **Enterprise** | Ilimitado | Ilimitado | Ilimitado | Completo |

### 📱 Integrações

#### WhatsApp Evolution API

- ✅ Múltiplas instâncias por usuário
- ✅ Envio de mensagens automatizadas
- ✅ Webhooks para recebimento de mensagens
- ✅ Suporte a mídia (imagens, vídeos, documentos)
- ✅ QR Code para autenticação

#### Supabase

- ✅ Autenticação e autorização
- ✅ Banco de dados PostgreSQL
- ✅ Storage para arquivos
- ✅ Realtime subscriptions
- ✅ Row Level Security (RLS)

#### Outras Integrações

- **Google Calendar** - Agendamentos e eventos
- **Asaas** - Pagamentos e cobranças
- **ZapSign** - Assinaturas digitais
- **ElevenLabs** - Síntese de voz
- **FireCrawl** - Web scraping inteligente
- **Backblaze B2** - Storage de arquivos

### 🔐 Segurança e Permissões

- **Autenticação JWT** - Sistema seguro de autenticação
- **Role-Based Access Control (RBAC)** - Controle granular de permissões
- **Credenciais Criptografadas** - Armazenamento seguro de API keys
- **Rate Limiting** - Proteção contra abuso de APIs
- **Audit Logs** - Rastreamento de ações do usuário

### 📈 Analytics e Relatórios

- **Dashboard em Tempo Real** - Métricas e KPIs atualizados
- **Relatórios Customizados** - Geração de relatórios por período
- **Exportação de Dados** - Excel, CSV, PDF
- **Visualizações Avançadas** - Gráficos e tabelas interativas
- **Análise de Performance** - Acompanhamento de conversões

---

## 🛠️ Tecnologias

### Frontend

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Recharts** - Gráficos e visualizações
- **Lucide Icons** - Iconografia moderna
- **XLSX/Papa Parse** - Processamento de planilhas

### Backend

- **Next.js API Routes** - Endpoints serverless
- **Supabase Client** - Cliente PostgreSQL
- **Fetch API** - Requisições HTTP

### Database

- **PostgreSQL (Supabase)** - Banco de dados relacional
- **Row Level Security** - Segurança em nível de linha
- **Views Materializadas** - Performance otimizada
- **JSONB** - Armazenamento de dados flexíveis

### IA e Machine Learning

- **OpenAI GPT-4** - Modelos de linguagem
- **Google Gemini** - IA conversacional
- **ElevenLabs** - Text-to-Speech
- **Custom Agents** - Agentes especializados

### DevOps

- **Git** - Controle de versão
- **Docker** - Containerização (opcional)
- **Vercel** - Deploy e hosting
- **GitHub Actions** - CI/CD (futuro)

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e npm/yarn
- Conta Supabase
- Credenciais das APIs externas (Datecode, OpenAI, etc.)

### Passo a Passo

#### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/business-man.git
cd business-man
```

#### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

#### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas configurações:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# NextAuth
NEXTAUTH_SECRET=sua_chave_secreta_super_segura
NEXTAUTH_URL=http://localhost:3000

# Datecode (Padrão - usuários podem ter suas próprias)
DATECODE_USERNAME=seu_usuario_datecode
DATECODE_PASSWORD=sua_senha_datecode

# Backblaze B2
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET_NAME=seu-bucket
B2_KEY_ID=sua_key_id
B2_APPLICATION_KEY=sua_application_key
```

#### 4. Configure o banco de dados

Execute as migrations na ordem:

```bash
# 1. Estrutura básica
psql -h seu-host -U postgres -d seu-database -f database/schema.sql

# 2. Sistema de planos
psql -h seu-host -U postgres -d seu-database -f database/migration_sistema_planos_v2.sql

# 3. Credenciais Datecode
psql -h seu-host -U postgres -d seu-database -f database/migration_add_datecode_credentials.sql

# Ou use o Supabase SQL Editor para executar os arquivos
```

#### 5. Execute o projeto

```bash
npm run dev
# ou
yarn dev
```

Acesse `http://localhost:3000` 🎉

---

## 📖 Documentação

### Documentação Técnica

- **[Sistema de Planos e Permissões](docs/IMPLEMENTACAO_SISTEMA_PLANOS_PERMISSOES.md)** - Guia completo do sistema de planos
- **[Credenciais Datecode](docs/IMPLEMENTACAO_CREDENCIAIS_DATECODE.md)** - Implementação de credenciais por usuário
- **[Opções de Consulta Datecode](docs/OPCOES_CONSULTA_DATECODE.md)** - Guia de consultas (CPF, telefone, email, etc.)
- **[Sistema de Extração de Leads](docs/IMPLEMENTACAO_SISTEMA_EXTRACAO_LEADS.md)** - Processamento de arquivos Excel
- **[Sistema de Integrações](docs/IMPLEMENTACAO_SISTEMA_INTEGRACOES.md)** - Integrações externas
- **[Sistema de Arquivos](docs/IMPLEMENTACAO_SISTEMA_ARQUIVOS.md)** - Gestão de uploads

### API Endpoints

#### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/logout` - Logout

#### Consultas Datecode
- `POST /api/datecode/consulta` - Consulta completa (CPF, telefone, email, placa, nome)
- `POST /api/datecode` - Consulta CNPJ
- `POST /api/datecode/cpf` - Consulta CPF

#### Leads
- `GET /api/leads` - Listar leads
- `POST /api/leads` - Criar lead
- `PUT /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Excluir lead
- `POST /api/leads/import` - Importar leads de Excel

#### Usuários (Admin)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `GET /api/users/limits` - Verificar limites

---

## 📁 Estrutura do Projeto

```
business-man/
├── app/                          # App Router (Next.js 15)
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticação
│   │   ├── datecode/             # Consultas Datecode
│   │   ├── leads/                # Gestão de leads
│   │   └── users/                # Gestão de usuários
│   ├── consulta/                 # Página de consultas
│   ├── leads/                    # Página de leads
│   ├── usuarios/                 # Gestão de usuários
│   ├── configuracoes-admin/      # Configurações admin
│   └── page.tsx                  # Dashboard
├── components/                   # Componentes React
│   ├── AuthWrapper.tsx           # Provider de autenticação
│   ├── Sidebar.tsx               # Menu lateral
│   ├── ExtracaoProgress.tsx      # Progresso de extração
│   └── PlanProtection.tsx        # Proteção por plano
├── lib/                          # Bibliotecas e utilitários
│   ├── supabase.ts               # Cliente Supabase
│   ├── permissions.ts            # Sistema de permissões
│   ├── datecode.ts               # Helper Datecode
│   └── plans.ts                  # Definições de planos
├── database/                     # Migrations SQL
│   ├── schema.sql                # Esquema base
│   ├── migration_sistema_planos_v2.sql
│   ├── migration_add_datecode_credentials.sql
│   └── seed_data.sql             # Dados iniciais
├── docs/                         # Documentação
│   ├── IMPLEMENTACAO_SISTEMA_PLANOS_PERMISSOES.md
│   ├── IMPLEMENTACAO_CREDENCIAIS_DATECODE.md
│   ├── OPCOES_CONSULTA_DATECODE.md
│   └── ...
├── public/                       # Arquivos públicos
├── .env.example                  # Exemplo de variáveis
├── next.config.js                # Configuração Next.js
├── tailwind.config.js            # Configuração Tailwind
├── tsconfig.json                 # Configuração TypeScript
└── package.json                  # Dependências
```

---

## 🎨 Capturas de Tela

### Dashboard Principal
*Dashboard com métricas em tempo real e gráficos de performance*

### Consulta Inteligente
*Interface de consulta com múltiplos critérios de busca*

### Gestão de Leads
*Tabela avançada com filtros e exportação*

### Configurações Admin
*Painel administrativo completo*

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

© 2025 DNX Plataformas - Business Man

---

## 👥 Equipe

**Desenvolvido por DNX Plataformas**

- **Arquitetura e Backend**: Sistema de planos, credenciais e integrações
- **Frontend**: Interface moderna com Next.js e Tailwind
- **IA e Automação**: Agentes inteligentes e processamento de dados
- **DevOps**: Infraestrutura e deploy

---

## 🆘 Suporte

Para dúvidas, problemas ou sugestões:

- 📧 Email: suporte@dnxplataformas.com.br
- 💬 WhatsApp: (11) 9xxxx-xxxx
- 📚 Documentação: `/docs`

---

## 🗺️ Roadmap

### Em Desenvolvimento

- [ ] Sistema de notificações push
- [ ] App mobile (React Native)
- [ ] API pública com documentação Swagger
- [ ] Marketplace de integrações

### Futuro

- [ ] IA Predictive Analytics
- [ ] Análise de sentimento em conversas
- [ ] Integrações com ERPs
- [ ] Multi-idioma (i18n)
- [ ] White-label para parceiros

---

## ⭐ Agradecimentos

Agradecimentos especiais a todas as tecnologias e ferramentas que tornam este projeto possível:

- Next.js Team
- Supabase
- OpenAI
- Vercel
- E toda a comunidade open source

---

<div align="center">

**[⬆ Voltar ao topo](#-business-man---plataforma-multinegocios-inteligente)**

Feito com ❤️ por DNX Plataformas

</div>
