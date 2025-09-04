-- Criação das tabelas para contagens e extrações da API Profile

-- Tabela para armazenar contagens criadas
CREATE TABLE IF NOT EXISTS contagens_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_contagem_api INTEGER NOT NULL, -- ID retornado pela API Profile
    nome_contagem VARCHAR(255) NOT NULL,
    tipo_pessoa VARCHAR(2) NOT NULL CHECK (tipo_pessoa IN ('pf', 'pj')),
    
    -- Dados da contagem
    total_registros INTEGER NOT NULL DEFAULT 0,
    dados_filtros JSONB, -- Filtros aplicados na contagem
    dados_resultado JSONB, -- Resultado completo retornado pela API
    
    -- Status e datas
    status VARCHAR(20) NOT NULL DEFAULT 'processando' CHECK (status IN ('processando', 'concluida', 'erro')),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para armazenar extrações solicitadas
CREATE TABLE IF NOT EXISTS extracoes_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contagem_id BIGINT NOT NULL REFERENCES contagens_profile(id) ON DELETE CASCADE,
    id_extracao_api INTEGER, -- ID da extração na API Profile (se aplicável)
    
    -- Dados da extração
    nome_arquivo VARCHAR(255) NOT NULL,
    formato_arquivo VARCHAR(10) NOT NULL DEFAULT 'csv' CHECK (formato_arquivo IN ('csv', 'excel', 'json')),
    url_download TEXT, -- URL temporária para download
    tamanho_arquivo BIGINT, -- Tamanho em bytes
    total_registros_extraidos INTEGER NOT NULL DEFAULT 0,
    
    -- Status e datas
    status VARCHAR(20) NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'processando', 'concluida', 'erro', 'expirada')),
    data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_conclusao TIMESTAMPTZ,
    data_expiracao TIMESTAMPTZ, -- Link expira após X dias
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contagens_profile_user_id ON contagens_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_contagens_profile_id_contagem_api ON contagens_profile(id_contagem_api);
CREATE INDEX IF NOT EXISTS idx_contagens_profile_status ON contagens_profile(status);
CREATE INDEX IF NOT EXISTS idx_contagens_profile_created_at ON contagens_profile(created_at);

CREATE INDEX IF NOT EXISTS idx_extracoes_profile_user_id ON extracoes_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_extracoes_profile_contagem_id ON extracoes_profile(contagem_id);
CREATE INDEX IF NOT EXISTS idx_extracoes_profile_status ON extracoes_profile(status);
CREATE INDEX IF NOT EXISTS idx_extracoes_profile_created_at ON extracoes_profile(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contagens_profile_updated_at 
    BEFORE UPDATE ON contagens_profile 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extracoes_profile_updated_at 
    BEFORE UPDATE ON extracoes_profile 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE contagens_profile IS 'Armazena contagens criadas na API Profile pelos usuários';
COMMENT ON TABLE extracoes_profile IS 'Armazena extrações/downloads solicitados das contagens';

COMMENT ON COLUMN contagens_profile.id_contagem_api IS 'ID da contagem retornado pela API Profile';
COMMENT ON COLUMN contagens_profile.dados_filtros IS 'JSON com todos os filtros aplicados na contagem';
COMMENT ON COLUMN contagens_profile.dados_resultado IS 'JSON com o resultado completo retornado pela API Profile';

COMMENT ON COLUMN extracoes_profile.contagem_id IS 'Referência para a contagem da qual esta extração foi gerada';
COMMENT ON COLUMN extracoes_profile.url_download IS 'URL temporária para download do arquivo extraído';
COMMENT ON COLUMN extracoes_profile.data_expiracao IS 'Data em que o link de download expira';