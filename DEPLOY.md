# 🚀 Deploy - DNX Plataformas CRM

Guia simplificado para deploy via Docker/Portainer.

## 📋 Pré-requisitos

### Servidor VPS
- ✅ Docker + Docker Compose
- ✅ Portainer configurado
- ✅ Traefik (SSL automático)
- ✅ Domínio: `app.dnxplataformas.com.br`

## 🔧 Deploy Rápido

### 1. Variáveis de Ambiente
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://enwxbkyvnrjderqdygtl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-token
SUPABASE_SERVICE_ROLE_KEY=seu-service-key

# App
NEXTAUTH_URL=https://app.dnxplataformas.com.br
DEFAULT_WHATSAPP_BASEURL=https://wsapi.dnmarketing.com.br
```

### 2. Docker Deploy
```bash
# Build e deploy
docker build -t dnx-crm .
docker run -d --name dnx-crm -p 3000:3000 dnx-crm
```

### 3. Via Portainer
1. Acesse Portainer Web UI
2. Create Stack → Docker Compose
3. Cole docker-compose.yml
4. Configure environment variables
5. Deploy Stack

## 🌐 URLs

- **Produção**: https://app.dnxplataformas.com.br
- **SSL**: Automático via Traefik
- **Portainer**: https://portainer.dnxplataformas.com.br

## 📚 Documentação Completa

Ver [PORTAINER-DEPLOY.md](PORTAINER-DEPLOY.md) para instruções detalhadas.
