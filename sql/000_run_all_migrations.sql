-- =====================================================
-- SCRIPT MESTRE: Sistema Multi-Negócio
-- Executa todas as migrações em ordem
-- =====================================================

-- Informações da migração
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE 'INICIANDO MIGRAÇÃO: Sistema Multi-Negócio';
  RAISE NOTICE 'Data: %', NOW();
  RAISE NOTICE '======================================================';
  RAISE NOTICE '';
END $$;

-- 1. CRIAR TABELAS PRINCIPAIS (tipos_negocio e user_tipos_negocio)
-- =====================================================
\echo 'Executando: 001_create_tipos_negocio.sql'
\i sql/001_create_tipos_negocio.sql

-- 2. MODIFICAR TABELA LEADS
-- =====================================================  
\echo 'Executando: 002_alter_leads_table.sql'
\i sql/002_alter_leads_table.sql

-- 3. INSERIR TIPOS PADRÃO
-- =====================================================
\echo 'Executando: 003_insert_tipos_padrao.sql' 
\i sql/003_insert_tipos_padrao.sql

-- 4. CRIAR VIEWS PARA RELATÓRIOS
-- =====================================================
\echo 'Executando: 004_create_views_relatorios.sql'
\i sql/004_create_views_relatorios.sql

-- Verificações finais
DO $$
DECLARE 
  tipos_count INTEGER;
  leads_migrados INTEGER;
  views_count INTEGER;
BEGIN
  -- Verificar tipos criados
  SELECT COUNT(*) INTO tipos_count FROM public.tipos_negocio WHERE ativo = true;
  RAISE NOTICE 'Tipos de negócio criados: %', tipos_count;
  
  -- Verificar leads migrados
  SELECT COUNT(*) INTO leads_migrados FROM public.leads WHERE tipo_negocio_id IS NOT NULL;
  RAISE NOTICE 'Leads com tipo atribuído: %', leads_migrados;
  
  -- Verificar views criadas
  SELECT COUNT(*) INTO views_count 
  FROM information_schema.views 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'v_%_tipo%';
  RAISE NOTICE 'Views de relatório criadas: %', views_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Implementar interface administrativa';
  RAISE NOTICE '2. Adaptar formulário de leads'; 
  RAISE NOTICE '3. Atualizar dashboard com novas métricas';
  RAISE NOTICE '';
END $$;