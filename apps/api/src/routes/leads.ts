import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils'
import { authMiddleware } from '../middleware/auth'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

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
      order = 'desc'
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = Math.min(parseInt(limit as string), 100) // Max 100
    const offset = (pageNum - 1) * limitNum

    // Query base - filtrar por workspace
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)

    // Filtro por status
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
    const leadData = req.body

    if (!leadData.nome_cliente && !leadData.name) {
      throw ApiError.badRequest('Nome e obrigatorio', 'MISSING_NAME')
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
      logger.error({ error }, 'Failed to create lead')
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
    const updateData = req.body

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

    // Não permitir alterar workspace_id
    delete updateData.workspace_id
    delete updateData.user_id

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
      logger.error({ error }, 'Failed to update lead')
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

// PUT /api/leads/:id/status - Atualizar status do lead (dentro do workspace)
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

export default router
