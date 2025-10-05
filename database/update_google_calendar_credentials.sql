-- Migration: Atualizar estrutura das credenciais do Google Calendar
-- Data: 2025-10-05
-- Descrição: Adicionar client_id e client_secret às credenciais do Google Calendar

-- Comentário na coluna explicando a nova estrutura
COMMENT ON COLUMN public.credencias_diversas.google_calendar IS
'Credenciais OAuth2 do Google Calendar. Formato JSON: {"email": "usuario@gmail.com", "refresh_token": "1//0xxx", "client_id": "xxx.apps.googleusercontent.com", "client_secret": "xxx"}';

-- Exemplo de estrutura esperada:
-- {
--   "email": "usuario@gmail.com",
--   "refresh_token": "1//0gL9...",
--   "client_id": "xxxxx.apps.googleusercontent.com",
--   "client_secret": "GOCSPX-xxxxx"
-- }
