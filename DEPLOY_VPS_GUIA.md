# 🚀 GUIA DE DEPLOY NA VPS - Reorganização Completa

> **Data**: 2025-11-21
> **Setup**: Docker Swarm + Portainer + Traefik
> **Versão**: Pós-reorganização com bcrypt

---

## ⚠️ ATENÇÃO: MUDANÇAS CRÍTICAS

A reorganização incluiu **mudanças de segurança** que requerem atenção:

1. ✅ Senhas agora usam **bcrypt** (antes: plain text)
2. ✅ JWT_SECRET é **obrigatório** em produção
3. ✅ Nova estrutura de components
4. ✅ Novos utilitários (logger, error handling)

---

## 📋 PASSO A PASSO COMPLETO

### PASSO 1: Adicionar JWT_SECRET ao docker-compose

Edite o arquivo `docker-compose.local.yml` e adicione a variável de ambiente:

```yaml
environment:
  # ... todas as outras variáveis existentes ...

  # ✨ NOVA VARIÁVEL OBRIGATÓRIA
  - JWT_SECRET=sua_chave_jwt_super_segura_aqui_mude_isso
```

**Gerar JWT_SECRET seguro**:
```bash
# No seu computador local ou na VPS
openssl rand -base64 32

# Resultado será algo como:
# xK7Hs9pQw3mF8vR2nY6tJ4cZ1bL5dE0aQwErTyUiOpAsD=
```

**Coloque no docker-compose**:
```yaml
- JWT_SECRET=xK7Hs9pQw3mF8vR2nY6tJ4cZ1bL5dE0aQwErTyUiOpAsD=
```

---

### PASSO 2: ⚠️ MIGRAR SENHAS EXISTENTES (CRÍTICO!)

**Problema**: Senhas no banco estão em **plain text**, mas código agora espera **bcrypt hash**.

**Opções**:

#### Opção A: Script de Migração via Supabase SQL Editor (RECOMENDADO)

1. Acesse Supabase: https://supabase.com/dashboard
2. Vá para seu projeto → SQL Editor
3. Execute este SQL:

```sql
-- Ver senhas atuais (para verificar se já não estão hasheadas)
SELECT id, email, LEFT(password, 4) as senha_inicio
FROM users
LIMIT 5;

-- Se as senhas NÃO começam com "$2b$", significa que são plain text
-- Neste caso, você tem 2 opções:

-- OPÇÃO 1: Resetar senhas de todos usuários (eles terão que redefinir)
UPDATE users
SET password = '$2b$10$placeholder_hash_invalido'
WHERE password NOT LIKE '$2b$%';

-- OPÇÃO 2: Você já sabe as senhas? Faça hash manualmente:
-- Use https://bcrypt-generator.com/ ou um script Node
-- Depois atualize manualmente cada usuário
```

#### Opção B: Criar Novo Usuário Admin para Teste

Se você quer apenas **testar o deploy** primeiro:

1. Deploy a aplicação
2. Acesse Supabase SQL Editor
3. Crie novo usuário com senha já hasheada:

```sql
-- Gere o hash da senha em: https://bcrypt-generator.com/
-- Exemplo: senha "Admin@123" vira "$2b$10$hash_longo..."

INSERT INTO users (name, email, password, role, active)
VALUES (
  'Admin Teste',
  'admin@teste.com',
  '$2b$10$SEU_HASH_AQUI',  -- Hash gerado no bcrypt-generator.com
  'admin',
  true
);
```

---

### PASSO 3: Fazer Deploy via Portainer

#### 3.1 - Atualizar docker-compose.local.yml

Certifique-se que tem a variável JWT_SECRET:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - HOSTNAME=0.0.0.0
  - JWT_SECRET=xK7Hs9pQw3mF8vR2nY6tJ4cZ1bL5dE0aQwErTyUiOpAsD=  # ← ADICIONE ESTA LINHA
  # ... resto das variáveis ...
```

#### 3.2 - Deploy no Portainer

1. **Acessar Portainer**: http://seu-portainer.com
2. **Ir para Stacks**
3. **Encontrar stack "dnx-plataformas"** (ou criar nova)
4. **Editar stack** e colar o conteúdo do `docker-compose.local.yml` atualizado
5. **Update the stack**

**Ou via CLI na VPS**:

```bash
# Conectar na VPS
ssh usuario@sua-vps

# Ir para diretório do projeto (se tiver)
cd /caminho/do/projeto

# Fazer pull do GitHub
git pull origin main

# Fazer deploy do stack
docker stack deploy -c docker-compose.local.yml dnx-plataformas

# Ou se já existir, atualizar
docker service update --force dnx-plataformas_dnx-plataformas-app
```

---

### PASSO 4: Monitorar o Deploy

#### Ver logs em tempo real:

```bash
# Ver logs do serviço
docker service logs -f dnx-plataformas_dnx-plataformas-app

# Ou via Portainer:
# Stacks → dnx-plataformas → Services → dnx-plataformas-app → Logs
```

**O que você deve ver nos logs**:

```
Checking app directory...
Installing git...
Cloning repository...
Copying files to app directory...
Installing dependencies...
   ✓ bcrypt         ← NOVA dependência
   ✓ pino           ← NOVA dependência
   ✓ pino-pretty    ← NOVA dependência
Building application...
✓ Compiled successfully
Starting application...
> next start
✓ Ready on http://0.0.0.0:3000
```

---

### PASSO 5: Verificar se Funcionou

#### 5.1 - Acessar a aplicação

```
https://app.dnxplataformas.com.br
```

#### 5.2 - Testar Login

**Se você migrou as senhas**:
- Use login/senha existente
- Deve funcionar normalmente

**Se você criou novo usuário**:
- Use o novo usuário criado no PASSO 2
- Email: admin@teste.com
- Senha: Admin@123 (ou a que você usou)

#### 5.3 - Verificar Console do Navegador

Pressione F12 → Console

**Não deve ter**:
- ❌ Erros de "JWT_SECRET not configured"
- ❌ Erros de bcrypt
- ❌ 401 Unauthorized (se login correto)

**Pode ter**:
- ⚠️ Warnings de React (normais)

---

### PASSO 6: Testes Completos

Depois que login funcionar, teste:

- [ ] ✅ Criar novo lead
- [ ] ✅ Acessar `/configuracoes-admin` (nova rota admin unificada)
- [ ] ✅ Fazer consulta Datecode
- [ ] ✅ WhatsApp (se configurado)
- [ ] ✅ Navegação entre páginas
- [ ] ✅ Logout e login novamente

---

## 🔧 TROUBLESHOOTING

### Problema 1: "Login não funciona"

**Sintoma**: Erro ao fazer login, mesmo com credenciais corretas

**Causa**: Senhas no banco ainda estão em plain text

**Solução**:
```sql
-- No Supabase SQL Editor
-- Verificar se senha está hasheada
SELECT email, LEFT(password, 4) FROM users WHERE email = 'seu@email.com';

-- Se retornar algo diferente de "$2b$", significa que não está hasheada
-- Crie novo usuário com senha hasheada ou migre as senhas
```

---

### Problema 2: "JWT_SECRET not configured"

**Sintoma**: Erro nos logs ou console

**Causa**: Falta variável de ambiente

**Solução**:
1. Adicione `JWT_SECRET` ao docker-compose.local.yml
2. Redeploy: `docker service update --force dnx-plataformas_dnx-plataformas-app`

---

### Problema 3: "Build failed" ou "npm install error"

**Sintoma**: Container não inicia, erro ao instalar dependências

**Causa**: Problema no GitHub ou cache

**Solução**:
```bash
# Forçar rebuild do container
docker service update --force dnx-plataformas_dnx-plataformas-app

# Ver logs detalhados
docker service logs dnx-plataformas_dnx-plataformas-app
```

---

### Problema 4: "Cannot find module bcrypt"

**Sintoma**: Erro ao iniciar aplicação

**Causa**: npm install não rodou corretamente

**Solução**:
```bash
# Verificar se bcrypt está no package.json no GitHub
# Se sim, forçar reinstall

docker service update --force dnx-plataformas_dnx-plataformas-app
```

---

### Problema 5: "Admin pages não carregam"

**Sintoma**: `/admin/planos` retorna 404

**Causa**: Páginas duplicadas foram removidas

**Solução**:
✅ Use a nova rota unificada: `/configuracoes-admin`

**Rotas antigas (removidas)**:
- ❌ `/admin/planos`
- ❌ `/admin/tipos-negocio`

**Nova rota (única)**:
- ✅ `/configuracoes-admin` (tem tudo em tabs)

---

## 📊 Verificação de Sucesso

Depois do deploy, você deve ter:

```
✅ Aplicação rodando em https://app.dnxplataformas.com.br
✅ Login funcionando com bcrypt
✅ JWT_SECRET configurado
✅ Logs estruturados com Pino
✅ Error handling padronizado
✅ Components reorganizados
✅ Admin pages em /configuracoes-admin
✅ Sem console.log de debug
```

---

## 🔄 ROLLBACK (Se necessário)

Se algo der muito errado:

```bash
# Na VPS
# Voltar para commit anterior (antes da reorganização)
git checkout d5b9cf9

# Redeploy
docker service update --force dnx-plataformas_dnx-plataformas-app

# Ver logs
docker service logs -f dnx-plataformas_dnx-plataformas-app
```

**Ou via Portainer**:
1. Editar stack
2. Mudar a linha do git clone para:
   ```
   git clone -b main https://github.com/Karllosmartins/dnx-plataformas.git /tmp/repo &&
   git checkout d5b9cf9 &&
   ```
3. Update stack

---

## 📝 CHECKLIST FINAL

Antes de considerar deploy completo:

- [ ] JWT_SECRET adicionado ao docker-compose.local.yml
- [ ] Senhas migradas para bcrypt OU novo usuário admin criado
- [ ] Stack deployed no Portainer
- [ ] Logs mostram "Compiled successfully"
- [ ] Aplicação acessível em https://app.dnxplataformas.com.br
- [ ] Login funciona
- [ ] Admin pages carregam em `/configuracoes-admin`
- [ ] Testes básicos passaram (criar lead, consulta, etc)

---

## 🎯 RESUMO DE COMANDOS

```bash
# 1. Gerar JWT_SECRET
openssl rand -base64 32

# 2. Na VPS - Ver logs
docker service logs -f dnx-plataformas_dnx-plataformas-app

# 3. Forçar redeploy
docker service update --force dnx-plataformas_dnx-plataformas-app

# 4. Ver status do serviço
docker service ps dnx-plataformas_dnx-plataformas-app

# 5. Rollback se necessário
git checkout d5b9cf9
docker service update --force dnx-plataformas_dnx-plataformas-app
```

---

## 📚 Documentação Adicional

- [REORGANIZACAO_COMPLETA.md](REORGANIZACAO_COMPLETA.md) - O que mudou
- [docs/ARQUITETURA_REORGANIZADA.md](docs/ARQUITETURA_REORGANIZADA.md) - Nova arquitetura
- [INDEX_REORGANIZACAO.md](INDEX_REORGANIZACAO.md) - Índice de documentos

---

**Criado**: 2025-11-21
**Última atualização**: 2025-11-21
**Status**: ✅ Pronto para deploy
