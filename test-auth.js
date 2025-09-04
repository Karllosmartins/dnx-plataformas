// Teste da autenticação da API Profile
const API_PROFILE_BASE_URL = 'https://apiprofile.infinititi.com.br'

async function testAuth(apiKey) {
  console.log('🔐 Testando autenticação com API Key:', apiKey ? 'presente' : 'ausente')
  
  const formData = new URLSearchParams()
  formData.append('apiKey', apiKey)
  
  console.log('📤 Body da requisição:', formData.toString())
  
  try {
    const response = await fetch(`${API_PROFILE_BASE_URL}/api/Auth`, {
      method: 'POST',
      headers: {
        'accept': 'text/plain',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

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

// Substitua pela sua API Key real
const API_KEY = 'SUA_API_KEY_AQUI'

testAuth(API_KEY).then(result => {
  console.log('\n🏁 Resultado final:', result)
  process.exit(result.success ? 0 : 1)
})