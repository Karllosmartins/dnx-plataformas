-- Migration 002: Migrate Existing Data to Multi-Tenancy (SAFE VERSION)
-- Description: Create workspaces for existing users and migrate their data
-- Date: 2025-11-22
-- WARNING: This migration modifies existing data. Backup your database first!

-- ================================================
-- PART 1: Create Workspaces for Existing Users
-- ================================================

-- Create a workspace for each existing user
INSERT INTO workspaces (name, slug, plano_id, settings)
SELECT
  COALESCE(u.name, u.email) || '''s Workspace' as name,
  LOWER(REGEXP_REPLACE(COALESCE(u.name, u.email), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || u.id as slug,
  u.plano_id,
  '{}'::jsonb as settings
FROM users u
WHERE NOT EXISTS (
  -- Don't create duplicates if migration is run twice
  SELECT 1 FROM workspaces w
  WHERE w.slug = LOWER(REGEXP_REPLACE(COALESCE(u.name, u.email), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || u.id
);

-- ================================================
-- PART 2: Add Users as Owners of Their Workspaces
-- ================================================

INSERT INTO workspace_members (workspace_id, user_id, role, permissions)
SELECT DISTINCT
  w.id as workspace_id,
  u.id as user_id,
  'owner' as role,
  '{
    "leads": {"create": true, "read": true, "update": true, "delete": true},
    "whatsapp": {"create": true, "read": true, "update": true, "delete": true},
    "members": {"invite": true, "remove": true, "update_roles": true},
    "workspace": {"update": true, "delete": true}
  }'::jsonb as permissions
FROM users u
JOIN workspaces w ON w.slug = LOWER(REGEXP_REPLACE(COALESCE(u.name, u.email), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || u.id
WHERE NOT EXISTS (
  -- Don't create duplicates
  SELECT 1 FROM workspace_members wm
  WHERE wm.workspace_id = w.id AND wm.user_id = u.id
);

-- ================================================
-- PART 3: Set Current Workspace for Users
-- ================================================

UPDATE users u
SET current_workspace_id = (
  SELECT workspace_id
  FROM workspace_members wm
  WHERE wm.user_id = u.id
    AND wm.role = 'owner'
  LIMIT 1
)
WHERE current_workspace_id IS NULL;

-- ================================================
-- PART 4: Update Leads Table (if exists)
-- ================================================

DO $$
BEGIN
  -- Check if leads table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    -- Add workspace_id column to leads
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

    -- Migrate existing leads to user's workspace
    UPDATE leads l
    SET workspace_id = (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = l.user_id
        AND wm.role = 'owner'
      LIMIT 1
    )
    WHERE workspace_id IS NULL;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);

    RAISE NOTICE 'Leads table migrated successfully';
  ELSE
    RAISE NOTICE 'Leads table does not exist, skipping';
  END IF;
END $$;

-- ================================================
-- PART 5: Update WhatsApp Instances Table (if exists)
-- ================================================

DO $$
BEGIN
  -- Check if instancia_whtats table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'instancia_whtats') THEN
    -- Add workspace_id column
    ALTER TABLE instancia_whtats ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

    -- Migrate existing instances
    UPDATE instancia_whtats iw
    SET workspace_id = (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = iw.user_id
        AND wm.role = 'owner'
      LIMIT 1
    )
    WHERE workspace_id IS NULL;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_instancia_whtats_workspace ON instancia_whtats(workspace_id);

    RAISE NOTICE 'WhatsApp instances table migrated successfully';
  ELSE
    RAISE NOTICE 'WhatsApp instances table does not exist, skipping';
  END IF;
END $$;

-- ================================================
-- PART 6: Update Arquivos Table (if exists)
-- ================================================

DO $$
BEGIN
  -- Check if arquivos table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'arquivos') THEN
    -- Add workspace_id column
    ALTER TABLE arquivos ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

    -- Migrate existing arquivos
    UPDATE arquivos a
    SET workspace_id = (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = a.user_id
        AND wm.role = 'owner'
      LIMIT 1
    )
    WHERE workspace_id IS NULL;

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_arquivos_workspace ON arquivos(workspace_id);

    RAISE NOTICE 'Arquivos table migrated successfully';
  ELSE
    RAISE NOTICE 'Arquivos table does not exist, skipping';
  END IF;
END $$;

-- ================================================
-- PART 7: Update Agentes IA Table (if exists)
-- ================================================

DO $$
BEGIN
  -- Check if agentes_ia table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agentes_ia') THEN
    -- Add workspace_id column
    ALTER TABLE agentes_ia ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

    -- Migrate existing agentes
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
-- PART 8: Verification Queries
-- ================================================

-- Count workspaces created
SELECT COUNT(*) as total_workspaces FROM workspaces;

-- Count workspace members
SELECT COUNT(*) as total_members FROM workspace_members;

-- Check users without workspace
SELECT id, email, name FROM users WHERE current_workspace_id IS NULL;

-- Check leads without workspace (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    EXECUTE 'SELECT COUNT(*) as leads_without_workspace FROM leads WHERE workspace_id IS NULL';
  END IF;
END $$;

-- Show created workspaces with member count
SELECT
  w.id,
  w.name,
  w.slug,
  w.plano_id,
  COUNT(wm.id) as member_count,
  w.created_at
FROM workspaces w
LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
GROUP BY w.id, w.name, w.slug, w.plano_id, w.created_at
ORDER BY w.created_at DESC;

-- Show workspace members with user details
SELECT
  wm.workspace_id,
  w.name as workspace_name,
  u.id as user_id,
  u.name as user_name,
  u.email,
  wm.role,
  wm.joined_at
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
JOIN users u ON u.id = wm.user_id
ORDER BY w.name, wm.role, u.name;

-- ================================================
-- NOTES
-- ================================================
-- This migration safely handles missing tables by checking for existence
-- before attempting to add workspace_id columns.
--
-- Tables checked and migrated if they exist:
-- - leads
-- - whatsapp_instances
-- - arquivos
-- - agentes_ia
--
-- Add more tables as needed following the same pattern.
