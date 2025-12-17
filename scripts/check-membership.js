/**
 * Script para verificar memberships de um usuário
 * Executa: node scripts/check-membership.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Ler .env.local manualmente
const envContent = readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

const USER_ID = 31

async function checkMembership() {
  try {
    console.log(`🔍 Verificando memberships do usuário ${USER_ID}...\n`)

    // 1. Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, current_workspace_id')
      .eq('id', USER_ID)
      .single()

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message)
      return
    }

    console.log('👤 Usuário:', user.name || user.email)
    console.log('   ID:', user.id)
    console.log('   Workspace atual:', user.current_workspace_id || 'NENHUM')

    // 2. Buscar todos os memberships do usuário
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        workspace_id,
        role,
        workspaces (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', USER_ID)

    if (memberError) {
      console.error('❌ Erro ao buscar memberships:', memberError.message)
      return
    }

    console.log(`\n📋 Memberships encontrados: ${memberships?.length || 0}`)

    if (memberships && memberships.length > 0) {
      memberships.forEach((m, i) => {
        const ws = m.workspaces
        const isCurrentWs = user.current_workspace_id === m.workspace_id
        console.log(`\n   ${i + 1}. Workspace: ${ws?.name || 'N/A'} ${isCurrentWs ? '(ATUAL ✅)' : ''}`)
        console.log(`      ID: ${m.workspace_id}`)
        console.log(`      Role: ${m.role}`)
        console.log(`      Membership ID: ${m.id}`)
      })
    } else {
      console.log('\n⚠️  PROBLEMA: Usuário não é membro de nenhum workspace!')
    }

    // 3. Verificar se o workspace atual está nos memberships
    if (user.current_workspace_id) {
      const isMemberOfCurrent = memberships?.some(m => m.workspace_id === user.current_workspace_id)
      if (!isMemberOfCurrent) {
        console.log('\n🔴 PROBLEMA: Usuário tem current_workspace_id mas NÃO É MEMBRO dele!')
      }
    }

    // 4. Buscar todos os workspaces do sistema para comparar
    const { data: allWorkspaces } = await supabase
      .from('workspaces')
      .select('id, name, slug')
      .order('name')

    console.log(`\n\n📦 Todos os workspaces do sistema: ${allWorkspaces?.length || 0}`)
    allWorkspaces?.forEach((ws, i) => {
      const isMember = memberships?.some(m => m.workspace_id === ws.id)
      console.log(`   ${i + 1}. ${ws.name} (${ws.id}) - ${isMember ? 'É MEMBRO ✅' : 'NÃO É MEMBRO ❌'}`)
    })

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

checkMembership()
