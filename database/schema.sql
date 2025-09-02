-- =====================================================
-- SCHEMA CORRIGIDO - DNX PLATAFORMAS CRM LIMPA NOME
-- Baseado na estrutura real da leads_salustriano + campos Limpa Nome
-- =====================================================

-- 1. TABELA USERS
-- =====================================================
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  active BOOLEAN DEFAULT true,
  
  -- Campos para Limpa Nome
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(20),
  plano TEXT CHECK (plano IN ('basico', 'premium', 'enterprise')) DEFAULT 'basico',
  limite_leads INTEGER DEFAULT 100,
  limite_consultas INTEGER DEFAULT 10,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_cpf ON public.users(cpf);

-- RLS para users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_policy" ON public.users FOR ALL TO authenticated USING (true);

-- 2. TABELA CONFIGURACOES_CREDENCIAIS (com dados WhatsApp inclusos)
-- =====================================================
CREATE TABLE public.configuracoes_credenciais (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- APIs de IA
  openai_api_token TEXT,
  gemini_api_key TEXT,
  model TEXT DEFAULT 'gpt-4o',
  type_tool_supabase TEXT DEFAULT 'OpenAi',
  reasoning_effort TEXT,
  
  -- ElevenLabs
  apikey_elevenlabs TEXT,
  id_voz_elevenlabs TEXT,
  
  -- FireCrawl
  firecrawl_apikey TEXT,
  
  -- WhatsApp Evolution API (DADOS INCLUSOS AQUI)
  baseurl TEXT DEFAULT 'https://wsapi.dnmarketing.com.br',
  instancia TEXT, -- Nome da instância WhatsApp
  apikey TEXT,    -- API Key da instância
  
  -- Supabase Databases
  base_tools_supabase TEXT,
  base_leads_supabase TEXT,
  base_mensagens_supabase TEXT,
  base_agentes_supabase TEXT,
  base_rag_supabase TEXT,
  base_ads_supabase TEXT,
  
  -- Configurações do Agente
  prompt_do_agente TEXT,
  vector_store_ids JSONB,
  structured_output JSONB,
  
  -- Configurações Operacionais
  delay_entre_mensagens_em_segundos INTEGER DEFAULT 30,
  delay_apos_intervencao_humana_minutos INTEGER DEFAULT 0,
  inicio_expediente INTEGER DEFAULT 8,
  fim_expediente INTEGER DEFAULT 18,
  
  -- CRM Integration
  url_crm TEXT,
  usuario_crm TEXT,
  senha_crm TEXT,
  token_crm TEXT,
  
  -- Drive Integration
  pasta_drive TEXT,
  id_pasta_drive_rag TEXT,
  
  cliente TEXT NOT NULL, -- Nome do cliente/empresa
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_config UNIQUE (user_id)
);

-- Índices para configuracoes_credenciais
CREATE INDEX idx_config_user_id ON public.configuracoes_credenciais(user_id);
CREATE INDEX idx_config_instancia ON public.configuracoes_credenciais(instancia);

-- RLS para configuracoes_credenciais
ALTER TABLE public.configuracoes_credenciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_policy" ON public.configuracoes_credenciais FOR ALL TO authenticated USING (true);

-- 3. TABELA LEADS (COMPLETA com todos os campos da referência + Limpa Nome)
-- =====================================================
CREATE TABLE public.leads (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- CAMPOS ORIGINAIS da leads_salustriano (TODOS)
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  remotejid TEXT DEFAULT '',
  response_id TEXT,
  atendimentofinalizado BOOLEAN DEFAULT false,
  conversation_log JSONB DEFAULT '[]'::jsonb,
  times_tamp TEXT DEFAULT '',
  tokens INTEGER DEFAULT 0,
  user_lastinteraction TEXT,
  bot_lastinteraction TEXT,
  lead_id TEXT,
  contact_id TEXT,
  numero_formatado TEXT,
  email_usuario TEXT,
  task_id TEXT,
  site_usuario TEXT,
  link_meet TEXT,
  numero_follow TEXT,
  instance TEXT,
  nome_cliente TEXT,
  id_calendar TEXT,
  data_agendamento TEXT,
  hora_agendamento TEXT,
  "Agente_ID" TEXT DEFAULT '1',
  data_folowup_solicitado TEXT,
  folowup_solicitado BOOLEAN DEFAULT false,
  id_card TIMESTAMP WITH TIME ZONE,
  existe_whatsapp BOOLEAN,
  responsavel_encontrado BOOLEAN,
  responsavel_seguro BOOLEAN,
  efetuar_disparo BOOLEAN,
  nome_empresa TEXT,
  id_empresa TEXT,
  nome_campanha TEXT,
  
  -- CAMPOS ADICIONAIS PARA LIMPA NOME
  cpf VARCHAR(14),
  telefone VARCHAR(20),
  origem TEXT DEFAULT 'WhatsApp',
  
  -- Status do funil CRM Limpa Nome
  status_limpa_nome TEXT DEFAULT 'novo_lead' 
    CHECK (status_limpa_nome IN (
      'novo_lead', 'qualificacao', 'desqualificado', 'pagamento_consulta',
      'nao_consta_divida', 'consta_divida', 'enviado_para_negociacao', 'cliente_fechado'
    )),
  
  -- Dados financeiros
  valor_estimado_divida DECIMAL(10,2),
  valor_real_divida DECIMAL(10,2),
  valor_pago_consulta DECIMAL(10,2) CHECK (valor_pago_consulta IN (30, 199)),
  valor_contrato DECIMAL(10,2),
  
  -- Dados específicos por estágio
  tempo_negativado TEXT,
  tipo_consulta_interesse TEXT,
  motivo_desqualificacao TEXT,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  link_pagamento TEXT,
  data_consulta TIMESTAMP WITH TIME ZONE,
  orgaos_negativados TEXT[],
  link_relatorio TEXT,
  observacoes_limpa_nome TEXT,
  data_escalacao TIMESTAMP WITH TIME ZONE,
  vendedor_responsavel TEXT,
  data_fechamento TIMESTAMP WITH TIME ZONE,
  
  -- Controle
  data_ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para leads
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_cpf ON public.leads(cpf);
CREATE INDEX idx_leads_telefone ON public.leads(telefone);
CREATE INDEX idx_leads_numero_formatado ON public.leads(numero_formatado);
CREATE INDEX idx_leads_status_limpa_nome ON public.leads(status_limpa_nome);
CREATE INDEX idx_leads_nome_cliente ON public.leads(nome_cliente);
CREATE INDEX idx_leads_instance ON public.leads(instance);
CREATE INDEX idx_leads_data_atividade ON public.leads(data_ultima_atividade);

-- RLS para leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_policy" ON public.leads FOR ALL TO authenticated USING (true);

-- 4. TABELA PAGAMENTOS_CONSULTAS
-- =====================================================
CREATE TABLE public.pagamentos_consultas (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Dados do Cliente/Asaas
  id_cliente_asaas TEXT,
  id_cobranca_asaas TEXT,
  telefone_cliente VARCHAR(20),
  cpfcnpj VARCHAR(18),
  
  -- Dados do Pagamento
  valor_cobranca DECIMAL(10,2) NOT NULL,
  valor_recebido DECIMAL(10,2),
  metodo_pagamento TEXT CHECK (metodo_pagamento IN ('PIX', 'BOLETO', 'CARTAO')),
  status_pagamento TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status_pagamento IN ('PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED')),
  data_pago TIMESTAMP WITH TIME ZONE,
  
  -- Referências
  tabela_leads TEXT, -- Ex: leads_usuario1
  
  -- Links das Consultas
  consulta_link1 TEXT,
  consulta_link2 TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pagamentos_consultas
CREATE INDEX idx_pagamentos_lead_id ON public.pagamentos_consultas(lead_id);
CREATE INDEX idx_pagamentos_user_id ON public.pagamentos_consultas(user_id);
CREATE INDEX idx_pagamentos_status ON public.pagamentos_consultas(status_pagamento);

-- RLS para pagamentos_consultas
ALTER TABLE public.pagamentos_consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagamentos_policy" ON public.pagamentos_consultas FOR ALL TO authenticated USING (true);

-- =====================================================
-- FUNCTIONS E TRIGGERS
-- =====================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at 
    BEFORE UPDATE ON public.configuracoes_credenciais 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON public.leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at 
    BEFORE UPDATE ON public.pagamentos_consultas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function para atualizar data_ultima_atividade do lead
CREATE OR REPLACE FUNCTION update_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.leads 
    SET data_ultima_atividade = NOW()
    WHERE id = COALESCE(NEW.lead_id, OLD.lead_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar atividade do lead
CREATE TRIGGER update_lead_activity_on_payment 
    AFTER INSERT OR UPDATE OR DELETE ON public.pagamentos_consultas 
    FOR EACH ROW EXECUTE FUNCTION update_lead_activity();

-- =====================================================
-- VIEWS PARA DASHBOARD
-- =====================================================

-- View para funil de conversão
CREATE OR REPLACE VIEW v_funil_conversao AS
SELECT 
    u.id as user_id,
    u.name as usuario,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.status_limpa_nome = 'novo_lead' THEN 1 END) as novos_leads,
    COUNT(CASE WHEN l.status_limpa_nome = 'qualificacao' THEN 1 END) as qualificados,
    COUNT(CASE WHEN l.status_limpa_nome = 'pagamento_consulta' THEN 1 END) as pagou_consulta,
    COUNT(CASE WHEN l.status_limpa_nome = 'consta_divida' THEN 1 END) as divida_encontrada,
    COUNT(CASE WHEN l.status_limpa_nome = 'cliente_fechado' THEN 1 END) as contratos_fechados
FROM public.users u
LEFT JOIN public.leads l ON u.id = l.user_id
WHERE u.active = true
GROUP BY u.id, u.name;

-- View para métricas financeiras
CREATE OR REPLACE VIEW v_metricas_financeiras AS
SELECT 
    u.id as user_id,
    u.name as usuario,
    COALESCE(SUM(p.valor_recebido), 0) as total_consultas_pagas,
    COALESCE(SUM(l.valor_contrato), 0) as receita_contratos,
    COALESCE(AVG(l.valor_contrato), 0) as ticket_medio,
    COUNT(CASE WHEN p.status_pagamento = 'RECEIVED' AND p.valor_cobranca = 30 THEN 1 END) as consultas_basicas,
    COUNT(CASE WHEN p.status_pagamento = 'RECEIVED' AND p.valor_cobranca = 199 THEN 1 END) as consultas_rating
FROM public.users u
LEFT JOIN public.leads l ON u.id = l.user_id
LEFT JOIN public.pagamentos_consultas p ON l.id = p.lead_id
WHERE u.active = true
GROUP BY u.id, u.name;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Usuários padrão
INSERT INTO public.users (name, email, password, role, active) VALUES
('Administrator', 'admin@dnxplataformas.com.br', 'admin123', 'admin', true),
('Usuário Demo', 'demo@dnxplataformas.com.br', 'demo123', 'user', true)
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE public.leads IS 'Tabela de leads com campos originais + extensões Limpa Nome';
COMMENT ON TABLE public.configuracoes_credenciais IS 'Configurações por usuário incluindo WhatsApp';
COMMENT ON TABLE public.pagamentos_consultas IS 'Controle de pagamentos e consultas';