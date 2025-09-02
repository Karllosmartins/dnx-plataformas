-- =====================================================
-- SEED DATA - DNX PLATAFORMAS CRM LIMPA NOME
-- Dados iniciais para teste e desenvolvimento
-- =====================================================

-- Inserir usuários de exemplo
INSERT INTO public.users (name, email, password, role, active, cpf, telefone, plano, limite_leads, limite_consultas) VALUES
('Administrator', 'admin@dnxplataformas.com.br', 'admin123', 'admin', true, '11111111111', '5511999999999', 'enterprise', 1000, 100),
('Usuário Demo 1', 'usuario1@dnxplataformas.com.br', 'demo123', 'user', true, '03082774148', '556281048778', 'premium', 500, 50),
('Usuário Demo 2', 'usuario2@dnxplataformas.com.br', 'demo123', 'user', true, '99999999999', '5511888888888', 'basico', 100, 10)
ON CONFLICT (email) DO NOTHING;

-- Inserir alguns leads de exemplo
INSERT INTO public.leads (name, cpf, phone, email, status, user_id, created_at) VALUES
('João Silva', '12345678901', '5511999999999', 'joao@email.com', 'novo', 1, NOW()),
('Maria Santos', '10987654321', '5511888888888', 'maria@email.com', 'em_progresso', 1, NOW()),
('Pedro Costa', '55566677788', '5511777777777', 'pedro@email.com', 'finalizado', 1, NOW())
ON CONFLICT (cpf) DO NOTHING;

-- Inserir configurações básicas
-- IMPORTANTE: Configure suas chaves de API reais através da interface web
-- ou através de variáveis de ambiente em produção