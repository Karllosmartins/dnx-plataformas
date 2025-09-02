# 🚀 Guia de Deploy - DNX Plataformas CRM

## 📋 Pré-requisitos

### No servidor VPS:
- [x] Docker instalado
- [x] Docker Compose instalado
- [x] Traefik configurado (para SSL automático)
- [x] Domínio `app.dnmarketing.com.br` apontado para o servidor

## 🔧 Configuração

### 1. Configurar variáveis de ambiente
```bash
cp .env.example .env.production
```

### ⚠️ **Variáveis obrigatórias**:
```bash
DATABASE_URL="postgresql://postgres:8W0KemHchTqSBcgi@enwxbkyvnrjderqdygtl.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://enwxbkyvnrjderqdygtl.supabase.co
NEXTAUTH_URL=https://app.dnmarketing.com.br
```

### 2. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🌐 Acesso
- **Produção**: https://app.dnmarketing.com.br
- **SSL**: Automático via Traefik
