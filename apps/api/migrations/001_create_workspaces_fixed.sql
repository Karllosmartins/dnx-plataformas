-- Migration 001: Create Workspaces and Multi-Tenancy (FIXED)
-- Description: Add workspace tables for multi-tenancy support
-- Date: 2025-11-22
-- Note: RLS policies removed - using API-level authentication with JWT

-- ================================================
-- PART 1: Create Workspaces Table
-- ================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plano_id INTEGER REFERENCES planos(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ================================================
-- PART 2: Create Workspace Members Table
-- ================================================

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP DEFAULT NOW(),
  invited_by INTEGER REFERENCES users(id),
  UNIQUE(workspace_id, user_id)
);

-- ================================================
-- PART 3: Update Users Table
-- ================================================

-- Add current_workspace_id to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS current_workspace_id UUID REFERENCES workspaces(id);

-- Remove plano_id from users (will be in workspace now)
-- Note: Keeping plano_id for migration period - can be removed later
-- ALTER TABLE users DROP COLUMN IF EXISTS plano_id;

-- ================================================
-- PART 4: Create Indexes
-- ================================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace
  ON workspace_members(workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user
  ON workspace_members(user_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug
  ON workspaces(slug);

CREATE INDEX IF NOT EXISTS idx_users_current_workspace
  ON users(current_workspace_id);

-- ================================================
-- PART 5: Create Function to Update updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- PART 6: Comments for Documentation
-- ================================================

COMMENT ON TABLE workspaces IS 'Workspaces represent organizations/teams that share resources';
COMMENT ON TABLE workspace_members IS 'Junction table for users belonging to workspaces with roles';
COMMENT ON COLUMN workspaces.settings IS 'JSON configuration for workspace-specific settings';
COMMENT ON COLUMN workspace_members.role IS 'User role: owner (full access), admin (manage members), member (standard access), viewer (read-only)';
COMMENT ON COLUMN workspace_members.permissions IS 'Fine-grained permissions override for specific actions';

-- ================================================
-- NOTES
-- ================================================
-- RLS (Row Level Security) is NOT enabled because:
-- 1. Using custom JWT authentication via Express API
-- 2. auth.uid() from Supabase Auth returns UUID, but users.id is INTEGER
-- 3. Authorization is handled at API level in middleware
--
-- Security is enforced by:
-- - JWT authentication middleware in API
-- - Workspace membership checks in route handlers
-- - Role-based permissions in API logic
