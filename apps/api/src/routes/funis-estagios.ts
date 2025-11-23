import { Router, Response } from 'express'
import { supabase } from '../lib/supabase.js'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace.js'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// GET /api/funis/:funilId/estagios - Listar estágios de um funil
router.get('/:funilId/estagios', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { funilId } = req.params
    const workspaceId = req.workspaceId

    // Verificar se funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('id')
      .eq('id', funilId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    const { data: estagios, error } = await supabase
      .from('funil_estagios')
      .select('*')
      .eq('funil_id', funilId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      logger.error({ error }, 'Failed to fetch estagios')
      throw ApiError.internal('Erro ao buscar estagios', 'FETCH_ESTAGIOS_ERROR')
    }

    ApiResponse.success(res, estagios || [])

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/funis/:funilId/estagios - Criar novo estágio
router.post('/:funilId/estagios', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { funilId } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const estagioData = req.body

    if (!estagioData.nome) {
      throw ApiError.badRequest('Nome do estagio e obrigatorio', 'MISSING_NOME')
    }

    // Verificar se funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('id')
      .eq('id', funilId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    // Buscar próxima ordem
    const { data: maxOrdem } = await supabase
      .from('funil_estagios')
      .select('ordem')
      .eq('funil_id', funilId)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    const novaOrdem = estagioData.ordem || (maxOrdem ? maxOrdem.ordem + 1 : 1)

    const { data: estagio, error } = await supabase
      .from('funil_estagios')
      .insert({
        funil_id: funilId,
        nome: estagioData.nome,
        descricao: estagioData.descricao,
        cor: estagioData.cor || '#6B7280',
        ordem: novaOrdem,
        ativo: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create estagio')
      throw ApiError.internal('Erro ao criar estagio', 'CREATE_ESTAGIO_ERROR')
    }

    logger.info({ estagioId: estagio.id, funilId, workspaceId, userId }, 'Estagio created')
    ApiResponse.created(res, estagio)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/funis/:funilId/estagios/:estagioId - Atualizar estágio
router.put('/:funilId/estagios/:estagioId', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { funilId, estagioId } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const updateData = req.body

    // Verificar se funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('id')
      .eq('id', funilId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    // Verificar se estágio pertence ao funil
    const { data: existing } = await supabase
      .from('funil_estagios')
      .select('id')
      .eq('id', estagioId)
      .eq('funil_id', funilId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Estagio nao encontrado', 'ESTAGIO_NOT_FOUND')
    }

    delete updateData.funil_id
    delete updateData.id

    const { data: estagio, error } = await supabase
      .from('funil_estagios')
      .update(updateData)
      .eq('id', estagioId)
      .eq('funil_id', funilId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update estagio')
      throw ApiError.internal('Erro ao atualizar estagio', 'UPDATE_ESTAGIO_ERROR')
    }

    logger.info({ estagioId, funilId, workspaceId, userId }, 'Estagio updated')
    ApiResponse.success(res, estagio)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/funis/:funilId/estagios/:estagioId - Deletar estágio
router.delete('/:funilId/estagios/:estagioId', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { funilId, estagioId } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    // Verificar se funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('id')
      .eq('id', funilId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    // Verificar se estágio pertence ao funil
    const { data: existing } = await supabase
      .from('funil_estagios')
      .select('id')
      .eq('id', estagioId)
      .eq('funil_id', funilId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Estagio nao encontrado', 'ESTAGIO_NOT_FOUND')
    }

    // Verificar se há leads neste estágio
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('estagio_id', estagioId)

    if (leadsCount && leadsCount > 0) {
      throw ApiError.badRequest(
        `Nao e possivel deletar estagio com ${leadsCount} leads`,
        'ESTAGIO_HAS_LEADS'
      )
    }

    const { error } = await supabase
      .from('funil_estagios')
      .delete()
      .eq('id', estagioId)
      .eq('funil_id', funilId)

    if (error) {
      logger.error({ error }, 'Failed to delete estagio')
      throw ApiError.internal('Erro ao deletar estagio', 'DELETE_ESTAGIO_ERROR')
    }

    logger.info({ estagioId, funilId, workspaceId, userId }, 'Estagio deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/funis/:funilId/estagios/:estagioId/reorder - Reordenar estágios
router.put('/:funilId/estagios/:estagioId/reorder', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { funilId, estagioId } = req.params
    const { novaOrdem } = req.body
    const workspaceId = req.workspaceId

    if (typeof novaOrdem !== 'number' || novaOrdem < 1) {
      throw ApiError.badRequest('Nova ordem invalida', 'INVALID_ORDER')
    }

    // Verificar se funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('id')
      .eq('id', funilId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    // Buscar estágio
    const { data: estagio } = await supabase
      .from('funil_estagios')
      .select('ordem')
      .eq('id', estagioId)
      .eq('funil_id', funilId)
      .single()

    if (!estagio) {
      throw ApiError.notFound('Estagio nao encontrado', 'ESTAGIO_NOT_FOUND')
    }

    const ordemAtual = estagio.ordem

    // Atualizar ordem dos estágios afetados usando queries individuais
    if (novaOrdem > ordemAtual) {
      // Buscar estágios afetados e atualizar individualmente
      const { data: estagiosAfetados } = await supabase
        .from('funil_estagios')
        .select('id, ordem')
        .eq('funil_id', funilId)
        .gt('ordem', ordemAtual)
        .lte('ordem', novaOrdem)

      for (const e of estagiosAfetados || []) {
        await supabase
          .from('funil_estagios')
          .update({ ordem: e.ordem - 1 })
          .eq('id', e.id)
      }
    } else if (novaOrdem < ordemAtual) {
      const { data: estagiosAfetados } = await supabase
        .from('funil_estagios')
        .select('id, ordem')
        .eq('funil_id', funilId)
        .gte('ordem', novaOrdem)
        .lt('ordem', ordemAtual)

      for (const e of estagiosAfetados || []) {
        await supabase
          .from('funil_estagios')
          .update({ ordem: e.ordem + 1 })
          .eq('id', e.id)
      }
    }

    // Atualizar ordem do estágio movido
    const { data: updatedEstagio, error } = await supabase
      .from('funil_estagios')
      .update({ ordem: novaOrdem })
      .eq('id', estagioId)
      .eq('funil_id', funilId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to reorder estagio')
      throw ApiError.internal('Erro ao reordenar estagio', 'REORDER_ESTAGIO_ERROR')
    }

    ApiResponse.success(res, updatedEstagio)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
