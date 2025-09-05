-- Alterar o tipo da coluna vectorstore_id de integer para text
-- pois os IDs da OpenAI são strings como "vs_68b3577bc48881918c0fc7f77bde1954"

-- Primeiro verificar o tipo atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_agent_vectorstore' 
AND table_schema = 'public';

-- Se a coluna ainda for integer, executar a alteração:
ALTER TABLE public.user_agent_vectorstore 
ALTER COLUMN vectorstore_id TYPE text USING vectorstore_id::text;

-- Verificar se a alteração foi aplicada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_agent_vectorstore' 
AND table_schema = 'public';