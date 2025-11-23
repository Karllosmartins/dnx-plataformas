-- Migration 003: Add workspace_id to agentes_ia table
-- Description: Add workspace support to AI agents
-- Date: 2025-11-22

-- ================================================
-- PART 1: Add workspace_id column to agentes_ia
-- ================================================

DO $$
BEGIN
  -- Check if agentes_ia table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agentes_ia') THEN
    -- Add workspace_id column
    ALTER TABLE agentes_ia ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

    -- Migrate existing agentes to user's workspace
    UPDATE agentes_ia ai
    SET workspace_id = (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = ai.user_id
        AND wm.role = 'owner'
      LIMIT 1
    )
    WHERE workspace_id IS NULL;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_agentes_ia_workspace ON agentes_ia(workspace_id);

    RAISE NOTICE 'Agentes IA table migrated successfully';
  ELSE
    RAISE NOTICE 'Agentes IA table does not exist, skipping';
  END IF;
END $$;

-- ================================================
-- PART 2: Verification Query
-- ================================================

-- Check agentes without workspace (should be 0 after migration)
SELECT COUNT(*) as agentes_without_workspace
FROM agentes_ia
WHERE workspace_id IS NULL;

-- Show agentes with workspace info
SELECT
  ai.id,
  ai.nome,
  ai.user_id,
  ai.workspace_id,
  w.name as workspace_name
FROM agentes_ia ai
LEFT JOIN workspaces w ON w.id = ai.workspace_id
ORDER BY ai.created_at DESC;
