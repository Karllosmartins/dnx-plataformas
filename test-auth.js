// Teste da autenticação da API Profile
const API_PROFILE_BASE_URL = 'https://apiprofile.infinititi.com.br'

async function testAuth(apiKey) {
  console.log('🔐 Testando autenticação com API Key:', apiKey ? 'presente' : 'ausente')
  
  const formData = new URLSearchParams()
  formData.append('apiKey', apiKey)
  
  console.log('📤 Body da requisição:', formData.toString())
  
  try {
    // Primeiro, tenta com application/json
    console.log('🔄 Tentativa 1: application/json')
    let response = await fetch(`${API_PROFILE_BASE_URL}/api/Auth`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ apiKey: apiKey })
    })

    if (response.status === 415) {
      console.log('🔄 Tentativa 2: application/x-www-form-urlencoded')
      response = await fetch(`${API_PROFILE_BASE_URL}/api/Auth`, {
        method: 'POST',
        headers: {
          'accept': 'text/plain',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      })
    }

    console.log('📥 Status da resposta:', response.status)
    console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na autenticação:', errorText)
      return { success: false, error: errorText }
    }

    const data = await response.json()
    console.log('✅ Autenticação bem-sucedida!')
    console.log('🔑 Resposta completa:', data)
    return { success: true, token: data.token }
  } catch (error) {
    console.error('💥 Erro durante o teste:', error)
    return { success: false, error: error.message }
  }
}

// API Key do banco de dados
const API_KEY = '043d2754-cd7f-47ba-b83b-0dbbb3877f36'

testAuth(API_KEY).then(result => {
  console.log('\n🏁 Resultado final:', result)
  process.exit(result.success ? 0 : 1)
})