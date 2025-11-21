// Script para migrar TODAS as senhas de texto plano para bcrypt
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcrypt')

const supabaseUrl = 'https://enwxbkyvnrjderqdygtl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud3hia3l2bnJqZGVycWR5Z3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MzAzNCwiZXhwIjoyMDcxNjM5MDM0fQ.BxADhNw1F84N_YVV7EQC8OHJlE6StJx0lqjZxjHRRD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateAllPasswords() {
  console.log('\n🔄 Iniciando migração de senhas de todos os usuários...\n')

  // 1. Buscar todos os usuários
  console.log('1️⃣ Buscando todos os usuários...')
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, password, active')
    .order('id')

  if (fetchError) {
    console.error('❌ Erro ao buscar usuários:', fetchError)
    return
  }

  console.log(`✅ Encontrados ${users.length} usuários\n`)

  // 2. Filtrar usuários com senha em plain text
  const usersToMigrate = users.filter(user => !user.password.startsWith('$2b$'))
  const usersAlreadyMigrated = users.filter(user => user.password.startsWith('$2b$'))

  console.log(`📊 Status:`)
  console.log(`   • ${usersAlreadyMigrated.length} usuários já com bcrypt ✅`)
  console.log(`   • ${usersToMigrate.length} usuários precisam migrar ⚠️\n`)

  if (usersToMigrate.length === 0) {
    console.log('🎉 Nenhum usuário precisa de migração! Todos já estão com bcrypt.')
    return
  }

  // 3. Confirmar antes de prosseguir
  console.log('⚠️  ATENÇÃO: Vou migrar as seguintes senhas:\n')
  usersToMigrate.forEach(user => {
    console.log(`   • ID ${user.id}: ${user.name} (${user.email})`)
    console.log(`     Senha atual: ${user.password.substring(0, 20)}...`)
  })

  console.log('\n🔄 Iniciando migração em 3 segundos...\n')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 4. Migrar cada usuário
  const saltRounds = 10
  let migrated = 0
  let errors = 0

  for (const user of usersToMigrate) {
    try {
      console.log(`\n🔐 Migrando usuário ID ${user.id}: ${user.name}`)

      // Fazer hash da senha atual
      const hashedPassword = await bcrypt.hash(user.password, saltRounds)
      console.log(`   ✅ Hash gerado (${hashedPassword.length} caracteres)`)

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id)

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar: ${updateError.message}`)
        errors++
        continue
      }

      // Verificar se a senha funciona
      const isValid = await bcrypt.compare(user.password, hashedPassword)
      if (!isValid) {
        console.error(`   ❌ ERRO: Senha não valida após migração!`)
        errors++
        continue
      }

      console.log(`   ✅ Senha atualizada e testada com sucesso!`)
      migrated++

    } catch (error) {
      console.error(`   ❌ Erro inesperado: ${error.message}`)
      errors++
    }
  }

  // 5. Resumo final
  console.log('\n' + '='.repeat(60))
  console.log('📋 RESUMO DA MIGRAÇÃO')
  console.log('='.repeat(60))
  console.log(`✅ Migrados com sucesso: ${migrated}`)
  console.log(`❌ Erros: ${errors}`)
  console.log(`📊 Total de usuários: ${users.length}`)
  console.log(`🔒 Usuários com bcrypt: ${usersAlreadyMigrated.length + migrated}`)
  console.log('='.repeat(60))

  if (migrated > 0) {
    console.log('\n🎉 Migração concluída com sucesso!')
    console.log('✅ Todos os usuários agora podem fazer login com suas senhas originais.')
  }

  if (errors > 0) {
    console.log('\n⚠️  Alguns usuários não foram migrados. Verifique os erros acima.')
  }

  // 6. Verificação final
  console.log('\n🔍 Verificação final...')
  const { data: verifyData, error: verifyError } = await supabase
    .from('users')
    .select('id, name, password')
    .order('id')

  if (!verifyError) {
    console.log('\n📊 Status final de todos os usuários:')
    verifyData.forEach(user => {
      const isBcrypt = user.password.startsWith('$2b$')
      const status = isBcrypt ? '✅ BCRYPT' : '❌ PLAIN TEXT'
      console.log(`   • ID ${user.id}: ${user.name.padEnd(30)} ${status}`)
    })
  }

  console.log('\n✅ Script finalizado!\n')
}

// Executar
migrateAllPasswords().catch(error => {
  console.error('\n❌ ERRO FATAL:', error)
  process.exit(1)
})
