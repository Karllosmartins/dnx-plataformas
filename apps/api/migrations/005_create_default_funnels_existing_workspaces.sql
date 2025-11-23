-- Migration 005: Create Default Funnels for Existing Workspaces
-- Description: Add default "Vendas" funnel to workspaces that don't have any funnel
-- Date: 2025-11-22

-- ================================================
-- Create default funnel for existing workspaces
-- ================================================

DO $$
DECLARE
  workspace_record RECORD;
  new_funil_id UUID;
BEGIN
  -- Loop through workspaces without funnels
  FOR workspace_record IN
    SELECT w.id, w.name
    FROM workspaces w
    WHERE NOT EXISTS (
      SELECT 1 FROM funis f WHERE f.workspace_id = w.id
    )
  LOOP
    -- Create default "Vendas" funnel
    INSERT INTO funis (workspace_id, nome, descricao, icone, cor, ordem)
    VALUES (
      workspace_record.id,
      'Vendas',
      'Funil padrão de vendas',
      'trending-up',
      '#3B82F6',
      1
    )
    RETURNING id INTO new_funil_id;

    -- Create default stages
    INSERT INTO funil_estagios (funil_id, nome, cor, ordem) VALUES
      (new_funil_id, 'Novo Lead', '#10B981', 1),
      (new_funil_id, 'Qualificação', '#F59E0B', 2),
      (new_funil_id, 'Proposta', '#8B5CF6', 3),
      (new_funil_id, 'Negociação', '#EC4899', 4),
      (new_funil_id, 'Fechado', '#22C55E', 5);

    RAISE NOTICE 'Created default funnel for workspace: % (ID: %)', workspace_record.name, workspace_record.id;
  END LOOP;

  RAISE NOTICE 'Default funnels creation completed';
END $$;

-- ================================================
-- Verification
-- ================================================

-- Show all workspaces with their funnels
SELECT
  w.id as workspace_id,
  w.name as workspace_name,
  f.id as funil_id,
  f.nome as funil_nome,
  (SELECT COUNT(*) FROM funil_estagios fe WHERE fe.funil_id = f.id) as total_estagios
FROM workspaces w
LEFT JOIN funis f ON f.workspace_id = w.id
ORDER BY w.created_at DESC;
