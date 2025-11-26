-- Migration 003: Add Workspace Owner Reference
-- Description: Link workspace to owner user
-- Date: 2025-11-26
-- Rationale: Workspace needs to know who owns it

-- ================================================
-- PART 1: Add Owner Reference
-- ================================================

-- Link workspace to owner user (from users table)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);

-- ================================================
-- PART 2: Add Indexes
-- ================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id
  ON workspaces(owner_id);

-- ================================================
-- PART 3: Add Comments for Documentation
-- ================================================

COMMENT ON COLUMN workspaces.owner_id IS 'User ID of the workspace owner (references users table)';

-- ================================================
-- NOTES
-- ================================================
-- - Owner data (name, email, phone, CPF, password) is in users table
-- - Date Code credentials are in credenciais_diversas table
-- - plano_customizado JSONB field stores custom permissions overrides