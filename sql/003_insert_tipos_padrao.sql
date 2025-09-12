-- =====================================================
-- MIGRAÇÃO 003: Dados Iniciais - Tipos de Negócio Padrão
-- Insere os tipos: Previdenciário e B2B
-- =====================================================

-- 1. TIPO: ADVOGADO PREVIDENCIÁRIO
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
      "obrigatorio": true,
      "ajuda": "Selecione o tipo de acidente ou situação"
    },
    {
      "nome": "data_acidente",
      "label": "Data do Acidente",
      "tipo": "date",
      "obrigatorio": false,
      "ajuda": "Data aproximada do acidente (se souber)"
    },
    {
      "nome": "contrato_assinado",
      "label": "Já assinou contrato com advogado?",
      "tipo": "boolean", 
      "obrigatorio": true,
      "ajuda": "Se já tem representação legal"
    },
    {
      "nome": "beneficios_interesse",
      "label": "Benefícios de Interesse",
      "tipo": "multiselect",
      "opcoes": [
        "auxilio_doenca", 
        "auxilio_acidente", 
        "aposentadoria_invalidez",
        "aposentadoria_especial",
        "pensao_morte",
        "salario_maternidade",
        "outros"
      ],
      "obrigatorio": false,
      "ajuda": "Quais benefícios tem interesse em conseguir"
    },
    {
      "nome": "tem_documentacao",
      "label": "Tem documentação médica?",
      "tipo": "boolean",
      "obrigatorio": false,
      "ajuda": "Laudos, atestados, boletins de ocorrência"
    },
    {
      "nome": "valor_estimado_causa",
      "label": "Valor Estimado da Causa (R$)",
      "tipo": "number",
      "obrigatorio": false,
      "ajuda": "Valor aproximado que espera receber"
    },
    {
      "nome": "urgencia_financeira",
      "label": "Grau de Urgência Financeira", 
      "tipo": "select",
      "opcoes": ["baixa", "media", "alta", "critica"],
      "obrigatorio": false,
      "ajuda": "Nível de necessidade financeira do cliente"
    },
    {
      "nome": "observacoes_caso",
      "label": "Observações do Caso",
      "tipo": "textarea",
      "obrigatorio": false,
      "ajuda": "Informações adicionais relevantes"
    }
  ]'::jsonb,
  '[
    "novo_caso",
    "analise_viabilidade", 
    "documentacao_pendente",
    "caso_viavel",
    "caso_inviavel",
    "contrato_enviado",
    "contrato_assinado",
    "processo_iniciado",
    "aguardando_inss",
    "beneficio_concedido",
    "caso_finalizado"
  ]'::jsonb,
  '{
    "metricas_principais": [
      "taxa_viabilidade",
      "contratos_assinados", 
      "processos_ganhos",
      "valor_medio_causa"
    ],
    "campos_receita": ["valor_estimado_causa"],
    "campos_conversao": ["contrato_assinado", "processo_iniciado"]
  }'::jsonb,
  2
) ON CONFLICT (nome) DO UPDATE SET
  campos_personalizados = EXCLUDED.campos_personalizados,
  status_personalizados = EXCLUDED.status_personalizados,
  metricas_config = EXCLUDED.metricas_config,
  updated_at = NOW();

-- 2. TIPO: PROSPECÇÃO B2B
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
      "opcoes": [
        "tecnologia", "saude", "educacao", "financeiro", "varejo", 
        "industria", "servicos", "construcao", "agronegocio", "outros"
      ],
      "obrigatorio": false,
      "ajuda": "Setor de atuação da empresa"
    },
    {
      "nome": "porte_empresa",
      "label": "Porte da Empresa",
      "tipo": "select", 
      "opcoes": ["pequena", "media", "grande", "multinacional"],
      "obrigatorio": false,
      "ajuda": "Tamanho da empresa prospectada"
    },
    {
      "nome": "cargo_contato_inicial",
      "label": "Cargo do Contato Inicial",
      "tipo": "text",
      "obrigatorio": false,
      "ajuda": "Posição de quem atendeu primeiro"
    },
    {
      "nome": "departamento_alvo",
      "label": "Departamento Alvo",
      "tipo": "select",
      "opcoes": ["TI", "Marketing", "Vendas", "RH", "Financeiro", "Operações", "Diretoria"],
      "obrigatorio": false,
      "ajuda": "Área responsável pela decisão"
    },
    {
      "nome": "nome_decisor",
      "label": "Nome do Decisor",
      "tipo": "text",
      "obrigatorio": false,
      "ajuda": "Nome da pessoa que toma a decisão"
    },
    {
      "nome": "cargo_decisor", 
      "label": "Cargo do Decisor",
      "tipo": "text",
      "obrigatorio": false,
      "ajuda": "Posição do tomador de decisão"
    },
    {
      "nome": "tipo_solucao",
      "label": "Tipo de Solução",
      "tipo": "select",
      "opcoes": [
        "software", "consultoria", "automacao", "marketing_digital",
        "treinamento", "outsourcing", "equipamentos", "outros"
      ],
      "obrigatorio": false,
      "ajuda": "Categoria da solução oferecida"
    },
    {
      "nome": "budget_disponivel",
      "label": "Budget Disponível (R$)",
      "tipo": "number",
      "obrigatorio": false,
      "ajuda": "Orçamento disponível para a solução"
    },
    {
      "nome": "timeline_projeto",
      "label": "Timeline do Projeto",
      "tipo": "select",
      "opcoes": ["imediato", "30_dias", "trimestre", "semestre", "ano", "indefinido"],
      "obrigatorio": false,
      "ajuda": "Prazo esperado para implementação"
    },
    {
      "nome": "dor_principal",
      "label": "Dor Principal Identificada",
      "tipo": "textarea",
      "obrigatorio": false,
      "ajuda": "Principal problema que a solução resolve"
    },
    {
      "nome": "concorrentes",
      "label": "Concorrentes Mencionados",
      "tipo": "text",
      "obrigatorio": false,
      "ajuda": "Outras empresas que estão concorrendo"
    }
  ]'::jsonb,
  '[
    "novo_contato",
    "qualificacao_inicial",
    "mapeando_decisor",
    "contato_decisor",
    "apresentacao_agendada",
    "apresentacao_realizada", 
    "proposta_solicitada",
    "proposta_enviada",
    "negociacao",
    "deal_fechado",
    "deal_perdido"
  ]'::jsonb,
  '{
    "metricas_principais": [
      "taxa_encontrar_decisor",
      "reunioes_agendadas",
      "propostas_enviadas", 
      "taxa_fechamento",
      "ticket_medio"
    ],
    "campos_receita": ["budget_disponivel"],
    "campos_conversao": ["contato_decisor", "apresentacao_realizada", "proposta_enviada"]
  }'::jsonb,
  3
) ON CONFLICT (nome) DO UPDATE SET
  campos_personalizados = EXCLUDED.campos_personalizados,
  status_personalizados = EXCLUDED.status_personalizados,
  metricas_config = EXCLUDED.metricas_config,
  updated_at = NOW();

-- 3. ATUALIZAR CONFIGURAÇÃO DO LIMPA NOME (melhorar campos)
-- =====================================================
UPDATE public.tipos_negocio 
SET campos_personalizados = '[
  {
    "nome": "tempo_negativado",
    "label": "Há quanto tempo está negativado?",
    "tipo": "select",
    "opcoes": ["menos_1_ano", "1_2_anos", "2_5_anos", "mais_5_anos", "nao_sabe"],
    "obrigatorio": false,
    "ajuda": "Tempo aproximado de negativação"
  },
  {
    "nome": "valor_divida_estimado",
    "label": "Valor Estimado das Dívidas (R$)",
    "tipo": "number",
    "obrigatorio": false,
    "ajuda": "Valor total aproximado das dívidas"
  },
  {
    "nome": "orgaos_negativadores",
    "label": "Órgãos de Proteção ao Crédito",
    "tipo": "multiselect", 
    "opcoes": ["Serasa", "SPC", "Cartório de Protestos", "Receita Federal", "Não sabe"],
    "obrigatorio": false,
    "ajuda": "Onde aparecem as negativações"
  },
  {
    "nome": "tipos_divida",
    "label": "Tipos de Dívida",
    "tipo": "multiselect",
    "opcoes": [
      "cartao_credito", "emprestimo_banco", "financiamento_veiculo",
      "financiamento_imovel", "cheque_especial", "conta_telefone",
      "energia_eletrica", "ipva", "outros"
    ],
    "obrigatorio": false,
    "ajuda": "Principais tipos de dívida"
  },
  {
    "nome": "renda_mensal",
    "label": "Renda Mensal Aproximada (R$)",
    "tipo": "select",
    "opcoes": [
      "ate_1000", "1000_2000", "2000_5000", "5000_10000", "acima_10000", "sem_renda"
    ],
    "obrigatorio": false,
    "ajuda": "Faixa de renda para avaliar capacidade de pagamento"
  },
  {
    "nome": "urgencia_negociacao",
    "label": "Urgência para Negociar",
    "tipo": "select",
    "opcoes": ["baixa", "media", "alta", "urgentissimo"],
    "obrigatorio": false,
    "ajuda": "Nível de urgência do cliente"
  },
  {
    "nome": "ja_tentou_negociar",
    "label": "Já tentou negociar antes?",
    "tipo": "boolean",
    "obrigatorio": false,
    "ajuda": "Se já fez tentativas anteriores de negociação"
  },
  {
    "nome": "observacoes_negociacao",
    "label": "Observações da Negociação",
    "tipo": "textarea",
    "obrigatorio": false,
    "ajuda": "Informações adicionais importantes"
  }
]'::jsonb,
metricas_config = '{
  "metricas_principais": [
    "taxa_conversao_consulta",
    "consultas_pagas",
    "contratos_fechados",
    "ticket_medio_contrato"
  ],
  "campos_receita": ["valor_pago_consulta", "valor_contrato"],
  "campos_conversao": ["pagamento_consulta", "consta_divida", "cliente_fechado"]
}'::jsonb,
updated_at = NOW()
WHERE nome = 'limpa_nome';

-- 4. COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE public.tipos_negocio IS 'Tipos de negócio: Limpa Nome, Previdenciário, B2B - configurados pelo admin';

-- Log de migração
DO $$
BEGIN
  RAISE NOTICE 'Migração 003 concluída: Tipos de negócio padrão inseridos com sucesso';
  RAISE NOTICE 'Tipos disponíveis: Limpa Nome, Advogado Previdenciário, Prospecção B2B';
END $$;