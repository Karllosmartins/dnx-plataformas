-- =====================================================
-- DADOS DE EXEMPLO PARA USUÁRIO ID 8
-- Leads e cobranças para demonstrar o funil CRM Limpa Nome
-- =====================================================

-- Inserir leads de exemplo para usuário ID 8
INSERT INTO public.leads (
    user_id,
    nome_cliente,
    cpf,
    telefone,
    numero_formatado,
    origem,
    status_limpa_nome,
    valor_estimado_divida,
    valor_real_divida,
    valor_pago_consulta,
    valor_contrato,
    tempo_negativado,
    tipo_consulta_interesse,
    motivo_desqualificacao,
    data_pagamento,
    link_pagamento,
    data_consulta,
    orgaos_negativados,
    link_relatorio,
    observacoes_limpa_nome,
    data_escalacao,
    vendedor_responsavel,
    data_fechamento,
    instance,
    remotejid,
    atendimentofinalizado
) VALUES 
-- Lead 1: Novo Lead (acabou de entrar)
(
    8, -- user_id
    'Carlos Henrique Silva',
    '123.456.789-10',
    '(11) 91234-5678',
    '5511912345678',
    'WhatsApp',
    'novo_lead',
    NULL, -- ainda não estimou dívida
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Cliente entrou hoje via WhatsApp, aguardando qualificação',
    NULL,
    NULL,
    NULL,
    'dnx_plataforma_2405',
    '5511912345678@s.whatsapp.net',
    false
),

-- Lead 2: Em qualificação
(
    8,
    'Maria Fernanda Costa',
    '987.654.321-00',
    '(21) 98765-4321',
    '5521987654321',
    'Site',
    'qualificacao',
    18000.00, -- valor estimado
    NULL,
    NULL,
    NULL,
    '3 anos', -- tempo negativado
    'Consulta Rating', -- tipo consulta interesse
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Cliente interessado em consulta completa, possui múltiplas negativações',
    NULL,
    NULL,
    NULL,
    'dnx_plataforma_2405',
    '5521987654321@s.whatsapp.net',
    false
),

-- Lead 3: Desqualificado
(
    8,
    'João Pedro Santos',
    '456.789.123-45',
    '(31) 97777-8888',
    '5531977778888',
    'Indicação',
    'desqualificado',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'CPF limpo, sem negativações', -- motivo desqualificação
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Cliente não possui dívidas pendentes, não se enquadra no perfil',
    NULL,
    NULL,
    NULL,
    'dnx_plataforma_2405',
    '5531977778888@s.whatsapp.net',
    false
),

-- Lead 4: Pagamento da consulta realizado
(
    8,
    'Ana Beatriz Oliveira',
    '321.654.987-11',
    '(11) 96666-5555',
    '5511966665555',
    'WhatsApp',
    'pagamento_consulta',
    12000.00,
    NULL,
    199.00, -- consulta rating paga
    NULL,
    '1.5 anos',
    'Consulta Rating',
    NULL,
    NOW() - INTERVAL '2 days', -- pagou há 2 dias
    'https://pix.asaas.com/pagamento-ana-beatriz',
    NULL,
    NULL,
    NULL,
    'Pagamento confirmado, aguardando processamento da consulta',
    NULL,
    NULL,
    NULL,
    'dnx_plataforma_2405',
    '5511966665555@s.whatsapp.net',
    false
),

-- Lead 5: Não consta dívida
(
    8,
    'Roberto Carlos Lima',
    '654.321.987-22',
    '(85) 94444-3333',
    '5585944443333',
    'Site',
    'nao_consta_divida',
    8000.00,
    0.00, -- não foi encontrada dívida
    30.00, -- consulta básica
    NULL,
    '6 meses',
    'Consulta Básica',
    NULL,
    NOW() - INTERVAL '5 days',
    'https://pix.asaas.com/pagamento-roberto',
    NOW() - INTERVAL '3 days', -- consulta realizada
    ARRAY[]::text[], -- sem órgãos negativados
    NULL,
    'Consulta realizada, CPF estava limpo. Cliente foi reembolsado.',
    NULL,
    NULL,
    NULL,
    'dnx_plataforma_2405',
    '5585944443333@s.whatsapp.net',
    true
),

-- Lead 6: Consta dívida (resultado positivo)
(
    8,
    'Fernanda Alves Pereira',
    '789.123.456-33',
    '(11) 95555-4444',
    '5511955554444',
    'WhatsApp',
    'consta_divida',
    25000.00,
    23450.75, -- valor real encontrado
    199.00,
    NULL,
    '4 anos',
    'Consulta Rating',
    NULL,
    NOW() - INTERVAL '1 week',
    'https://pix.asaas.com/pagamento-fernanda',
    NOW() - INTERVAL '5 days',
    ARRAY['SPC', 'SERASA', 'Banco do Brasil', 'Caixa Econômica'], -- órgãos
    'https://f005.backblazeb2.com/file/limpanome/relatorio-fernanda-123456.pdf',
    'Dívidas encontradas em múltiplos órgãos, cliente interessado em negociação',
    NULL,
    NULL,
    NULL,
    'dnx_plataforma_2405',
    '5511955554444@s.whatsapp.net',
    false
),

-- Lead 7: Enviado para negociação
(
    8,
    'Lucas Rafael Souza',
    '147.258.369-44',
    '(21) 93333-2222',
    '5521933332222',
    'Indicação',
    'enviado_para_negociacao',
    15000.00,
    14250.80,
    199.00,
    NULL,
    '2 anos',
    'Consulta Rating',
    NULL,
    NOW() - INTERVAL '10 days',
    'https://pix.asaas.com/pagamento-lucas',
    NOW() - INTERVAL '8 days',
    ARRAY['SPC', 'SERASA'],
    'https://f005.backblazeb2.com/file/limpanome/relatorio-lucas-789123.pdf',
    'Cliente muito interessado, escalado para equipe de vendas',
    NOW() - INTERVAL '2 days', -- escalado há 2 dias
    'Vendedor João Silva',
    NULL,
    'dnx_plataforma_2405',
    '5521933332222@s.whatsapp.net',
    false
),

-- Lead 8: Cliente fechado (sucesso completo)
(
    8,
    'Patricia Machado Torres',
    '258.147.963-55',
    '(31) 92222-1111',
    '5531922221111',
    'WhatsApp',
    'cliente_fechado',
    30000.00,
    28750.50, -- valor real da dívida
    199.00,
    3500.00, -- valor do contrato fechado
    '5 anos',
    'Consulta Rating',
    NULL,
    NOW() - INTERVAL '3 weeks',
    'https://pix.asaas.com/pagamento-patricia',
    NOW() - INTERVAL '21 days',
    ARRAY['SPC', 'SERASA', 'Banco Bradesco', 'Santander'],
    'https://f005.backblazeb2.com/file/limpanome/relatorio-patricia-456789.pdf',
    'Cliente fechou contrato completo, processo finalizado com sucesso',
    NOW() - INTERVAL '10 days',
    'Vendedor Maria Santos',
    NOW() - INTERVAL '3 days', -- fechado há 3 dias
    'dnx_plataforma_2405',
    '5531922221111@s.whatsapp.net',
    true
),

-- Lead 9: Outro cliente fechado
(
    8,
    'Eduardo Henrique Dias',
    '369.258.147-66',
    '(11) 91111-9999',
    '5511911119999',
    'Site',
    'cliente_fechado',
    22000.00,
    20800.30,
    199.00,
    2800.00,
    '3 anos',
    'Consulta Rating',
    NULL,
    NOW() - INTERVAL '1 month',
    'https://pix.asaas.com/pagamento-eduardo',
    NOW() - INTERVAL '4 weeks',
    ARRAY['SPC', 'SERASA', 'Banco do Brasil'],
    'https://f005.backblazeb2.com/file/limpanome/relatorio-eduardo-987654.pdf',
    'Excelente cliente, pagou à vista',
    NOW() - INTERVAL '2 weeks',
    'Vendedor Carlos Lima',
    NOW() - INTERVAL '1 week',
    'dnx_plataforma_2405',
    '5511911119999@s.whatsapp.net',
    true
),

-- Lead 10: Mais um em qualificação
(
    8,
    'Juliana Cristina Rocha',
    '741.852.963-77',
    '(85) 98888-7777',
    '5585988887777',
    'WhatsApp',
    'qualificacao',
    16500.00,
    NULL,
    NULL,
    NULL,
    '2.5 anos',
    'Consulta Rating',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Cliente em processo de qualificação, demonstrou interesse',
    NULL,
    NULL,
    NULL,
    'dnx_plataforma_2405',
    '5585988887777@s.whatsapp.net',
    false
);

-- =====================================================
-- COBRANÇAS/PAGAMENTOS RELACIONADOS
-- =====================================================

-- Inserir cobranças para os leads que fizeram pagamento
INSERT INTO public.pagamentos_consultas (
    lead_id,
    user_id,
    id_cliente_asaas,
    id_cobranca_asaas,
    telefone_cliente,
    cpfcnpj,
    valor_cobranca,
    valor_recebido,
    metodo_pagamento,
    status_pagamento,
    data_pago,
    consulta_link1,
    consulta_link2,
    tabela_leads
) VALUES 
-- Cobrança da Ana Beatriz (ID do lead será obtido da consulta)
(
    (SELECT id FROM public.leads WHERE cpf = '321.654.987-11' AND user_id = 8 LIMIT 1),
    8,
    'cus_ana_beatriz_001',
    'pay_ana_001',
    '5511966665555',
    '32165498711',
    199.00,
    195.05, -- valor líquido após taxas
    'PIX',
    'RECEIVED',
    NOW() - INTERVAL '2 days',
    'https://f005.backblazeb2.com/file/limpanome/SERSPCSCORE-32165498711.pdf',
    'https://f005.backblazeb2.com/file/limpanome/BOAVISTASCORE-32165498711.pdf',
    'leads'
),

-- Cobrança do Roberto (consulta básica)
(
    (SELECT id FROM public.leads WHERE cpf = '654.321.987-22' AND user_id = 8 LIMIT 1),
    8,
    'cus_roberto_002',
    'pay_roberto_002',
    '5585944443333',
    '65432198722',
    30.00,
    28.01,
    'PIX',
    'RECEIVED',
    NOW() - INTERVAL '5 days',
    'https://f005.backblazeb2.com/file/limpanome/CONSULTA-BASICA-65432198722.pdf',
    NULL,
    'leads'
),

-- Cobrança da Fernanda (rating)
(
    (SELECT id FROM public.leads WHERE cpf = '789.123.456-33' AND user_id = 8 LIMIT 1),
    8,
    'cus_fernanda_003',
    'pay_fernanda_003',
    '5511955554444',
    '78912345633',
    199.00,
    195.05,
    'PIX',
    'RECEIVED',
    NOW() - INTERVAL '1 week',
    'https://f005.backblazeb2.com/file/limpanome/SERSPCSCORE-78912345633.pdf',
    'https://f005.backblazeb2.com/file/limpanome/BOAVISTASCORE-78912345633.pdf',
    'leads'
),

-- Cobrança do Lucas
(
    (SELECT id FROM public.leads WHERE cpf = '147.258.369-44' AND user_id = 8 LIMIT 1),
    8,
    'cus_lucas_004',
    'pay_lucas_004',
    '5521933332222',
    '14725836944',
    199.00,
    195.05,
    'PIX',
    'RECEIVED',
    NOW() - INTERVAL '10 days',
    'https://f005.backblazeb2.com/file/limpanome/SERSPCSCORE-14725836944.pdf',
    'https://f005.backblazeb2.com/file/limpanome/BOAVISTASCORE-14725836944.pdf',
    'leads'
),

-- Cobrança da Patricia (cliente fechado)
(
    (SELECT id FROM public.leads WHERE cpf = '258.147.963-55' AND user_id = 8 LIMIT 1),
    8,
    'cus_patricia_005',
    'pay_patricia_005',
    '5531922221111',
    '25814796355',
    199.00,
    195.05,
    'PIX',
    'RECEIVED',
    NOW() - INTERVAL '3 weeks',
    'https://f005.backblazeb2.com/file/limpanome/SERSPCSCORE-25814796355.pdf',
    'https://f005.backblazeb2.com/file/limpanome/BOAVISTASCORE-25814796355.pdf',
    'leads'
),

-- Cobrança do Eduardo (cliente fechado)
(
    (SELECT id FROM public.leads WHERE cpf = '369.258.147-66' AND user_id = 8 LIMIT 1),
    8,
    'cus_eduardo_006',
    'pay_eduardo_006',
    '5511911119999',
    '36925814766',
    199.00,
    195.05,
    'PIX',
    'RECEIVED',
    NOW() - INTERVAL '1 month',
    'https://f005.backblazeb2.com/file/limpanome/SERSPCSCORE-36925814766.pdf',
    'https://f005.backblazeb2.com/file/limpanome/BOAVISTASCORE-36925814766.pdf',
    'leads'
);

-- =====================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================

-- Contar leads por status para o usuário 8
SELECT 
    status_limpa_nome,
    COUNT(*) as quantidade,
    SUM(valor_estimado_divida) as valor_total_estimado,
    SUM(valor_real_divida) as valor_total_real,
    SUM(valor_pago_consulta) as total_consultas_pagas,
    SUM(valor_contrato) as total_contratos
FROM public.leads 
WHERE user_id = 8
GROUP BY status_limpa_nome
ORDER BY 
    CASE status_limpa_nome
        WHEN 'novo_lead' THEN 1
        WHEN 'qualificacao' THEN 2
        WHEN 'desqualificado' THEN 3
        WHEN 'pagamento_consulta' THEN 4
        WHEN 'nao_consta_divida' THEN 5
        WHEN 'consta_divida' THEN 6
        WHEN 'enviado_para_negociacao' THEN 7
        WHEN 'cliente_fechado' THEN 8
        ELSE 9
    END;

-- Verificar cobranças
SELECT 
    p.id,
    l.nome_cliente,
    p.valor_cobranca,
    p.valor_recebido,
    p.status_pagamento,
    p.data_pago
FROM public.pagamentos_consultas p
JOIN public.leads l ON p.lead_id = l.id
WHERE p.user_id = 8
ORDER BY p.data_pago DESC;

-- Resumo geral do usuário 8
SELECT 
    'Resumo Usuario 8' as relatorio,
    COUNT(*) as total_leads,
    SUM(CASE WHEN status_limpa_nome = 'cliente_fechado' THEN 1 ELSE 0 END) as clientes_fechados,
    SUM(valor_pago_consulta) as total_consultas_pagas,
    SUM(valor_contrato) as total_contratos,
    ROUND(
        (SUM(CASE WHEN status_limpa_nome = 'cliente_fechado' THEN 1 ELSE 0 END)::decimal / COUNT(*)::decimal) * 100, 
        2
    ) as taxa_conversao_percent
FROM public.leads 
WHERE user_id = 8;