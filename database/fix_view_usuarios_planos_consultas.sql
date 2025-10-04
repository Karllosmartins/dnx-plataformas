-- Migration: Adicionar consultas_realizadas e leads_consumidos
-- Data: 2025-10-04
-- Descrição: Adicionar campos de consumo na tabela users e atualizar view

-- 1. Adicionar colunas na tabela users se não existirem
ALTER TABLE users ADD COLUMN IF NOT EXISTS leads_consumidos INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consultas_realizadas INTEGER DEFAULT 0;

-- 2. Adicionar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_leads_consumidos ON users (leads_consumidos);
CREATE INDEX IF NOT EXISTS idx_users_consultas_realizadas ON users (consultas_realizadas);

-- 3. Recriar a view com os novos campos
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
    p.preco as plano_preco,
    p.limite_leads as plano_limite_leads,
    p.limite_consultas as plano_limite_consultas,
    p.limite_instancias as plano_limite_instancias,
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
