-- Migration 006: Adicionar coluna mercadopago na tabela credencias_diversas
-- Data: 2025-12-04
-- Descrição: Adiciona suporte para integração com Mercado Pago

-- Adicionar coluna mercadopago se não existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'credencias_diversas') THEN

    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'credencias_diversas'
      AND column_name = 'mercadopago'
    ) THEN
      ALTER TABLE credencias_diversas
      ADD COLUMN mercadopago JSONB DEFAULT '{"access_token": ""}'::jsonb;

      RAISE NOTICE '✅ Coluna mercadopago adicionada à tabela credencias_diversas';
    ELSE
      RAISE NOTICE 'ℹ️  Coluna mercadopago já existe em credencias_diversas';
    END IF;

  ELSE
    RAISE NOTICE '⚠️  Tabela credencias_diversas não existe';
  END IF;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN credencias_diversas.mercadopago IS 'Credenciais de acesso ao Mercado Pago (access_token)';
