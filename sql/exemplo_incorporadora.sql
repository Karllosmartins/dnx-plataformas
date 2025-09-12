-- =====================================================
-- EXEMPLO: Adicionando Tipo "Incorporadora"
-- Como adicionar um novo tipo de negócio ao sistema
-- =====================================================

-- 1. INSERIR NOVO TIPO: INCORPORADORA
-- =====================================================
INSERT INTO public.tipos_negocio (
  nome,
  nome_exibicao, 
  descricao,
  icone,
  cor,
  campos_personalizados,
  status_personalizados,
  metricas_config,
  ordem
) VALUES (
  'incorporadora',
  'Incorporadora Imobiliária',
  'Vendas de imóveis em lançamentos e empreendimentos',
  'building-office-2',
  '#EC4899', -- Rosa
  '[
    {
      "nome": "tipo_imovel",
      "label": "Tipo de Imóvel",
      "tipo": "select", 
      "opcoes": ["apartamento", "casa", "comercial", "terreno", "cobertura"],
      "obrigatorio": true,
      "ajuda": "Tipo do imóvel de interesse"
    },
    {
      "nome": "faixa_preco",
      "label": "Faixa de Preço",
      "tipo": "select",
      "opcoes": [
        "ate_200k", "200k_400k", "400k_600k", "600k_1M", 
        "1M_2M", "acima_2M"
      ],
      "obrigatorio": false,
      "ajuda": "Faixa de investimento do cliente"
    },
    {
      "nome": "finalidade",
      "label": "Finalidade do Imóvel",
      "tipo": "select",
      "opcoes": ["moradia", "investimento", "comercial"],
      "obrigatorio": true,
      "ajuda": "Para que vai usar o imóvel"
    },
    {
      "nome": "regiao_interesse",
      "label": "Região de Interesse",
      "tipo": "multiselect",
      "opcoes": [
        "centro", "zona_sul", "zona_norte", "zona_leste", 
        "zona_oeste", "abc", "interior", "litoral"
      ],
      "obrigatorio": false,
      "ajuda": "Regiões onde tem interesse"
    },
    {
      "nome": "tempo_compra",
      "label": "Prazo para Compra",
      "tipo": "select",
      "opcoes": ["imediato", "3_meses", "6_meses", "1_ano", "2_anos"],
      "obrigatorio": false,
      "ajuda": "Quando pretende comprar"
    },
    {
      "nome": "tem_financiamento",
      "label": "Tem pré-aprovação de financiamento?",
      "tipo": "boolean",
      "obrigatorio": false,
      "ajuda": "Se já tem crédito aprovado no banco"
    },
    {
      "nome": "valor_entrada",
      "label": "Valor Disponível para Entrada (R$)",
      "tipo": "number",
      "obrigatorio": false,
      "ajuda": "Quanto tem disponível para dar de entrada"
    },
    {
      "nome": "renda_familiar",
      "label": "Renda Familiar Mensal (R$)",
      "tipo": "number", 
      "obrigatorio": false,
      "ajuda": "Renda total da família"
    },
    {
      "nome": "primeiro_imovel",
      "label": "É o primeiro imóvel?",
      "tipo": "boolean",
      "obrigatorio": false,
      "ajuda": "Se é o primeiro imóvel próprio"
    },
    {
      "nome": "empreendimento_interesse",
      "label": "Empreendimento Específico",
      "tipo": "text",
      "obrigatorio": false,
      "ajuda": "Nome do empreendimento se tiver interesse específico"
    },
    {
      "nome": "observacoes_cliente",
      "label": "Observações do Cliente",
      "tipo": "textarea",
      "obrigatorio": false,
      "ajuda": "Preferências e características específicas"
    }
  ]'::jsonb,
  '[
    "novo_interessado",
    "qualificacao_inicial",
    "apresentacao_empreendimentos", 
    "visita_agendada",
    "visita_realizada",
    "proposta_apresentada",
    "negociacao_preco",
    "documentacao_enviada",
    "financiamento_aprovado",
    "contrato_assinado",
    "venda_finalizada"
  ]'::jsonb,
  '{
    "metricas_principais": [
      "visitas_realizadas",
      "propostas_apresentadas",
      "contratos_assinados", 
      "valor_medio_venda",
      "tempo_medio_venda"
    ],
    "campos_receita": ["faixa_preco", "valor_entrada"],
    "campos_conversao": ["visita_realizada", "proposta_apresentada", "contrato_assinado"]
  }'::jsonb,
  4 -- Ordem de exibição
);

-- 2. EXEMPLO: ATRIBUIR A UM USUÁRIO ESPECÍFICO
-- =====================================================
-- Atribuir o tipo "Incorporadora" ao usuário ID 2 (por exemplo)
INSERT INTO public.user_tipos_negocio (user_id, tipo_negocio_id, ativo)
SELECT 
  2 as user_id, -- ID do usuário que vai usar
  tn.id as tipo_negocio_id,
  true as ativo
FROM public.tipos_negocio tn 
WHERE tn.nome = 'incorporadora'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_tipos_negocio utn
    WHERE utn.user_id = 2 AND utn.tipo_negocio_id = tn.id
  );

-- 3. EXEMPLO: LEAD DE INCORPORADORA
-- =====================================================
-- Como ficaria um lead do tipo incorporadora preenchido
/*
INSERT INTO public.leads (
  user_id,
  nome_cliente,
  telefone,
  tipo_negocio_id,
  dados_personalizados,
  status_generico
) VALUES (
  2, -- User ID
  'Maria Silva',
  '11999887766',
  (SELECT id FROM tipos_negocio WHERE nome = 'incorporadora'),
  '{
    "tipo_imovel": "apartamento",
    "faixa_preco": "400k_600k", 
    "finalidade": "moradia",
    "regiao_interesse": ["zona_sul", "abc"],
    "tempo_compra": "6_meses",
    "tem_financiamento": false,
    "valor_entrada": 150000,
    "renda_familiar": 12000,
    "primeiro_imovel": true,
    "observacoes_cliente": "Prefere andar alto, com sacada"
  }'::jsonb,
  'qualificacao_inicial'
);
*/

-- 4. VERIFICAR SE FOI CRIADO CORRETAMENTE
-- =====================================================
SELECT 
  nome,
  nome_exibicao,
  cor,
  jsonb_array_length(campos_personalizados) as qtd_campos,
  jsonb_array_length(status_personalizados) as qtd_status
FROM public.tipos_negocio 
WHERE nome = 'incorporadora';

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Tipo "Incorporadora" adicionado com sucesso!';
  RAISE NOTICE 'Campos personalizados: 11';
  RAISE NOTICE 'Status do funil: 11'; 
  RAISE NOTICE 'Agora pode ser atribuído aos usuários via interface administrativa';
END $$;