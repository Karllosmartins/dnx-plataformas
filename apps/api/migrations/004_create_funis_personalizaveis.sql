-- Migration 004: Create Customizable Funnels System
-- Description: Replace tipos_negocio with flexible funnel system
-- Date: 2025-11-22

-- ================================================
-- PART 1: Create Funis Table
-- ================================================

CREATE TABLE IF NOT EXISTS funis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  icone VARCHAR(50) DEFAULT 'funnel',
  cor VARCHAR(7) DEFAULT '#3B82F6',
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_funis_workspace ON funis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_funis_ativo ON funis(ativo);
CREATE INDEX IF NOT EXISTS idx_funis_ordem ON funis(ordem);

COMMENT ON TABLE funis IS 'Funis personalizáveis criados pelos usuários dentro de cada workspace';
COMMENT ON COLUMN funis.workspace_id IS 'Workspace ao qual o funil pertence';
COMMENT ON COLUMN funis.nome IS 'Nome do funil (ex: Vendas, Suporte, Cobrança)';
COMMENT ON COLUMN funis.icone IS 'Ícone do funil para exibição na UI';
COMMENT ON COLUMN funis.cor IS 'Cor hex do funil (#RRGGBB)';

-- ================================================
-- PART 2: Create Funil Estágios Table
-- ================================================

CREATE TABLE IF NOT EXISTS funil_estagios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id UUID NOT NULL REFERENCES funis(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7) DEFAULT '#6B7280',
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(funil_id, nome),
  UNIQUE(funil_id, ordem)
);

CREATE INDEX IF NOT EXISTS idx_funil_estagios_funil ON funil_estagios(funil_id);
CREATE INDEX IF NOT EXISTS idx_funil_estagios_ordem ON funil_estagios(funil_id, ordem);
CREATE INDEX IF NOT EXISTS idx_funil_estagios_ativo ON funil_estagios(ativo);

COMMENT ON TABLE funil_estagios IS 'Estágios customizáveis de cada funil';
COMMENT ON COLUMN funil_estagios.funil_id IS 'Funil ao qual o estágio pertence';
COMMENT ON COLUMN funil_estagios.nome IS 'Nome do estágio (ex: Novo Lead, Qualificação, Negociação)';
COMMENT ON COLUMN funil_estagios.ordem IS 'Ordem do estágio no funil (determina fluxo)';

-- ================================================
-- PART 3: Create Campos Personalizados Table
-- ================================================

CREATE TABLE IF NOT EXISTS campos_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  funil_id UUID REFERENCES funis(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (
    tipo IN ('text', 'number', 'date', 'select', 'checkbox', 'email', 'phone', 'currency', 'url')
  ),
  opcoes JSONB,
  obrigatorio BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, funil_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_campos_workspace ON campos_personalizados(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campos_funil ON campos_personalizados(funil_id);
CREATE INDEX IF NOT EXISTS idx_campos_tipo ON campos_personalizados(tipo);
CREATE INDEX IF NOT EXISTS idx_campos_ativo ON campos_personalizados(ativo);

COMMENT ON TABLE campos_personalizados IS 'Campos customizáveis para leads';
COMMENT ON COLUMN campos_personalizados.workspace_id IS 'Workspace ao qual o campo pertence';
COMMENT ON COLUMN campos_personalizados.funil_id IS 'Funil específico (NULL = campo global)';
COMMENT ON COLUMN campos_personalizados.tipo IS 'Tipo do campo (text, number, date, select, etc)';
COMMENT ON COLUMN campos_personalizados.opcoes IS 'Opções para campos tipo select (array JSON)';

-- ================================================
-- PART 4: Update Leads Table
-- ================================================

-- Add new columns to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS funil_id UUID REFERENCES funis(id),
  ADD COLUMN IF NOT EXISTS estagio_id UUID REFERENCES funil_estagios(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_funil ON leads(funil_id);
CREATE INDEX IF NOT EXISTS idx_leads_estagio ON leads(estagio_id);
CREATE INDEX IF NOT EXISTS idx_leads_funil_estagio ON leads(funil_id, estagio_id);

COMMENT ON COLUMN leads.funil_id IS 'Funil ao qual o lead pertence';
COMMENT ON COLUMN leads.estagio_id IS 'Estágio atual do lead no funil';

-- ================================================
-- PART 5: Create Triggers
-- ================================================

-- Trigger para atualizar updated_at em funis
CREATE TRIGGER update_funis_updated_at
  BEFORE UPDATE ON funis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- PART 6: Migrate Existing Data (Optional)
-- ================================================

-- Comentado por padrão - executar apenas se quiser migrar dados existentes
/*
DO $$
BEGIN
  -- Migrar tipos_negocio existentes para funis
  INSERT INTO funis (workspace_id, nome, descricao, icone, cor, ativo, ordem)
  SELECT
    w.id as workspace_id,
    tn.nome_exibicao as nome,
    tn.descricao,
    tn.icone,
    tn.cor,
    tn.ativo,
    tn.ordem
  FROM tipos_negocio tn
  CROSS JOIN workspaces w  -- Criar funil padrão para cada workspace
  WHERE NOT EXISTS (
    SELECT 1 FROM funis f
    WHERE f.workspace_id = w.id AND f.nome = tn.nome_exibicao
  );

  RAISE NOTICE 'Tipos de negócio migrados para funis';
END $$;
*/

-- ================================================
-- PART 7: Create Default Funnel Template
-- ================================================

-- Função para criar funil padrão para novos workspaces
CREATE OR REPLACE FUNCTION create_default_funnel_for_workspace()
RETURNS TRIGGER AS $$
DECLARE
  funil_id UUID;
BEGIN
  -- Criar funil padrão "Vendas"
  INSERT INTO funis (workspace_id, nome, descricao, icone, cor, ordem)
  VALUES (
    NEW.id,
    'Vendas',
    'Funil padrão de vendas',
    'trending-up',
    '#3B82F6',
    1
  )
  RETURNING id INTO funil_id;

  -- Criar estágios padrão
  INSERT INTO funil_estagios (funil_id, nome, cor, ordem) VALUES
    (funil_id, 'Novo Lead', '#10B981', 1),
    (funil_id, 'Qualificação', '#F59E0B', 2),
    (funil_id, 'Proposta', '#8B5CF6', 3),
    (funil_id, 'Negociação', '#EC4899', 4),
    (funil_id, 'Fechado', '#22C55E', 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar funil padrão em novos workspaces
CREATE TRIGGER create_default_funnel
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION create_default_funnel_for_workspace();

-- ================================================
-- PART 8: Verification Queries
-- ================================================

-- Count funis
SELECT COUNT(*) as total_funis FROM funis;

-- Count estágios
SELECT COUNT(*) as total_estagios FROM funil_estagios;

-- Show funis with estágios count
SELECT
  f.id,
  f.workspace_id,
  w.name as workspace_name,
  f.nome as funil_name,
  f.cor,
  COUNT(fe.id) as total_estagios,
  f.created_at
FROM funis f
LEFT JOIN workspaces w ON w.id = f.workspace_id
LEFT JOIN funil_estagios fe ON fe.funil_id = f.id
GROUP BY f.id, f.workspace_id, w.name, f.nome, f.cor, f.created_at
ORDER BY f.created_at DESC;

-- Show estágios by funil
SELECT
  f.nome as funil_name,
  fe.nome as estagio_name,
  fe.cor,
  fe.ordem,
  fe.ativo
FROM funil_estagios fe
JOIN funis f ON f.id = fe.funil_id
ORDER BY f.nome, fe.ordem;
