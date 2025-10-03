-- =====================================================
-- MIGRAÇÃO: Adicionar campo acesso_consulta na tabela planos
-- =====================================================

-- Adicionar coluna acesso_consulta se não existir
ALTER TABLE public.planos
ADD COLUMN IF NOT EXISTS acesso_consulta BOOLEAN DEFAULT FALSE;

-- Atualizar planos existentes para incluir acesso_consulta
-- Enterprise tem acesso a consulta
UPDATE public.planos
SET acesso_consulta = TRUE
WHERE nome = 'enterprise';

-- Atualizar a view para incluir acesso_consulta
CREATE OR REPLACE VIEW public.view_usuarios_planos AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.active,
  u.plano as plano_legado,
  u.plano_id,
  p.nome as plano_nome,
  p.descricao as plano_descricao,
  p.acesso_dashboard,
  p.acesso_crm,
  p.acesso_whatsapp,
  p.acesso_disparo_simples,
  p.acesso_disparo_ia,
  p.acesso_agentes_ia,
  p.acesso_extracao_leads,
  p.acesso_enriquecimento,
  p.acesso_usuarios,
  p.acesso_consulta,
  p.limite_leads,
  p.limite_consultas,
  p.limite_instancias,
  u.plano_customizado,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.planos p ON u.plano_id = p.id;
