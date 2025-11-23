import { Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'
import { ApiError } from '../utils'
import { AuthenticatedRequest } from './auth'

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

    // Buscar current_workspace_id do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('current_workspace_id')
      .eq('id', parseInt(userId || '0'))
      .single()

    if (error || !user || !user.current_workspace_id) {
      throw ApiError.badRequest(
        'Usuario nao possui workspace ativo',
        'NO_ACTIVE_WORKSPACE'
      )
    }

    // Verificar se usuário é membro do workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', user.current_workspace_id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership) {
      throw ApiError.forbidden(
        'Usuario nao e membro do workspace',
        'NOT_WORKSPACE_MEMBER'
      )
    }

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

    res.status(500).json({
      success: false,
      error: 'Erro ao verificar workspace',
      code: 'WORKSPACE_ERROR'
    })
  }
}
