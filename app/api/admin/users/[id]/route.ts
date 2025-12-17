import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '../../../../../lib/supabase'
import { requireAdmin } from '../../../../../lib/auth-utils'

export const dynamic = 'force-dynamic'

// GET - Buscar usuário por ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar se é admin
    const adminError = await requireAdmin(request)
    if (adminError) return adminError

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
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
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

    return NextResponse.json({
      success: true,
      data: {
        ...usuario,
        workspace_memberships: memberships || []
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar se é admin
    const adminError = await requireAdmin(request)
    if (adminError) return adminError

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
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
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
        return NextResponse.json(
          { success: false, error: 'Email já cadastrado por outro usuário' },
          { status: 400 }
        )
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

    return NextResponse.json({ success: true, data: userWithoutPassword })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir usuário (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar se é admin
    const adminError = await requireAdmin(request)
    if (adminError) return adminError

    const { id } = await params

    // Verificar se usuário existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
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

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir usuário' },
      { status: 500 }
    )
  }
}
