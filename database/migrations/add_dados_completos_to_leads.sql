-- Migration: Adicionar campo dados_completos para armazenar dados completos da extração
-- Data: 2025-01-26

-- Adicionar campo dados_completos JSONB para armazenar todos os dados da API Profile
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS dados_completos JSONB DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.leads.dados_completos IS 'Dados completos da extração da API Profile (CNPJ ou CPF) em formato JSON';

-- Criar índice GIN para queries eficientes em JSON
CREATE INDEX IF NOT EXISTS idx_leads_dados_completos ON public.leads USING GIN (dados_completos);