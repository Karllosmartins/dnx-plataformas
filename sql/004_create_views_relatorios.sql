-- =====================================================
-- MIGRAÇÃO 004: Views para Relatórios Segmentados
-- Views para dashboard e métricas por tipo de negócio
-- =====================================================

-- 1. VIEW: LEADS COM TIPO DE NEGÓCIO (base para outras views)
-- =====================================================
CREATE OR REPLACE VIEW v_leads_com_tipo AS
SELECT 
  l.*,
  tn.nome as tipo_negocio_nome,
  tn.nome_exibicao as tipo_negocio_display,
  tn.cor as tipo_negocio_cor,
  tn.icone as tipo_negocio_icone,
  tn.campos_personalizados,
  tn.status_personalizados,
  tn.metricas_config,
  
  -- Campos calculados úteis
  COALESCE(l.status_generico, l.status_limpa_nome) as status_atual,
  EXTRACT(days FROM (NOW() - l.created_at)) as dias_desde_criacao,
  EXTRACT(days FROM (NOW() - l.data_ultima_atividade)) as dias_sem_atividade
  
FROM public.leads l
LEFT JOIN public.tipos_negocio tn ON l.tipo_negocio_id = tn.id
WHERE tn.ativo = true OR tn.id IS NULL;

-- 2. VIEW: DASHBOARD GERAL POR TIPO
-- =====================================================
CREATE OR REPLACE VIEW v_dashboard_tipos AS
SELECT 
  u.id as user_id,
  u.name as usuario_nome,
  tn.id as tipo_id,
  tn.nome as tipo_nome,
  tn.nome_exibicao as tipo_display,
  tn.cor as tipo_cor,
  tn.icone as tipo_icone,
  
  -- Métricas básicas
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_ultimo_mes,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as leads_ultima_semana,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE THEN 1 END) as leads_hoje,
  
  -- Métricas de atividade
  COUNT(CASE WHEN l.data_ultima_atividade >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as leads_ativos_semana,
  COUNT(CASE WHEN l.data_ultima_atividade < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_inativos_mes,
  
  -- Métricas específicas do Limpa Nome
  COUNT(CASE WHEN tn.nome = 'limpa_nome' AND l.valor_pago_consulta > 0 THEN 1 END) as consultas_pagas_limpa_nome,
  COALESCE(SUM(CASE WHEN tn.nome = 'limpa_nome' THEN l.valor_contrato END), 0) as receita_contratos_limpa_nome,
  COUNT(CASE WHEN tn.nome = 'limpa_nome' AND l.status_limpa_nome = 'cliente_fechado' THEN 1 END) as contratos_fechados_limpa_nome,
  
  -- Métricas específicas do B2B
  COUNT(CASE WHEN tn.nome = 'b2b' AND l.responsavel_encontrado = true THEN 1 END) as responsaveis_encontrados_b2b,
  COUNT(CASE WHEN tn.nome = 'b2b' AND l.falando_com_responsavel = true THEN 1 END) as conversas_responsavel_b2b,
  
  -- Métricas personalizadas via JSONB
  COUNT(CASE WHEN l.dados_personalizados->>'contrato_assinado' = 'true' THEN 1 END) as contratos_assinados_previdenciario,
  COUNT(CASE WHEN l.dados_personalizados->>'caso_viavel' = 'true' THEN 1 END) as casos_viaveis_previdenciario,
  COUNT(CASE WHEN l.dados_personalizados->>'apresentacao_realizada' = 'true' THEN 1 END) as apresentacoes_b2b,
  
  -- Valores médios
  ROUND(AVG(CASE WHEN tn.nome = 'limpa_nome' THEN l.valor_contrato END), 2) as ticket_medio_limpa_nome,
  ROUND(AVG((l.dados_personalizados->>'valor_estimado_causa')::numeric), 2) as valor_medio_causa_previdenciario,
  ROUND(AVG((l.dados_personalizados->>'budget_disponivel')::numeric), 2) as budget_medio_b2b,
  
  -- Taxas de conversão
  CASE 
    WHEN COUNT(l.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN l.valor_pago_consulta > 0 THEN 1 END)::numeric / COUNT(l.id) * 100), 2)
    ELSE 0 
  END as taxa_conversao_consulta,
  
  CASE 
    WHEN COUNT(CASE WHEN tn.nome = 'b2b' THEN 1 END) > 0 THEN
      ROUND((COUNT(CASE WHEN l.responsavel_encontrado = true THEN 1 END)::numeric / COUNT(CASE WHEN tn.nome = 'b2b' THEN 1 END) * 100), 2)
    ELSE 0
  END as taxa_encontrar_responsavel

FROM public.users u
LEFT JOIN public.user_tipos_negocio utn ON u.id = utn.user_id AND utn.ativo = true
LEFT JOIN public.tipos_negocio tn ON utn.tipo_negocio_id = tn.id AND tn.ativo = true
LEFT JOIN public.leads l ON u.id = l.user_id AND l.tipo_negocio_id = tn.id
WHERE u.active = true
GROUP BY u.id, u.name, tn.id, tn.nome, tn.nome_exibicao, tn.cor, tn.icone
ORDER BY u.name, tn.ordem;

-- 3. VIEW: FUNIL DE CONVERSÃO POR TIPO
-- =====================================================
CREATE OR REPLACE VIEW v_funil_por_tipo AS
SELECT 
  u.id as user_id,
  u.name as usuario_nome,
  tn.nome as tipo_nome,
  tn.nome_exibicao as tipo_display,
  tn.cor as tipo_cor,
  
  -- Status distribution para cada tipo
  jsonb_object_agg(
    COALESCE(l.status_generico, l.status_limpa_nome, 'sem_status'),
    COUNT(l.id)
  ) FILTER (WHERE l.id IS NOT NULL) as distribuicao_status,
  
  -- Total de leads
  COUNT(l.id) as total_leads,
  
  -- Cálculo de taxa de conversão por tipo
  CASE 
    WHEN tn.nome = 'limpa_nome' THEN
      ROUND(
        (COUNT(CASE WHEN l.status_limpa_nome = 'cliente_fechado' THEN 1 END)::numeric / 
         NULLIF(COUNT(l.id), 0)) * 100, 2
      )
    WHEN tn.nome = 'previdenciario' THEN
      ROUND(
        (COUNT(CASE WHEN l.dados_personalizados->>'contrato_assinado' = 'true' THEN 1 END)::numeric /
         NULLIF(COUNT(l.id), 0)) * 100, 2
      )
    WHEN tn.nome = 'b2b' THEN
      ROUND(
        (COUNT(CASE WHEN l.dados_personalizados->>'deal_fechado' = 'true' THEN 1 END)::numeric /
         NULLIF(COUNT(l.id), 0)) * 100, 2
      )
    ELSE 0
  END as taxa_conversao_final,
  
  -- Tempo médio no funil (em dias)
  ROUND(AVG(EXTRACT(days FROM (COALESCE(l.data_fechamento, NOW()) - l.created_at))), 1) as tempo_medio_funil_dias

FROM public.users u
LEFT JOIN public.user_tipos_negocio utn ON u.id = utn.user_id AND utn.ativo = true
LEFT JOIN public.tipos_negocio tn ON utn.tipo_negocio_id = tn.id AND tn.ativo = true
LEFT JOIN public.leads l ON u.id = l.user_id AND l.tipo_negocio_id = tn.id
WHERE u.active = true AND tn.id IS NOT NULL
GROUP BY u.id, u.name, tn.nome, tn.nome_exibicao, tn.cor
ORDER BY u.name, tn.nome;

-- 4. VIEW: MÉTRICAS DETALHADAS POR PERÍODO
-- =====================================================
CREATE OR REPLACE VIEW v_metricas_periodo AS
SELECT 
  u.id as user_id,
  u.name as usuario_nome,
  tn.nome as tipo_nome,
  tn.nome_exibicao as tipo_display,
  
  -- Métricas por período
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE THEN 1 END) as leads_hoje,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as leads_7_dias,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_30_dias,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as leads_90_dias,
  
  -- Receita por período (Limpa Nome)
  COALESCE(SUM(CASE 
    WHEN tn.nome = 'limpa_nome' AND l.data_pagamento >= CURRENT_DATE - INTERVAL '30 days' 
    THEN l.valor_pago_consulta 
  END), 0) as receita_consultas_30_dias,
  
  COALESCE(SUM(CASE 
    WHEN tn.nome = 'limpa_nome' AND l.data_fechamento >= CURRENT_DATE - INTERVAL '30 days'
    THEN l.valor_contrato 
  END), 0) as receita_contratos_30_dias,
  
  -- Conversões por período
  COUNT(CASE 
    WHEN l.data_pagamento >= CURRENT_DATE - INTERVAL '30 days' AND l.valor_pago_consulta > 0
    THEN 1 
  END) as conversoes_consulta_30_dias,
  
  COUNT(CASE 
    WHEN l.data_fechamento >= CURRENT_DATE - INTERVAL '30 days' 
      AND (l.status_limpa_nome = 'cliente_fechado' OR l.dados_personalizados->>'contrato_assinado' = 'true')
    THEN 1 
  END) as conversoes_contrato_30_dias

FROM public.users u
LEFT JOIN public.user_tipos_negocio utn ON u.id = utn.user_id AND utn.ativo = true
LEFT JOIN public.tipos_negocio tn ON utn.tipo_negocio_id = tn.id AND tn.ativo = true  
LEFT JOIN public.leads l ON u.id = l.user_id AND l.tipo_negocio_id = tn.id
WHERE u.active = true AND tn.id IS NOT NULL
GROUP BY u.id, u.name, tn.nome, tn.nome_exibicao
ORDER BY u.name, tn.nome;

-- 5. VIEW: ANÁLISE DE PERFORMANCE POR TIPO
-- =====================================================
CREATE OR REPLACE VIEW v_performance_tipos AS
SELECT 
  tn.nome as tipo_nome,
  tn.nome_exibicao as tipo_display,
  tn.cor as tipo_cor,
  
  -- Estatísticas gerais
  COUNT(DISTINCT l.user_id) as usuarios_usando,
  COUNT(l.id) as total_leads_sistema,
  ROUND(AVG(EXTRACT(days FROM (NOW() - l.created_at))), 1) as idade_media_leads,
  
  -- Performance por tipo
  CASE 
    WHEN tn.nome = 'limpa_nome' THEN
      CONCAT(
        COUNT(CASE WHEN l.valor_pago_consulta > 0 THEN 1 END), ' consultas pagas de ', COUNT(l.id), ' leads (',
        ROUND((COUNT(CASE WHEN l.valor_pago_consulta > 0 THEN 1 END)::numeric / NULLIF(COUNT(l.id), 0)) * 100, 1), '%)'
      )
    WHEN tn.nome = 'previdenciario' THEN
      CONCAT(
        COUNT(CASE WHEN l.dados_personalizados->>'contrato_assinado' = 'true' THEN 1 END), ' contratos de ', COUNT(l.id), ' casos (',
        ROUND((COUNT(CASE WHEN l.dados_personalizados->>'contrato_assinado' = 'true' THEN 1 END)::numeric / NULLIF(COUNT(l.id), 0)) * 100, 1), '%)'
      )
    WHEN tn.nome = 'b2b' THEN
      CONCAT(
        COUNT(CASE WHEN l.responsavel_encontrado = true THEN 1 END), ' responsáveis encontrados de ', COUNT(l.id), ' empresas (',
        ROUND((COUNT(CASE WHEN l.responsavel_encontrado = true THEN 1 END)::numeric / NULLIF(COUNT(l.id), 0)) * 100, 1), '%)'
      )
  END as resumo_performance,
  
  -- Receita total por tipo
  CASE 
    WHEN tn.nome = 'limpa_nome' THEN COALESCE(SUM(l.valor_pago_consulta) + SUM(l.valor_contrato), 0)
    WHEN tn.nome = 'previdenciario' THEN COALESCE(SUM((l.dados_personalizados->>'valor_estimado_causa')::numeric), 0)
    WHEN tn.nome = 'b2b' THEN COALESCE(SUM((l.dados_personalizados->>'budget_disponivel')::numeric), 0)
    ELSE 0
  END as receita_potencial_total

FROM public.tipos_negocio tn
LEFT JOIN public.leads l ON tn.id = l.tipo_negocio_id
WHERE tn.ativo = true
GROUP BY tn.nome, tn.nome_exibicao, tn.cor
ORDER BY COUNT(l.id) DESC;

-- 6. GRANTS E PERMISSÕES
-- =====================================================
-- Garantir que usuários autenticados possam acessar as views
GRANT SELECT ON v_leads_com_tipo TO authenticated;
GRANT SELECT ON v_dashboard_tipos TO authenticated;  
GRANT SELECT ON v_funil_por_tipo TO authenticated;
GRANT SELECT ON v_metricas_periodo TO authenticated;
GRANT SELECT ON v_performance_tipos TO authenticated;

-- 7. COMENTÁRIOS
-- =====================================================
COMMENT ON VIEW v_leads_com_tipo IS 'View base com leads enriquecidos com informações do tipo de negócio';
COMMENT ON VIEW v_dashboard_tipos IS 'Métricas principais por usuário e tipo de negócio para dashboard';
COMMENT ON VIEW v_funil_por_tipo IS 'Análise do funil de conversão por tipo de negócio';
COMMENT ON VIEW v_metricas_periodo IS 'Métricas detalhadas por período (hoje, 7d, 30d, 90d)';
COMMENT ON VIEW v_performance_tipos IS 'Análise comparativa de performance entre tipos de negócio';

-- Log de migração
DO $$
BEGIN
  RAISE NOTICE 'Migração 004 concluída: Views para relatórios segmentados criadas com sucesso';
  RAISE NOTICE 'Views disponíveis: v_leads_com_tipo, v_dashboard_tipos, v_funil_por_tipo, v_metricas_periodo, v_performance_tipos';
END $$;