# Instruções para Executar a Migration no Supabase

## Opção 1: Via Interface Web do Supabase (Recomendado)

1. **Acesse o Painel do Supabase**
   - URL: https://supabase.com/dashboard/project/enwxbkyvnrjderqdygtl
   - Faça login com suas credenciais

2. **Navegue até o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "+ New Query"

3. **Cole o SQL da Migration**
   - Abra o arquivo: `apps/api/migrations/001_create_workspaces.sql`
   - Copie todo o conteúdo
   - Cole no editor SQL do Supabase

4. **Execute a Migration**
   - Clique no botão "Run" (ou pressione Ctrl+Enter)
   - Aguarde a execução completar
   - Verifique se não há erros

5. **Verifique as Tabelas Criadas**
   - No menu lateral, clique em "Table Editor"
   - Você deve ver as novas tabelas:
     - `workspaces`
     - `workspace_members`
   - Na tabela `users`, deve haver uma nova coluna: `current_workspace_id`

## Opção 2: Via Supabase CLI

### Pré-requisitos
1. Ter o Supabase CLI instalado
2. Estar autenticado com `npx supabase login`
3. Ter linkado o projeto com `npx supabase link --project-ref enwxbkyvnrjderqdygtl`

### Executar Migration
```bash
# Criar diretório de migrations se não existir
npx supabase init

# Copiar migration para o local correto
copy apps\api\migrations\001_create_workspaces.sql supabase\migrations\20251122000000_create_workspaces.sql

# Executar migration
npx supabase db push
```

## Opção 3: Via PostgreSQL Client (Avançado)

Se você tiver acesso direto ao banco de dados PostgreSQL:

```bash
# Instalar pg globalmente se não tiver
npm install -g pg

# Executar migration
psql "postgresql://postgres:[YOUR_PASSWORD]@db.enwxbkyvnrjderqdygtl.supabase.co:5432/postgres" -f apps/api/migrations/001_create_workspaces.sql
```

## Verificação Pós-Migration

Após executar a migration, verifique se tudo foi criado corretamente:

### Via SQL Editor do Supabase
```sql
-- Verificar se as tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workspaces', 'workspace_members');

-- Verificar estrutura da tabela workspaces
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workspaces'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela workspace_members
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workspace_members'
ORDER BY ordinal_position;

-- Verificar se current_workspace_id foi adicionado em users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'current_workspace_id';

-- Verificar índices criados
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('workspaces', 'workspace_members', 'users')
  AND indexname LIKE 'idx_%';

-- Verificar RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('workspaces', 'workspace_members');
```

## Possíveis Erros e Soluções

### Erro: "relation already exists"
- **Causa**: As tabelas já foram criadas anteriormente
- **Solução**: Verificar se as tabelas existem e se estão corretas. Se necessário, dropar e recriar.

### Erro: "permission denied"
- **Causa**: Usuário não tem permissões suficientes
- **Solução**: Usar o service_role_key ou executar como postgres user

### Erro: "column already exists"
- **Causa**: A coluna `current_workspace_id` já existe em `users`
- **Solução**: Verificar se a coluna está correta. O SQL usa `ADD COLUMN IF NOT EXISTS`, então não deveria dar erro.

## Próximos Passos

Após executar a migration com sucesso:

1. **Criar um workspace inicial**
   ```sql
   INSERT INTO workspaces (name, slug, plano_id)
   VALUES ('Workspace Padrão', 'default', 1);
   ```

2. **Associar usuários existentes ao workspace**
   ```sql
   -- Pegar o ID do workspace criado
   WITH ws AS (
     SELECT id FROM workspaces WHERE slug = 'default' LIMIT 1
   )
   -- Adicionar todos os usuários como members
   INSERT INTO workspace_members (workspace_id, user_id, role)
   SELECT ws.id, u.id, 'member'
   FROM users u, ws
   WHERE NOT EXISTS (
     SELECT 1 FROM workspace_members wm
     WHERE wm.user_id = u.id AND wm.workspace_id = ws.id
   );

   -- Definir workspace padrão para usuários
   UPDATE users u
   SET current_workspace_id = (SELECT id FROM workspaces WHERE slug = 'default' LIMIT 1)
   WHERE current_workspace_id IS NULL;
   ```

3. **Testar as RLS policies**
   - Fazer login como um usuário
   - Tentar acessar workspaces e workspace_members
   - Verificar se apenas os dados do workspace do usuário são retornados
