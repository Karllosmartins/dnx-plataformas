-- =====================================================
-- MIGRAÇÃO 002: Modificação da Tabela Leads
-- Adiciona suporte a tipos de negócio e campos dinâmicos
-- =====================================================

-- 1. ADICIONAR COLUNAS NA TABELA LEADS
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

-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_leads_tipo_negocio_id ON public.leads(tipo_negocio_id);
CREATE INDEX IF NOT EXISTS idx_leads_dados_personalizados ON public.leads USING GIN (dados_personalizados);
CREATE INDEX IF NOT EXISTS idx_leads_status_generico ON public.leads(status_generico);

-- Índice composto para queries por usuário e tipo
CREATE INDEX IF NOT EXISTS idx_leads_user_tipo ON public.leads(user_id, tipo_negocio_id);

-- 3. MIGRAÇÃO DE DADOS EXISTENTES
-- =====================================================

-- Primeiro, vamos criar um tipo padrão "Limpa Nome" se não existir
INSERT INTO public.tipos_negocio (nome, nome_exibicao, descricao, cor, campos_personalizados, status_personalizados)
SELECT 
  'limpa_nome',
  'Limpa Nome',
  'Negociação e quitação de dívidas',
  '#10B981',
  '[
    {
      "nome": "tempo_negativado",
      "label": "Tempo Negativado",
      "tipo": "text",
      "obrigatorio": false
    },
    {
      "nome": "orgaos_negativados", 
      "label": "Órgãos Negativados",
      "tipo": "multiselect",
      "opcoes": ["Serasa", "SPC", "Cartório", "Receita Federal"],
      "obrigatorio": false
    }
  ]'::jsonb,
  '["novo_lead", "qualificacao", "desqualificado", "pagamento_consulta", "nao_consta_divida", "consta_divida", "enviado_para_negociacao", "cliente_fechado"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.tipos_negocio WHERE nome = 'limpa_nome');

-- Atribuir todos os leads existentes ao tipo "Limpa Nome"
UPDATE public.leads 
SET tipo_negocio_id = (SELECT id FROM public.tipos_negocio WHERE nome = 'limpa_nome')
WHERE tipo_negocio_id IS NULL;

-- Migrar dados específicos do Limpa Nome para dados_personalizados
UPDATE public.leads 
SET dados_personalizados = jsonb_build_object(
  'tempo_negativado', COALESCE(tempo_negativado, ''),
  'orgaos_negativados', COALESCE(array_to_json(orgaos_negativados), '[]'::json),
  'tipo_consulta_interesse', COALESCE(tipo_consulta_interesse, ''),
  'motivo_desqualificacao', COALESCE(motivo_desqualificacao, ''),
  'observacoes', COALESCE(observacoes_limpa_nome, ''),
  'vendedor_responsavel', COALESCE(vendedor_responsavel, '')
)
WHERE tipo_negocio_id = (SELECT id FROM public.tipos_negocio WHERE nome = 'limpa_nome')
  AND dados_personalizados = '{}'::jsonb;

-- Sincronizar status_generico com status_limpa_nome existente
UPDATE public.leads 
SET status_generico = status_limpa_nome
WHERE status_generico IS NULL AND status_limpa_nome IS NOT NULL;

-- 4. CONSTRAINTS E VALIDAÇÕES
-- =====================================================

-- Constraint para garantir que leads tenham um tipo
-- ALTER TABLE public.leads ADD CONSTRAINT leads_tipo_negocio_required CHECK (tipo_negocio_id IS NOT NULL);
-- Comentado por enquanto para não quebrar dados existentes

-- 5. ATRIBUIR TIPO LIMPA NOME PARA USUÁRIOS EXISTENTES
-- =====================================================

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

-- 6. COMENTÁRIOS
-- =====================================================
COMMENT ON COLUMN public.leads.tipo_negocio_id IS 'Referência ao tipo de negócio (Limpa Nome, Previdenciário, B2B, etc.)';
COMMENT ON COLUMN public.leads.dados_personalizados IS 'Dados específicos do tipo de negócio em formato JSON';
COMMENT ON COLUMN public.leads.status_generico IS 'Status genérico que complementa os status específicos de cada tipo';

-- 7. FUNÇÃO AUXILIAR PARA BUSCAR DADOS CONTEXTUALIZADOS
-- =====================================================
CREATE OR REPLACE FUNCTION get_lead_context(lead_id_param BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'lead_id', l.id,
      'nome_cliente', l.nome_cliente,
      'telefone', l.telefone,
      'tipo_negocio', tn.nome,
      'tipo_exibicao', tn.nome_exibicao,
      'dados_personalizados', l.dados_personalizados,
      'campos_config', tn.campos_personalizados,
      'status_possiveis', tn.status_personalizados,
      -- Campos específicos do Limpa Nome
      'campos_limpa_nome', CASE 
        WHEN tn.nome = 'limpa_nome' THEN
          jsonb_build_object(
            'cpf', l.cpf,
            'valor_estimado_divida', l.valor_estimado_divida,
            'valor_real_divida', l.valor_real_divida,
            'valor_pago_consulta', l.valor_pago_consulta,
            'status_limpa_nome', l.status_limpa_nome
          )
        ELSE NULL
      END,
      -- Campos específicos do B2B
      'campos_b2b', CASE
        WHEN tn.nome = 'b2b' THEN
          jsonb_build_object(
            'responsavel_encontrado', l.responsavel_encontrado,
            'falando_com_responsavel', l.falando_com_responsavel,
            'nome_empresa', l.nome_empresa
          )
        ELSE NULL
      END
    ) INTO result
  FROM public.leads l
  LEFT JOIN public.tipos_negocio tn ON l.tipo_negocio_id = tn.id
  WHERE l.id = lead_id_param;
  
  RETURN result;
END;
$$;