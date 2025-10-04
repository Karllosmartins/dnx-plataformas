-- Migration: Adicionar consultas_realizadas e leads_consumidos na view_usuarios_planos
-- Data: 2025-10-04
-- Descrição: Corrigir view para incluir campos de consumo de recursos

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
    -- Configurações operacionais
    u.delay_entre_mensagens,
    u.delay_apos_intervencao,
    u.inicio_expediente,
    u.fim_expediente,
    u.numero_instancias,
    -- Tipos de negócio
    u.tipos_negocio,
    -- Integração CRM
    u.crm_url,
    u.crm_usuario,
    u.crm_senha,
    u.crm_token,
    -- Google Drive
    u.pasta_drive,
    u.id_pasta_rag,
    -- Informações do cliente
    u.nome_cliente_empresa,
    u.structured_output_schema,
    -- APIs de IA
    u.openai_api_token,
    u.gemini_api_key,
    u.modelo_ia,
    u.tipo_tool_supabase,
    u.reasoning_effort,
    u.api_key_dados,
    -- ElevenLabs
    u.elevenlabs_api_key,
    u.elevenlabs_voice_id,
    -- FireCrawl
    u.firecrawl_api_key,
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
