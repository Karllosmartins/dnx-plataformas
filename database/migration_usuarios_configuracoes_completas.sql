-- Migration: Adicionar configurações completas para usuários
-- Data: 2025-01-15
-- Descrição: Adiciona colunas para configurações operacionais, APIs, integrações e outras configurações de usuário

-- Adicionar novas colunas na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS delay_entre_mensagens INTEGER DEFAULT 30;
ALTER TABLE users ADD COLUMN IF NOT EXISTS delay_apos_intervencao INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS inicio_expediente INTEGER DEFAULT 8;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fim_expediente INTEGER DEFAULT 18;
ALTER TABLE users ADD COLUMN IF NOT EXISTS numero_instancias INTEGER DEFAULT 1;

-- Tipos de negócio (JSON array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tipos_negocio TEXT;

-- Integração CRM
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_usuario TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_senha TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm_token TEXT;

-- Google Drive
ALTER TABLE users ADD COLUMN IF NOT EXISTS pasta_drive TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_pasta_rag TEXT;

-- Informações do cliente
ALTER TABLE users ADD COLUMN IF NOT EXISTS nome_cliente_empresa TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS structured_output_schema TEXT;

-- APIs de IA
ALTER TABLE users ADD COLUMN IF NOT EXISTS openai_api_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS modelo_ia TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tipo_tool_supabase TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reasoning_effort TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key_dados TEXT;

-- ElevenLabs
ALTER TABLE users ADD COLUMN IF NOT EXISTS elevenlabs_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS elevenlabs_voice_id TEXT;

-- FireCrawl
ALTER TABLE users ADD COLUMN IF NOT EXISTS firecrawl_api_key TEXT;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN users.delay_entre_mensagens IS 'Delay entre mensagens em segundos';
COMMENT ON COLUMN users.delay_apos_intervencao IS 'Delay após intervenção em minutos';
COMMENT ON COLUMN users.inicio_expediente IS 'Hora de início do expediente (0-23)';
COMMENT ON COLUMN users.fim_expediente IS 'Hora de fim do expediente (0-23)';
COMMENT ON COLUMN users.numero_instancias IS 'Número de instâncias simultâneas';
COMMENT ON COLUMN users.tipos_negocio IS 'Array JSON com tipos de negócio selecionados';
COMMENT ON COLUMN users.crm_url IS 'URL de integração com CRM';
COMMENT ON COLUMN users.crm_usuario IS 'Usuário para autenticação no CRM';
COMMENT ON COLUMN users.crm_senha IS 'Senha para autenticação no CRM';
COMMENT ON COLUMN users.crm_token IS 'Token de integração com CRM';
COMMENT ON COLUMN users.pasta_drive IS 'ID da pasta no Google Drive';
COMMENT ON COLUMN users.id_pasta_rag IS 'ID da pasta RAG no Google Drive';
COMMENT ON COLUMN users.nome_cliente_empresa IS 'Nome do cliente/empresa';
COMMENT ON COLUMN users.structured_output_schema IS 'Schema JSON para structured output';
COMMENT ON COLUMN users.openai_api_token IS 'Token da API OpenAI';
COMMENT ON COLUMN users.gemini_api_key IS 'Chave da API Gemini';
COMMENT ON COLUMN users.modelo_ia IS 'Modelo de IA preferido';
COMMENT ON COLUMN users.tipo_tool_supabase IS 'Tipo de tool Supabase';
COMMENT ON COLUMN users.reasoning_effort IS 'Nível de reasoning effort';
COMMENT ON COLUMN users.api_key_dados IS 'API Key para dados/profile';
COMMENT ON COLUMN users.elevenlabs_api_key IS 'Chave da API ElevenLabs';
COMMENT ON COLUMN users.elevenlabs_voice_id IS 'ID da voz no ElevenLabs';
COMMENT ON COLUMN users.firecrawl_api_key IS 'Chave da API FireCrawl';

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_tipos_negocio ON users USING GIN (tipos_negocio);
CREATE INDEX IF NOT EXISTS idx_users_inicio_expediente ON users (inicio_expediente);
CREATE INDEX IF NOT EXISTS idx_users_fim_expediente ON users (fim_expediente);

-- Atualizar a view de usuários com planos para incluir as novas colunas
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
    p.preco as plano_preco,
    p.permissoes as plano_permissoes,
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
COMMENT ON VIEW view_usuarios_planos IS 'View que combina dados de usuários com informações dos planos e todas as configurações';