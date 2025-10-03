-- =====================================================
-- FIX: Adicionar coluna api_key_dados na tabela users
-- =====================================================

-- Adicionar coluna se não existir
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS api_key_dados TEXT;

-- Adicionar comentário
COMMENT ON COLUMN public.users.api_key_dados IS 'API Key para dados/profile (Profile API)';
