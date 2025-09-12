-- =====================================================
-- MIGRAÇÃO COMPLETA: Sistema Multi-Negócio
-- Versão para Supabase (corrigido para UUID)
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

-- =====================================================
-- 1. CRIAR TABELAS PRINCIPAIS
-- =====================================================

-- TABELA TIPOS_NEGOCIO (configurada pelo admin)
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

-- RLS para tipos_negocio (sem policies por enquanto - será configurado depois)
ALTER TABLE public.tipos_negocio ENABLE ROW LEVEL SECURITY;

-- TABELA USER_TIPOS_NEGOCIO (atribuição aos usuários)
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

-- RLS para user_tipos_negocio (sem policies por enquanto)
ALTER TABLE public.user_tipos_negocio ENABLE ROW LEVEL SECURITY;

-- Triggers para updated_at (se a função existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_tipos_negocio_updated_at ON public.tipos_negocio;
    CREATE TRIGGER update_tipos_negocio_updated_at 
      BEFORE UPDATE ON public.tipos_negocio 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_user_tipos_negocio_updated_at ON public.user_tipos_negocio;
    CREATE TRIGGER update_user_tipos_negocio_updated_at 
      BEFORE UPDATE ON public.user_tipos_negocio 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Triggers de updated_at criados com sucesso';
  ELSE
    RAISE NOTICE 'Função update_updated_at_column não encontrada, triggers não criados';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Etapa 1 concluída: Tabelas tipos_negocio e user_tipos_negocio criadas';
END $$;

-- =====================================================
-- 2. MODIFICAR TABELA LEADS
-- =====================================================

-- Adicionar referência ao tipo de negócio
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tipo_negocio_id BIGINT REFERENCES public.tipos_negocio(id);

-- Adicionar campo JSONB para dados específicos do tipo
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS dados_personalizados JSONB DEFAULT '{}'::jsonb;

-- Campo para status genérico (complementa status_limpa_nome existente)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS status_generico VARCHAR(50);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_tipo_negocio_id ON public.leads(tipo_negocio_id);
CREATE INDEX IF NOT EXISTS idx_leads_dados_personalizados ON public.leads USING GIN (dados_personalizados);
CREATE INDEX IF NOT EXISTS idx_leads_status_generico ON public.leads(status_generico);
CREATE INDEX IF NOT EXISTS idx_leads_user_tipo ON public.leads(user_id, tipo_negocio_id);

DO $$
BEGIN
  RAISE NOTICE 'Etapa 2 concluída: Tabela leads modificada com novos campos';
END $$;

-- =====================================================
-- 3. INSERIR TIPOS PADRÃO
-- =====================================================

-- Tipo padrão "Limpa Nome" 
INSERT INTO public.tipos_negocio (nome, nome_exibicao, descricao, cor, campos_personalizados, status_personalizados, ordem)
SELECT 
  'limpa_nome',
  'Limpa Nome',
  'Negociação e quitação de dívidas',
  '#10B981',
  '[
    {
      "nome": "tempo_negativado",
      "label": "Há quanto tempo está negativado?",
      "tipo": "select",
      "opcoes": ["menos_1_ano", "1_2_anos", "2_5_anos", "mais_5_anos", "nao_sabe"],
      "obrigatorio": false,
      "ajuda": "Tempo aproximado de negativação"
    },
    {
      "nome": "orgaos_negativados", 
      "label": "Órgãos Negativados",
      "tipo": "multiselect",
      "opcoes": ["Serasa", "SPC", "Cartório", "Receita Federal"],
      "obrigatorio": false
    }
  ]'::jsonb,
  '["novo_lead", "qualificacao", "desqualificado", "pagamento_consulta", "nao_consta_divida", "consta_divida", "enviado_para_negociacao", "cliente_fechado"]'::jsonb,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.tipos_negocio WHERE nome = 'limpa_nome');

-- Tipo "Advogado Previdenciário"
INSERT INTO public.tipos_negocio (
  nome, nome_exibicao, descricao, icone, cor, campos_personalizados, status_personalizados, ordem
) 
SELECT
  'previdenciario',
  'Advogado Previdenciário', 
  'Casos de acidentes e benefícios previdenciários',
  'scale',
  '#F59E0B',
  '[
    {
      "nome": "tipo_acidente",
      "label": "Tipo de Acidente",
      "tipo": "select",
      "opcoes": ["trabalho", "transito", "doenca_ocupacional", "invalidez", "outros"],
      "obrigatorio": true
    },
    {
      "nome": "contrato_assinado",
      "label": "Já assinou contrato com advogado?",
      "tipo": "boolean", 
      "obrigatorio": true
    },
    {
      "nome": "beneficios_interesse",
      "label": "Benefícios de Interesse",
      "tipo": "multiselect",
      "opcoes": ["auxilio_doenca", "auxilio_acidente", "aposentadoria_invalidez", "outros"],
      "obrigatorio": false
    }
  ]'::jsonb,
  '["novo_caso", "analise_viabilidade", "caso_viavel", "caso_inviavel", "contrato_enviado", "contrato_assinado", "processo_iniciado", "caso_finalizado"]'::jsonb,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.tipos_negocio WHERE nome = 'previdenciario');

-- Tipo "Prospecção B2B"
INSERT INTO public.tipos_negocio (
  nome, nome_exibicao, descricao, icone, cor, campos_personalizados, status_personalizados, ordem
)
SELECT
  'b2b',
  'Prospecção B2B',
  'Prospecção e vendas para empresas',
  'building-office',
  '#8B5CF6',
  '[
    {
      "nome": "segmento_empresa",
      "label": "Segmento da Empresa", 
      "tipo": "select",
      "opcoes": ["tecnologia", "saude", "educacao", "financeiro", "varejo", "industria", "servicos", "outros"],
      "obrigatorio": false
    },
    {
      "nome": "porte_empresa",
      "label": "Porte da Empresa",
      "tipo": "select", 
      "opcoes": ["pequena", "media", "grande", "multinacional"],
      "obrigatorio": false
    },
    {
      "nome": "budget_disponivel",
      "label": "Budget Disponível (R$)",
      "tipo": "number",
      "obrigatorio": false
    }
  ]'::jsonb,
  '["novo_contato", "qualificacao_inicial", "mapeando_decisor", "contato_decisor", "apresentacao_realizada", "proposta_enviada", "negociacao", "deal_fechado"]'::jsonb,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.tipos_negocio WHERE nome = 'b2b');

-- Atribuir todos os leads existentes ao tipo "Limpa Nome"
UPDATE public.leads 
SET tipo_negocio_id = (SELECT id FROM public.tipos_negocio WHERE nome = 'limpa_nome')
WHERE tipo_negocio_id IS NULL;

-- Atribuir o tipo "Limpa Nome" para todos os usuários existentes
INSERT INTO public.user_tipos_negocio (user_id, tipo_negocio_id, ativo)
SELECT 
  u.id,
  tn.id,
  true
FROM public.users u
CROSS JOIN public.tipos_negocio tn
WHERE tn.nome = 'limpa_nome'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_tipos_negocio utn 
    WHERE utn.user_id = u.id AND utn.tipo_negocio_id = tn.id
  );

DO $$
BEGIN
  RAISE NOTICE 'Etapa 3 concluída: Tipos padrão inseridos e leads migrados';
END $$;

-- =====================================================
-- 4. CRIAR VIEWS PARA RELATÓRIOS
-- =====================================================

-- VIEW: LEADS COM TIPO DE NEGÓCIO
CREATE OR REPLACE VIEW v_leads_com_tipo AS
SELECT 
  l.*,
  tn.nome as tipo_negocio_nome,
  tn.nome_exibicao as tipo_negocio_display,
  tn.cor as tipo_negocio_cor,
  tn.campos_personalizados,
  tn.status_personalizados,
  COALESCE(l.status_generico, l.status_limpa_nome) as status_atual,
  EXTRACT(days FROM (NOW() - l.created_at)) as dias_desde_criacao
FROM public.leads l
LEFT JOIN public.tipos_negocio tn ON l.tipo_negocio_id = tn.id
WHERE tn.ativo = true OR tn.id IS NULL;

-- VIEW: DASHBOARD POR TIPO
CREATE OR REPLACE VIEW v_dashboard_tipos AS
SELECT 
  u.id as user_id,
  u.name as usuario_nome,
  tn.nome as tipo_nome,
  tn.nome_exibicao as tipo_display,
  tn.cor as tipo_cor,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_ultimo_mes,
  COUNT(CASE WHEN tn.nome = 'limpa_nome' AND l.valor_pago_consulta > 0 THEN 1 END) as consultas_pagas,
  COUNT(CASE WHEN tn.nome = 'b2b' AND l.responsavel_encontrado = true THEN 1 END) as responsaveis_encontrados
FROM public.users u
LEFT JOIN public.user_tipos_negocio utn ON u.id = utn.user_id AND utn.ativo = true
LEFT JOIN public.tipos_negocio tn ON utn.tipo_negocio_id = tn.id AND tn.ativo = true
LEFT JOIN public.leads l ON u.id = l.user_id AND l.tipo_negocio_id = tn.id
WHERE u.active = true
GROUP BY u.id, u.name, tn.nome, tn.nome_exibicao, tn.cor, tn.ordem
ORDER BY u.name, tn.ordem;

-- VIEW: FUNIL POR TIPO
CREATE OR REPLACE VIEW v_funil_por_tipo AS
SELECT 
  u.id as user_id,
  u.name as usuario_nome,
  tn.nome as tipo_nome,
  tn.nome_exibicao as tipo_display,
  tn.cor as tipo_cor,
  COUNT(l.id) as total_leads,
  
  -- Taxa de conversão básica
  CASE 
    WHEN COUNT(l.id) > 0 THEN
      ROUND((COUNT(CASE WHEN l.valor_pago_consulta > 0 OR l.responsavel_encontrado = true THEN 1 END)::numeric / COUNT(l.id) * 100), 2)
    ELSE 0
  END as taxa_conversao_geral

FROM public.users u
LEFT JOIN public.user_tipos_negocio utn ON u.id = utn.user_id AND utn.ativo = true
LEFT JOIN public.tipos_negocio tn ON utn.tipo_negocio_id = tn.id AND tn.ativo = true
LEFT JOIN public.leads l ON u.id = l.user_id AND l.tipo_negocio_id = tn.id
WHERE u.active = true AND tn.id IS NOT NULL
GROUP BY u.id, u.name, tn.nome, tn.nome_exibicao, tn.cor
ORDER BY u.name, tn.nome;

-- Grants básicos (sem RLS por enquanto)
GRANT SELECT ON public.tipos_negocio TO authenticated;
GRANT SELECT ON public.user_tipos_negocio TO authenticated;
GRANT SELECT ON v_leads_com_tipo TO authenticated;
GRANT SELECT ON v_dashboard_tipos TO authenticated;
GRANT SELECT ON v_funil_por_tipo TO authenticated;

-- Comentários
COMMENT ON TABLE public.tipos_negocio IS 'Tipos de negócio configurados pelo administrador';
COMMENT ON TABLE public.user_tipos_negocio IS 'Atribuição de tipos de negócio aos usuários';

DO $$
BEGIN
  RAISE NOTICE 'Etapa 4 concluída: Views para relatórios criadas';
END $$;

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================
DO $$
DECLARE 
  tipos_count INTEGER;
  leads_migrados INTEGER;
  users_atribuidos INTEGER;
BEGIN
  -- Verificar tipos criados
  SELECT COUNT(*) INTO tipos_count FROM public.tipos_negocio WHERE ativo = true;
  RAISE NOTICE 'Tipos de negócio criados: %', tipos_count;
  
  -- Verificar leads migrados
  SELECT COUNT(*) INTO leads_migrados FROM public.leads WHERE tipo_negocio_id IS NOT NULL;
  RAISE NOTICE 'Leads com tipo atribuído: %', leads_migrados;
  
  -- Verificar usuários com tipos atribuídos
  SELECT COUNT(*) INTO users_atribuidos FROM public.user_tipos_negocio WHERE ativo = true;
  RAISE NOTICE 'Usuários com tipos atribuídos: %', users_atribuidos;
  
  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Sistema multi-negócio ativo com:';
  RAISE NOTICE '- Limpa Nome, Previdenciário e B2B configurados';
  RAISE NOTICE '- Todos os leads existentes preservados';
  RAISE NOTICE '- Views para relatórios disponíveis';
  RAISE NOTICE '';
  RAISE NOTICE 'Para testar execute:';
  RAISE NOTICE 'SELECT nome, nome_exibicao, cor FROM tipos_negocio;';
  RAISE NOTICE 'SELECT * FROM v_dashboard_tipos LIMIT 5;';
  RAISE NOTICE '';
END $$;