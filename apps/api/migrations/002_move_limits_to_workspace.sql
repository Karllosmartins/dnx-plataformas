-- Migration 002: Move Limits and Consumption to Workspace
-- Description: Migrate limits from user-based to workspace-based
-- Date: 2025-11-23
-- Rationale: Workspaces should control shared resource limits, not individual users

-- ================================================
-- PART 1: Add Limit Fields to Workspaces
-- ================================================

-- Add limit fields (from plano)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS limite_leads INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS limite_consultas INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS limite_instancias INTEGER DEFAULT 1;

-- Add consumption fields
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS leads_consumidos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consultas_realizadas INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instancias_ativas INTEGER DEFAULT 0;

-- Add last reset timestamp
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS ultimo_reset_contagem TIMESTAMP DEFAULT NOW();

-- Add plano customizado (workspace-level overrides)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plano_customizado JSONB DEFAULT '{}';

-- ================================================
-- PART 2: Migrate Existing Data from Users to Workspaces
-- ================================================

-- Copy limits from first user in each workspace (assuming they have the same plan)
UPDATE workspaces w
SET
  limite_leads = COALESCE(
    (SELECT u.limite_leads
     FROM users u
     WHERE u.current_workspace_id = w.id
     LIMIT 1),
    1000
  ),
  limite_consultas = COALESCE(
    (SELECT u.limite_consultas
     FROM users u
     WHERE u.current_workspace_id = w.id
     LIMIT 1),
    100
  ),
  leads_consumidos = COALESCE(
    (SELECT SUM(u.leads_consumidos)
     FROM users u
     WHERE u.current_workspace_id = w.id),
    0
  ),
  consultas_realizadas = COALESCE(
    (SELECT SUM(u.consultas_realizadas)
     FROM users u
     WHERE u.current_workspace_id = w.id),
    0
  ),
  instancias_ativas = COALESCE(
    (SELECT MAX(u.numero_instancias)
     FROM users u
     WHERE u.current_workspace_id = w.id),
    0
  );

-- Set limits from plano if workspace has plano_id
UPDATE workspaces w
SET
  limite_leads = p.limite_leads,
  limite_consultas = p.limite_consultas,
  limite_instancias = p.limite_instancias
FROM planos p
WHERE w.plano_id = p.id;

-- ================================================
-- PART 3: Add Comments for Documentation
-- ================================================

COMMENT ON COLUMN workspaces.limite_leads IS 'Maximum number of leads allowed for this workspace (from plano or custom)';
COMMENT ON COLUMN workspaces.limite_consultas IS 'Maximum number of API consultations allowed for this workspace';
COMMENT ON COLUMN workspaces.limite_instancias IS 'Maximum number of WhatsApp instances allowed for this workspace';
COMMENT ON COLUMN workspaces.leads_consumidos IS 'Current number of leads created in this workspace';
COMMENT ON COLUMN workspaces.consultas_realizadas IS 'Current number of API consultations used in this workspace';
COMMENT ON COLUMN workspaces.instancias_ativas IS 'Current number of active WhatsApp instances in this workspace';
COMMENT ON COLUMN workspaces.ultimo_reset_contagem IS 'Last time consumption counters were reset (monthly billing cycle)';
COMMENT ON COLUMN workspaces.plano_customizado IS 'Custom overrides for this specific workspace (e.g., extra limits, custom features)';

-- ================================================
-- PART 4: Create Indexes for Performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_plano_id
  ON workspaces(plano_id);

-- ================================================
-- PART 5: Create Helper Functions
-- ================================================

-- Function to check if workspace can create more leads
CREATE OR REPLACE FUNCTION workspace_can_create_lead(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_limit INTEGER;
  current_consumed INTEGER;
BEGIN
  SELECT limite_leads, leads_consumidos
  INTO current_limit, current_consumed
  FROM workspaces
  WHERE id = workspace_uuid;

  RETURN current_consumed < current_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment lead count
CREATE OR REPLACE FUNCTION workspace_increment_leads(workspace_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workspaces
  SET leads_consumidos = leads_consumidos + 1
  WHERE id = workspace_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to check if workspace can make more consultations
CREATE OR REPLACE FUNCTION workspace_can_make_consultation(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_limit INTEGER;
  current_consumed INTEGER;
BEGIN
  SELECT limite_consultas, consultas_realizadas
  INTO current_limit, current_consumed
  FROM workspaces
  WHERE id = workspace_uuid;

  RETURN current_consumed < current_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment consultation count
CREATE OR REPLACE FUNCTION workspace_increment_consultations(workspace_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workspaces
  SET consultas_realizadas = consultas_realizadas + 1
  WHERE id = workspace_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly counters
CREATE OR REPLACE FUNCTION workspace_reset_monthly_counters(workspace_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workspaces
  SET
    leads_consumidos = 0,
    consultas_realizadas = 0,
    ultimo_reset_contagem = NOW()
  WHERE id = workspace_uuid;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- NOTES
-- ================================================
-- After this migration:
-- 1. Workspaces control all resource limits (shared by all users)
-- 2. Users table still has limite_leads, limite_consultas (for backward compatibility)
-- 3. API should be updated to check workspace limits instead of user limits
-- 4. Frontend should show workspace consumption, not user consumption
-- 5. Only workspace admins/owners should be able to see full consumption metrics
--
-- Future cleanup (after API migration):
-- - ALTER TABLE users DROP COLUMN limite_leads;
-- - ALTER TABLE users DROP COLUMN limite_consultas;
-- - ALTER TABLE users DROP COLUMN leads_consumidos;
-- - ALTER TABLE users DROP COLUMN consultas_realizadas;
-- - ALTER TABLE users DROP COLUMN numero_instancias;
-- - ALTER TABLE users DROP COLUMN ultimo_reset_contagem;
