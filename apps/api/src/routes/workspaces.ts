import { Router, Response } from 'express'
import { supabase } from '../lib/supabase.js'
import { ApiError, ApiResponse, handleApiError, logger } from '../utils/index.js'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js'
import type {
  Workspace,
  WorkspaceWithMembers,
  WorkspaceMember,
  CreateWorkspaceRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
  WorkspaceRole
} from '@dnx/types'

const router = Router()

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware)

// GET /api/workspaces - Listar workspaces do usuário
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    // Buscar workspaces onde o usuário é membro
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces (
          id,
          name,
          slug,
          plano_id,
          settings,
          created_at,
          updated_at,
          limite_leads,
          limite_consultas,
          limite_instancias,
          leads_consumidos,
          consultas_realizadas,
          instancias_ativas,
          planos (
            nome
          )
        )
      `)
      .eq('user_id', parseInt(userId || '0'))

    if (memberError) {
      logger.error({ error: memberError }, 'Failed to fetch workspaces')
      throw ApiError.internal('Erro ao buscar workspaces', 'FETCH_WORKSPACES_ERROR')
    }

    // Transformar resultado e contar leads/instâncias reais por workspace
    const workspacesWithCounts = await Promise.all(
      (memberships || []).map(async (m) => {
        const ws = m.workspaces as unknown as Workspace & { planos?: { nome: string } }

        // Contar leads reais da tabela leads FILTRADO POR WORKSPACE
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', ws.id)

        // Contar instâncias WhatsApp reais FILTRADO POR WORKSPACE
        const { count: instancesCount } = await supabase
          .from('instancia_whtats')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', ws.id)

        return {
          ...ws,
          plano_nome: ws?.planos?.nome || 'Básico',
          leads_consumidos: leadsCount || 0,
          instancias_ativas: instancesCount || 0,
          current_user_role: m.role
        }
      })
    )

    ApiResponse.success(res, workspacesWithCounts)

  } catch (error) {
    handleApiError(error, res)
  }
})

// GET /api/workspaces/:id - Buscar workspace por ID com membros
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    // Verificar se usuário é membro do workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership) {
      throw ApiError.forbidden('Voce nao tem acesso a este workspace', 'WORKSPACE_ACCESS_DENIED')
    }

    // Buscar workspace com informações de limite e consumo
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select(`
        *,
        planos (
          nome,
          descricao,
          acesso_dashboard,
          acesso_crm,
          acesso_whatsapp,
          acesso_disparo_simples,
          acesso_disparo_ia,
          acesso_agentes_ia,
          acesso_extracao_leads,
          acesso_enriquecimento,
          acesso_usuarios,
          acesso_consulta,
          acesso_integracoes,
          acesso_arquivos
        )
      `)
      .eq('id', id)
      .single()

    if (workspaceError || !workspace) {
      throw ApiError.notFound('Workspace nao encontrado', 'WORKSPACE_NOT_FOUND')
    }

    // Buscar membros
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        permissions,
        joined_at,
        invited_by,
        users (
          id,
          name,
          email
        )
      `)
      .eq('workspace_id', id)

    if (membersError) {
      logger.error({ error: membersError }, 'Failed to fetch members')
    }

    const result: WorkspaceWithMembers = {
      ...workspace,
      members: members as unknown as WorkspaceMember[],
      member_count: members?.length || 0
    }

    ApiResponse.success(res, result)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/workspaces - Criar novo workspace
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId
    const { name, slug }: CreateWorkspaceRequest = req.body

    if (!name) {
      throw ApiError.badRequest('Nome e obrigatorio', 'MISSING_NAME')
    }

    // Gerar slug se não fornecido
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Criar workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name,
        slug: finalSlug,
        settings: {}
      })
      .select()
      .single()

    if (workspaceError) {
      if (workspaceError.code === '23505') { // Unique violation
        throw ApiError.badRequest('Slug ja esta em uso', 'SLUG_EXISTS')
      }
      logger.error({ error: workspaceError }, 'Failed to create workspace')
      throw ApiError.internal('Erro ao criar workspace', 'CREATE_WORKSPACE_ERROR')
    }

    // Adicionar usuário como owner
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: parseInt(userId || '0'),
        role: 'owner',
        permissions: {
          leads: { create: true, read: true, update: true, delete: true },
          whatsapp: { create: true, read: true, update: true, delete: true },
          members: { invite: true, remove: true, update_roles: true },
          workspace: { update: true, delete: true }
        }
      })

    if (memberError) {
      logger.error({ error: memberError }, 'Failed to add owner to workspace')
    }

    // Atualizar current_workspace_id do usuário
    await supabase
      .from('users')
      .update({ current_workspace_id: workspace.id })
      .eq('id', parseInt(userId || '0'))

    logger.info({ workspaceId: workspace.id, userId }, 'Workspace created')
    ApiResponse.created(res, workspace)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/workspaces/:id - Atualizar workspace
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const { name, settings } = req.body

    // Verificar se usuário é owner ou admin
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw ApiError.forbidden('Apenas owners e admins podem atualizar workspace', 'INSUFFICIENT_PERMISSIONS')
    }

    const updateData: Partial<Workspace> = {}
    if (name !== undefined) updateData.name = name
    if (settings !== undefined) updateData.settings = settings

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update workspace')
      throw ApiError.internal('Erro ao atualizar workspace', 'UPDATE_WORKSPACE_ERROR')
    }

    logger.info({ workspaceId: id, userId }, 'Workspace updated')
    ApiResponse.success(res, workspace)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/workspaces/:id - Deletar workspace
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    // Verificar se usuário é owner
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership || membership.role !== 'owner') {
      throw ApiError.forbidden('Apenas owners podem deletar workspace', 'OWNER_REQUIRED')
    }

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error({ error }, 'Failed to delete workspace')
      throw ApiError.internal('Erro ao deletar workspace', 'DELETE_WORKSPACE_ERROR')
    }

    logger.info({ workspaceId: id, userId }, 'Workspace deleted')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/workspaces/:id/members - Convidar membro
router.post('/:id/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId
    const { email, role, permissions }: InviteMemberRequest = req.body

    if (!email || !role) {
      throw ApiError.badRequest('Email e role sao obrigatorios', 'MISSING_FIELDS')
    }

    // Verificar permissões do usuário
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership) {
      throw ApiError.forbidden('Voce nao e membro deste workspace', 'NOT_MEMBER')
    }

    const canInvite = ['owner', 'admin'].includes(membership.role) ||
                     membership.permissions?.members?.invite

    if (!canInvite) {
      throw ApiError.forbidden('Voce nao tem permissao para convidar membros', 'CANNOT_INVITE')
    }

    // Buscar usuário pelo email
    const { data: invitedUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!invitedUser) {
      throw ApiError.notFound('Usuario nao encontrado', 'USER_NOT_FOUND')
    }

    // Verificar se já é membro
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', id)
      .eq('user_id', invitedUser.id)
      .single()

    if (existing) {
      throw ApiError.badRequest('Usuario ja e membro deste workspace', 'ALREADY_MEMBER')
    }

    // Adicionar membro
    const { data: newMember, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id: invitedUser.id,
        role,
        permissions: permissions || {},
        invited_by: parseInt(userId || '0')
      })
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to add member')
      throw ApiError.internal('Erro ao adicionar membro', 'ADD_MEMBER_ERROR')
    }

    logger.info({ workspaceId: id, newUserId: invitedUser.id, invitedBy: userId }, 'Member added')
    ApiResponse.created(res, newMember)

  } catch (error) {
    handleApiError(error, res)
  }
})

// PUT /api/workspaces/:id/members/:memberId - Atualizar role de membro
router.put('/:id/members/:memberId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, memberId } = req.params
    const userId = req.user?.userId
    const { role, permissions }: UpdateMemberRoleRequest = req.body

    // Verificar permissões
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw ApiError.forbidden('Apenas owners e admins podem atualizar roles', 'INSUFFICIENT_PERMISSIONS')
    }

    // Não permitir alterar o último owner
    if (role && role !== 'owner') {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', id)
        .eq('role', 'owner')

      if (count === 1) {
        const { data: targetMember } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('id', memberId)
          .single()

        if (targetMember?.role === 'owner') {
          throw ApiError.badRequest('Nao e possivel remover o ultimo owner', 'LAST_OWNER')
        }
      }
    }

    const updateData: Partial<WorkspaceMember> = {}
    if (role) updateData.role = role
    if (permissions !== undefined) updateData.permissions = permissions

    const { data: updated, error } = await supabase
      .from('workspace_members')
      .update(updateData)
      .eq('id', memberId)
      .eq('workspace_id', id)
      .select()
      .single()

    if (error) {
      logger.error({ error }, 'Failed to update member')
      throw ApiError.internal('Erro ao atualizar membro', 'UPDATE_MEMBER_ERROR')
    }

    logger.info({ workspaceId: id, memberId, userId }, 'Member role updated')
    ApiResponse.success(res, updated)

  } catch (error) {
    handleApiError(error, res)
  }
})

// DELETE /api/workspaces/:id/members/:memberId - Remover membro
router.delete('/:id/members/:memberId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, memberId } = req.params
    const userId = req.user?.userId

    // Verificar permissões
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership) {
      throw ApiError.forbidden('Voce nao e membro deste workspace', 'NOT_MEMBER')
    }

    const canRemove = ['owner', 'admin'].includes(membership.role)

    if (!canRemove) {
      throw ApiError.forbidden('Voce nao tem permissao para remover membros', 'CANNOT_REMOVE')
    }

    // Não permitir remover o último owner
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('id', memberId)
      .single()

    if (targetMember?.role === 'owner') {
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', id)
        .eq('role', 'owner')

      if (count === 1) {
        throw ApiError.badRequest('Nao e possivel remover o ultimo owner', 'LAST_OWNER')
      }
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', id)

    if (error) {
      logger.error({ error }, 'Failed to remove member')
      throw ApiError.internal('Erro ao remover membro', 'REMOVE_MEMBER_ERROR')
    }

    logger.info({ workspaceId: id, memberId, userId }, 'Member removed')
    ApiResponse.noContent(res)

  } catch (error) {
    handleApiError(error, res)
  }
})

// POST /api/workspaces/:id/switch - Trocar workspace ativo
router.post('/:id/switch', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.userId

    // Verificar se é membro
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', id)
      .eq('user_id', parseInt(userId || '0'))
      .single()

    if (!membership) {
      throw ApiError.forbidden('Voce nao e membro deste workspace', 'NOT_MEMBER')
    }

    // Atualizar current_workspace_id
    const { error } = await supabase
      .from('users')
      .update({ current_workspace_id: id })
      .eq('id', parseInt(userId || '0'))

    if (error) {
      logger.error({ error }, 'Failed to switch workspace')
      throw ApiError.internal('Erro ao trocar workspace', 'SWITCH_WORKSPACE_ERROR')
    }

    logger.info({ workspaceId: id, userId }, 'Workspace switched')
    ApiResponse.message(res, 'Workspace trocado com sucesso')

  } catch (error) {
    handleApiError(error, res)
  }
})

export default router
