-- SCRIPT PARA VERIFICAR SE OS PLANOS ESTÃO CONFIGURADOS CORRETAMENTE

-- 1. Verificar se a tabela planos existe e tem os dados corretos
SELECT
  nome,
  acesso_dashboard,
  acesso_crm,
  acesso_whatsapp,
  acesso_disparo_simples,
  acesso_disparo_ia,
  acesso_agentes_ia,
  acesso_extracao_leads,
  acesso_enriquecimento,
  acesso_usuarios
FROM planos
ORDER BY nome;

-- 2. Verificar se os usuários têm plano_id configurado
SELECT
  id,
  name,
  email,
  plano as plano_legado,
  plano_id,
  role
FROM users
ORDER BY name;

-- 3. Verificar a view view_usuarios_planos
SELECT
  id,
  name,
  email,
  plano_nome,
  acesso_extracao_leads,
  acesso_enriquecimento
FROM view_usuarios_planos
WHERE plano_nome LIKE '%premium%'
ORDER BY name;

-- 4. CORRIGIR DADOS SE NECESSÁRIO:
-- Se um usuário Premium 1 tiver acesso à extração, execute:
-- UPDATE users SET plano_id = (SELECT id FROM planos WHERE nome = 'premium1') WHERE id = [ID_DO_USUARIO];

-- 5. Verificar novamente depois da correção:
-- SELECT * FROM view_usuarios_planos WHERE id = [ID_DO_USUARIO];