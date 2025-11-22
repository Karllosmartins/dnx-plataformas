-- Migration 001: Create Workspaces and Multi-Tenancy
-- Description: Add workspace tables for multi-tenancy support
-- Date: 2025-11-22

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
-- Note: Comment out if you want to keep for migration period
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
-- PART 6: Create RLS Policies (Row Level Security)
-- ================================================

-- Enable RLS on workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view workspaces they are members of
CREATE POLICY workspace_members_select ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()::integer
    )
  );

-- Policy: Only owners can update workspace
CREATE POLICY workspace_owners_update ON workspaces
  FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()::integer
        AND role = 'owner'
    )
  );

-- Enable RLS on workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view other members in their workspaces
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()::integer
    )
  );

-- ================================================
-- PART 7: Comments for Documentation
-- ================================================

COMMENT ON TABLE workspaces IS 'Workspaces represent organizations/teams that share resources';
COMMENT ON TABLE workspace_members IS 'Junction table for users belonging to workspaces with roles';
COMMENT ON COLUMN workspaces.settings IS 'JSON configuration for workspace-specific settings';
COMMENT ON COLUMN workspace_members.role IS 'User role: owner (full access), admin (manage members), member (standard access), viewer (read-only)';
COMMENT ON COLUMN workspace_members.permissions IS 'Fine-grained permissions override for specific actions';
