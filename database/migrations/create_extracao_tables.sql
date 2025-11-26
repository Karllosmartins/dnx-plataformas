-- Migration: Criar tabelas para dados completos da extração Profile
-- Data: 2025-01-26

-- =====================================================
-- TABELA: extracao_dados_pj (Pessoa Jurídica - CNPJ)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.extracao_dados_pj (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Dados da Empresa
  cnpj VARCHAR(18) NOT NULL,
  ds_nome_razao TEXT,
  ds_nome_fantasia TEXT,
  ds_matriz VARCHAR(1),
  dt_abertura DATE,
  cd_cnae VARCHAR(20),
  descricao_cnae TEXT,
  cd_njur VARCHAR(10),
  vl_capital_social DECIMAL(15,2),
  nr_funcionarios INTEGER,
  nr_funcionarios_grupo INTEGER,
  ds_porte VARCHAR(50),
  vl_faturamento_presumido_anual DECIMAL(15,2),
  tipo_pj VARCHAR(50),
  nr_proprietarios INTEGER,
  risco VARCHAR(50),
  score_pj INTEGER,

  -- Endereço
  ds_endereco TEXT,
  ds_tipo VARCHAR(10),
  ds_titulo VARCHAR(50),
  ds_logradouro TEXT,
  ds_numero VARCHAR(20),
  ds_complemento TEXT,
  ds_bairro VARCHAR(100),
  ds_cidade VARCHAR(100),
  ds_uf VARCHAR(2),
  ds_cep VARCHAR(10),

  -- Telefones
  cel1_ddd VARCHAR(3),
  cel1_numero VARCHAR(20),
  cel1_operadora VARCHAR(50),
  cel2_ddd VARCHAR(3),
  cel2_numero VARCHAR(20),
  cel2_operadora VARCHAR(50),
  fixo1_ddd VARCHAR(3),
  fixo1_numero VARCHAR(20),
  fixo2_ddd VARCHAR(3),
  fixo2_numero VARCHAR(20),

  -- Email
  ds_email TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para extracao_dados_pj
CREATE INDEX idx_extracao_pj_lead_id ON public.extracao_dados_pj(lead_id);
CREATE INDEX idx_extracao_pj_user_id ON public.extracao_dados_pj(user_id);
CREATE INDEX idx_extracao_pj_cnpj ON public.extracao_dados_pj(cnpj);

-- RLS para extracao_dados_pj
ALTER TABLE public.extracao_dados_pj ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extracao_pj_policy" ON public.extracao_dados_pj
  FOR ALL TO authenticated
  USING (true);

-- =====================================================
-- TABELA: extracao_dados_socios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.extracao_dados_socios (
  id BIGSERIAL PRIMARY KEY,
  extracao_pj_id BIGINT NOT NULL REFERENCES public.extracao_dados_pj(id) ON DELETE CASCADE,
  lead_id BIGINT REFERENCES public.leads(id) ON DELETE SET NULL, -- Lead do sócio (se cadastrado)
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Dados do Sócio
  cnpj_empresa VARCHAR(18) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  cpf_formatado VARCHAR(14),
  nome TEXT,
  data_nascimento DATE,
  participacao DECIMAL(5,2),
  qualificacao VARCHAR(100),
  data_entrada DATE,

  -- Contato
  ds_email TEXT,
  cel1_ddd VARCHAR(3),
  cel1_numero VARCHAR(20),
  cel1_operadora VARCHAR(50),
  cel2_ddd VARCHAR(3),
  cel2_numero VARCHAR(20),
  cel2_operadora VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para extracao_dados_socios
CREATE INDEX idx_extracao_socios_pj_id ON public.extracao_dados_socios(extracao_pj_id);
CREATE INDEX idx_extracao_socios_lead_id ON public.extracao_dados_socios(lead_id);
CREATE INDEX idx_extracao_socios_user_id ON public.extracao_dados_socios(user_id);
CREATE INDEX idx_extracao_socios_cpf ON public.extracao_dados_socios(cpf);

-- RLS para extracao_dados_socios
ALTER TABLE public.extracao_dados_socios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extracao_socios_policy" ON public.extracao_dados_socios
  FOR ALL TO authenticated
  USING (true);

-- =====================================================
-- TABELA: extracao_dados_pf (Pessoa Física - CPF)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.extracao_dados_pf (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Dados Pessoais
  cpf VARCHAR(14) NOT NULL,
  ds_nome TEXT,
  ds_nome_mae TEXT,
  ds_nasc DATE,
  idade INTEGER,
  ds_estado_civil VARCHAR(50),
  nr_dependentes INTEGER,
  cd_cbo VARCHAR(20),
  ds_sexo VARCHAR(1),
  ds_classe_social VARCHAR(2),
  vl_renda DECIMAL(15,2),
  score INTEGER,
  score_descr VARCHAR(50),

  -- Endereço
  ds_endereco TEXT,
  ds_tipo VARCHAR(10),
  ds_titulo VARCHAR(50),
  ds_logradouro TEXT,
  ds_numero VARCHAR(20),
  ds_complemento TEXT,
  ds_bairro VARCHAR(100),
  ds_cidade VARCHAR(100),
  ds_uf VARCHAR(2),
  ds_cep VARCHAR(10),
  descricao_cbo TEXT,

  -- Telefones
  cel1_ddd VARCHAR(3),
  cel1_numero VARCHAR(20),
  cel1_operadora VARCHAR(50),
  cel2_ddd VARCHAR(3),
  cel2_numero VARCHAR(20),
  cel2_operadora VARCHAR(50),
  fixo1_ddd VARCHAR(3),
  fixo1_numero VARCHAR(20),
  fixo2_ddd VARCHAR(3),
  fixo2_numero VARCHAR(20),

  -- Email
  ds_email TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para extracao_dados_pf
CREATE INDEX idx_extracao_pf_lead_id ON public.extracao_dados_pf(lead_id);
CREATE INDEX idx_extracao_pf_user_id ON public.extracao_dados_pf(user_id);
CREATE INDEX idx_extracao_pf_cpf ON public.extracao_dados_pf(cpf);

-- RLS para extracao_dados_pf
ALTER TABLE public.extracao_dados_pf ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extracao_pf_policy" ON public.extracao_dados_pf
  FOR ALL TO authenticated
  USING (true);