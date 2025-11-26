/**
 * Script para verificar e corrigir workspace/plano do usuário
 * Executa: node scripts/check-user-workspace.js
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

async function checkUser() {
  try {
    console.log('🔍 Verificando configuração do usuário...\n')

    // 1. Buscar usuário atual (você)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (userError) throw userError

    const user = users[0]
    console.log('👤 Usuário:', user.username || user.email)
    console.log('   ID:', user.id)
    console.log('   Workspace atual:', user.current_workspace_id || 'NENHUM ❌')

    // 2. Verificar se tem workspace
    if (!user.current_workspace_id) {
      console.log('\n⚠️  Problema: Usuário não tem workspace configurado!')

      // Buscar workspaces existentes
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)

      if (workspaces && workspaces.length > 0) {
        console.log('\n✅ Workspace encontrado:', workspaces[0].name)
        console.log('   ID:', workspaces[0].id)
        console.log('   Plano ID:', workspaces[0].plano_id || 'NENHUM ❌')

        // Atualizar usuário com workspace
        const { error: updateError } = await supabase
          .from('users')
          .update({ current_workspace_id: workspaces[0].id })
          .eq('id', user.id)

        if (updateError) {
          console.error('❌ Erro ao atualizar workspace:', updateError)
        } else {
          console.log('\n✅ Workspace configurado no usuário!')
          user.current_workspace_id = workspaces[0].id
        }
      } else {
        console.log('\n❌ Nenhum workspace encontrado. Precisa criar um!')
        return
      }
    }

    // 3. Verificar workspace e plano
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select(`
        *,
        planos (
          id,
          nome,
          acesso_extracao_leads,
          limite_leads_mes
        )
      `)
      .eq('id', user.current_workspace_id)
      .single()

    if (wsError) throw wsError

    console.log('\n📦 Workspace:', workspace.name)
    console.log('   ID:', workspace.id)
    console.log('   Plano ID:', workspace.plano_id || 'NENHUM ❌')
    console.log('   Leads consumidos:', workspace.leads_consumidos || 0)

    // 4. Verificar plano
    if (!workspace.planos) {
      console.log('\n⚠️  Problema: Workspace não tem plano associado!')

      // Buscar planos disponíveis
      const { data: planos } = await supabase
        .from('planos')
        .select('*')
        .order('id')

      if (planos && planos.length > 0) {
        console.log('\n📋 Planos disponíveis:')
        planos.forEach(p => {
          console.log(`   - ${p.nome} (ID: ${p.id})`)
          console.log(`     Extração de leads: ${p.acesso_extracao_leads ? 'SIM ✅' : 'NÃO ❌'}`)
          console.log(`     Limite mensal: ${p.limite_leads_mes || 0} leads`)
        })

        // Encontrar plano com acesso a extração de leads
        const planoComExtracao = planos.find(p => p.acesso_extracao_leads)

        if (planoComExtracao) {
          console.log(`\n✅ Plano recomendado: ${planoComExtracao.nome}`)

          // Atualizar workspace com plano
          const { error: updateError } = await supabase
            .from('workspaces')
            .update({ plano_id: planoComExtracao.id })
            .eq('id', workspace.id)

          if (updateError) {
            console.error('❌ Erro ao atualizar plano:', updateError)
          } else {
            console.log('✅ Plano configurado no workspace!')
          }
        }
      } else {
        console.log('\n❌ Nenhum plano encontrado no sistema!')
      }
    } else {
      const plano = Array.isArray(workspace.planos) ? workspace.planos[0] : workspace.planos
      console.log('\n📋 Plano:', plano.nome)
      console.log('   Extração de leads:', plano.acesso_extracao_leads ? 'SIM ✅' : 'NÃO ❌')
      console.log('   Limite mensal:', plano.limite_leads_mes || 0, 'leads')
      console.log('   Disponível:', (plano.limite_leads_mes || 0) - (workspace.leads_consumidos || 0), 'leads')

      if (!plano.acesso_extracao_leads) {
        console.log('\n⚠️  ATENÇÃO: Seu plano não permite extração de leads!')
      } else {
        console.log('\n✅ Tudo configurado corretamente!')
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

checkUser()