-- Script para migrar leads para seus respectivos funis por workspace
-- Executa em modo seguro: apenas atualiza leads que ainda não têm funil_id

-- 1. Primeiro, vamos verificar a situação atual
SELECT 
    'ANTES DA MIGRACAO' as status,
    w.name as workspace,
    COUNT(l.id) as total_leads,
    COUNT(l.funil_id) as leads_com_funil,
    COUNT(l.id) - COUNT(l.funil_id) as leads_sem_funil
FROM leads l
JOIN workspaces w ON l.workspace_id = w.id
GROUP BY w.id, w.name
ORDER BY w.name;

-- 2. Verificar funis disponíveis por workspace
SELECT 
    w.name as workspace,
    f.id as funil_id,
    f.nome as funil_nome,
    f.ativo
FROM funis f
JOIN workspaces w ON f.workspace_id = w.id
WHERE f.ativo = true
ORDER BY w.name, f.ordem;

-- 3. Verificar estágios do primeiro funil de cada workspace
SELECT 
    w.name as workspace,
    f.nome as funil,
    e.id as estagio_id,
    e.nome as estagio_nome,
    e.ordem
FROM funil_estagios e
JOIN funis f ON e.funil_id = f.id
JOIN workspaces w ON f.workspace_id = w.id
WHERE f.ativo = true 
  AND e.ativo = true
  AND f.id IN (
    SELECT DISTINCT ON (workspace_id) id 
    FROM funis 
    WHERE ativo = true 
    ORDER BY workspace_id, ordem
  )
ORDER BY w.name, e.ordem;


-- ============================================================================
-- SCRIPT DE MIGRAÇÃO: Associar leads aos funis de seus workspaces
-- ============================================================================

-- Este script:
-- 1. Pega o PRIMEIRO funil ativo de cada workspace (ordenado por 'ordem')
-- 2. Pega o PRIMEIRO estágio ativo desse funil (ordenado por 'ordem')
-- 3. Atualiza APENAS leads que NÃO têm funil_id (preserva dados existentes)

-- 4. EXECUTAR A MIGRAÇÃO
-- Atualizar leads sem funil, associando ao primeiro funil/estágio do workspace

UPDATE leads l
SET 
    funil_id = subquery.funil_id,
    estagio_id = subquery.estagio_id,
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (f.workspace_id)
        f.workspace_id,
        f.id as funil_id,
        (
            SELECT e.id 
            FROM funil_estagios e 
            WHERE e.funil_id = f.id 
              AND e.ativo = true 
            ORDER BY e.ordem 
            LIMIT 1
        ) as estagio_id
    FROM funis f
    WHERE f.ativo = true
    ORDER BY f.workspace_id, f.ordem
) subquery
WHERE l.workspace_id = subquery.workspace_id
  AND l.funil_id IS NULL;

-- 5. Verificar resultado após migração
SELECT 
    'DEPOIS DA MIGRACAO' as status,
    w.name as workspace,
    COUNT(l.id) as total_leads,
    COUNT(l.funil_id) as leads_com_funil,
    COUNT(l.id) - COUNT(l.funil_id) as leads_sem_funil
FROM leads l
JOIN workspaces w ON l.workspace_id = w.id
GROUP BY w.id, w.name
ORDER BY w.name;

-- 6. Mostrar distribuição por funil após migração
SELECT 
    w.name as workspace,
    f.nome as funil,
    COUNT(l.id) as total_leads
FROM leads l
JOIN workspaces w ON l.workspace_id = w.id
LEFT JOIN funis f ON l.funil_id = f.id
GROUP BY w.name, f.nome
ORDER BY w.name, f.nome;


-- ============================================================================
-- OPCIONAL: Inicializar dados_personalizados como objeto vazio
-- ============================================================================
-- Execute isso se quiser que todos os leads tenham dados_personalizados 
-- mesmo que vazio (facilita a edição posterior)

-- Verificar leads com dados_personalizados NULL
SELECT 
    COUNT(*) as leads_sem_dados_personalizados
FROM leads 
WHERE dados_personalizados IS NULL;

-- Inicializar como objeto vazio (descomente para executar)
-- UPDATE leads 
-- SET dados_personalizados = '{}'::jsonb 
-- WHERE dados_personalizados IS NULL;

