-- Adicionar controle de acesso para arquivos
ALTER TABLE public.planos
ADD COLUMN IF NOT EXISTS acesso_arquivos BOOLEAN DEFAULT FALSE;

-- Atualizar planos existentes (Enterprise tem acesso)
UPDATE public.planos
SET acesso_arquivos = TRUE
WHERE nome = 'enterprise';

-- Atualizar a view view_usuarios_planos
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
  p.acesso_integracoes,
  p.acesso_arquivos,
  p.limite_leads,
  p.limite_consultas,
  p.limite_instancias,
  u.plano_customizado,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.planos p ON u.plano_id = p.id;
