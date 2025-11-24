-- Migration 004: Migrar tabelas restantes para usar workspace_id
-- Data: 2025-11-24
-- Descrição: Adicionar workspace_id a todas as tabelas que ainda usam apenas user_id

-- =====================================================
-- TABELAS A MIGRAR:
-- - user_agent_vectorstore
-- - user_tools (se existir)
-- - whatsapp_instances (se ainda usar user_id)
-- - campanhas (se existir)
-- - arquivos (se existir)
-- - credencias_diversas (se existir)
-- =====================================================

-- =====================================================
-- ETAPA 1: user_agent_vectorstore
-- =====================================================

-- Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_agent_vectorstore') THEN

    -- Adicionar workspace_id se não existir
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'user_agent_vectorstore'
      AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE user_agent_vectorstore
      ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

      RAISE NOTICE '✅ Adicionada coluna workspace_id a user_agent_vectorstore';
    END IF;

    -- Migrar dados existentes
    UPDATE user_agent_vectorstore uav
    SET workspace_id = u.current_workspace_id
    FROM users u
    WHERE uav.user_id = u.id
      AND uav.workspace_id IS NULL
      AND u.current_workspace_id IS NOT NULL;

    -- Criar workspaces para registros sem workspace
    DECLARE
      record_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO record_count
      FROM user_agent_vectorstore
      WHERE workspace_id IS NULL;

      IF record_count > 0 THEN
        RAISE NOTICE 'Criando workspaces para % registros de user_agent_vectorstore', record_count;

        -- Criar workspace para cada usuário sem workspace
        INSERT INTO workspaces (name, slug, plano_id, created_at, updated_at)
        SELECT
          u.name || '''s Workspace',
          LOWER(REGEXP_REPLACE(u.name || '-' || u.id, '[^a-zA-Z0-9-]', '', 'g')),
          1, -- Plano básico
          NOW(),
          NOW()
        FROM (
          SELECT DISTINCT uav.user_id, u.name, u.id
          FROM user_agent_vectorstore uav
          JOIN users u ON uav.user_id = u.id
          WHERE uav.workspace_id IS NULL
            AND u.current_workspace_id IS NULL
        ) u
        ON CONFLICT (slug) DO NOTHING
        RETURNING id, slug;

        -- Atualizar registros
        UPDATE user_agent_vectorstore uav
        SET workspace_id = w.id
        FROM users u
        JOIN workspaces w ON w.slug = LOWER(REGEXP_REPLACE(u.name || '-' || u.id, '[^a-zA-Z0-9-]', '', 'g'))
        WHERE uav.user_id = u.id
          AND uav.workspace_id IS NULL;
      END IF;
    END;

    -- Tornar NOT NULL
    ALTER TABLE user_agent_vectorstore
    ALTER COLUMN workspace_id SET NOT NULL;

    -- Criar índice
    CREATE INDEX IF NOT EXISTS idx_user_agent_vectorstore_workspace_id
    ON user_agent_vectorstore USING btree (workspace_id);

    -- Atualizar comentário
    COMMENT ON COLUMN user_agent_vectorstore.workspace_id IS
    'ID do workspace - vectorstores são compartilhados no workspace';

    RAISE NOTICE '✅ Tabela user_agent_vectorstore migrada com sucesso';

  ELSE
    RAISE NOTICE 'ℹ️  Tabela user_agent_vectorstore não existe';
  END IF;
END $$;

-- =====================================================
-- ETAPA 2: user_tools
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tools') THEN

    -- Adicionar workspace_id se não existir
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'user_tools'
      AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE user_tools
      ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

      RAISE NOTICE '✅ Adicionada coluna workspace_id a user_tools';
    END IF;

    -- Migrar dados
    UPDATE user_tools ut
    SET workspace_id = u.current_workspace_id
    FROM users u
    WHERE ut.user_id = u.id
      AND ut.workspace_id IS NULL
      AND u.current_workspace_id IS NOT NULL;

    -- Para registros sem workspace, usar o workspace do usuário ou criar
    UPDATE user_tools ut
    SET workspace_id = (
      SELECT w.id
      FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = ut.user_id
      LIMIT 1
    )
    WHERE ut.workspace_id IS NULL;

    -- Tornar NOT NULL se possível
    DECLARE
      null_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO null_count
      FROM user_tools
      WHERE workspace_id IS NULL;

      IF null_count = 0 THEN
        ALTER TABLE user_tools
        ALTER COLUMN workspace_id SET NOT NULL;
        RAISE NOTICE '✅ workspace_id definido como NOT NULL em user_tools';
      ELSE
        RAISE WARNING 'Ainda existem % registros sem workspace_id em user_tools', null_count;
      END IF;
    END;

    -- Criar índice
    CREATE INDEX IF NOT EXISTS idx_user_tools_workspace_id
    ON user_tools USING btree (workspace_id);

    -- Atualizar comentário
    COMMENT ON COLUMN user_tools.workspace_id IS
    'ID do workspace - ferramentas são compartilhadas no workspace';

    RAISE NOTICE '✅ Tabela user_tools migrada com sucesso';

  ELSE
    RAISE NOTICE 'ℹ️  Tabela user_tools não existe';
  END IF;
END $$;

-- =====================================================
-- ETAPA 3: whatsapp_instances (verificar se precisa)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_instances') THEN

    -- Verificar se já tem workspace_id
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'whatsapp_instances'
      AND column_name = 'workspace_id'
    ) THEN

      -- Adicionar workspace_id
      ALTER TABLE whatsapp_instances
      ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

      RAISE NOTICE '✅ Adicionada coluna workspace_id a whatsapp_instances';

      -- Migrar dados se tiver user_id
      IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'whatsapp_instances'
        AND column_name = 'user_id'
      ) THEN
        UPDATE whatsapp_instances wi
        SET workspace_id = u.current_workspace_id
        FROM users u
        WHERE wi.user_id = u.id
          AND wi.workspace_id IS NULL
          AND u.current_workspace_id IS NOT NULL;

        RAISE NOTICE '✅ Dados migrados em whatsapp_instances';
      END IF;

      -- Criar índice
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_workspace_id
      ON whatsapp_instances USING btree (workspace_id);

    ELSE
      RAISE NOTICE 'ℹ️  whatsapp_instances já tem workspace_id';
    END IF;

  ELSE
    RAISE NOTICE 'ℹ️  Tabela whatsapp_instances não existe';
  END IF;
END $$;

-- =====================================================
-- ETAPA 4: campanhas (se existir)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campanhas') THEN

    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'campanhas'
      AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE campanhas
      ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

      RAISE NOTICE '✅ Adicionada coluna workspace_id a campanhas';

      -- Migrar dados
      IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'campanhas'
        AND column_name = 'user_id'
      ) THEN
        UPDATE campanhas c
        SET workspace_id = u.current_workspace_id
        FROM users u
        WHERE c.user_id = u.id
          AND c.workspace_id IS NULL
          AND u.current_workspace_id IS NOT NULL;
      END IF;

      -- Criar índice
      CREATE INDEX IF NOT EXISTS idx_campanhas_workspace_id
      ON campanhas USING btree (workspace_id);

      RAISE NOTICE '✅ Tabela campanhas migrada com sucesso';
    END IF;

  ELSE
    RAISE NOTICE 'ℹ️  Tabela campanhas não existe';
  END IF;
END $$;

-- =====================================================
-- ETAPA 5: arquivos (se existir)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'arquivos') THEN

    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'arquivos'
      AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE arquivos
      ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

      RAISE NOTICE '✅ Adicionada coluna workspace_id a arquivos';

      -- Migrar dados
      IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'arquivos'
        AND column_name = 'user_id'
      ) THEN
        UPDATE arquivos a
        SET workspace_id = u.current_workspace_id
        FROM users u
        WHERE a.user_id = u.id
          AND a.workspace_id IS NULL
          AND u.current_workspace_id IS NOT NULL;
      END IF;

      -- Criar índice
      CREATE INDEX IF NOT EXISTS idx_arquivos_workspace_id
      ON arquivos USING btree (workspace_id);

      RAISE NOTICE '✅ Tabela arquivos migrada com sucesso';
    END IF;

  ELSE
    RAISE NOTICE 'ℹ️  Tabela arquivos não existe';
  END IF;
END $$;

-- =====================================================
-- ETAPA 6: credencias_diversas (se existir)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'credencias_diversas') THEN

    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'credencias_diversas'
      AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE credencias_diversas
      ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

      RAISE NOTICE '✅ Adicionada coluna workspace_id a credencias_diversas';

      -- Migrar dados
      IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'credencias_diversas'
        AND column_name = 'user_id'
      ) THEN
        UPDATE credencias_diversas cd
        SET workspace_id = u.current_workspace_id
        FROM users u
        WHERE cd.user_id = u.id
          AND cd.workspace_id IS NULL
          AND u.current_workspace_id IS NOT NULL;
      END IF;

      -- Criar índice
      CREATE INDEX IF NOT EXISTS idx_credencias_diversas_workspace_id
      ON credencias_diversas USING btree (workspace_id);

      RAISE NOTICE '✅ Tabela credencias_diversas migrada com sucesso';
    END IF;

  ELSE
    RAISE NOTICE 'ℹ️  Tabela credencias_diversas não existe';
  END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  tabela RECORD;
  total_migradas INTEGER := 0;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '📊 RESUMO DA MIGRATION 004';
  RAISE NOTICE '═══════════════════════════════════════';

  -- Verificar cada tabela
  FOR tabela IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'workspace_id'
      AND table_schema = 'public'
      AND table_name IN (
        'user_agent_vectorstore',
        'user_tools',
        'whatsapp_instances',
        'campanhas',
        'arquivos',
        'configuracoes_credenciais',
        'credencias_diversas'
      )
  LOOP
    total_migradas := total_migradas + 1;
    RAISE NOTICE '✅ %', tabela.table_name;
  END LOOP;

  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ Migration 004 concluída!';
  RAISE NOTICE 'Total de tabelas com workspace_id: %', total_migradas;
  RAISE NOTICE '═══════════════════════════════════════';
END $$;