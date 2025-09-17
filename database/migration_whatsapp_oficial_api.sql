-- =====================================================
-- MIGRAÇÃO PARA SUPORTE À API OFICIAL DO WHATSAPP
-- =====================================================

-- Adicionar campos para suporte à API oficial do WhatsApp na tabela instancia_whtats
ALTER TABLE public.instancia_whtats
ADD COLUMN IF NOT EXISTS waba_id TEXT,
ADD COLUMN IF NOT EXISTS nt_id TEXT,
ADD COLUMN IF NOT EXISTS is_official_api BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_instancia_waba_id ON public.instancia_whtats(waba_id);
CREATE INDEX IF NOT EXISTS idx_instancia_official_api ON public.instancia_whtats(is_official_api);
CREATE INDEX IF NOT EXISTS idx_instancia_phone_number_id ON public.instancia_whtats(phone_number_id);

-- Comentários para documentação
COMMENT ON COLUMN public.instancia_whtats.waba_id IS 'ID da WhatsApp Business Account (WABA) para API oficial';
COMMENT ON COLUMN public.instancia_whtats.nt_id IS 'Number Type ID para API oficial';
COMMENT ON COLUMN public.instancia_whtats.is_official_api IS 'Indica se a instância usa a API oficial do WhatsApp';
COMMENT ON COLUMN public.instancia_whtats.access_token IS 'Token de acesso para API oficial do WhatsApp';
COMMENT ON COLUMN public.instancia_whtats.phone_number_id IS 'ID do número de telefone na API oficial';

-- Criar tabela para templates aprovados
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id BIGSERIAL PRIMARY KEY,
  instancia_id BIGINT NOT NULL REFERENCES public.instancia_whtats(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_language TEXT NOT NULL DEFAULT 'pt_BR',
  template_category TEXT NOT NULL,
  template_status TEXT NOT NULL,
  template_components JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(instancia_id, template_name, template_language)
);

-- Índices para templates
CREATE INDEX idx_templates_instancia_id ON public.whatsapp_templates(instancia_id);
CREATE INDEX idx_templates_name ON public.whatsapp_templates(template_name);
CREATE INDEX idx_templates_status ON public.whatsapp_templates(template_status);

-- RLS para templates
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_policy" ON public.whatsapp_templates FOR ALL TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para a tabela de templates
COMMENT ON TABLE public.whatsapp_templates IS 'Templates aprovados para uso na API oficial do WhatsApp';
COMMENT ON COLUMN public.whatsapp_templates.template_components IS 'Estrutura JSON dos componentes do template (header, body, footer, buttons)';