const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = 'https://enwxbkyvnrjderqdygtl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVud3hia3l2bnJqZGVycWR5Z3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MzAzNCwiZXhwIjoyMDcxNjM5MDM0fQ.BxADhNw1F84N_YVV7EQC8OHJlE6StJx0lqjZxjHRRD8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados...')

  try {
    // Ler e executar o schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📄 Executando schema...')
    
    // Dividir em comandos individuais (remover comentários e linhas vazias)
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'))
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`Executando: ${command.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql_query: command })
        if (error) {
          console.error(`❌ Erro ao executar comando: ${error.message}`)
        }
      }
    }

    // Inserir dados iniciais
    console.log('📊 Inserindo dados iniciais...')
    
    // Inserir usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          name: 'Administrator',
          email: 'admin@dnxplataformas.com.br',
          password: 'admin123',
          role: 'admin',
          active: true,
          cpf: '11111111111',
          telefone: '5511999999999',
          plano: 'enterprise',
          limite_leads: 1000,
          limite_consultas: 100
        },
        {
          name: 'Usuário Demo 1',
          email: 'usuario1@dnxplataformas.com.br',
          password: 'demo123',
          role: 'user',
          active: true,
          cpf: '03082774148',
          telefone: '556281048778',
          plano: 'premium',
          limite_leads: 500,
          limite_consultas: 50
        },
        {
          name: 'Usuário Demo 2',
          email: 'usuario2@dnxplataformas.com.br',
          password: 'demo123',
          role: 'user',
          active: true,
          cpf: '99999999999',
          telefone: '5511888888888',
          plano: 'basico',
          limite_leads: 100,
          limite_consultas: 10
        }
      ])
      .select()

    if (usersError) {
      console.error('❌ Erro ao inserir usuários:', usersError.message)
    } else {
      console.log(`✅ ${users.length} usuários criados com sucesso`)
    }

    // Verificar se deu tudo certo
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    if (testError) {
      console.error('❌ Erro ao verificar usuários:', testError.message)
    } else {
      console.log(`✅ Verificação: ${testUsers.length} usuários encontrados`)
      testUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`)
      })
    }

    console.log('🎉 Banco de dados configurado com sucesso!')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

setupDatabase()