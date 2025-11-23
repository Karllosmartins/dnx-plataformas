import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils'
import { authMiddleware } from '../middleware/auth'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// GET /api/agentes-ia - Listar agentes IA do workspace
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const { estagio } = req.query

    let query = supabase
      .from('agentes_ia')
      .select('*')
      .eq('workspace_id', workspaceId)

    // Filtro por estágio
    if (estagio) {
      query = query.eq('estagio', estagio)
    }

    query = query.order('created_at', { ascending: false })

    const { data: agentes, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch agentes IA')
      throw ApiError.internal('Erro ao buscar agentes IA', 'FETCH_AGENTES_ERROR')
    }

    ApiResponse.success(res, agentes || [])

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/agentes-ia/:id - Buscar agente por ID (dentro do workspace)
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    const { data: agente, error } = await supabase
      .from('agentes_ia')
      .select('*')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !agente) {
      throw ApiError.notFound('Agente IA nao encontrado', 'AGENTE_NOT_FOUND')
    }

    ApiResponse.success(res, agente)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/agentes-ia - Criar novo agente IA no workspace
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const workspaceId = req.workspaceId
    const agenteData = req.body

    if (!agenteData.nome || !agenteData.prompt) {
      throw ApiError.badRequest('Nome e prompt sao obrigatorios', 'MISSING_REQUIRED_FIELDS')
    }

    const { data: agente, error } = await supabase
      .from('agentes_ia')
      .insert({
        ...agenteData,
        workspace_id: workspaceId,
        user_id: parseInt(userId || '0'),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create agente IA')
      throw ApiError.internal('Erro ao criar agente IA', 'CREATE_AGENTE_ERROR')
    }

    logger.info({ agenteId: agente.id, workspaceId, userId }, 'Agente IA created')
    ApiResponse.created(res, agente)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/agentes-ia/:id - Atualizar agente IA (dentro do workspace)
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const updateData = req.body

    // Verificar se agente existe e pertence ao workspace
    const { data: existing, error: existError } = await supabase
      .from('agentes_ia')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (existError || !existing) {
      throw ApiError.notFound('Agente IA nao encontrado', 'AGENTE_NOT_FOUND')
    }

    // Não permitir alterar workspace_id e user_id
    delete updateData.workspace_id
    delete updateData.user_id

    const { data: agente, error } = await supabase
      .from('agentes_ia')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update agente IA')
      throw ApiError.internal('Erro ao atualizar agente IA', 'UPDATE_AGENTE_ERROR')
    }

    logger.info({ agenteId: id, workspaceId, userId }, 'Agente IA updated')
    ApiResponse.success(res, agente)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/agentes-ia/:id - Deletar agente IA (dentro do workspace)
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    // Verificar se agente pertence ao workspace antes de deletar
    const { data: existing } = await supabase
      .from('agentes_ia')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Agente IA nao encontrado', 'AGENTE_NOT_FOUND')
    }

    const { error } = await supabase
      .from('agentes_ia')
      .delete()
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)

    if (error) {
      logger.error({ error }, 'Failed to delete agente IA')
      throw ApiError.internal('Erro ao deletar agente IA', 'DELETE_AGENTE_ERROR')
    }

    logger.info({ agenteId: id, workspaceId, userId }, 'Agente IA deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
