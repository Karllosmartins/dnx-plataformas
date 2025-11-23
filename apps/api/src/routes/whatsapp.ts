import { Router, Response } from 'express'
import { supabase } from '../lib/supabase.js'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { workspaceMiddleware, WorkspaceRequest } from '../middleware/workspace.js'

const router = Router()

// Aplicar middlewares de autenticação e workspace
router.use(authMiddleware)
router.use(workspaceMiddleware)

// GET /api/whatsapp/instances - Listar instâncias WhatsApp do workspace
router.get('/instances', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId

    const { data: instances, error } = await supabase
      .from('instancia_whtats')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ error }, 'Failed to fetch WhatsApp instances')
      throw ApiError.internal('Erro ao buscar instancias', 'FETCH_INSTANCES_ERROR')
    }

    ApiResponse.success(res, instances || [])

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/whatsapp/instances/:id - Buscar instância por ID (dentro do workspace)
router.get('/instances/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    const { data: instance, error } = await supabase
      .from('instancia_whtats')
      .select('*')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (error || !instance) {
      throw ApiError.notFound('Instancia nao encontrada', 'INSTANCE_NOT_FOUND')
    }

    ApiResponse.success(res, instance)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/whatsapp/instances - Criar nova instância no workspace
router.post('/instances', async (req: WorkspaceRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const workspaceId = req.workspaceId
    const instanceData = req.body

    if (!instanceData.instancia) {
      throw ApiError.badRequest('Nome da instancia e obrigatorio', 'MISSING_INSTANCE_NAME')
    }

    const { data: instance, error } = await supabase
      .from('instancia_whtats')
      .insert({
        ...instanceData,
        workspace_id: workspaceId,
        user_id: parseInt(userId || '0'),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create WhatsApp instance')
      throw ApiError.internal('Erro ao criar instancia', 'CREATE_INSTANCE_ERROR')
    }

    logger.info({ instanceId: instance.id, workspaceId, userId }, 'WhatsApp instance created')
    ApiResponse.created(res, instance)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/whatsapp/instances/:id - Atualizar instância (dentro do workspace)
router.put('/instances/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const updateData = req.body

    // Verificar se instância existe e pertence ao workspace
    const { data: existing, error: existError } = await supabase
      .from('instancia_whtats')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (existError || !existing) {
      throw ApiError.notFound('Instancia nao encontrada', 'INSTANCE_NOT_FOUND')
    }

    // Não permitir alterar workspace_id e user_id
    delete updateData.workspace_id
    delete updateData.user_id

    const { data: instance, error } = await supabase
      .from('instancia_whtats')
      .update(updateData)
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update WhatsApp instance')
      throw ApiError.internal('Erro ao atualizar instancia', 'UPDATE_INSTANCE_ERROR')
    }

    logger.info({ instanceId: id, workspaceId, userId }, 'WhatsApp instance updated')
    ApiResponse.success(res, instance)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/whatsapp/instances/:id - Deletar instância (dentro do workspace)
router.delete('/instances/:id', async (req: WorkspaceRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const userId = req.user?.userId

    // Verificar se instância pertence ao workspace antes de deletar
    const { data: existing } = await supabase
      .from('instancia_whtats')
      .select('id')
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)
      .single()

    if (!existing) {
      throw ApiError.notFound('Instancia nao encontrada', 'INSTANCE_NOT_FOUND')
    }

    const { error } = await supabase
      .from('instancia_whtats')
      .delete()
      .eq('id', parseInt(id))
      .eq('workspace_id', workspaceId)

    if (error) {
      logger.error({ error }, 'Failed to delete WhatsApp instance')
      throw ApiError.internal('Erro ao deletar instancia', 'DELETE_INSTANCE_ERROR')
    }

    logger.info({ instanceId: id, workspaceId, userId }, 'WhatsApp instance deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/whatsapp/templates - Listar templates de uma instância
router.get('/templates', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const { instancia_id } = req.query

    if (!instancia_id) {
      throw ApiError.badRequest('ID da instancia e obrigatorio', 'MISSING_INSTANCE_ID')
    }

    // Verificar se a instância pertence ao workspace
    const { data: instance } = await supabase
      .from('instancia_whtats')
      .select('id')
      .eq('id', parseInt(instancia_id as string))
      .eq('workspace_id', workspaceId)
      .single()

    if (!instance) {
      throw ApiError.forbidden('Instancia nao pertence ao workspace', 'INSTANCE_NOT_IN_WORKSPACE')
    }

    const { data: templates, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('instancia_id', parseInt(instancia_id as string))
      .order('created_at', { ascending: false })

    if (error) {
      logger.error({ error }, 'Failed to fetch templates')
      throw ApiError.internal('Erro ao buscar templates', 'FETCH_TEMPLATES_ERROR')
    }

    ApiResponse.success(res, templates || [])

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/whatsapp/templates - Criar template para uma instância
router.post('/templates', async (req: WorkspaceRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const userId = req.user?.userId
    const templateData = req.body

    if (!templateData.instancia_id || !templateData.template_name) {
      throw ApiError.badRequest('ID da instancia e nome do template sao obrigatorios', 'MISSING_REQUIRED_FIELDS')
    }

    // Verificar se a instância pertence ao workspace
    const { data: instance } = await supabase
      .from('instancia_whtats')
      .select('id')
      .eq('id', templateData.instancia_id)
      .eq('workspace_id', workspaceId)
      .single()

    if (!instance) {
      throw ApiError.forbidden('Instancia nao pertence ao workspace', 'INSTANCE_NOT_IN_WORKSPACE')
    }

    const { data: template, error } = await supabase
      .from('whatsapp_templates')
      .insert({
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to create template')
      throw ApiError.internal('Erro ao criar template', 'CREATE_TEMPLATE_ERROR')
    }

    logger.info({ templateId: template.id, workspaceId, userId }, 'WhatsApp template created')
    ApiResponse.created(res, template)

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
