import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils'
import { authMiddleware } from '../middleware/auth'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// GET /api/arquivos - Listar arquivos do workspace
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const { produto, mimetype } = req.query

    let query = supabase
      .from('arquivos')
      .select('*')
      .eq('workspace_id', workspaceId)

    // Filtro por produto
    if (produto) {
      query = query.eq('produto', produto)
    }

    // Filtro por tipo de arquivo
    if (mimetype) {
      query = query.eq('mimetype', mimetype)
    }

    query = query.order('id', { ascending: false })

    const { data: arquivos, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch arquivos')
      throw ApiError.internal('Erro ao buscar arquivos', 'FETCH_ARQUIVOS_ERROR')
    }

    ApiResponse.success(res, arquivos || [])

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/arquivos/:id - Buscar arquivo por ID (dentro do workspace)
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    const { data: arquivo, error } = await supabase
      .from('arquivos')
      .select('*')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !arquivo) {
      throw ApiError.notFound('Arquivo nao encontrado', 'ARQUIVO_NOT_FOUND')
    }

    ApiResponse.success(res, arquivo)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/arquivos - Upload de arquivo no workspace
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const workspaceId = req.workspaceId
    const arquivoData = req.body

    if (!arquivoData.nome || !arquivoData.arquivo) {
      throw ApiError.badRequest('Nome e arquivo sao obrigatorios', 'MISSING_REQUIRED_FIELDS')
    }

    const { data: arquivo, error } = await supabase
      .from('arquivos')
      .insert({
        ...arquivoData,
        workspace_id: workspaceId,
        user_id: parseInt(userId || '0')
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create arquivo')
      throw ApiError.internal('Erro ao criar arquivo', 'CREATE_ARQUIVO_ERROR')
    }

    logger.info({ arquivoId: arquivo.id, workspaceId, userId }, 'Arquivo created')
    ApiResponse.created(res, arquivo)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/arquivos/:id - Atualizar arquivo (dentro do workspace)
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const updateData = req.body

    // Verificar se arquivo existe e pertence ao workspace
    const { data: existing, error: existError } = await supabase
      .from('arquivos')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (existError || !existing) {
      throw ApiError.notFound('Arquivo nao encontrado', 'ARQUIVO_NOT_FOUND')
    }

    // Não permitir alterar workspace_id e user_id
    delete updateData.workspace_id
    delete updateData.user_id

    const { data: arquivo, error } = await supabase
      .from('arquivos')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update arquivo')
      throw ApiError.internal('Erro ao atualizar arquivo', 'UPDATE_ARQUIVO_ERROR')
    }

    logger.info({ arquivoId: id, workspaceId, userId }, 'Arquivo updated')
    ApiResponse.success(res, arquivo)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/arquivos/:id - Deletar arquivo (dentro do workspace)
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    // Verificar se arquivo pertence ao workspace antes de deletar
    const { data: existing } = await supabase
      .from('arquivos')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Arquivo nao encontrado', 'ARQUIVO_NOT_FOUND')
    }

    const { error } = await supabase
      .from('arquivos')
      .delete()
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)

    if (error) {
      logger.error({ error }, 'Failed to delete arquivo')
      throw ApiError.internal('Erro ao deletar arquivo', 'DELETE_ARQUIVO_ERROR')
    }

    logger.info({ arquivoId: id, workspaceId, userId }, 'Arquivo deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
