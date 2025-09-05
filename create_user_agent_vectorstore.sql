-- Criar tabela user_agent_vectorstore
CREATE TABLE IF NOT EXISTS public.user_agent_vectorstore (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES public.agentes_ia(id) ON DELETE CASCADE,
  vectorstore_id TEXT NOT NULL, -- ID do vector store na OpenAI
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada usuário + agente tenha apenas um vector store
  UNIQUE(user_id, agent_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_agent_vectorstore_user_id ON public.user_agent_vectorstore(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agent_vectorstore_agent_id ON public.user_agent_vectorstore(agent_id);
CREATE INDEX IF NOT EXISTS idx_user_agent_vectorstore_active ON public.user_agent_vectorstore(is_active);

-- RLS (Row Level Security)
ALTER TABLE public.user_agent_vectorstore ENABLE ROW LEVEL SECURITY;

-- Política para que usuários só vejam seus próprios dados
CREATE POLICY IF NOT EXISTS "vectorstore_policy" 
ON public.user_agent_vectorstore 
FOR ALL 
TO authenticated 
USING (true); -- Por enquanto permite tudo, depois pode restringir por user_id

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_agent_vectorstore_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_user_agent_vectorstore_updated_at
    BEFORE UPDATE ON public.user_agent_vectorstore 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_agent_vectorstore_updated_at();

-- Comentário
COMMENT ON TABLE public.user_agent_vectorstore IS 'Tabela de correlação entre usuários, agentes IA e vector stores da OpenAI';