const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase - Carrega de variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

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