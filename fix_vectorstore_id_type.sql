-- Alterar o tipo da coluna vectorstore_id de integer para text
-- pois os IDs da OpenAI são strings como "vs_68b3577bc48881918c0fc7f77bde1954"

ALTER TABLE public.user_agent_vectorstore 
ALTER COLUMN vectorstore_id TYPE text;