import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils'
import { authMiddleware } from '../middleware/auth'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// GET /api/funis - Listar funis do workspace
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const { includeEstagios } = req.query

    let query = supabase
      .from('funis')
      .select(includeEstagios === 'true' ? '*, estagios:funil_estagios(*)' : '*')
      .eq('workspace_id', workspaceId)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    const { data: funis, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch funis')
      throw ApiError.internal('Erro ao buscar funis', 'FETCH_FUNIS_ERROR')
    }

    ApiResponse.success(res, funis || [])

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/funis/:id - Buscar funil por ID com estágios
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    // Buscar funil
    const { data: funil, error: funilError } = await supabase
      .from('funis')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (funilError || !funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    // Buscar estágios do funil
    const { data: estagios, error: estagiosError } = await supabase
      .from('funil_estagios')
      .select('*')
      .eq('funil_id', id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (estagiosError) {
      logger.error({ error: estagiosError }, 'Failed to fetch funil estagios')
    }

    ApiResponse.success(res, {
      ...funil,
      estagios: estagios || [],
      total_estagios: estagios?.length || 0
    })

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/funis - Criar novo funil
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const funilData = req.body

    if (!funilData.nome) {
      throw ApiError.badRequest('Nome do funil e obrigatorio', 'MISSING_NOME')
    }

    // Buscar próxima ordem
    const { data: maxOrdem } = await supabase
      .from('funis')
      .select('ordem')
      .eq('workspace_id', workspaceId)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    const novaOrdem = maxOrdem ? maxOrdem.ordem + 1 : 1

    const { data: funil, error } = await supabase
      .from('funis')
      .insert({
        workspace_id: workspaceId,
        nome: funilData.nome,
        descricao: funilData.descricao,
        icone: funilData.icone || 'funnel',
        cor: funilData.cor || '#3B82F6',
        ordem: novaOrdem,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create funil')
      throw ApiError.internal('Erro ao criar funil', 'CREATE_FUNIL_ERROR')
    }

    logger.info({ funilId: funil.id, workspaceId, userId }, 'Funil created')
    ApiResponse.created(res, funil)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/funis/:id - Atualizar funil
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const updateData = req.body

    // Verificar se funil pertence ao workspace
    const { data: existing } = await supabase
      .from('funis')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    delete updateData.workspace_id
    delete updateData.id

    const { data: funil, error } = await supabase
      .from('funis')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update funil')
      throw ApiError.internal('Erro ao atualizar funil', 'UPDATE_FUNIL_ERROR')
    }

    logger.info({ funilId: id, workspaceId, userId }, 'Funil updated')
    ApiResponse.success(res, funil)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/funis/:id - Deletar funil
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    // Verificar se funil pertence ao workspace
    const { data: existing } = await supabase
      .from('funis')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    // Verificar se há leads vinculados ao funil
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('funil_id', id)

    if (leadsCount && leadsCount > 0) {
      throw ApiError.badRequest(
        `Nao e possivel deletar funil com ${leadsCount} leads vinculados`,
        'FUNIL_HAS_LEADS'
      )
    }

    const { error } = await supabase
      .from('funis')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      logger.error({ error }, 'Failed to delete funil')
      throw ApiError.internal('Erro ao deletar funil', 'DELETE_FUNIL_ERROR')
    }

    logger.info({ funilId: id, workspaceId, userId }, 'Funil deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/funis/:id/reorder - Reordenar funis
router.put('/:id/reorder', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const { novaOrdem } = req.body
    const workspaceId = req.workspaceId

    if (typeof novaOrdem !== 'number' || novaOrdem < 1) {
      throw ApiError.badRequest('Nova ordem invalida', 'INVALID_ORDER')
    }

    // Verificar se funil pertence ao workspace
    const { data: funil } = await supabase
      .from('funis')
      .select('ordem')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (!funil) {
      throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
    }

    const ordemAtual = funil.ordem

    // Atualizar ordem dos funis afetados
    if (novaOrdem > ordemAtual) {
      // Movendo para baixo - decrementar ordem dos funis entre atual e nova posição
      await supabase
        .from('funis')
        .update({ ordem: supabase.raw('ordem - 1') as any })
        .eq('workspace_id', workspaceId)
        .gt('ordem', ordemAtual)
        .lte('ordem', novaOrdem)
    } else if (novaOrdem < ordemAtual) {
      // Movendo para cima - incrementar ordem dos funis entre nova posição e atual
      await supabase
        .from('funis')
        .update({ ordem: supabase.raw('ordem + 1') as any })
        .eq('workspace_id', workspaceId)
        .gte('ordem', novaOrdem)
        .lt('ordem', ordemAtual)
    }

    // Atualizar ordem do funil movido
    const { data: updatedFunil, error } = await supabase
      .from('funis')
      .update({ ordem: novaOrdem })
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to reorder funil')
      throw ApiError.internal('Erro ao reordenar funil', 'REORDER_FUNIL_ERROR')
    }

    ApiResponse.success(res, updatedFunil)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
