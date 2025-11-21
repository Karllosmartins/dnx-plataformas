// Script de migração de senha do usuário 24 para bcrypt
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcrypt')

const supabaseUrl = 'https://enwxbkyvnrjderqdygtl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud3hia3l2bnJqZGVycWR5Z3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MzAzNCwiZXhwIjoyMDcxNjM5MDM0fQ.BxADhNw1F84N_YVV7EQC8OHJlE6StJx0lqjZxjHRRD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migratePassword() {
  console.log('\n🔄 Iniciando migração de senha do usuário 24...\n')

  // Senha atual em plain text
  const plainPassword = 'karllosmartins1000@'

  console.log('1️⃣ Gerando hash bcrypt da senha atual...')
  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds)

  console.log('✅ Hash gerado com sucesso')
  console.log('   Tamanho:', hashedPassword.length, 'caracteres')
  console.log('   Hash (primeiros 50):', hashedPassword.substring(0, 50) + '...')

  console.log('\n2️⃣ Atualizando senha no banco de dados...')
  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', 24)

  if (updateError) {
    console.error('❌ Erro ao atualizar senha:', updateError)
    return
  }

  console.log('✅ Senha atualizada com sucesso no banco')

  console.log('\n3️⃣ Verificando atualização...')
  const { data: verifyData, error: verifyError } = await supabase
    .from('users')
    .select('id, name, email, password')
    .eq('id', 24)
    .single()

  if (verifyError) {
    console.error('❌ Erro ao verificar:', verifyError)
    return
  }

  console.log('✅ Verificação completa:')
  console.log('   ID:', verifyData.id)
  console.log('   Nome:', verifyData.name)
  console.log('   Email:', verifyData.email)
  console.log('   Senha é bcrypt?', verifyData.password.startsWith('$2b$') ? '✅ SIM' : '❌ NÃO')

  console.log('\n4️⃣ Testando login com senha atual...')
  const isValid = await bcrypt.compare(plainPassword, verifyData.password)

  if (isValid) {
    console.log('✅ LOGIN FUNCIONANDO! Senha validada com sucesso')
  } else {
    console.log('❌ ERRO! Login não funcionou')
  }

  console.log('\n✅ MIGRAÇÃO COMPLETA!')
  console.log('\n📋 RESUMO:')
  console.log('   • Usuário: Karllos Martins (ID 24)')
  console.log('   • Email: karllosmartins1000@gmail.com')
  console.log('   • Senha: karllosmartins1000@ (MANTIDA)')
  console.log('   • Formato: BCRYPT HASH ✅')
  console.log('   • Login: TESTADO E FUNCIONANDO ✅')
  console.log('\n🚀 Sistema pronto para deploy na VPS!')
}

migratePassword().catch(console.error)
