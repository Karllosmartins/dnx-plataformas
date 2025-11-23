import { Router, Response } from 'express'
import { supabase } from '../lib/supabase.js'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace.js'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// GET /api/leads/stats - Estatísticas de leads para dashboard (SEM paginação)
// IMPORTANTE: Esta rota deve vir ANTES de / para não conflitar
router.get('/stats', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId

    // Contagem total de leads
    const { count: totalLeads, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)

    if (countError) {
      logger.error({ error: countError }, 'Failed to count leads')
      throw ApiError.internal('Erro ao contar leads', 'COUNT_LEADS_ERROR')
    }

    // Buscar leads com funil_id para distribuição por funis
    const { data: leadsWithFunil, error: funilError } = await supabase
      .from('leads')
      .select('funil_id')
      .eq('workspace_id', workspaceId)
      .not('funil_id', 'is', null)

    if (funilError) {
      logger.error({ error: funilError }, 'Failed to fetch leads with funil')
      throw ApiError.internal('Erro ao buscar leads por funil', 'FETCH_LEADS_FUNIL_ERROR')
    }

    // Contar leads por funil
    const distribuicaoFunis: Record<string, number> = {}
    leadsWithFunil?.forEach(lead => {
      if (lead.funil_id) {
        distribuicaoFunis[lead.funil_id] = (distribuicaoFunis[lead.funil_id] || 0) + 1
      }
    })

    // Buscar nomes dos funis
    const funilIds = Object.keys(distribuicaoFunis)
    let funisData: Array<{ id: string; nome: string }> = []

    if (funilIds.length > 0) {
      const { data: funis } = await supabase
        .from('funis')
        .select('id, nome')
        .in('id', funilIds)
        .eq('workspace_id', workspaceId)

      funisData = funis || []
    }

    // Montar resposta de distribuição com nomes
    const distribuicaoComNomes = funisData.map(funil => ({
      funil_id: funil.id,
      nome: funil.nome,
      total: distribuicaoFunis[funil.id] || 0
    }))

    // Leads sem funil
    const leadsSemFunil = (totalLeads || 0) - (leadsWithFunil?.length || 0)

    // Buscar leads recentes (últimos 30 dias) para métricas
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: leadsRecentes } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Leads do mês atual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { count: leadsMesAtual } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', inicioMes.toISOString())

    ApiResponse.success(res, {
      total: totalLeads || 0,
      leads_sem_funil: leadsSemFunil,
      leads_com_funil: leadsWithFunil?.length || 0,
      leads_recentes_30d: leadsRecentes || 0,
      leads_mes_atual: leadsMesAtual || 0,
      distribuicao_funis: distribuicaoComNomes,
      funis_total: funisData.length
    })

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/leads - Listar leads do workspace com paginação e filtros
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const {
      page = '1',
      limit = '20',
      status,
      search,
      sort = 'created_at',
      order = 'desc',
      funil_id,
      estagio_id
    } = req.query

    const pageNum = parseInt(page as string)
    // Aumentado limite máximo para 500 para permitir consultas maiores
    const limitNum = Math.min(parseInt(limit as string), 500)
    const offset = (pageNum - 1) * limitNum

    // Query base - filtrar por workspace
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)

    // Filtro por funil
    if (funil_id) {
      query = query.eq('funil_id', funil_id)
    }

    // Filtro por estágio
    if (estagio_id) {
      query = query.eq('estagio_id', estagio_id)
    }

    // Filtro por status (legado)
    if (status) {
      query = query.eq('status_limpa_nome', status)
    }

    // Busca por nome, email ou telefone
    if (search) {
      query = query.or(`nome_cliente.ilike.%${search}%,email_usuario.ilike.%${search}%,numero_formatado.ilike.%${search}%`)
    }

    // Ordenação
    query = query.order(sort as string, { ascending: order === 'asc' })

    // Paginação
    query = query.range(offset, offset + limitNum - 1)

    const { data: leads, error, count } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch leads')
      throw ApiError.internal('Erro ao buscar leads', 'FETCH_LEADS_ERROR')
    }

    ApiResponse.paginated(res, leads || [], pageNum, limitNum, count || 0)

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/leads/kanban/:funilId - Listar leads agrupados por estágio (para Kanban)
// IMPORTANTE: Esta rota deve vir ANTES de /:id para não conflitar
router.get('/kanban/:funilId', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { funilId } = req.params
    const workspaceId = req.workspaceId

    // Verificar se funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('id, nome')
      .eq('id', funilId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    // Buscar estágios do funil
    const { data: estagios, error: estagiosError } = await supabase
      .from('funil_estagios')
      .select('id, nome, cor, ordem')
      .eq('funil_id', funilId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (estagiosError) {
      throw ApiError.internal('Erro ao buscar estagios', 'FETCH_ESTAGIOS_ERROR')
    }

    // Buscar leads do funil
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome_cliente, email_usuario, numero_formatado, estagio_id, created_at, updated_at, dados_personalizados')
      .eq('workspace_id', workspaceId)
      .eq('funil_id', funilId)
      .order('created_at', { ascending: false })

    if (leadsError) {
      throw ApiError.internal('Erro ao buscar leads', 'FETCH_LEADS_ERROR')
    }

    // Agrupar leads por estágio
    const kanban = estagios?.map(estagio => ({
      ...estagio,
      leads: leads?.filter(lead => lead.estagio_id === estagio.id) || [],
      total: leads?.filter(lead => lead.estagio_id === estagio.id).length || 0
    })) || []

    // Adicionar coluna para leads sem estágio
    const leadsWithoutStage = leads?.filter(lead => !lead.estagio_id) || []
    if (leadsWithoutStage.length > 0) {
      kanban.unshift({
        id: 'sem-estagio',
        nome: 'Sem Estágio',
        cor: '#9CA3AF',
        ordem: 0,
        leads: leadsWithoutStage,
        total: leadsWithoutStage.length
      })
    }

    ApiResponse.success(res, {
      funil,
      kanban,
      total_leads: leads?.length || 0
    })

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/leads/bulk/estagio - Mover múltiplos leads para outro estágio
// IMPORTANTE: Esta rota deve vir ANTES de /:id para não conflitar
router.put('/bulk/estagio', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { lead_ids, estagio_id } = req.body
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      throw ApiError.badRequest('IDs dos leads sao obrigatorios', 'MISSING_LEAD_IDS')
    }

    if (!estagio_id) {
      throw ApiError.badRequest('ID do estagio e obrigatorio', 'MISSING_ESTAGIO_ID')
    }

    // Verificar se todos os leads pertencem ao workspace
    const { data: existingLeads, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .in('id', lead_ids)
      .eq('workspace_id', workspaceId)

    if (checkError || !existingLeads || existingLeads.length !== lead_ids.length) {
      throw ApiError.badRequest('Alguns leads nao foram encontrados ou nao pertencem ao workspace', 'INVALID_LEADS')
    }

    // Atualizar leads
    const { data: leads, error } = await supabase
      .from('leads')
      .update({
        estagio_id,
        updated_at: new Date().toISOString()
      })
      .in('id', lead_ids)
      .eq('workspace_id', workspaceId)
      .select()

    if (error) {
      logger.error({ error }, 'Failed to bulk update leads estagio')
      throw ApiError.internal('Erro ao mover leads', 'BULK_UPDATE_ERROR')
    }

    logger.info({ leadIds: lead_ids, estagioId: estagio_id, workspaceId, userId }, 'Bulk leads moved to new stage')
    ApiResponse.success(res, { updated: leads?.length || 0, leads })

  } catch (error) {
    handleApiError(error, res)
  }
})

// PATCH /api/leads/:id/stage - Mover lead para outro estágio
router.patch('/:id/stage', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const { estagioId } = req.body
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    if (!estagioId) {
      throw ApiError.badRequest('ID do estagio e obrigatorio', 'MISSING_ESTAGIO_ID')
    }

    // Verificar se lead pertence ao workspace
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (checkError || !existingLead) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    // Atualizar estágio do lead
    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        estagio_id: estagioId,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update lead stage')
      throw ApiError.internal('Erro ao mover lead', 'UPDATE_STAGE_ERROR')
    }

    logger.info({ leadId: id, estagioId, workspaceId, userId }, 'Lead moved to new stage')
    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/leads/:id - Buscar lead por ID (dentro do workspace)
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !lead) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/leads - Criar novo lead no workspace
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const workspaceId = req.workspaceId
    const leadData = { ...req.body }

    if (!leadData.nome_cliente && !leadData.name) {
      throw ApiError.badRequest('Nome e obrigatorio', 'MISSING_NAME')
    }

    // Renomear campos_personalizados para dados_personalizados
    if (leadData.campos_personalizados !== undefined) {
      leadData.dados_personalizados = leadData.campos_personalizados
      delete leadData.campos_personalizados
    }

    // Garantir que funil_id e estagio_id sejam null se vazios
    if (leadData.funil_id === '' || leadData.funil_id === 'none') {
      leadData.funil_id = null
    }
    if (leadData.estagio_id === '' || leadData.estagio_id === 'none') {
      leadData.estagio_id = null
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        workspace_id: workspaceId,
        user_id: parseInt(userId || '0'), // Mantém para compatibilidade
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error({ error, leadData }, 'Failed to create lead')
      throw ApiError.internal('Erro ao criar lead', 'CREATE_LEAD_ERROR')
    }

    logger.info({ leadId: lead.id, workspaceId, userId }, 'Lead created')
    ApiResponse.created(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/leads/:id - Atualizar lead (dentro do workspace)
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const updateData = { ...req.body }

    // Verificar se lead existe e pertence ao workspace
    const { data: existing, error: existError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (existError || !existing) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    // Não permitir alterar campos protegidos
    delete updateData.workspace_id
    delete updateData.user_id
    delete updateData.id
    delete updateData.created_at

    // Renomear campos_personalizados para dados_personalizados
    if (updateData.campos_personalizados !== undefined) {
      updateData.dados_personalizados = updateData.campos_personalizados
      delete updateData.campos_personalizados
    }

    // Garantir que funil_id e estagio_id sejam null se vazios
    if (updateData.funil_id === '' || updateData.funil_id === 'none') {
      updateData.funil_id = null
    }
    if (updateData.estagio_id === '' || updateData.estagio_id === 'none') {
      updateData.estagio_id = null
    }

    const { data: lead, error} = await supabase
      .from('leads')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error, updateData }, 'Failed to update lead')
      throw ApiError.internal('Erro ao atualizar lead', 'UPDATE_LEAD_ERROR')
    }

    logger.info({ leadId: id, workspaceId, userId }, 'Lead updated')
    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/leads/:id - Deletar lead (dentro do workspace)
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    // Verificar se lead pertence ao workspace antes de deletar
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)

    if (error) {
      logger.error({ error }, 'Failed to delete lead')
      throw ApiError.internal('Erro ao deletar lead', 'DELETE_LEAD_ERROR')
    }

    logger.info({ leadId: id, workspaceId, userId }, 'Lead deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/leads/:id/status - Atualizar status do lead (legado)
router.put('/:id/status', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    if (!status) {
      throw ApiError.badRequest('Status e obrigatorio', 'MISSING_STATUS')
    }

    // Verificar se lead pertence ao workspace
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        status_limpa_nome: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update lead status')
      throw ApiError.internal('Erro ao atualizar status', 'UPDATE_STATUS_ERROR')
    }

    logger.info({ leadId: id, status, workspaceId, userId }, 'Lead status updated')
    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/leads/:id/estagio - Mover lead para outro estágio (para Kanban)
router.put('/:id/estagio', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const { estagio_id, funil_id } = req.body
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    if (!estagio_id) {
      throw ApiError.badRequest('ID do estagio e obrigatorio', 'MISSING_ESTAGIO_ID')
    }

    // Verificar se lead pertence ao workspace
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, funil_id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (!existingLead) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    // Verificar se o estágio existe e pertence ao funil correto
    const targetFunilId = funil_id || existingLead.funil_id

    if (!targetFunilId) {
      throw ApiError.badRequest('Lead nao esta vinculado a nenhum funil', 'LEAD_NO_FUNIL')
    }

    const { data: estagio } = await supabase
      .from('funil_estagios')
      .select('id, funil_id, nome')
      .eq('id', estagio_id)
      .eq('funil_id', targetFunilId)
      .single()

    if (!estagio) {
      throw ApiError.notFound('Estagio nao encontrado neste funil', 'ESTAGIO_NOT_FOUND')
    }

    // Verificar se o funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('id')
      .eq('id', targetFunilId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.forbidden('Funil nao pertence ao workspace', 'FUNIL_NOT_IN_WORKSPACE')
    }

    // Atualizar lead
    const updateData: Record<string, unknown> = {
      estagio_id,
      updated_at: new Date().toISOString()
    }

    // Se mudou de funil, atualizar também
    if (funil_id && funil_id !== existingLead.funil_id) {
      updateData.funil_id = funil_id
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update lead estagio')
      throw ApiError.internal('Erro ao mover lead', 'UPDATE_ESTAGIO_ERROR')
    }

    logger.info({ leadId: id, estagioId: estagio_id, estagioNome: estagio.nome, workspaceId, userId }, 'Lead moved to new stage')
    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
