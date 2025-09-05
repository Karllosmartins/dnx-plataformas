# 🔐 Deploy Seguro - DNX Plataformas

## ⚠️ Segurança de Credenciais

Este projeto usa **duas versões** do docker-compose para Portainer:

### 📁 Arquivos de Deploy

```
docker-compose.portainer.yml       ✅ TEMPLATE (vai pro GitHub)
docker-compose.portainer.local.yml ❌ COM CREDENCIAIS (só local)
```

## 🚀 Como Fazer Deploy

### 1. **No Desenvolvimento Local**
Use sempre a versão `.local.yml`:
```bash
# Arquivo já contém suas credenciais reais
docker-compose -f docker-compose.portainer.local.yml up
```

### 2. **No Portainer (Produção)**
1. **Copie o conteúdo** do arquivo `docker-compose.portainer.local.yml`
2. **Cole no Portainer** → Create Stack → Web Editor
3. **Deploy** da stack

### 3. **Para Outros Desenvolvedores**
1. Baixem o template `docker-compose.portainer.yml`
2. Substituam os placeholders pelas credenciais reais:
   ```yaml
   # SUBSTITUIR:
   - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   - SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
   - DATABASE_URL=postgresql://postgres:your-password@your-project.supabase.co:5432/postgres
   
   # POR:
   - NEXT_PUBLIC_SUPABASE_URL=https://enwxbkyvnrjderqdygtl.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI... (sua chave real)
   - SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI... (sua service key real)  
   - DATABASE_URL=postgresql://postgres:8W0Kem... (sua URL real)
   ```
3. Salvem como `docker-compose.portainer.local.yml`

## 🛡️ Proteções Implementadas

### ✅ O que ESTÁ seguro:
- Template sem credenciais no GitHub
- Arquivo local ignorado pelo Git (`.gitignore`)
- Credenciais reais apenas localmente

### ❌ O que NÃO fazer:
- ❌ Nunca commitar o arquivo `.local.yml`
- ❌ Nunca colocar credenciais reais no GitHub
- ❌ Nunca compartilhar credenciais em chats/emails

## 🔄 Fluxo de Trabalho

```mermaid
graph TD
    A[Desenvolver] --> B[Usar .local.yml]
    B --> C[Testar Local]
    C --> D[Commit Template]
    D --> E[Push GitHub]
    E --> F[Deploy Portainer]
    F --> G[Copiar .local.yml]
```

## 🆘 Em Caso de Vazamento

Se credenciais vazarem no GitHub:
1. **Imediatamente** rodar pelo Supabase:
   - Regenerar Service Role Key
   - Regenerar Anon Key (se necessário)
2. **Atualizar** arquivo local com novas credenciais
3. **Redeployar** aplicação

## 📚 Documentação Relacionada

- [DEPLOY.md](DEPLOY.md) - Deploy básico
- [PORTAINER-DEPLOY.md](PORTAINER-DEPLOY.md) - Deploy detalhado
- [README.md](README.md) - Documentação geral

---

**Lembre-se:** Segurança em primeiro lugar! 🔐