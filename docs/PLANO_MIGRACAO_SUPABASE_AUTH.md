# Plano: Migração para Supabase Auth + Notificação de Usuários + Reset de Senha

## Decisões do Usuário
- **Login**: Migrar TUDO para Supabase Auth
- **Senha de novos usuários**: Usuário define própria senha (recebe link por email)

## Objetivo
Implementar:
1. Migrar sistema de autenticação completo para Supabase Auth
2. Envio de email automático quando admin cria novo usuário
3. Funcionalidade "Esqueci minha senha" com link de reset

## Situação Atual

### Autenticação
- Sistema próprio com bcrypt + JWT
- Senhas hasheadas com bcrypt (10 rounds)
- Tokens armazenados em localStorage
- Sem envio de emails
- Sem funcionalidade de reset de senha

### Arquivos Principais
- `app/api/admin/users/route.ts` - Criação de usuários
- `app/api/auth/login/route.ts` - Login
- `lib/auth-utils.ts` - Verificação JWT
- `middleware.ts` - Proteção de rotas
- `components/layout/LoginForm.tsx` - UI de login

---

## Abordagem Escolhida: Supabase Auth

### Por que Supabase Auth?
- Já usa Supabase como banco de dados
- Sistema de email integrado (convite, reset, confirmação)
- Tokens seguros e gerenciados automaticamente
- Templates de email customizáveis no dashboard
- Menos código para manter

### Estratégia de Migração
**Abordagem híbrida**: Manter tabela `users` atual + sincronizar com `auth.users`

Isso permite:
- Não quebrar o sistema existente
- Migração gradual
- Manter campos customizados (cpf, telefone, plano, etc.)

---

## Etapas de Implementação

### Fase 1: Configuração do Supabase Auth

#### 1.1 Configurar Templates de Email no Supabase Dashboard
- Acessar: Dashboard > Authentication > Email Templates
- Customizar templates em português:
  - **Invite** (convite para novo usuário)
  - **Reset Password** (esqueci minha senha)
  - **Confirm Email** (confirmação de email)

#### 1.2 Configurar URL de Redirecionamento
- Dashboard > Authentication > URL Configuration
- Site URL: `https://seudominio.com`
- Redirect URLs: `https://seudominio.com/auth/callback`

---

### Fase 2: Criar Páginas de Reset de Senha

#### 2.1 Página "Esqueci minha senha"
**Arquivo**: `app/esqueci-senha/page.tsx`

```
Funcionalidade:
- Campo de email
- Botão "Enviar link de recuperação"
- Chama supabase.auth.resetPasswordForEmail()
- Mostra mensagem de sucesso
```

#### 2.2 Página "Redefinir senha"
**Arquivo**: `app/auth/callback/page.tsx`

```
Funcionalidade:
- Recebe token da URL (Supabase redireciona aqui)
- Formulário para nova senha
- Chama supabase.auth.updateUser({ password })
- Redireciona para login
```

#### 2.3 Link na tela de login
**Arquivo**: `components/layout/LoginForm.tsx`

```
Adicionar:
- Link "Esqueci minha senha" abaixo do formulário
- Redireciona para /esqueci-senha
```

---

### Fase 3: Modificar Criação de Usuários

#### 3.1 Atualizar API de criação
**Arquivo**: `app/api/admin/users/route.ts`

```
Mudanças:
1. Usar supabase.auth.admin.createUser() em vez de INSERT direto
2. Opção para enviar email de convite automaticamente
3. Sincronizar com tabela users existente
```

**Fluxo novo**:
```
1. Admin cria usuário via UI
2. API chama supabase.auth.admin.createUser({
     email,
     password, // opcional - pode deixar vazio para forçar reset
     email_confirm: true,
     user_metadata: { name, role }
   })
3. Supabase cria em auth.users + envia email de convite
4. Trigger sincroniza para tabela public.users
5. API adiciona campos extras (cpf, telefone, workspace)
```

#### 3.2 Criar trigger de sincronização
**Migration SQL**:

```sql
-- Função para sincronizar auth.users -> public.users
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    true,
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger após criar usuário no auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_user();
```

---

### Fase 4: Atualizar Login

#### 4.1 Modificar API de login
**Arquivo**: `app/api/auth/login/route.ts`

```
Migração completa:
- Usar supabase.auth.signInWithPassword()
- Retornar session tokens do Supabase
```

#### 4.2 Middleware
**Arquivo**: `middleware.ts`

```
Mudanças:
- Verificar session do Supabase Auth
- Manter compatibilidade com JWT atual durante transição
```

---

### Fase 5: UI de Administração

#### 5.1 Atualizar formulário de criar usuário
**Arquivo**: `app/usuarios/page.tsx` ou `app/configuracoes-admin/`

```
Mudanças:
- Remover campo senha (usuário define própria)
- Mostrar mensagem: "Usuário receberá email para definir senha"
- Mensagem de confirmação após criar
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `app/esqueci-senha/page.tsx` | Página para solicitar reset |
| `app/auth/callback/page.tsx` | Página para definir nova senha |
| `app/auth/callback/route.ts` | API para processar callback |

### Arquivos a Modificar
| Arquivo | Mudança |
|---------|---------|
| `app/api/admin/users/route.ts` | Usar Supabase Auth para criar usuários |
| `app/api/auth/login/route.ts` | Usar Supabase Auth signInWithPassword |
| `components/layout/LoginForm.tsx` | Adicionar link "Esqueci senha" |
| `middleware.ts` | Suportar session do Supabase |
| `lib/supabase.ts` | Adicionar cliente auth se necessário |

### Migrations SQL
| Migration | Descrição |
|-----------|-----------|
| `sync_auth_users.sql` | Trigger para sincronizar auth.users -> users |

---

## Configurações Necessárias

### Supabase Dashboard
1. **Authentication > Providers**: Habilitar Email
2. **Authentication > Email Templates**: Customizar em português
3. **Authentication > URL Configuration**: Configurar redirects

### Variáveis de Ambiente
```env
# Já existentes (manter)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Fluxos de Usuário

### Fluxo 1: Admin cria novo usuário (CONFIRMADO)
```
1. Admin acessa /usuarios
2. Clica em "Novo Usuário"
3. Preenche: nome, email, workspace, role
4. NÃO precisa definir senha
5. Clica "Criar"
6. Sistema:
   - Cria usuário no Supabase Auth (inviteUserByEmail)
   - Supabase envia email de convite automaticamente
   - Trigger sincroniza com tabela public.users
7. Usuário recebe email: "Você foi convidado para DNX Plataformas"
8. Usuário clica no link → /auth/callback
9. Usuário define sua própria senha
10. Redireciona para /login
11. Usuário faz login com email + senha que definiu
```

### Fluxo 2: Usuário esqueceu senha
```
1. Usuário acessa /login
2. Clica em "Esqueci minha senha"
3. Informa email
4. Sistema envia link de reset via Supabase
5. Usuário recebe email
6. Clica no link → /auth/callback?token=...
7. Define nova senha
8. Redireciona para login
9. Faz login com nova senha
```

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Usuários existentes sem auth.users | Script de migração para criar auth.users para todos |
| Senhas bcrypt não funcionam com Supabase | Manter fallback bcrypt durante transição |
| Emails não chegam | Configurar SPF/DKIM no domínio |
| Tokens expirando | Configurar refresh automático |

---

## Checklist de Implementação (ordem recomendada)

1. [ ] **Configurar Supabase Dashboard** (manual)
   - Templates de email em português
   - URLs de redirecionamento
   - Habilitar provider Email

2. [ ] **Migration: Adicionar coluna auth_id na tabela users**
   - Permite vincular users com auth.users

3. [ ] **Criar trigger de sincronização**
   - auth.users → public.users

4. [ ] **Script de migração de usuários existentes**
   - Criar entrada em auth.users para cada usuário atual

5. [ ] **Criar páginas de autenticação**
   - `/esqueci-senha` - solicitar reset
   - `/auth/callback` - definir nova senha

6. [ ] **Modificar criação de usuários**
   - Usar `inviteUserByEmail()`
   - Remover campo senha do formulário

7. [ ] **Modificar login**
   - Usar `signInWithPassword()`
   - Atualizar armazenamento de sessão

8. [ ] **Atualizar middleware**
   - Verificar sessão Supabase
   - Manter compatibilidade

9. [ ] **Testar fluxos completos**
   - Criar usuário → receber email → definir senha → login
   - Esqueci senha → email → redefinir → login

10. [ ] **Remover código legado** (após validação)

---

## Estimativa de Complexidade

| Componente | Complexidade |
|------------|--------------|
| Páginas de reset senha | Baixa |
| Migration SQL | Baixa |
| Modificar criação usuários | Média |
| Modificar login | Alta |
| Configuração Supabase | Baixa (manual) |
