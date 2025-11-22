-- Migration 002: Migrate Existing Data to Multi-Tenancy (FIXED)
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
-- PART 4: Update Leads Table
-- ================================================

-- Add workspace_id column to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

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

-- Make workspace_id NOT NULL after migration
-- Uncomment after verifying migration was successful
-- ALTER TABLE leads ALTER COLUMN workspace_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_workspace
  ON leads(workspace_id);

-- ================================================
-- PART 5: Update WhatsApp Instances Table
-- ================================================

-- Add workspace_id column to whatsapp_instances
ALTER TABLE whatsapp_instances
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

-- Migrate existing instances to user's workspace
UPDATE whatsapp_instances wi
SET workspace_id = (
  SELECT wm.workspace_id
  FROM workspace_members wm
  WHERE wm.user_id = wi.user_id
    AND wm.role = 'owner'
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_workspace
  ON whatsapp_instances(workspace_id);

-- ================================================
-- PART 6: Update Other Resource Tables
-- ================================================

-- Repeat similar pattern for other tables:
-- - agentes_ia
-- - datecode_consumptions
-- - arquivos
-- - etc.

-- Example for arquivos:
ALTER TABLE arquivos
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

UPDATE arquivos a
SET workspace_id = (
  SELECT wm.workspace_id
  FROM workspace_members wm
  WHERE wm.user_id = a.user_id
    AND wm.role = 'owner'
  LIMIT 1
)
WHERE workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_arquivos_workspace
  ON arquivos(workspace_id);

-- ================================================
-- PART 7: Verification Queries
-- ================================================

-- Count workspaces created
SELECT COUNT(*) as total_workspaces FROM workspaces;

-- Count workspace members
SELECT COUNT(*) as total_members FROM workspace_members;

-- Check users without workspace
SELECT id, email, name FROM users WHERE current_workspace_id IS NULL;

-- Check leads without workspace
SELECT COUNT(*) as leads_without_workspace FROM leads WHERE workspace_id IS NULL;

-- Show created workspaces
SELECT
  w.id,
  w.name,
  w.slug,
  COUNT(wm.id) as member_count
FROM workspaces w
LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
GROUP BY w.id, w.name, w.slug
ORDER BY w.created_at DESC;

-- ================================================
-- PART 8: Rollback Script (Keep for safety)
-- ================================================

/*
-- TO ROLLBACK THIS MIGRATION:

-- Remove workspace columns
ALTER TABLE leads DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE whatsapp_instances DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE arquivos DROP COLUMN IF EXISTS workspace_id;
ALTER TABLE users DROP COLUMN IF EXISTS current_workspace_id;

-- Drop workspace tables
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
*/

-- ================================================
-- NOTES
-- ================================================
-- RLS policies were NOT added because:
-- 1. Using custom JWT authentication via Express API
-- 2. Authorization is handled at API level
-- 3. See migration 001 for more details
--
-- All queries at the end are uncommented for verification.
-- Review the results to ensure migration was successful.
