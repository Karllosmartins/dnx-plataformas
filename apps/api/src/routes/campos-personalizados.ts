import { Router, Response } from 'express'
import { supabase } from '../lib/supabase'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils'
import { authMiddleware } from '../middleware/auth'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// GET /api/campos - Listar campos personalizados do workspace
router.get('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const { funilId, global } = req.query

    let query = supabase
      .from('campos_personalizados')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('ativo', true)

    // Filtro por funil específico
    if (funilId) {
      query = query.eq('funil_id', funilId)
    }

    // Filtro apenas campos globais
    if (global === 'true') {
      query = query.is('funil_id', null)
    }

    query = query.order('ordem', { ascending: true })

    const { data: campos, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch campos personalizados')
      throw ApiError.internal('Erro ao buscar campos', 'FETCH_CAMPOS_ERROR')
    }

    ApiResponse.success(res, campos || [])

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/campos/:id - Buscar campo por ID
router.get('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    const { data: campo, error } = await supabase
      .from('campos_personalizados')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !campo) {
      throw ApiError.notFound('Campo nao encontrado', 'CAMPO_NOT_FOUND')
    }

    ApiResponse.success(res, campo)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/campos - Criar novo campo personalizado
router.post('/', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const campoData = req.body

    if (!campoData.nome || !campoData.tipo) {
      throw ApiError.badRequest('Nome e tipo sao obrigatorios', 'MISSING_REQUIRED_FIELDS')
    }

    // Validar tipo
    const tiposValidos = ['text', 'number', 'date', 'select', 'checkbox', 'email', 'phone', 'currency', 'url']
    if (!tiposValidos.includes(campoData.tipo)) {
      throw ApiError.badRequest('Tipo de campo invalido', 'INVALID_TIPO')
    }

    // Se for tipo select, validar opções
    if (campoData.tipo === 'select' && (!campoData.opcoes || campoData.opcoes.length === 0)) {
      throw ApiError.badRequest('Campos tipo select requerem opcoes', 'MISSING_OPCOES')
    }

    // Se tiver funilId, verificar se pertence ao workspace
    if (campoData.funil_id) {
      const { data: funil } = await supabase
        .from('funis')
        .select('id')
        .eq('id', campoData.funil_id)
        .eq('workspace_id', workspaceId)
        .single()

      if (!funil) {
        throw ApiError.notFound('Funil nao encontrado', 'FUNIL_NOT_FOUND')
      }
    }

    // Buscar próxima ordem
    const { data: maxOrdem } = await supabase
      .from('campos_personalizados')
      .select('ordem')
      .eq('workspace_id', workspaceId)
      .eq('funil_id', campoData.funil_id || null)
      .order('ordem', { ascending: false })
      .limit(1)
      .single()

    const novaOrdem = maxOrdem ? maxOrdem.ordem + 1 : 1

    const { data: campo, error } = await supabase
      .from('campos_personalizados')
      .insert({
        workspace_id: workspaceId,
        funil_id: campoData.funil_id || null,
        nome: campoData.nome,
        tipo: campoData.tipo,
        opcoes: campoData.opcoes || null,
        obrigatorio: campoData.obrigatorio || false,
        ordem: novaOrdem,
        ativo: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create campo')
      throw ApiError.internal('Erro ao criar campo', 'CREATE_CAMPO_ERROR')
    }

    logger.info({ campoId: campo.id, workspaceId, userId }, 'Campo personalizado created')
    ApiResponse.created(res, campo)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/campos/:id - Atualizar campo personalizado
router.put('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const updateData = req.body

    // Verificar se campo pertence ao workspace
    const { data: existing } = await supabase
      .from('campos_personalizados')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Campo nao encontrado', 'CAMPO_NOT_FOUND')
    }

    // Validar tipo se fornecido
    if (updateData.tipo) {
      const tiposValidos = ['text', 'number', 'date', 'select', 'checkbox', 'email', 'phone', 'currency', 'url']
      if (!tiposValidos.includes(updateData.tipo)) {
        throw ApiError.badRequest('Tipo de campo invalido', 'INVALID_TIPO')
      }
    }

    delete updateData.workspace_id
    delete updateData.id

    const { data: campo, error } = await supabase
      .from('campos_personalizados')
      .update(updateData)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update campo')
      throw ApiError.internal('Erro ao atualizar campo', 'UPDATE_CAMPO_ERROR')
    }

    logger.info({ campoId: id, workspaceId, userId }, 'Campo personalizado updated')
    ApiResponse.success(res, campo)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/campos/:id - Deletar campo personalizado
router.delete('/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    // Verificar se campo pertence ao workspace
    const { data: existing } = await supabase
      .from('campos_personalizados')
      .select('id, nome')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Campo nao encontrado', 'CAMPO_NOT_FOUND')
    }

    // Soft delete - apenas desativar
    const { error } = await supabase
      .from('campos_personalizados')
      .update({ ativo: false })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      logger.error({ error }, 'Failed to delete campo')
      throw ApiError.internal('Erro ao deletar campo', 'DELETE_CAMPO_ERROR')
    }

    logger.info({ campoId: id, campoNome: existing.nome, workspaceId, userId }, 'Campo personalizado deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
