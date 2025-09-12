-- =====================================================
-- MIGRAÇÃO 001: Sistema Multi-Negócio
-- Criação das tabelas tipos_negocio e user_tipos_negocio
-- =====================================================

-- 1. TABELA TIPOS_NEGOCIO (configurada pelo admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tipos_negocio (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificação do tipo
  nome VARCHAR(50) UNIQUE NOT NULL, -- 'limpa_nome', 'previdenciario', 'b2b'
  nome_exibicao VARCHAR(100) NOT NULL, -- "Limpa Nome", "Advogado Previdenciário"
  descricao TEXT,
  icone VARCHAR(50) DEFAULT 'building', -- Nome do ícone para UI
  cor VARCHAR(7) DEFAULT '#3B82F6', -- Cor hexadecimal
  
  -- Configuração dos campos específicos
  campos_personalizados JSONB DEFAULT '[]'::jsonb,
  status_personalizados JSONB DEFAULT '[]'::jsonb,
  
  -- Configuração de métricas
  metricas_config JSONB DEFAULT '{
    "metricas_principais": [],
    "campos_receita": [],
    "campos_conversao": []
  }'::jsonb,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tipos_negocio
CREATE INDEX IF NOT EXISTS idx_tipos_negocio_nome ON public.tipos_negocio(nome);
CREATE INDEX IF NOT EXISTS idx_tipos_negocio_ativo ON public.tipos_negocio(ativo);

-- RLS para tipos_negocio (apenas admins podem gerenciar)
ALTER TABLE public.tipos_negocio ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler tipos ativos, apenas admins podem modificar
CREATE POLICY "tipos_negocio_read_policy" ON public.tipos_negocio
  FOR SELECT USING (ativo = true);

CREATE POLICY "tipos_negocio_admin_policy" ON public.tipos_negocio
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::bigint 
      AND users.role = 'admin'
    )
  );

-- 2. TABELA USER_TIPOS_NEGOCIO (atribuição aos usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_tipos_negocio (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo_negocio_id BIGINT NOT NULL REFERENCES public.tipos_negocio(id) ON DELETE CASCADE,
  
  -- Configurações específicas do usuário para este tipo (se necessário)
  configuracoes_usuario JSONB DEFAULT '{}'::jsonb,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_tipo UNIQUE (user_id, tipo_negocio_id)
);

-- Índices para user_tipos_negocio
CREATE INDEX IF NOT EXISTS idx_user_tipos_negocio_user_id ON public.user_tipos_negocio(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tipos_negocio_tipo_id ON public.user_tipos_negocio(tipo_negocio_id);
CREATE INDEX IF NOT EXISTS idx_user_tipos_negocio_ativo ON public.user_tipos_negocio(ativo);

-- RLS para user_tipos_negocio
ALTER TABLE public.user_tipos_negocio ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem apenas suas atribuições
CREATE POLICY "user_tipos_negocio_policy" ON public.user_tipos_negocio
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()::bigint OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::bigint 
    AND users.role = 'admin'
  ));

-- 3. TRIGGERS para updated_at
-- =====================================================
CREATE TRIGGER update_tipos_negocio_updated_at 
  BEFORE UPDATE ON public.tipos_negocio 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tipos_negocio_updated_at 
  BEFORE UPDATE ON public.user_tipos_negocio 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. COMENTÁRIOS para documentação
-- =====================================================
COMMENT ON TABLE public.tipos_negocio IS 'Tipos de negócio configurados pelo administrador (Limpa Nome, Previdenciário, B2B, etc.)';
COMMENT ON TABLE public.user_tipos_negocio IS 'Atribuição de tipos de negócio aos usuários';

COMMENT ON COLUMN public.tipos_negocio.campos_personalizados IS 'Array JSON com definição dos campos específicos do tipo';
COMMENT ON COLUMN public.tipos_negocio.status_personalizados IS 'Array JSON com os status específicos do funil deste tipo';
COMMENT ON COLUMN public.tipos_negocio.metricas_config IS 'Configuração das métricas específicas do tipo de negócio';