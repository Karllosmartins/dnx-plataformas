-- Migration: Atualizar view_usuarios_planos com campos de consumo
-- Data: 2025-10-04
-- Descrição: Adicionar leads_consumidos e consultas_realizadas na view

-- Recriar a view incluindo os campos de consumo
DROP VIEW IF EXISTS view_usuarios_planos;

CREATE VIEW view_usuarios_planos AS
SELECT
    u.id,
    u.name,
    u.email,
    u.cpf,
    u.telefone,
    u.role,
    u.active,
    u.limite_leads,
    u.limite_consultas,
    u.leads_consumidos,
    u.consultas_realizadas,
    u.plano_id,
    u.plano,
    u.numero_instancias,
    u.plano_customizado,
    u.ultimo_reset_contagem,
    -- Dados do plano
    p.nome as plano_nome,
    p.descricao as plano_descricao,
    p.limite_leads as plano_limite_leads,
    p.limite_consultas as plano_limite_consultas,
    p.limite_instancias as plano_limite_instancias,
    p.ativo as plano_ativo,
    p.acesso_dashboard,
    p.acesso_crm,
    p.acesso_whatsapp,
    p.acesso_disparo_simples,
    p.acesso_disparo_ia,
    p.acesso_agentes_ia,
    p.acesso_extracao_leads,
    p.acesso_enriquecimento,
    p.acesso_consulta,
    p.acesso_usuarios,
    u.created_at,
    u.updated_at
FROM
    users u
LEFT JOIN
    planos p ON u.plano_id = p.id;

-- Conceder permissões na view
GRANT SELECT ON view_usuarios_planos TO authenticated;
GRANT SELECT ON view_usuarios_planos TO anon;

-- Comentário na view
COMMENT ON VIEW view_usuarios_planos IS 'View que combina dados de usuários com informações dos planos incluindo consumo de recursos';
