import { Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'
import { ApiError, logger } from '../utils/index.js'
import { AuthenticatedRequest } from './auth.js'

export interface WorkspaceRequest extends AuthenticatedRequest {
  workspaceId?: string
}

/**
 * Middleware para adicionar workspace_id ao request
 * Busca o current_workspace_id do usuário
 */
export async function workspaceMiddleware(
  req: WorkspaceRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId
    logger.info({ userId }, 'Workspace middleware - resolving workspace')

    // Buscar current_workspace_id do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('current_workspace_id')
      .eq('id', parseInt(userId || '0'))
      .single()

    if (error) {
      logger.error({ error, userId }, 'Error fetching user workspace')
    }

    if (error || !user || !user.current_workspace_id) {
      throw ApiError.badRequest(
        'Usuario nao possui workspace ativo',
        'NO_ACTIVE_WORKSPACE'
      )
    }

    logger.info({ userId, workspaceId: user.current_workspace_id }, 'User workspace resolved')

    // Verificar se usuário é membro do workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', user.current_workspace_id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership) {
      logger.warn({ userId, workspaceId: user.current_workspace_id }, 'User is not a workspace member')
      throw ApiError.forbidden(
        'Usuario nao e membro do workspace',
        'NOT_WORKSPACE_MEMBER'
      )
    }

    logger.info({ userId, workspaceId: user.current_workspace_id, role: membership.role }, 'Workspace middleware completed')

    // Adicionar workspace_id ao request
    req.workspaceId = user.current_workspace_id
    next()
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      })
      return
    }

    logger.error({ error }, 'Unexpected error in workspace middleware')
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar workspace',
      code: 'WORKSPACE_ERROR'
    })
  }
}
