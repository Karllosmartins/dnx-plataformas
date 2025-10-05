-- Migration: Adicionar valor padrão para acesso_integracoes
-- Data: 2025-10-05
-- Descrição: Definir acesso_integracoes como true por padrão e atualizar planos existentes

-- Atualizar coluna para ter default true
ALTER TABLE public.planos
ALTER COLUMN acesso_integracoes SET DEFAULT true;

-- Atualizar planos existentes que estão null
UPDATE public.planos
SET acesso_integracoes = true
WHERE acesso_integracoes IS NULL;

-- Comentário
COMMENT ON COLUMN public.planos.acesso_integracoes IS 'Define se o plano tem acesso à aba de Integrações (ZapSign, Google Calendar, Asaas, etc)';
