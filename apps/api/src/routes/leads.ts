import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware)

// GET /api/leads - Listar leads com paginação e filtros
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId
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

    // Query base
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })

    // Filtro por status
    if (status) {
      query = query.eq('status', status)
    }

    // Busca por nome, email ou telefone
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
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

// GET /api/leads/:id - Buscar lead por ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', parseInt(id))
      .single()

    if (error || !lead) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/leads - Criar novo lead
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { name, email, phone, cpf, value, status = 'novo', notes } = req.body

    if (!name) {
      throw ApiError.badRequest('Nome e obrigatorio', 'MISSING_NAME')
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        cpf,
        value: value ? parseFloat(value) : null,
        status,
        notes,
        created_by: parseInt(userId || '0')
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create lead')
      throw ApiError.internal('Erro ao criar lead', 'CREATE_LEAD_ERROR')
    }

    logger.info({ leadId: lead.id, userId }, 'Lead created')
    ApiResponse.created(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/leads/:id - Atualizar lead
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const { name, email, phone, cpf, value, status, notes } = req.body

    // Verificar se lead existe
    const { data: existing, error: existError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', parseInt(id))
      .single()

    if (existError || !existing) {
      throw ApiError.notFound('Lead nao encontrado', 'LEAD_NOT_FOUND')
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (cpf !== undefined) updateData.cpf = cpf
    if (value !== undefined) updateData.value = parseFloat(value)
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update lead')
      throw ApiError.internal('Erro ao atualizar lead', 'UPDATE_LEAD_ERROR')
    }

    logger.info({ leadId: id, userId }, 'Lead updated')
    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/leads/:id - Deletar lead
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', parseInt(id))

    if (error) {
      logger.error({ error }, 'Failed to delete lead')
      throw ApiError.internal('Erro ao deletar lead', 'DELETE_LEAD_ERROR')
    }

    logger.info({ leadId: id, userId }, 'Lead deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/leads/:id/status - Atualizar status do lead
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user?.userId

    if (!status) {
      throw ApiError.badRequest('Status e obrigatorio', 'MISSING_STATUS')
    }

    const validStatuses = ['novo', 'em_negociacao', 'proposta_enviada', 'fechado', 'perdido']
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Status invalido. Use: ${validStatuses.join(', ')}`, 'INVALID_STATUS')
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update lead status')
      throw ApiError.internal('Erro ao atualizar status', 'UPDATE_STATUS_ERROR')
    }

    logger.info({ leadId: id, status, userId }, 'Lead status updated')
    ApiResponse.success(res, lead)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
