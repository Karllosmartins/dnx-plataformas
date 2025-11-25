-- Migration 003: Migrar configuracoes_credenciais para usar workspace_id
-- Data: 2025-11-24
-- Descrição: Mover configurações de user_id para workspace_id para consistência multi-tenant

-- =====================================================
-- ETAPA 1: Adicionar coluna workspace_id
-- =====================================================

-- Adicionar coluna workspace_id (nullable inicialmente)
ALTER TABLE configuracoes_credenciais
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- =====================================================
-- ETAPA 2: Migrar dados existentes
-- =====================================================

-- Migrar configurações existentes para o workspace atual do usuário
UPDATE configuracoes_credenciais cc
SET workspace_id = u.current_workspace_id
FROM users u
WHERE cc.user_id = u.id
  AND u.current_workspace_id IS NOT NULL;

-- Para usuários sem workspace, criar um workspace automaticamente
DO $$
DECLARE
  user_record RECORD;
  new_workspace_id UUID;
BEGIN
  FOR user_record IN
    SELECT DISTINCT cc.user_id, u.name, u.email
    FROM configuracoes_credenciais cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.workspace_id IS NULL
  LOOP
    -- Criar workspace para o usuário
    INSERT INTO workspaces (name, slug, plano_id, created_at, updated_at)
    VALUES (
      user_record.name || '''s Workspace',
      LOWER(REGEXP_REPLACE(user_record.name || '-' || user_record.user_id, '[^a-zA-Z0-9-]', '', 'g')),
      1, -- Plano básico por padrão
      NOW(),
      NOW()
    )
    RETURNING id INTO new_workspace_id;

    -- Associar usuário ao workspace como owner
    INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
    VALUES (new_workspace_id, user_record.user_id, 'owner', NOW());

    -- Atualizar current_workspace_id do usuário
    UPDATE users
    SET current_workspace_id = new_workspace_id
    WHERE id = user_record.user_id;

    -- Atualizar configuração
    UPDATE configuracoes_credenciais
    SET workspace_id = new_workspace_id
    WHERE user_id = user_record.user_id;

    RAISE NOTICE 'Criado workspace % para usuário %', new_workspace_id, user_record.user_id;
  END LOOP;
END $$;

-- =====================================================
-- ETAPA 3: Tornar workspace_id obrigatório
-- =====================================================

-- Agora que todos têm workspace_id, tornar NOT NULL
ALTER TABLE configuracoes_credenciais
ALTER COLUMN workspace_id SET NOT NULL;

-- =====================================================
-- ETAPA 4: Atualizar constraints e índices
-- =====================================================

-- Remover constraint unique antiga (user_id)
ALTER TABLE configuracoes_credenciais
DROP CONSTRAINT IF EXISTS unique_user_config;

-- Adicionar nova constraint unique (workspace_id)
-- Permitir múltiplas configurações por workspace (uma por instância)
-- Se quiser apenas uma config por workspace, use: unique (workspace_id)
-- Se quiser múltiplas configs, use: unique (workspace_id, instancia)
ALTER TABLE configuracoes_credenciais
ADD CONSTRAINT unique_workspace_config UNIQUE (workspace_id, instancia);

-- Remover índice antigo de user_id
DROP INDEX IF EXISTS idx_config_user_id;

-- Adicionar índice para workspace_id
CREATE INDEX IF NOT EXISTS idx_config_workspace_id
ON configuracoes_credenciais USING btree (workspace_id);

-- Manter índice de instancia (já existe)
-- CREATE INDEX IF NOT EXISTS idx_config_instancia ON configuracoes_credenciais(instancia);

-- =====================================================
-- ETAPA 5: (OPCIONAL) Remover coluna user_id
-- =====================================================

-- IMPORTANTE: Manter user_id por enquanto para compatibilidade
-- Descomentar após garantir que todo código foi atualizado
-- ALTER TABLE configuracoes_credenciais DROP COLUMN IF EXISTS user_id;

-- =====================================================
-- ETAPA 6: Atualizar comentários
-- =====================================================

COMMENT ON COLUMN configuracoes_credenciais.workspace_id IS
'ID do workspace - cada workspace tem suas próprias configurações';

COMMENT ON COLUMN configuracoes_credenciais.user_id IS
'[DEPRECATED] Mantido por compatibilidade. Usar workspace_id';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  configs_sem_workspace INTEGER;
BEGIN
  SELECT COUNT(*) INTO configs_sem_workspace
  FROM configuracoes_credenciais
  WHERE workspace_id IS NULL;

  IF configs_sem_workspace > 0 THEN
    RAISE EXCEPTION 'Migration falhou: % configurações sem workspace_id', configs_sem_workspace;
  ELSE
    RAISE NOTICE '✅ Migration 003 concluída com sucesso!';
    RAISE NOTICE 'Total de configurações migradas: %', (SELECT COUNT(*) FROM configuracoes_credenciais);
  END IF;
END $$;
