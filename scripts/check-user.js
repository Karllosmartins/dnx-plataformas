// Script temporário para verificar usuário no Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://enwxbkyvnrjderqdygtl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud3hia3l2bnJqZGVycWR5Z3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MzAzNCwiZXhwIjoyMDcxNjM5MDM0fQ.BxADhNw1F84N_YVV7EQC8OHJlE6StJx0lqjZxjHRRD8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, password, role, active')
    .eq('id', 24)
    .single()

  if (error) {
    console.error('Erro ao buscar usuário:', error)
    return
  }

  console.log('\n=== USUÁRIO ID 24 ===')
  console.log('ID:', data.id)
  console.log('Nome:', data.name)
  console.log('Email:', data.email)
  console.log('Role:', data.role)
  console.log('Ativo:', data.active)
  console.log('\n=== SENHA ATUAL ===')
  console.log('Senha (primeiros 50 chars):', data.password.substring(0, 50) + '...')
  console.log('Tipo:', data.password.startsWith('$2b$') ? 'BCRYPT HASH ✅' : 'PLAIN TEXT ❌')
  console.log('Tamanho:', data.password.length, 'caracteres')
}

checkUser()
