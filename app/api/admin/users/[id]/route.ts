import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../../../lib/supabase'
import { ApiResponse, ApiError, handleApiError } from '../../../../../lib/api-utils'

export const dynamic = 'force-dynamic'

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: usuario, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        active,
        cpf,
        telefone,
        created_at,
        updated_at,
        current_workspace_id
      `)
      .eq('id', id)
      .single()

    if (error || !usuario) {
      throw ApiError.notFound('Usuário não encontrado', 'USER_NOT_FOUND')
    }

    // Buscar memberships
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        workspaces (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', id)

    return ApiResponse.success({
      ...usuario,
      workspace_memberships: memberships || []
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      email,
      password,
      role,
      active,
      cpf,
      telefone,
      workspace_id,
      workspace_role
    } = body

    // Verificar se usuário existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single()

    if (findError || !existingUser) {
      throw ApiError.notFound('Usuário não encontrado', 'USER_NOT_FOUND')
    }

    // Se mudou o email, verificar se já existe
    if (email && email !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single()

      if (emailCheck) {
        throw ApiError.badRequest('Email já cadastrado por outro usuário', 'EMAIL_EXISTS')
      }
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (active !== undefined) updateData.active = active
    if (cpf !== undefined) updateData.cpf = cpf || null
    if (telefone !== undefined) updateData.telefone = telefone || null
    if (workspace_id !== undefined) updateData.current_workspace_id = workspace_id

    // Se nova senha foi fornecida, hash e atualizar
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Se workspace_id e workspace_role fornecidos, atualizar membership
    if (workspace_id && workspace_role) {
      // Verificar se já é membro
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', id)
        .eq('workspace_id', workspace_id)
        .single()

      if (existingMember) {
        // Atualizar role
        await supabase
          .from('workspace_members')
          .update({ role: workspace_role })
          .eq('id', existingMember.id)
      } else {
        // Adicionar como membro
        await supabase
          .from('workspace_members')
          .insert({
            workspace_id,
            user_id: parseInt(id),
            role: workspace_role
          })
      }
    }

    // Retornar usuário sem a senha
    const { password: _, ...userWithoutPassword } = updatedUser

    return ApiResponse.success(userWithoutPassword)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Excluir usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar se usuário existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existingUser) {
      throw ApiError.notFound('Usuário não encontrado', 'USER_NOT_FOUND')
    }

    // Remover memberships primeiro
    await supabase
      .from('workspace_members')
      .delete()
      .eq('user_id', id)

    // Excluir usuário
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return ApiResponse.noContent()
  } catch (error) {
    return handleApiError(error)
  }
}
