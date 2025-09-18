-- =====================================================
-- MIGRAÇÃO PARA SISTEMA DE PLANOS E CONTROLE DE ACESSO
-- =====================================================

-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS public.planos (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  valor_mensal DECIMAL(10,2) DEFAULT 0,

  -- Controles de acesso
  acesso_dashboard BOOLEAN DEFAULT TRUE,
  acesso_crm BOOLEAN DEFAULT TRUE,
  acesso_whatsapp BOOLEAN DEFAULT TRUE,
  acesso_disparo_simples BOOLEAN DEFAULT TRUE,
  acesso_disparo_ia BOOLEAN DEFAULT FALSE,
  acesso_agentes_ia BOOLEAN DEFAULT FALSE,
  acesso_extracao_leads BOOLEAN DEFAULT FALSE,
  acesso_enriquecimento BOOLEAN DEFAULT FALSE,
  acesso_usuarios BOOLEAN DEFAULT FALSE,

  -- Limites
  limite_leads INTEGER DEFAULT 1000,
  limite_consultas INTEGER DEFAULT 100,
  limite_instancias INTEGER DEFAULT 1,

  -- Metadados
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO public.planos (
  nome, descricao, valor_mensal,
  acesso_dashboard, acesso_crm, acesso_whatsapp, acesso_disparo_simples,
  acesso_disparo_ia, acesso_agentes_ia, acesso_extracao_leads,
  acesso_enriquecimento, acesso_usuarios,
  limite_leads, limite_consultas, limite_instancias
) VALUES
-- Plano Básico
(
  'basico',
  'Plano básico com funcionalidades essenciais',
  97.00,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE,
  FALSE, FALSE,
  1000, 100, 1
),
-- Plano Premium 1 (IA)
(
  'premium1',
  'Plano premium com IA e agentes inteligentes',
  197.00,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, FALSE,
  FALSE, FALSE,
  5000, 500, 3
),
-- Plano Premium 2 (Extração)
(
  'premium2',
  'Plano premium com extração de leads',
  197.00,
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, TRUE,
  FALSE, FALSE,
  5000, 500, 3
),
-- Plano Enterprise
(
  'enterprise',
  'Plano completo com todas as funcionalidades',
  497.00,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE,
  TRUE, TRUE,
  50000, 5000, 10
)
ON CONFLICT (nome) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  valor_mensal = EXCLUDED.valor_mensal,
  acesso_dashboard = EXCLUDED.acesso_dashboard,
  acesso_crm = EXCLUDED.acesso_crm,
  acesso_whatsapp = EXCLUDED.acesso_whatsapp,
  acesso_disparo_simples = EXCLUDED.acesso_disparo_simples,
  acesso_disparo_ia = EXCLUDED.acesso_disparo_ia,
  acesso_agentes_ia = EXCLUDED.acesso_agentes_ia,
  acesso_extracao_leads = EXCLUDED.acesso_extracao_leads,
  acesso_enriquecimento = EXCLUDED.acesso_enriquecimento,
  acesso_usuarios = EXCLUDED.acesso_usuarios,
  limite_leads = EXCLUDED.limite_leads,
  limite_consultas = EXCLUDED.limite_consultas,
  limite_instancias = EXCLUDED.limite_instancias,
  updated_at = NOW();

-- Adicionar relacionamento de plano na tabela users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plano_id BIGINT REFERENCES public.planos(id),
ADD COLUMN IF NOT EXISTS plano_customizado JSONB; -- Para overrides específicos

-- Migrar planos existentes para a nova estrutura
UPDATE public.users SET plano_id = (
  CASE
    WHEN plano = 'basico' THEN (SELECT id FROM public.planos WHERE nome = 'basico')
    WHEN plano = 'premium' THEN (SELECT id FROM public.planos WHERE nome = 'premium1')
    WHEN plano = 'enterprise' THEN (SELECT id FROM public.planos WHERE nome = 'enterprise')
    ELSE (SELECT id FROM public.planos WHERE nome = 'basico')
  END
) WHERE plano_id IS NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_planos_ativo ON public.planos(ativo);
CREATE INDEX IF NOT EXISTS idx_planos_nome ON public.planos(nome);
CREATE INDEX IF NOT EXISTS idx_users_plano_id ON public.users(plano_id);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para planos
DROP TRIGGER IF EXISTS update_planos_updated_at ON public.planos;
CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para tabela planos
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planos_policy" ON public.planos FOR ALL TO authenticated USING (true);

-- View para facilitar consultas de usuários com planos
CREATE OR REPLACE VIEW public.view_usuarios_planos AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.active,
  u.plano as plano_legado,
  p.nome as plano_nome,
  p.descricao as plano_descricao,
  p.valor_mensal,
  p.acesso_dashboard,
  p.acesso_crm,
  p.acesso_whatsapp,
  p.acesso_disparo_simples,
  p.acesso_disparo_ia,
  p.acesso_agentes_ia,
  p.acesso_extracao_leads,
  p.acesso_enriquecimento,
  p.acesso_usuarios,
  p.limite_leads,
  p.limite_consultas,
  p.limite_instancias,
  u.plano_customizado,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.planos p ON u.plano_id = p.id;

-- Comentários para documentação
COMMENT ON TABLE public.planos IS 'Tabela de planos com controles de acesso e limites';
COMMENT ON COLUMN public.planos.plano_customizado IS 'Overrides específicos de acesso para este usuário (formato JSON)';
COMMENT ON VIEW public.view_usuarios_planos IS 'View que combina usuários com seus planos e permissões';