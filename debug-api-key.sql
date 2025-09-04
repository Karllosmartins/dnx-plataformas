-- Query para verificar se o usuário tem API Key configurada
SELECT 
    u.id,
    u.name,
    u.email,
    cc.apikeydados,
    CASE 
        WHEN cc.apikeydados IS NOT NULL AND cc.apikeydados != '' THEN 'Configurada'
        ELSE 'NÃO CONFIGURADA'
    END as status_api_key
FROM users u
LEFT JOIN configuracoes_credenciais cc ON u.id = cc.user_id
WHERE u.id = 24;  -- Seu ID de usuário conforme o log