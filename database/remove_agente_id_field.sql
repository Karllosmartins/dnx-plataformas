-- Migration: Remover campo agente_id da tabela agentes_ia
-- Data: 2025-10-05
-- Descrição: O campo agente_id é redundante, vamos usar apenas o id (auto-incremento) como identificador único

-- Remover o campo agente_id da tabela agentes_ia
ALTER TABLE public.agentes_ia DROP COLUMN IF EXISTS agente_id;

-- Comentário na tabela
COMMENT ON TABLE public.agentes_ia IS 'Tabela de agentes de IA - usa id auto-incremento como identificador único';
