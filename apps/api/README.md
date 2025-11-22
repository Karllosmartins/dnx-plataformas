# DNX API - Express Backend

API REST construída com Express.js para o DNX Plataformas CRM.

## 🚀 Quick Start

```bash
# Desenvolvimento
npm run dev:api

# Build
npm run build:api

# Produção
npm run start:api
```

## 📡 Endpoints

### Health Check
- `GET /api/health` - Status da API

### Autenticação
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/refresh` - Renovar access token
- `GET /api/auth/me` - Dados do usuário autenticado (requer auth)
- `POST /api/auth/logout` - Logout (requer auth)

### Leads
Todas as rotas de leads requerem autenticação via Bearer Token.

- `GET /api/leads` - Listar leads (paginação, filtros, busca)
- `GET /api/leads/:id` - Buscar lead por ID
- `POST /api/leads` - Criar novo lead
- `PUT /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Deletar lead
- `PUT /api/leads/:id/status` - Atualizar apenas o status

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação.

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha123"}'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "Nome do Usuário",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Usando o Token
```bash
curl -X GET http://localhost:3001/api/leads \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"SEU_REFRESH_TOKEN"}'
```

## 📊 Leads API

### Listar Leads
```bash
GET /api/leads?page=1&limit=20&status=novo&search=nome&sort=created_at&order=desc
```

**Query Parameters:**
- `page` - Número da página (default: 1)
- `limit` - Itens por página (default: 20, max: 100)
- `status` - Filtrar por status (novo, em_negociacao, proposta_enviada, fechado, perdido)
- `search` - Buscar em nome, email ou telefone
- `sort` - Campo para ordenação (default: created_at)
- `order` - Ordem (asc/desc, default: desc)

**Resposta:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

### Criar Lead
```bash
POST /api/leads
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11999999999",
  "cpf": "12345678900",
  "value": 5000.00,
  "status": "novo",
  "notes": "Cliente interessado"
}
```

### Atualizar Status
```bash
PUT /api/leads/123/status
Content-Type: application/json
Authorization: Bearer TOKEN

{
  "status": "em_negociacao"
}
```

**Status válidos:**
- `novo`
- `em_negociacao`
- `proposta_enviada`
- `fechado`
- `perdido`

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# API
API_PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_SECRET=sua-chave-secreta-super-segura

# Supabase
SUPABASE_URL=sua-url-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

## 🏗️ Arquitetura

```
apps/api/
├── src/
│   ├── server.ts           # Servidor Express principal
│   ├── routes/             # Definição de rotas
│   │   ├── auth.ts         # Rotas de autenticação
│   │   ├── leads.ts        # Rotas de leads
│   │   └── health.ts       # Health check
│   ├── middleware/         # Middlewares
│   │   └── auth.ts         # JWT authentication
│   ├── utils/              # Utilitários
│   │   ├── api-error.ts    # Classe de erro customizada
│   │   ├── api-response.ts # Respostas padronizadas
│   │   └── logger.ts       # Logger Pino
│   └── lib/                # Bibliotecas
│       └── supabase.ts     # Cliente Supabase
├── package.json
└── tsconfig.json
```

## 🛡️ Segurança

- **Helmet** - Headers de segurança HTTP
- **CORS** - Configurado para aceitar apenas origins autorizadas
- **JWT** - Tokens assinados com HS256
- **Bcrypt** - Hash de senhas com bcrypt
- **Rate Limiting** - (TODO: implementar)

## 📝 Logs

A API utiliza **Pino** para logs estruturados.

Em desenvolvimento, os logs são formatados com `pino-pretty`:
```
[19:51:45.572] INFO: API server running on http://localhost:3001
[19:52:07.659] INFO: request completed
    req: { method: "GET", url: "/api/health" }
    res: { statusCode: 200 }
    responseTime: 4
```

Em produção, logs são em JSON para melhor processamento.

## 🐳 Docker

A API está configurada no `docker-compose.monorepo.yml`:

```yaml
services:
  dnx-api:
    image: node:18-alpine
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - API_PORT=3001
```

## 🚧 Próximos Passos

- [ ] Migrar rotas de WhatsApp
- [ ] Migrar rotas de Arquivos
- [ ] Migrar rotas de Datecode
- [ ] Implementar rate limiting
- [ ] Adicionar validação com Zod
- [ ] Implementar testes (Jest)
- [ ] Documentação OpenAPI/Swagger
- [ ] Webhook handlers
- [ ] Notificações em tempo real (WebSockets)

## 📄 Licença

Propriedade de DNX Plataformas.
