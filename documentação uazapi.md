/instance/init
Criar Instancia
Cria uma nova instância do WhatsApp. Para criar uma instância você precisa:

Ter um admintoken válido
Enviar pelo menos o nome da instância
A instância será criada desconectada
Será gerado um token único para autenticação
Após criar a instância, guarde o token retornado pois ele será necessário para todas as outras operações.

Estados possíveis da instância:

disconnected: Desconectado do WhatsApp
connecting: Em processo de conexão
connected: Conectado e autenticado
Campos administrativos (adminField01/adminField02) são opcionais e podem ser usados para armazenar metadados personalizados. OS valores desses campos são vísiveis para o dono da instancia via token, porém apenas o administrador da api (via admin token) pode editá-los.

Request
Body
name
string
required
Nome da instância

Example: "minha-instancia"

systemName
string
Nome do sistema (opcional, padrão 'uazapiGO' se não informado)

Example: "apilocal"

adminField01
string
Campo administrativo 1 para metadados personalizados (opcional)

Example: "custom-metadata-1"

adminField02
string
Campo administrativo 2 para metadados personalizados (opcional)

Example: "custom-metadata-2"

curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/init \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'admintoken: qjFnbrGWTpVUVFkYwLzgtNGzIPu5xmfsIpf0cbnJEs7mI3VR4L' \
  --data '{
  "name": "minha-instancia",
  "systemName": "apilocal",
  "adminField01": "custom-metadata-1",
  "adminField02": "custom-metadata-2"
}'
Responses

200
Sucesso
Response Example

{
  "response": "Instance created successfully",
  "instance": {
    "id": "i91011ijkl",
    "token": "abc123xyz",
    "status": "connected",
    "paircode": "1234-5678",
    "qrcode": "data:image/png;base64,iVBORw0KGg...",
    "name": "Instância Principal",
    "profileName": "Loja ABC",
    "profilePicUrl": "https://example.com/profile.jpg",
    "isBusiness": true,
    "plataform": "Android",
    "systemName": "uazapi",
    "owner": "user@example.com",
    "lastDisconnect": "2025-01-24T14:00:00Z",
    "lastDisconnectReason": "Network error",
    "adminField01": "custom_data",
    "openai_apikey": "sk-...xyz",
    "chatbot_enabled": true,
    "chatbot_ignoreGroups": true,
    "chatbot_stopConversation": "parar",
    "chatbot_stopMinutes": 60,
    "created": "2025-01-24T14:00:00Z",
    "updated": "2025-01-24T14:30:00Z",
    "delayMin": 2,
    "delayMax": 4
  },
  "connected": false,
  "loggedIn": false,
  "name": "minha-instancia",
  "token": "123e4567-e89b-12d3-a456-426614174000",
  "info": "This instance will be automatically disconnected and deleted after 1 hour."
}

401
Token inválido/expirado
No response body for this status code.

404
Instância não encontrada

500
Erro interno
No response body for this statu

GET /instance/all
Listar todas as instâncias
Retorna uma lista completa de todas as instâncias do sistema, incluindo:

ID e nome de cada instância
Status atual (disconnected, connecting, connected)
Data de criação
Última desconexão e motivo
Informações de perfil (se conectado)
Requer permissões de administrador.

curl --request GET \
  --url https://dnxplataforma.uazapi.com/instance/all \
  --header 'Accept: application/json' \
  --header 'admintoken: qjFnbrGWTpVUVFkYwLzgtNGzIPu5xmfsIpf0cbnJEs7mI3VR4L'

Responses

200
Lista de instâncias retornada com sucesso
Response Example

[
  {
    "id": "i91011ijkl",
    "token": "abc123xyz",
    "status": "connected",
    "paircode": "1234-5678",
    "qrcode": "data:image/png;base64,iVBORw0KGg...",
    "name": "Instância Principal",
    "profileName": "Loja ABC",
    "profilePicUrl": "https://example.com/profile.jpg",
    "isBusiness": true,
    "plataform": "Android",
    "systemName": "uazapi",
    "owner": "user@example.com",
    "lastDisconnect": "2025-01-24T14:00:00Z",
    "lastDisconnectReason": "Network error",
    "adminField01": "custom_data",
    "openai_apikey": "sk-...xyz",
    "chatbot_enabled": true,
    "chatbot_ignoreGroups": true,
    "chatbot_stopConversation": "parar",
    "chatbot_stopMinutes": 60,
    "created": "2025-01-24T14:00:00Z",
    "updated": "2025-01-24T14:30:00Z",
    "delayMin": 2,
    "delayMax": 4
  }
]

401
Token inválido ou expirado
Response Example

{
  "error": "Unauthorized"
}

403
Token de administrador inválido
Response Example

{
  "error": "Invalid AdminToken Header"
}

500
Erro interno do servidor
Response Example

{
  "error": "Internal server error"
}

  POST
/instance/updateAdminFields
Atualizar campos administrativos
Atualiza os campos administrativos (adminField01/adminField02) de uma instância.
Responses

200
Campos atualizados com sucesso
Response Example

{
  "id": "i91011ijkl",
  "token": "abc123xyz",
  "status": "connected",
  "paircode": "1234-5678",
  "qrcode": "data:image/png;base64,iVBORw0KGg...",
  "name": "Instância Principal",
  "profileName": "Loja ABC",
  "profilePicUrl": "https://example.com/profile.jpg",
  "isBusiness": true,
  "plataform": "Android",
  "systemName": "uazapi",
  "owner": "user@example.com",
  "lastDisconnect": "2025-01-24T14:00:00Z",
  "lastDisconnectReason": "Network error",
  "adminField01": "custom_data",
  "openai_apikey": "sk-...xyz",
  "chatbot_enabled": true,
  "chatbot_ignoreGroups": true,
  "chatbot_stopConversation": "parar",
  "chatbot_stopMinutes": 60,
  "created": "2025-01-24T14:00:00Z",
  "updated": "2025-01-24T14:30:00Z",
  "delayMin": 2,
  "delayMax": 4
}

401
Token de administrador inválido
No response body for this status code.

404
Instância não encontrada

500
Erro interno
Campos administrativos são opcionais e podem ser usados para armazenar metadados personalizados. Estes campos são persistidos no banco de dados e podem ser utilizados para integrações com outros sistemas ou para armazenamento de informações internas. OS valores desses campos são vísiveis para o dono da instancia via token, porém apenas o administrador da api (via admin token) pode editá-los.

Request
Body
id
string
required
ID da instância

Example: "inst_123456"

adminField01
string
Campo administrativo 1

Example: "clientId_456"

adminField02
string
Campo administrativo 2

Example: "integration_xyz"

curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/updateAdminFields \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'admintoken: qjFnbrGWTpVUVFkYwLzgtNGzIPu5xmfsIpf0cbnJEs7mI3VR4L' \
  --data '{
  "id": "inst_123456",
  "adminField01": "clientId_456",
  "adminField02": "integration_xyz"
}'

GET
/globalwebhook
Ver Webhook Global
Retorna a configuração atual do webhook global, incluindo:

URL configurada
Eventos ativos
Filtros aplicados
Configurações adicionais
Exemplo de resposta:

{
  "enabled": true,
  "url": "https://example.com/webhook",
  "events": ["messages", "messages_update"],
  "excludeMessages": ["wasSentByApi", "isGroupNo"],
  "addUrlEvents": true,
  "addUrlTypesMessages": true
}

curl --request GET \
  --url https://dnxplataforma.uazapi.com/globalwebhook \
  --header 'Accept: application/json' \
  --header 'admintoken: qjFnbrGWTpVUVFkYwLzgtNGzIPu5xmfsIpf0cbnJEs7mI3VR4L'

  POST
/globalwebhook
Configurar Webhook Global
Configura um webhook global que receberá eventos de todas as instâncias.

🚀 Configuração Simples (Recomendada)
Para a maioria dos casos de uso:

Configure apenas URL e eventos desejados
Modo simples por padrão (sem complexidade)
Recomendado: Sempre use "excludeMessages": ["wasSentByApi"] para evitar loops
Exemplo: {"url": "https://webhook.cool/global", "events": ["messages", "connection"], "excludeMessages": ["wasSentByApi"]}
🧪 Sites para Testes (ordenados por qualidade)
Para testar webhooks durante desenvolvimento:

https://webhook.cool/ - ⭐ Melhor opção (sem rate limit, interface limpa)
https://rbaskets.in/ - ⭐ Boa alternativa (confiável, baixo rate limit)
https://webhook.site/ - ⚠️ Evitar se possível (rate limit agressivo)
Funcionalidades Principais:
Configuração de URL para recebimento de eventos
Seleção granular de tipos de eventos
Filtragem avançada de mensagens
Parâmetros adicionais na URL
Eventos Disponíveis:

connection: Alterações no estado da conexão
history: Recebimento de histórico de mensagens
messages: Novas mensagens recebidas
messages_update: Atualizações em mensagens existentes
call: Eventos de chamadas VoIP
contacts: Atualizações na agenda de contatos
presence: Alterações no status de presença
groups: Modificações em grupos
labels: Gerenciamento de etiquetas
chats: Eventos de conversas
chat_labels: Alterações em etiquetas de conversas
blocks: Bloqueios/desbloqueios
leads: Atualizações de leads
sender: Atualizações de campanhas, quando inicia, e quando completa
Remover mensagens com base nos filtros:

wasSentByApi: Mensagens originadas pela API ⚠️ IMPORTANTE: Use sempre este filtro para evitar loops em automações
wasNotSentByApi: Mensagens não originadas pela API
fromMeYes: Mensagens enviadas pelo usuário
fromMeNo: Mensagens recebidas de terceiros
isGroupYes: Mensagens em grupos
isGroupNo: Mensagens em conversas individuais
💡 Prevenção de Loops Globais: O webhook global recebe eventos de TODAS as instâncias. Se você tem automações que enviam mensagens via API, sempre inclua "excludeMessages": ["wasSentByApi"]. Caso prefira receber esses eventos, certifique-se de que sua automação detecta mensagens enviadas pela própria API para não criar loops infinitos em múltiplas instâncias.

Parâmetros de URL:

addUrlEvents (boolean): Quando ativo, adiciona o tipo do evento como path parameter na URL. Exemplo: https://api.example.com/webhook/{evento}
addUrlTypesMessages (boolean): Quando ativo, adiciona o tipo da mensagem como path parameter na URL. Exemplo: https://api.example.com/webhook/{tipo_mensagem}
Combinações de Parâmetros:

Ambos ativos: https://api.example.com/webhook/{evento}/{tipo_mensagem} Exemplo real: https://api.example.com/webhook/message/conversation
Apenas eventos: https://api.example.com/webhook/message
Apenas tipos: https://api.example.com/webhook/conversation
Notas Técnicas:

Os parâmetros são adicionados na ordem: evento → tipo mensagem
A URL deve ser configurada para aceitar esses parâmetros dinâmicos
Funciona com qualquer combinação de eventos/mensagens
Request
Body
url
string
required
URL para receber os eventos

Example: "https://webhook.cool/global"

events
array
required
Lista de eventos monitorados

Example: ["messages","connection"]

excludeMessages
array
Filtros para excluir tipos de mensagens

Example: ["wasSentByApi"]

addUrlEvents
boolean
Adiciona o tipo do evento como parâmetro na URL.

false (padrão): URL normal
true: Adiciona evento na URL (ex: /webhook/message)
addUrlTypesMessages
boolean
Adiciona o tipo da mensagem como parâmetro na URL.

false (padrão): URL normal
true: Adiciona tipo da mensagem (ex: /webhook/conversation)
Responses

200
Webhook global configurado com sucesso
Response Example

{
  "id": "wh_9a8b7c6d5e",
  "instance_id": "inst_12345",
  "enabled": true,
  "url": "https://webhook.cool/example",
  "events": [
    "messages",
    "connection"
  ],
  "AddUrlTypesMessages": false,
  "addUrlEvents": false,
  "excludeMessages": [],
  "created": "2025-01-24T16:20:00Z",
  "updated": "2025-01-24T16:25:00Z"
}

400
Payload inválido
Response Example

{
  "error": "Invalid payload"
}

401
Token de administrador não fornecido
Response Example

{
  "error": "Unauthorized"
}

403
Token de administrador inválido ou servidor demo
Response Example

{
  "error": "This is a public demo server. This endpoint has been disabled."
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to save global webhook to database"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/globalwebhook \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'admintoken: qjFnbrGWTpVUVFkYwLzgtNGzIPu5xmfsIpf0cbnJEs7mI3VR4L' \
  --data '{
  "url": "https://webhook.cool/global",
  "events": [
    "messages",
    "connection"
  ],
  "excludeMessages": [
    "wasSentByApi"
  ]
}'

------------

POST
/instance/connect
Conectar instância ao WhatsApp
Inicia o processo de conexão de uma instância ao WhatsApp. Este endpoint:

Requer o token de autenticação da instância
Recebe o número de telefone associado à conta WhatsApp
Gera um QR code caso não passe o campo phone
Ou Gera código de pareamento se passar o o campo phone
Atualiza o status da instância para "connecting"
O processo de conexão permanece pendente até que:

O QR code seja escaneado no WhatsApp do celular, ou
O código de pareamento seja usado no WhatsApp
Timeout de 2 minutos para QRCode seja atingido ou 5 minutos para o código de pareamento
Use o endpoint /instance/status para monitorar o progresso da conexão.

Estados possíveis da instância:

disconnected: Desconectado do WhatsApp
connecting: Em processo de conexão
connected: Conectado e autenticado
Exemplo de requisição:

{
  "phone": "5511999999999"
}
Request
Body
phone
string
required
Número de telefone no formato internacional (ex: 5511999999999)

Example: "5511999999999"

Responses

200
Sucesso
Response Example

{
  "connected": false,
  "loggedIn": false,
  "jid": null,
  "instance": {
    "id": "i91011ijkl",
    "token": "abc123xyz",
    "status": "connected",
    "paircode": "1234-5678",
    "qrcode": "data:image/png;base64,iVBORw0KGg...",
    "name": "Instância Principal",
    "profileName": "Loja ABC",
    "profilePicUrl": "https://example.com/profile.jpg",
    "isBusiness": true,
    "plataform": "Android",
    "systemName": "uazapi",
    "owner": "user@example.com",
    "lastDisconnect": "2025-01-24T14:00:00Z",
    "lastDisconnectReason": "Network error",
    "adminField01": "custom_data",
    "openai_apikey": "sk-...xyz",
    "chatbot_enabled": true,
    "chatbot_ignoreGroups": true,
    "chatbot_stopConversation": "parar",
    "chatbot_stopMinutes": 60,
    "created": "2025-01-24T14:00:00Z",
    "updated": "2025-01-24T14:30:00Z",
    "delayMin": 2,
    "delayMax": 4
  }
}

401
Token inválido/expirado
No response body for this status code.

404
Instância não encontrada

429
Limite de conexões simultâneas atingido

500
Erro interno
No response body for this status code.
curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/connect \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "phone": "5511999999999"
}'

POST
/instance/disconnect
Desconectar instância
Desconecta a instância do WhatsApp, encerrando a sessão atual. Esta operação:

Encerra a conexão ativa

Requer novo QR code para reconectar

Diferenças entre desconectar e hibernar:

Desconectar: Encerra completamente a sessão, exigindo novo login

Hibernar: Mantém a sessão ativa, apenas pausa a conexão

Use este endpoint para:

Encerrar completamente uma sessão

Forçar uma nova autenticação

Limpar credenciais de uma instância

Reiniciar o processo de conexão

Estados possíveis após desconectar:

disconnected: Desconectado do WhatsApp

connecting: Em processo de reconexão (após usar /instance/connect)

curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/disconnect \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'

  GET
/instance/status
Verificar status da instância
Retorna o status atual de uma instância, incluindo:

Estado da conexão (disconnected, connecting, connected)
QR code atualizado (se em processo de conexão)
Código de pareamento (se disponível)
Informações da última desconexão
Detalhes completos da instância
Este endpoint é particularmente útil para:

Monitorar o progresso da conexão
Obter QR codes atualizados durante o processo de conexão
Verificar o estado atual da instância
Identificar problemas de conexão
Estados possíveis:

disconnected: Desconectado do WhatsApp
connecting: Em processo de conexão (aguardando QR code ou código de pareamento)
connected: Conectado e autenticado com sucesso
Responses

200
Sucesso
Response Example

{
  "instance": {
    "id": "i91011ijkl",
    "token": "abc123xyz",
    "status": "connected",
    "paircode": "1234-5678",
    "qrcode": "data:image/png;base64,iVBORw0KGg...",
    "name": "Instância Principal",
    "profileName": "Loja ABC",
    "profilePicUrl": "https://example.com/profile.jpg",
    "isBusiness": true,
    "plataform": "Android",
    "systemName": "uazapi",
    "owner": "user@example.com",
    "lastDisconnect": "2025-01-24T14:00:00Z",
    "lastDisconnectReason": "Network error",
    "adminField01": "custom_data",
    "openai_apikey": "sk-...xyz",
    "chatbot_enabled": true,
    "chatbot_ignoreGroups": true,
    "chatbot_stopConversation": "parar",
    "chatbot_stopMinutes": 60,
    "created": "2025-01-24T14:00:00Z",
    "updated": "2025-01-24T14:30:00Z",
    "delayMin": 2,
    "delayMax": 4
  },
  "status": {
    "connected": false,
    "loggedIn": false,
    "jid": {}
  }
}

401
Token inválido/expirado
Response Example

{
  "error": "instance info not found"
}

404
Instância não encontrada

500
Erro interno
No response body for this status code.

curl --request GET \
  --url https://dnxplataforma.uazapi.com/instance/status \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'

  POST
/instance/updateInstanceName
Atualizar nome da instância
Atualiza o nome de uma instância WhatsApp existente. O nome não precisa ser único.

Request
Body
name
string
required
Novo nome para a instância

Example: "Minha Nova Instância 2024!@#"

Responses

200
Sucesso
Response Example

{
  "id": "i91011ijkl",
  "token": "abc123xyz",
  "status": "connected",
  "paircode": "1234-5678",
  "qrcode": "data:image/png;base64,iVBORw0KGg...",
  "name": "Instância Principal",
  "profileName": "Loja ABC",
  "profilePicUrl": "https://example.com/profile.jpg",
  "isBusiness": true,
  "plataform": "Android",
  "systemName": "uazapi",
  "owner": "user@example.com",
  "lastDisconnect": "2025-01-24T14:00:00Z",
  "lastDisconnectReason": "Network error",
  "adminField01": "custom_data",
  "openai_apikey": "sk-...xyz",
  "chatbot_enabled": true,
  "chatbot_ignoreGroups": true,
  "chatbot_stopConversation": "parar",
  "chatbot_stopMinutes": 60,
  "created": "2025-01-24T14:00:00Z",
  "updated": "2025-01-24T14:30:00Z",
  "delayMin": 2,
  "delayMax": 4
}

401
Token inválido/expirado
No response body for this status code.

404
Instância não encontrada

500
Erro interno
No response body for this status code.

curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/updateInstanceName \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "name": "Minha Nova Instância 2024!@#"
}'

DELETE
/instance
Deletar instância
Remove a instância do sistema.

Responses

200
Instância deletada com sucesso
Response Example

{
  "response": "Instance Deleted",
  "info": "O dispositivo foi desconectado com sucesso e a instância foi removida do banco de dados."
}

401
Falha na autenticação
Response Example

{
  "error": "Não autorizado - Token inválido ou ausente"
}

404
Instância não encontrada

500
Erro interno do servidor
Response Example

{
  "error": "Falha ao deletar instância"
}
curl --request DELETE \
  --url https://dnxplataforma.uazapi.com/instance \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'

  GET
/instance/privacy
Buscar configurações de privacidade
Busca as configurações de privacidade atuais da instância do WhatsApp.

Importante - Diferença entre Status e Broadcast:

Status: Refere-se ao recado personalizado que aparece embaixo do nome do usuário (ex: "Disponível", "Ocupado", texto personalizado)
Broadcast: Refere-se ao envio de "stories/reels" (fotos/vídeos temporários)
Limitação: As configurações de privacidade do broadcast (stories/reels) não estão disponíveis para alteração via API.

Retorna todas as configurações de privacidade como quem pode:

Adicionar aos grupos
Ver visto por último
Ver status (recado embaixo do nome)
Ver foto de perfil
Receber confirmação de leitura
Ver status online
Fazer chamadas
Responses

200
Configurações de privacidade obtidas com sucesso
Response Example

{
  "groupadd": "contacts",
  "last": "contacts",
  "status": "contacts",
  "profile": "contacts",
  "readreceipts": "all",
  "online": "all",
  "calladd": "all"
}

401
Token de autenticação inválido
Response Example

{
  "error": "client not found"
}

500
Erro interno do servidor
Response Example

{
  "error": "No session"
}

curl --request GET \
  --url https://dnxplataforma.uazapi.com/instance/privacy \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'

  POST
/instance/privacy
Alterar configurações de privacidade
Altera uma ou múltiplas configurações de privacidade da instância do WhatsApp de forma otimizada.

Importante - Diferença entre Status e Broadcast:

Status: Refere-se ao recado personalizado que aparece embaixo do nome do usuário (ex: "Disponível", "Ocupado", texto personalizado)
Broadcast: Refere-se ao envio de "stories/reels" (fotos/vídeos temporários)
Limitação: As configurações de privacidade do broadcast (stories/reels) não estão disponíveis para alteração via API.

Características:

✅ Eficiência: Altera apenas configurações que realmente mudaram
✅ Flexibilidade: Pode alterar uma ou múltiplas configurações na mesma requisição
✅ Feedback completo: Retorna todas as configurações atualizadas
Formato de entrada:

{
  "groupadd": "contacts",
  "last": "none",
  "status": "contacts"
}
Tipos de privacidade disponíveis:

groupadd: Quem pode adicionar aos grupos
last: Quem pode ver visto por último
status: Quem pode ver status (recado embaixo do nome)
profile: Quem pode ver foto de perfil
readreceipts: Confirmação de leitura
online: Quem pode ver status online
calladd: Quem pode fazer chamadas
Valores possíveis:

all: Todos
contacts: Apenas contatos
contact_blacklist: Contatos exceto bloqueados
none: Ninguém
match_last_seen: Corresponder ao visto por último (apenas para online)
known: Números conhecidos (apenas para calladd)
Request
Body
groupadd
string
Quem pode adicionar aos grupos. Valores - all, contacts, contact_blacklist, none

last
string
Quem pode ver visto por último. Valores - all, contacts, contact_blacklist, none

status
string
Quem pode ver status (recado embaixo do nome). Valores - all, contacts, contact_blacklist, none

profile
string
Quem pode ver foto de perfil. Valores - all, contacts, contact_blacklist, none

readreceipts
string
Confirmação de leitura. Valores - all, none

online
string
Quem pode ver status online. Valores - all, match_last_seen

calladd
string
Quem pode fazer chamadas. Valores - all, known

Responses

200
Configuração de privacidade alterada com sucesso
Response Example

{
  "groupadd": "all",
  "last": "all",
  "status": "all",
  "profile": "all",
  "readreceipts": "all",
  "online": "all",
  "calladd": "all"
}

400
Dados de entrada inválidos
Response Example

{
  "error": "string"
}

401
Token de autenticação inválido
Response Example

{
  "error": "client not found"
}

500
Erro interno do servidor
Response Example

{
  "error": "string"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/privacy \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "groupadd": "contacts"
}'

POST
/instance/presence
Atualizar status de presença da instância
Atualiza o status de presença global da instância do WhatsApp. Este endpoint permite:

Definir se a instância está disponível (Aparece "online") ou indisponível
Controlar o status de presença para todos os contatos
Salvar o estado atual da presença na instância
Tipos de presença suportados:

available: Marca a instância como disponível/online
unavailable: Marca a instância como indisponível/offline
Atenção:

O status de presença pode ser temporariamente alterado para "available" (online) em algumas situações internas da API, e com isso o visto por último também pode ser atualizado.
Caso isso for um problema, considere alterar suas configurações de privacidade no WhatsApp para não mostrar o visto por último e/ou quem pode ver seu status "online".
⚠️ Importante - Limitação do Presence "unavailable":

Quando a API é o único dispositivo ativo: Confirmações de entrega/leitura (ticks cinzas/azuis) não são enviadas nem recebidas
Impacto: Eventos message_update com status de entrega podem não ser recebidos
Solução: Se precisar das confirmações, mantenha WhatsApp Web ou aplicativo móvel ativo ou use presence "available"
Exemplo de requisição:

{
  "presence": "available"
}
Exemplo de resposta:

{
  "response": "Presence updated successfully"
}
Erros comuns:

401: Token inválido ou expirado
400: Valor de presença inválido
500: Erro ao atualizar presença
Request
Body
presence
string
required
Status de presença da instância

Example: "available"

Responses

200
Presença atualizada com sucesso
Response Example

{
  "response": "Presence updated successfully"
}

400
Requisição inválida
Response Example

{
  "error": "string"
}

401
Token inválido ou expirado
Response Example

{
  "error": "client not found"
}

500
Erro interno do servidor
Response Example

{
  "error": "No session"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/presence \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "presence": "available"
}'

POST
/profile/name
Altera o nome do perfil do WhatsApp
Altera o nome de exibição do perfil da instância do WhatsApp.

O endpoint realiza:

Atualiza o nome do perfil usando o WhatsApp AppState
Sincroniza a mudança com o servidor do WhatsApp
Retorna confirmação da alteração
Importante:

A instância deve estar conectada ao WhatsApp
O nome será visível para todos os contatos
Pode haver um limite de alterações por período (conforme WhatsApp)
Request
Body
name
string
required
Novo nome do perfil do WhatsApp

Example: "Minha Empresa - Atendimento"

Responses

200
Nome do perfil alterado com sucesso
Response Example

{
  "success": true,
  "message": "Nome do perfil alterado com sucesso",
  "profile": {
    "name": "Minha Empresa - Atendimento",
    "updated_at": 1704067200
  }
}

400
Dados inválidos na requisição
Response Example

{
  "error": "Nome muito longo ou inválido"
}

401
Sem sessão ativa
Response Example

{
  "error": "No session"
}

403
Ação não permitida
Response Example

{
  "error": "Limite de alterações excedido ou conta com restrições"
}

500
Erro interno do servidor
Response Example

{
  "error": "Erro ao alterar nome do perfil"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/profile/name \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "name": "Minha Empresa - Atendimento"
}'

POST
/profile/image
Altera a imagem do perfil do WhatsApp
Altera a imagem de perfil da instância do WhatsApp.

O endpoint realiza:

Atualiza a imagem do perfil usando
Processa a imagem (URL, base64 ou comando de remoção)
Sincroniza a mudança com o servidor do WhatsApp
Retorna confirmação da alteração
Importante:

A instância deve estar conectada ao WhatsApp
A imagem será visível para todos os contatos
A imagem deve estar em formato JPEG e tamanho 640x640 pixels
Request
Body
image
string
required
Imagem do perfil. Pode ser:

URL da imagem (http/https)
String base64 da imagem
"remove" ou "delete" para remover a imagem atual
Example: "https://picsum.photos/640/640.jpg"

Responses

200
Imagem do perfil alterada com sucesso
Response Example

{
  "success": true,
  "message": "Imagem do perfil alterada com sucesso",
  "profile": {
    "image_updated": true,
    "image_removed": false,
    "updated_at": 1704067200
  }
}

400
Dados inválidos na requisição
Response Example

{
  "error": "Formato de imagem inválido ou URL inacessível"
}

401
Sem sessão ativa
Response Example

{
  "error": "No session"
}

403
Ação não permitida
Response Example

{
  "error": "Limite de alterações excedido ou conta com restrições"
}

413
Imagem muito grande

500
Erro interno do servidor
Response Example

{
  "error": "Erro ao alterar imagem do perfil"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/profile/image \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "image": "https://picsum.photos/640/640.jpg"
}'

GET
/webhook
Ver Webhook da Instância
Retorna a configuração atual do webhook da instância, incluindo:

URL configurada
Eventos ativos
Filtros aplicados
Configurações adicionais
Exemplo de resposta:

[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "enabled": true,
    "url": "https://example.com/webhook",
    "events": ["messages", "messages_update"],
    "excludeMessages": ["wasSentByApi", "isGroupNo"],
    "addUrlEvents": true,
    "addUrlTypesMessages": true
  },
  {
    "id": "987fcdeb-51k3-09j8-x543-864297539100",
    "enabled": true,
    "url": "https://outro-endpoint.com/webhook",
    "events": ["connection", "presence"],
    "excludeMessages": [],
    "addUrlEvents": false,
    "addUrlTypesMessages": false
  }
]
A resposta é sempre um array, mesmo quando há apenas um webhook configurado.

Responses

200
Configuração do webhook retornada com sucesso
Response Example

[
  {
    "id": "wh_9a8b7c6d5e",
    "instance_id": "inst_12345",
    "enabled": true,
    "url": "https://webhook.cool/example",
    "events": [
      "messages",
      "connection"
    ],
    "AddUrlTypesMessages": false,
    "addUrlEvents": false,
    "excludeMessages": [],
    "created": "2025-01-24T16:20:00Z",
    "updated": "2025-01-24T16:25:00Z"
  }
]

401
Token inválido ou não fornecido
Response Example

{
  "error": "missing token"
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to process webhook data"
}

curl --request GET \
  --url https://dnxplataforma.uazapi.com/webhook \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'

  POST
/webhook
Configurar Webhook da Instância
Gerencia a configuração de webhooks para receber eventos em tempo real da instância. Permite gerenciar múltiplos webhooks por instância através do campo ID e action.

🚀 Modo Simples (Recomendado)
Uso mais fácil - sem complexidade de IDs:

Não inclua action nem id no payload
Gerencia automaticamente um único webhook por instância
Cria novo ou atualiza o existente automaticamente
Recomendado: Sempre use "excludeMessages": ["wasSentByApi"] para evitar loops
Exemplo: {"url": "https://meusite.com/webhook", "events": ["messages"], "excludeMessages": ["wasSentByApi"]}
🧪 Sites para Testes (ordenados por qualidade)
Para testar webhooks durante desenvolvimento:

https://webhook.cool/ - ⭐ Melhor opção (sem rate limit, interface limpa)
https://rbaskets.in/ - ⭐ Boa alternativa (confiável, baixo rate limit)
https://webhook.site/ - ⚠️ Evitar se possível (rate limit agressivo)
⚙️ Modo Avançado (Para múltiplos webhooks)
Para usuários que precisam de múltiplos webhooks por instância:

💡 Dica: Mesmo precisando de múltiplos webhooks, considere usar addUrlEvents no modo simples. Um único webhook pode receber diferentes tipos de eventos em URLs específicas (ex: /webhook/message, /webhook/connection), eliminando a necessidade de múltiplos webhooks.

Criar Novo Webhook:

Use action: "add"
Não inclua id no payload
O sistema gera ID automaticamente
Atualizar Webhook Existente:

Use action: "update"
Inclua o id do webhook no payload
Todos os campos serão atualizados
Remover Webhook:

Use action: "delete"
Inclua apenas o id do webhook
Outros campos são ignorados
Eventos Disponíveis
connection: Alterações no estado da conexão
history: Recebimento de histórico de mensagens
messages: Novas mensagens recebidas
messages_update: Atualizações em mensagens existentes
call: Eventos de chamadas VoIP
contacts: Atualizações na agenda de contatos
presence: Alterações no status de presença
groups: Modificações em grupos
labels: Gerenciamento de etiquetas
chats: Eventos de conversas
chat_labels: Alterações em etiquetas de conversas
blocks: Bloqueios/desbloqueios
leads: Atualizações de leads
sender: Atualizações de campanhas, quando inicia, e quando completa
Remover mensagens com base nos filtros:

wasSentByApi: Mensagens originadas pela API ⚠️ IMPORTANTE: Use sempre este filtro para evitar loops em automações
wasNotSentByApi: Mensagens não originadas pela API
fromMeYes: Mensagens enviadas pelo usuário
fromMeNo: Mensagens recebidas de terceiros
isGroupYes: Mensagens em grupos
isGroupNo: Mensagens em conversas individuais
💡 Prevenção de Loops: Se você tem automações que enviam mensagens via API, sempre inclua "excludeMessages": ["wasSentByApi"] no seu webhook. Caso prefira receber esses eventos, certifique-se de que sua automação detecta mensagens enviadas pela própria API para não criar loops infinitos.

Ações Suportadas:

add: Registrar novo webhook
delete: Remover webhook existente
Parâmetros de URL:

addUrlEvents (boolean): Quando ativo, adiciona o tipo do evento como path parameter na URL. Exemplo: https://api.example.com/webhook/{evento}
addUrlTypesMessages (boolean): Quando ativo, adiciona o tipo da mensagem como path parameter na URL. Exemplo: https://api.example.com/webhook/{tipo_mensagem}
Combinações de Parâmetros:

Ambos ativos: https://api.example.com/webhook/{evento}/{tipo_mensagem} Exemplo real: https://api.example.com/webhook/message/conversation
Apenas eventos: https://api.example.com/webhook/message
Apenas tipos: https://api.example.com/webhook/conversation
Notas Técnicas:

Os parâmetros são adicionados na ordem: evento → tipo mensagem
A URL deve ser configurada para aceitar esses parâmetros dinâmicos
Funciona com qualquer combinação de eventos/mensagens
Request
Body
id
string
ID único do webhook (necessário para update/delete)

Example: "123e4567-e89b-12d3-a456-426614174000"

enabled
boolean
Habilita/desabilita o webhook

Example: true

url
string
required
URL para receber os eventos

Example: "https://example.com/webhook"

events
array
Lista de eventos monitorados

excludeMessages
array
Filtros para excluir tipos de mensagens

addUrlEvents
boolean
Adiciona o tipo do evento como parâmetro na URL.

false (padrão): URL normal
true: Adiciona evento na URL (ex: /webhook/message)
addUrlTypesMessages
boolean
Adiciona o tipo da mensagem como parâmetro na URL.

false (padrão): URL normal
true: Adiciona tipo da mensagem (ex: /webhook/conversation)
action
string
Ação a ser executada:

add: criar novo webhook
update: atualizar webhook existente (requer id)
delete: remover webhook (requer apenas id) Se não informado, opera no modo simples (único webhook)
Responses

200
Webhook configurado ou atualizado com sucesso
Response Example

[
  {
    "id": "wh_9a8b7c6d5e",
    "instance_id": "inst_12345",
    "enabled": true,
    "url": "https://webhook.cool/example",
    "events": [
      "messages",
      "connection"
    ],
    "AddUrlTypesMessages": false,
    "addUrlEvents": false,
    "excludeMessages": [],
    "created": "2025-01-24T16:20:00Z",
    "updated": "2025-01-24T16:25:00Z"
  }
]

400
Requisição inválida
Response Example

{
  "error": "Invalid action"
}

401
Token inválido ou não fornecido
Response Example

{
  "error": "missing token"
}

500
Erro interno do servidor
Response Example

{
  "error": "Could not save webhook"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/webhook \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "enabled": true,
  "url": "https://webhook.cool/example",
  "events": [
    "messages",
    "connection"
  ],
  "excludeMessages": [
    "wasSentByApi"
  ]
}'

POST
/send/text
Enviar mensagem de texto
Envia uma mensagem de texto para um contato ou grupo.

Recursos Específicos
Preview de links com suporte a personalização automática ou customizada
Formatação básica do texto
Substituição automática de placeholders dinâmicos
Campos Comuns
Este endpoint suporta todos os campos opcionais comuns documentados na tag "Enviar Mensagem", incluindo: delay, readchat, readmessages, replyid, mentions, forward, track_source, track_id, placeholders e envio para grupos.

Preview de Links
Preview Automático
{
  "number": "5511999999999",
  "text": "Confira: https://exemplo.com",
  "linkPreview": true
}
Preview Personalizado
{
  "number": "5511999999999",
  "text": "Confira nosso site! https://exemplo.com",
  "linkPreview": true,
  "linkPreviewTitle": "Título Personalizado",
  "linkPreviewDescription": "Uma descrição personalizada do link",
  "linkPreviewImage": "https://exemplo.com/imagem.jpg",
  "linkPreviewLarge": true
}
Request
Body
number
string
required
Número do destinatário (formato internacional)

Example: "5511999999999"

text
string
required
Texto da mensagem (aceita placeholders)

Example: "Olá {{name}}! Como posso ajudar?"

linkPreview
boolean
Ativa/desativa preview de links. Se true, procura automaticamente um link no texto para gerar preview.

Comportamento:

Se apenas linkPreview=true: gera preview automático do primeiro link encontrado no texto
Se fornecidos campos personalizados (title, description, image): usa os valores fornecidos
Se campos personalizados parciais: combina com dados automáticos do link como fallback
Example: true

linkPreviewTitle
string
Define um título personalizado para o preview do link

Example: "Título Personalizado"

linkPreviewDescription
string
Define uma descrição personalizada para o preview do link

Example: "Descrição personalizada do link"

linkPreviewImage
string
URL ou Base64 da imagem para usar no preview do link

Example: "https://exemplo.com/imagem.jpg"

linkPreviewLarge
boolean
Se true, gera um preview grande com upload da imagem. Se false, gera um preview pequeno sem upload

Example: true

replyid
string
ID da mensagem para responder

Example: "3EB0538DA65A59F6D8A251"

mentions
string
Números para mencionar (separados por vírgula)

Example: "5511999999999,5511888888888"

readchat
boolean
Marca conversa como lida após envio

Example: true

readmessages
boolean
Marca últimas mensagens recebidas como lidas

Example: true

delay
integer
Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'

Example: 1000

forward
boolean
Marca a mensagem como encaminhada no WhatsApp

Example: true

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Mensagem enviada com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Message sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Missing number or text"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

429
Limite de requisições excedido

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send message"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/text \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "text": "Olá! Como posso ajudar?"
}'

POST
/send/media
Enviar mídia (imagem, vídeo, áudio ou documento)
Envia diferentes tipos de mídia para um contato ou grupo. Suporta URLs ou arquivos base64.

Tipos de Mídia Suportados
image: Imagens (JPG preferencialmente)
video: Vídeos (apenas MP4)
document: Documentos (PDF, DOCX, XLSX, etc)
audio: Áudio comum (MP3 ou OGG)
myaudio: Mensagem de voz (alternativa ao PTT)
ptt: Mensagem de voz (Push-to-Talk)
sticker: Figurinha/Sticker
Recursos Específicos
Upload por URL ou base64
Caption/legenda opcional com suporte a placeholders
Nome personalizado para documentos (docName)
Geração automática de thumbnails
Compressão otimizada conforme o tipo
Campos Comuns
Este endpoint suporta todos os campos opcionais comuns documentados na tag "Enviar Mensagem", incluindo: delay, readchat, readmessages, replyid, mentions, forward, track_source, track_id, placeholders e envio para grupos.

Exemplos Básicos
Imagem Simples
{
  "number": "5511999999999",
  "type": "image",
  "file": "https://exemplo.com/foto.jpg"
}
Documento com Nome
{
  "number": "5511999999999",
  "type": "document",
  "file": "https://exemplo.com/contrato.pdf",
  "docName": "Contrato.pdf",
  "text": "Segue o documento solicitado"
}
Request
Body
number
string
required
Número do destinatário (formato internacional)

Example: "5511999999999"

type
string
required
Tipo de mídia (image, video, document, audio, myaudio, ptt, sticker)

Example: "image"

file
string
required
URL ou base64 do arquivo

Example: "https://exemplo.com/imagem.jpg"

text
string
Texto descritivo (caption) - aceita placeholders

Example: "Veja esta foto!"

docName
string
Nome do arquivo (apenas para documents)

Example: "relatorio.pdf"

replyid
string
ID da mensagem para responder

Example: "3EB0538DA65A59F6D8A251"

mentions
string
Números para mencionar (separados por vírgula)

Example: "5511999999999,5511888888888"

readchat
boolean
Marca conversa como lida após envio

Example: true

readmessages
boolean
Marca últimas mensagens recebidas como lidas

Example: true

delay
integer
Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...' ou 'Gravando áudio...'

Example: 1000

forward
boolean
Marca a mensagem como encaminhada no WhatsApp

Example: true

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Mídia enviada com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Media sent successfully",
    "fileUrl": "https://mmg.whatsapp.net/..."
  }
}

400
Requisição inválida
Response Example

{
  "error": "Invalid media type or file format"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

413
Arquivo muito grande

415
Formato de mídia não suportado

500
Erro interno do servidor
Response Example

{
  "error": "Failed to upload media"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/media \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "type": "image",
  "file": "https://exemplo.com/foto.jpg"
}'
POST
/send/contact
Enviar cartão de contato (vCard)
Envia um cartão de contato (vCard) para um contato ou grupo.

Recursos Específicos
vCard completo com nome, telefones, organização, email e URL
Múltiplos números de telefone (separados por vírgula)
Cartão clicável no WhatsApp para salvar na agenda
Informações profissionais (organização/empresa)
Campos Comuns
Este endpoint suporta todos os campos opcionais comuns documentados na tag "Enviar Mensagem", incluindo: delay, readchat, readmessages, replyid, mentions, forward, track_source, track_id, placeholders e envio para grupos.

Exemplo Básico
{
  "number": "5511999999999",
  "fullName": "João Silva",
  "phoneNumber": "5511999999999,5511888888888",
  "organization": "Empresa XYZ",
  "email": "joao.silva@empresa.com",
  "url": "https://empresa.com/joao"
}
Request
Body
number
string
required
Número do destinatário (formato internacional)

Example: "5511999999999"

fullName
string
required
Nome completo do contato

Example: "João Silva"

phoneNumber
string
required
Números de telefone (separados por vírgula)

Example: "5511999999999,5511888888888"

organization
string
Nome da organização/empresa

Example: "Empresa XYZ"

email
string
Endereço de email

Example: "joao@empresa.com"

url
string
URL pessoal ou da empresa

Example: "https://empresa.com/joao"

replyid
string
ID da mensagem para responder

Example: "3EB0538DA65A59F6D8A251"

mentions
string
Números para mencionar (separados por vírgula)

Example: "5511999999999,5511888888888"

readchat
boolean
Marca conversa como lida após envio

Example: true

readmessages
boolean
Marca últimas mensagens recebidas como lidas

Example: true

delay
integer
Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'

Example: 1000

forward
boolean
Marca a mensagem como encaminhada no WhatsApp

Example: true

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Cartão de contato enviado com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Contact card sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Missing required fields"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

429
Limite de requisições excedido

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send contact card"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/contact \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "fullName": "João Silva",
  "phoneNumber": "5511999999999,5511888888888",
  "organization": "Empresa XYZ",
  "email": "joao@empresa.com",
  "url": "https://empresa.com/joao",
  "replyid": "3EB0538DA65A59F6D8A251",
  "mentions": "5511999999999,5511888888888",
  "readchat": true,
  "readmessages": true,
  "delay": 1000,
  "forward": true,
  "track_source": "chatwoot",
  "track_id": "msg_123456789"
}'

POST
/send/location
Enviar localização geográfica
Envia uma localização geográfica para um contato ou grupo.

Recursos Específicos
Coordenadas precisas (latitude e longitude obrigatórias)
Nome do local para identificação
Mapa interativo no WhatsApp para navegação
Pin personalizado com nome do local
Campos Comuns
Este endpoint suporta todos os campos opcionais comuns documentados na tag "Enviar Mensagem", incluindo: delay, readchat, readmessages, replyid, mentions, forward, track_source, track_id, placeholders e envio para grupos.

Exemplo Básico
{
  "number": "5511999999999",
  "name": "Maracanã",
  "address": "Av. Pres. Castelo Branco, Portão 3 - Maracanã, Rio de Janeiro - RJ, 20271-130",
  "latitude": -22.912982815767986,
  "longitude": -43.23028153499254
}
Request
Body
number
string
required
Número do destinatário (formato internacional)

Example: "5511999999999"

name
string
Nome do local

Example: "MASP"

address
string
Endereço completo do local

Example: "Av. Paulista, 1578 - Bela Vista"

latitude
number
required
Latitude (-90 a 90)

Example: -23.5616

longitude
number
required
Longitude (-180 a 180)

Example: -46.6562

replyid
string
ID da mensagem para responder

Example: "3EB0538DA65A59F6D8A251"

mentions
string
Números para mencionar (separados por vírgula)

Example: "5511999999999,5511888888888"

readchat
boolean
Marca conversa como lida após envio

Example: true

readmessages
boolean
Marca últimas mensagens recebidas como lidas

Example: true

delay
integer
Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'

Example: 1000

forward
boolean
Marca a mensagem como encaminhada no WhatsApp

Example: true

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Localização enviada com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Location sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Invalid coordinates or missing number"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

429
Limite de requisições excedido

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send location"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/location \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "name": "MASP",
  "address": "Av. Paulista, 1578 - Bela Vista",
  "latitude": -23.5616,
  "longitude": -46.6562,
  "replyid": "3EB0538DA65A59F6D8A251",
  "mentions": "5511999999999,5511888888888",
  "readchat": true,
  "readmessages": true,
  "delay": 1000,
  "forward": true,
  "track_source": "chatwoot",
  "track_id": "msg_123456789"
}'

POST
/message/presence
Enviar atualização de presença
Envia uma atualização de presença para um contato ou grupo de forma assíncrona.

🔄 Comportamento Assíncrono:
Execução independente: A presença é gerenciada em background, não bloqueia o retorno da API
Limite máximo: 5 minutos de duração (300 segundos)
Tick de atualização: Reenvia a presença a cada 10 segundos
Cancelamento automático: Presença é cancelada automaticamente ao enviar uma mensagem para o mesmo chat
📱 Tipos de presença suportados:
composing: Indica que você está digitando uma mensagem
recording: Indica que você está gravando um áudio
paused: Remove/cancela a indicação de presença atual
⏱️ Controle de duração:
Sem delay: Usa limite padrão de 5 minutos
Com delay: Usa o valor especificado (máximo 5 minutos)
Cancelamento: Envio de mensagem cancela presença automaticamente
📋 Exemplos de uso:
Digitar por 30 segundos:
{
  "number": "5511999999999",
  "presence": "composing",
  "delay": 30000
}
Gravar áudio por 1 minuto:
{
  "number": "5511999999999",
  "presence": "recording",
  "delay": 60000
}
Cancelar presença atual:
{
  "number": "5511999999999",
  "presence": "paused"
}
Usar limite máximo (5 minutos):
{
  "number": "5511999999999",
  "presence": "composing"
}
Request
Body
number
string
required
Número do destinatário no formato internacional (ex: 5511999999999)

Example: "5511999999999"

presence
string
required
Tipo de presença a ser enviada

Example: "composing"

delay
integer
Duração em milissegundos que a presença ficará ativa (máximo 5 minutos = 300000ms). Se não informado ou valor maior que 5 minutos, usa o limite padrão de 5 minutos. A presença é reenviada a cada 10 segundos durante este período.

Example: 30000

Responses

200
Presença atualizada com sucesso
Response Example

{
  "response": "Chat presence sent successfully"
}

400
Requisição inválida
Response Example

{
  "error": "Número inválido ou tipo de presença inválido"
}

401
Token inválido ou expirado
Response Example

{
  "error": "Token inválido ou expirado"
}

500
Erro interno do servidor
Response Example

{
  "error": "Erro ao enviar presença"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/message/presence \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "presence": "composing",
  "delay": 30000
}'
POST
/send/status
Enviar Stories (Status)
Envia um story (status) com suporte para texto, imagem, vídeo e áudio.

Suporte a campos de rastreamento: Este endpoint também suporta track_source e track_id documentados na tag "Enviar Mensagem".

Tipos de Status
text: Texto com estilo e cor de fundo
image: Imagens com legenda opcional
video: Vídeos com thumbnail e legenda
audio: Áudio normal ou mensagem de voz (PTT)
Cores de Fundo
1-3: Tons de amarelo
4-6: Tons de verde
7-9: Tons de azul
10-12: Tons de lilás
13: Magenta
14-15: Tons de rosa
16: Marrom claro
17-19: Tons de cinza (19 é o padrão)
Fontes (para texto)
0: Padrão
1-8: Estilos alternativos
Limites
Texto: Máximo 656 caracteres
Imagem: JPG, PNG, GIF
Vídeo: MP4, MOV
Áudio: MP3, OGG, WAV (convertido para OGG/OPUS)
Exemplo
{
  "type": "text",
  "text": "Novidades chegando!",
  "background_color": 7,
  "font": 1
}
Request
Body
type
string
required
Tipo do status

Example: "text"

text
string
Texto principal ou legenda

Example: "Novidades chegando!"

background_color
integer
Código da cor de fundo

Example: 7

font
integer
Estilo da fonte (apenas para type=text)

Example: 1

file
string
URL ou Base64 do arquivo de mídia

Example: "https://example.com/video.mp4"

thumbnail
string
URL ou Base64 da miniatura (opcional para vídeos)

Example: "https://example.com/thumb.jpg"

mimetype
string
MIME type do arquivo (opcional)

Example: "video/mp4"

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Status enviado com sucesso
Response Example

{
  "Id": "ABCD1234",
  "content": {},
  "messageTimestamp": 1672531200000,
  "status": "Pending"
}

400
Requisição inválida
Response Example

{
  "error": "Text too long"
}

401
Não autorizado
Response Example

{
  "error": "No session"
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to upload media"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/status \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "type": "text",
  "text": "Novidades chegando!",
  "background_color": 7,
  "font": 1,
  "file": "https://example.com/video.mp4",
  "thumbnail": "https://example.com/thumb.jpg",
  "mimetype": "video/mp4",
  "track_source": "chatwoot",
  "track_id": "msg_123456789"
}'

POST
/send/menu
Enviar menu interativo (botões, carrosel, lista ou enquete)
Este endpoint oferece uma interface unificada para envio de quatro tipos principais de mensagens interativas:

Botões: Para ações rápidas e diretas
Carrosel de Botões: Para uma lista horizontal de botões com imagens
Listas: Para menus organizados em seções
Enquetes: Para coleta de opiniões e votações
Suporte a campos de rastreamento: Este endpoint também suporta track_source e track_id documentados na tag "Enviar Mensagem".

Estrutura Base do Payload
Todas as requisições seguem esta estrutura base:

{
  "number": "5511999999999",
  "type": "button|list|poll|carousel",
  "text": "Texto principal da mensagem",
  "choices": ["opções baseadas no tipo escolhido"],
  "footerText": "Texto do rodapé (opcional para botões e listas)",
  "listButton": "Texto do botão (para listas)",
  "selectableCount": "Número de opções selecionáveis (apenas para enquetes)"
}
Tipos de Mensagens Interativas
1. Botões (type: "button")
Cria botões interativos com diferentes funcionalidades de ação.

Campos Específicos
footerText: Texto opcional exibido abaixo da mensagem principal
choices: Array de opções que serão convertidas em botões
Formatos de Botões
Cada botão pode ser configurado usando | (pipe) ou \n (quebra de linha) como separadores:

Botão de Resposta:

"texto|id" ou
"texto\nid" ou
"texto" (ID será igual ao texto)
Botão de Cópia:

"texto|copy:código" ou
"texto\ncopy:código"
Botão de Chamada:

"texto|call:+5511999999999" ou
"texto\ncall:+5511999999999"
Botão de URL:

"texto|https://exemplo.com" ou
"texto|url:https://exemplo.com"
Botões com Imagem
Para adicionar uma imagem aos botões, use o campo imageButton no payload:

Exemplo com Imagem
{
  "number": "5511999999999",
  "type": "button",
  "text": "Escolha um produto:",
  "imageButton": "https://exemplo.com/produto1.jpg",
  "choices": [
    "Produto A|prod_a",
    "Mais Info|https://exemplo.com/produto-a",
    "Produto B|prod_b",
    "Ligar|call:+5511999999999"
  ],
  "footerText": "Produtos em destaque"
}
Suporte: O campo imageButton aceita URLs ou imagens em base64.

Exemplo Completo
{
  "number": "5511999999999",
  "type": "button",
  "text": "Como podemos ajudar?",
  "choices": [
    "Suporte Técnico|suporte",
    "Fazer Pedido|pedido",
    "Nosso Site|https://exemplo.com",
    "Falar Conosco|call:+5511999999999"
  ],
  "footerText": "Escolha uma das opções abaixo"
}
Limitações e Compatibilidade
Importante: Ao combinar botões de resposta com outros tipos (call, url, copy) na mesma mensagem, será exibido o aviso: "Não é possível exibir esta mensagem no WhatsApp Web. Abra o WhatsApp no seu celular para visualizá-la."

2. Listas (type: "list")
Cria menus organizados em seções com itens selecionáveis.

Campos Específicos
listButton: Texto do botão que abre a lista
footerText: Texto opcional do rodapé
choices: Array com seções e itens da lista
Formato das Choices
"[Título da Seção]": Inicia uma nova seção
"texto|id|descrição": Item da lista com:
texto: Label do item
id: Identificador único, opcional
descrição: Texto descritivo adicional e opcional
Exemplo Completo
{
  "number": "5511999999999",
  "type": "list",
  "text": "Catálogo de Produtos",
  "choices": [
    "[Eletrônicos]",
    "Smartphones|phones|Últimos lançamentos",
    "Notebooks|notes|Modelos 2024",
    "[Acessórios]",
    "Fones|fones|Bluetooth e com fio",
    "Capas|cases|Proteção para seu device"
  ],
  "listButton": "Ver Catálogo",
  "footerText": "Preços sujeitos a alteração"
}
3. Enquetes (type: "poll")
Cria enquetes interativas para votação.

Campos Específicos
selectableCount: Número de opções que podem ser selecionadas (padrão: 1)
choices: Array simples com as opções de voto
Exemplo Completo
{
  "number": "5511999999999",
  "type": "poll",
  "text": "Qual horário prefere para atendimento?",
  "choices": [
    "Manhã (8h-12h)",
    "Tarde (13h-17h)",
    "Noite (18h-22h)"
  ],
  "selectableCount": 1
}
4. Carousel (type: "carousel")
Cria um carrossel de cartões com imagens e botões interativos.

Campos Específicos
choices: Array com elementos do carrossel na seguinte ordem:
[Texto do cartão]: Texto do cartão entre colchetes
{URL ou base64 da imagem}: Imagem entre chaves
Botões do cartão (um por linha):
"texto|copy:código" para botão de copiar
"texto|https://url" para botão de link
"texto|call:+número" para botão de ligação
Exemplo Completo
{
  "number": "5511999999999",
  "type": "carousel",
  "text": "Conheça nossos produtos",
  "choices": [
    "[Smartphone XYZ\nO mais avançado smartphone da linha]",
    "{https://exemplo.com/produto1.jpg}",
    "Copiar Código|copy:PROD123",
    "Ver no Site|https://exemplo.com/xyz",
    "Fale Conosco|call:+5511999999999",
    "[Notebook ABC\nO notebook ideal para profissionais]",
    "{https://exemplo.com/produto2.jpg}",
    "Copiar Código|copy:NOTE456",
    "Comprar Online|https://exemplo.com/abc",
    "Suporte|call:+5511988888888"
  ]
}
Nota: Criamos outro endpoint para carrossel: /send/carousel, funciona da mesma forma, mas com outro formato de payload. Veja o que é mais fácil para você.

Termos de uso
Os recursos de botões interativos e listas podem ser descontinuados a qualquer momento sem aviso prévio. Não nos responsabilizamos por quaisquer alterações ou indisponibilidade destes recursos.

Alternativas e Compatibilidade
Considerando a natureza dinâmica destes recursos, nosso endpoint foi projetado para facilitar a migração entre diferentes tipos de mensagens (botões, listas e enquetes).

Recomendamos criar seus fluxos de forma flexível, preparados para alternar entre os diferentes tipos.

Em caso de descontinuidade de algum recurso, você poderá facilmente migrar para outro tipo de mensagem apenas alterando o campo "type" no payload, mantendo a mesma estrutura de choices.

Request
Body
number
string
required
Número do destinatário (formato internacional)

Example: "5511999999999"

type
string
required
Tipo do menu (button, list, poll, carousel)

Example: "list"

text
string
required
Texto principal (aceita placeholders)

Example: "Escolha uma opção:"

footerText
string
Texto do rodapé (opcional)

Example: "Menu de serviços"

listButton
string
Texto do botão principal

Example: "Ver opções"

selectableCount
integer
Número máximo de opções selecionáveis (para enquetes)

Example: 1

choices
array
required
Lista de opções. Use [Título] para seções em listas

Example: ["[Eletrônicos]","Smartphones|phones|Últimos lançamentos","Notebooks|notes|Modelos 2024","[Acessórios]","Fones|fones|Bluetooth e com fio","Capas|cases|Proteção para seu device"]

imageButton
string
URL da imagem para botões (recomendado para type: button)

Example: "https://exemplo.com/imagem-botao.jpg"

replyid
string
ID da mensagem para responder

Example: "3EB0538DA65A59F6D8A251"

mentions
string
Números para mencionar (separados por vírgula)

Example: "5511999999999,5511888888888"

readchat
boolean
Marca conversa como lida após envio

Example: true

readmessages
boolean
Marca últimas mensagens recebidas como lidas

Example: true

delay
integer
Atraso em milissegundos antes do envio, durante o atraso apacerá 'Digitando...'

Example: 1000

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Menu enviado com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Menu sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Missing required fields or invalid menu type"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

429
Limite de requisições excedido

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send menu"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/menu \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "type": "list",
  "text": "Escolha uma opção:",
  "footerText": "Menu de serviços",
  "listButton": "Ver opções",
  "selectableCount": 1,
  "choices": [
    "[Eletrônicos]",
    "Smartphones|phones|Últimos lançamentos",
    "Notebooks|notes|Modelos 2024",
    "[Acessórios]",
    "Fones|fones|Bluetooth e com fio",
    "Capas|cases|Proteção para seu device"
  ],
  "imageButton": "https://exemplo.com/imagem-botao.jpg",
  "replyid": "3EB0538DA65A59F6D8A251",
  "mentions": "5511999999999,5511888888888",
  "readchat": true,
  "readmessages": true,
  "delay": 1000,
  "track_source": "chatwoot",
  "track_id": "msg_123456789"
}'

POST
/send/carousel
Enviar carrossel de mídia com botões
Este endpoint permite enviar um carrossel com imagens e botões interativos. Funciona de maneira igual ao endpoint /send/menu com type: carousel, porém usando outro formato de payload.

Campos Comuns
Este endpoint suporta todos os campos opcionais comuns documentados na tag "Enviar Mensagem", incluindo: delay, readchat, readmessages, replyid, mentions, forward, track_source, track_id, placeholders e envio para grupos.

Estrutura do Payload
{
  "number": "5511999999999",
  "text": "Texto principal",
  "carousel": [
    {
      "text": "Texto do cartão",
      "image": "URL da imagem",
      "buttons": [
        {
          "id": "resposta1",
          "text": "Texto do botão",
          "type": "REPLY"
        }
      ]
    }
  ],
  "delay": 1000,
  "readchat": true
}
Tipos de Botões
REPLY: Botão de resposta rápida

Quando clicado, envia o valor do id como resposta ao chat
O id será o texto enviado como resposta
URL: Botão com link

Quando clicado, abre a URL especificada
O id deve conter a URL completa (ex: https://exemplo.com)
COPY: Botão para copiar texto

Quando clicado, copia o texto para a área de transferência
O id será o texto que será copiado
CALL: Botão para realizar chamada

Quando clicado, inicia uma chamada telefônica
O id deve conter o número de telefone
Exemplo de Botões
{
  "buttons": [
    {
      "id": "Sim, quero comprar!",
      "text": "Confirmar Compra",
      "type": "REPLY"
    },
    {
      "id": "https://exemplo.com/produto",
      "text": "Ver Produto",
      "type": "URL"
    },
    {
      "id": "CUPOM20",
      "text": "Copiar Cupom",
      "type": "COPY"
    },
    {
      "id": "5511999999999",
      "text": "Falar com Vendedor",
      "type": "CALL"
    }
  ]
}
Exemplo Completo de Carrossel
{
  "number": "5511999999999",
  "text": "Nossos Produtos em Destaque",
  "carousel": [
    {
      "text": "Smartphone XYZ\nO mais avançado smartphone da linha",
      "image": "https://exemplo.com/produto1.jpg",
      "buttons": [
        {
          "id": "SIM_COMPRAR_XYZ",
          "text": "Comprar Agora",
          "type": "REPLY"
        },
        {
          "id": "https://exemplo.com/xyz",
          "text": "Ver Detalhes",
          "type": "URL"
        }
      ]
    },
    {
      "text": "Cupom de Desconto\nGanhe 20% OFF em qualquer produto",
      "image": "https://exemplo.com/cupom.jpg",
      "buttons": [
        {
          "id": "DESCONTO20",
          "text": "Copiar Cupom",
          "type": "COPY"
        },
        {
          "id": "5511999999999",
          "text": "Falar com Vendedor",
          "type": "CALL"
        }
      ]
    }
  ],
  "delay": 0,
  "readchat": true
}
Request
Body
number
string
required
Número do destinatário (formato internacional)

Example: "5511999999999"

text
string
required
Texto principal da mensagem

Example: "Nossos Produtos em Destaque"

carousel
array
required
Array de cartões do carrossel

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Carrossel enviado com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Carousel sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Missing required fields or invalid card format"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send carousel"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/carousel \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "text": "Nossos Produtos em Destaque",
  "carousel": [
    {
      "text": "Smartphone XYZ\nO mais avançado smartphone da linha",
      "image": "https://exemplo.com/produto1.jpg",
      "buttons": [
        {
          "id": "buy_xyz",
          "text": "Comprar Agora",
          "type": "REPLY"
        }
      ]
    }
  ],
  "track_source": "chatwoot",
  "track_id": "msg_123456789"
}'

POST
/send/location-button
Solicitar localização do usuário
Este endpoint envia uma mensagem com um botão que solicita a localização do usuário. Quando o usuário clica no botão, o WhatsApp abre a interface para compartilhar a localização atual.

Campos Comuns
Este endpoint suporta todos os campos opcionais comuns documentados na tag "Enviar Mensagem", incluindo: delay, readchat, readmessages, replyid, mentions, forward, track_source, track_id, placeholders e envio para grupos.

Estrutura do Payload
{
  "number": "5511999999999",
  "text": "Por favor, compartilhe sua localização",
  "delay": 0,
  "readchat": true
}
Exemplo de Uso
{
  "number": "5511999999999",
  "text": "Para continuar o atendimento, clique no botão abaixo e compartilhe sua localização"
}
Nota: O botão de localização é adicionado automaticamente à mensagem

Request
Body
number
string
required
Número do destinatário (formato internacional)

Example: "5511999999999"

text
string
required
Texto da mensagem que será exibida

Example: "Por favor, compartilhe sua localização"

delay
integer
Atraso em milissegundos antes do envio

0
readchat
boolean
Se deve marcar a conversa como lida após envio

Example: true

track_source
string
Origem do rastreamento da mensagem

Example: "chatwoot"

track_id
string
ID para rastreamento da mensagem (aceita valores duplicados)

Example: "msg_123456789"

Responses

200
Localização enviada com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Location sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Missing required fields or invalid coordinates"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send location"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/location-button \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "text": "Por favor, compartilhe sua localização",
  "delay": 0,
  "readchat": true,
  "track_source": "chatwoot",
  "track_id": "msg_123456789"
}'

POST
/send/request-payment
Solicitar pagamento
Envia uma solicitação de pagamento com o botão nativo "Revisar e pagar" do WhatsApp. O fluxo suporta PIX (estático, dinâmico ou desabilitado), boleto, link de pagamento e cartão, combinando tudo em uma única mensagem interativa.

Como funciona
Define o valor em amount (BRL por padrão) e opcionalmente personaliza título, texto e nota adicional.
Por padrão exige pixKey.
O arquivo apontado por fileUrl é anexado como documento (boleto ou fatura em PDF, por exemplo).
paymentLink habilita o botão externo.
Links suportados (paymentLink)
O WhatsApp apenas aceita URLs de provedores homologados. Utilize os padrões abaixo:

Mercado Pago: mpago.la/*, mpago.li/*, mercadopago.com.br/*
PicPay: picpay.me/*, link.picpay.com/*, app.picpay.com/user/*
Stone: payment-link.stone.com.br/*
Cielo: cielolink.com.br/*, cielo.mystore.com.br/*
Getnet: pag.getnet.com.br/*
Rede: userede.com.br/pagamentos/*
SumUp: pay.sumup.com/b2c/*
Pagar.me: payment-link.pagar.me/*
TON: payment-link.ton.com.br/*
PagBank: sacola.pagbank.com.br/*, pag.ae/*
Nubank: nubank.com.br/cobrar/*, checkout.nubank.com.br/*
InfinitePay: pay.infinitepay.io/*
VTEX: *.vtexpayments.com/*, *.myvtex.com/*
EBANX: payment.ebanx.com/*
Asaas: asaas.com/*
Vindi: pagar.vindi.com.br/*
Adyen: eu.adyen.link/*
EFI (Gerencianet): sejaefi.link/*, pagamento.sejaefi.com.br/*
SafraPay: portal.safrapay.com.br/*, safrapay.aditum.com.br/*
Stripe: buy.stripe.com/*
Hotmart: pay.hotmart.com/*
Campos comuns
Este endpoint também suporta os campos padrão: delay, readchat, readmessages, replyid, mentions, track_source, track_id e async.

Request
Body
number
string
required
Número do destinatário (DDD + número, formato internacional)

Example: "5511999999999"

title
string
Título que aparece no cabeçalho do fluxo

Example: "Detalhes do pedido"

text
string
Mensagem exibida no corpo do fluxo

Example: "Pedido #123 pronto para pagamento"

footer
string
Texto do rodapé da mensagem

Example: "Loja Exemplo"

itemName
string
Nome do item principal listado no fluxo

Example: "Assinatura Plano Ouro"

invoiceNumber
string
Identificador ou número da fatura

Example: "PED-123"

amount
number
required
Valor da cobrança (em BRL por padrão)

Example: 199.9

pixKey
string
Chave PIX estático (CPF/CNPJ/telefone/email/EVP)

Example: "123e4567-e89b-12d3-a456-426614174000"

pixType
string
Tipo da chave PIX (CPF, CNPJ, PHONE, EMAIL, EVP). Padrão EVP

Example: "EVP"

pixName
string
Nome do recebedor exibido no fluxo (padrão usa o nome do perfil da instância)

Example: "Loja Exemplo"

paymentLink
string
URL externa para checkout (somente dominios homologados; veja lista acima)

Example: "https://pagamentos.exemplo.com/checkout/abc"

fileUrl
string
URL ou caminho (base64) do documento a ser anexado (ex.: boleto PDF)

Example: "https://cdn.exemplo.com/boleto-123.pdf"

fileName
string
Nome do arquivo exibido no WhatsApp ao anexar fileUrl

Example: "boleto-123.pdf"

boletoCode
string
Linha digitável do boleto (habilita o método boleto automaticamente)

Example: "34191.79001 01043.510047 91020.150008 5 91070026000"

replyid
string
ID da mensagem que será respondida

mentions
string
Números mencionados separados por vírgula

delay
integer
Atraso em milissegundos antes do envio (exibe "digitando..." no WhatsApp)

readchat
boolean
Marca o chat como lido após enviar a mensagem

readmessages
boolean
Marca mensagens recentes como lidas após o envio

async
boolean
Enfileira o envio para processamento assíncrono

track_source
string
Origem de rastreamento (ex.: chatwoot, crm-interno)

track_id
string
Identificador de rastreamento (aceita valores duplicados)

Responses

200
Solicitação de pagamento enviada com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "Payment request sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Missing pixKey or pixCode"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send payment request"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/request-payment \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "amount": 199.9,
  "text": "Pedido #123 pronto para pagamento",
  "pixKey": "123e4567-e89b-12d3-a456-426614174000",
  "pixType": "EVP"
}'

POST
/send/pix-button
Enviar botão PIX
Envia um botão nativo do WhatsApp que abre para pagamento PIX com a chave informada. O usuário visualiza o detalhe do recebedor, nome e chave.

Regras principais
pixType aceita: CPF, CNPJ, PHONE, EMAIL, EVP (case insensitive)
pixName padrão: "Pix" quando não informado - nome de quem recebe o pagamento
Campos comuns
Este endpoint herda os campos opcionais padronizados da tag "Enviar Mensagem": delay, readchat, readmessages, replyid, mentions, track_source, track_id e async.

Exemplo de payload
{
  "number": "5511999999999",
  "pixType": "EVP",
  "pixKey": "123e4567-e89b-12d3-a456-426614174000",
  "pixName": "Loja Exemplo"
}
Request
Body
number
string
required
Número do destinatário (DDD + número, formato internacional)

Example: "5511999999999"

pixType
string
required
Tipo da chave PIX. Valores aceitos: CPF, CNPJ, PHONE, EMAIL ou EVP

Example: "EVP"

pixKey
string
required
Valor da chave PIX (CPF/CNPJ/telefone/email/EVP)

Example: "123e4567-e89b-12d3-a456-426614174000"

pixName
string
Nome exibido como recebedor do PIX (padrão "Pix" se vazio)

Example: "Loja Exemplo"

async
boolean
Enfileira o envio para processamento assíncrono

delay
integer
Atraso em milissegundos antes do envio (exibe "digitando..." no WhatsApp)

readchat
boolean
Marca o chat como lido após enviar a mensagem

readmessages
boolean
Marca mensagens recentes como lidas após o envio

replyid
string
ID da mensagem que será respondida

mentions
string
Lista de números mencionados separados por vírgula

track_source
string
Origem de rastreamento (ex.: chatwoot, crm-interno)

track_id
string
Identificador de rastreamento (aceita valores duplicados)

Responses

200
Botão PIX enviado com sucesso
Response Example

{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "messageid": "string",
  "chatid": "string",
  "fromMe": false,
  "isGroup": false,
  "messageType": "text",
  "messageTimestamp": 0,
  "edited": "string",
  "quoted": "string",
  "reaction": "string",
  "sender": "string",
  "senderName": "string",
  "source": "ios",
  "status": "pending",
  "text": "string",
  "vote": "string",
  "buttonOrListid": "string",
  "convertOptions": "string",
  "fileURL": "https://example.com",
  "content": "string",
  "owner": "string",
  "track_source": "string",
  "track_id": "string",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-01-15T10:30:00Z",
  "ai_metadata": {
    "agent_id": "string",
    "request": {
      "messages": [
        "item"
      ],
      "tools": [
        "item"
      ],
      "options": {
        "model": "string",
        "temperature": 0,
        "maxTokens": 0,
        "topP": 0,
        "frequencyPenalty": 0,
        "presencePenalty": 0
      }
    },
    "response": {
      "choices": [
        "item"
      ],
      "toolResults": [
        "item"
      ],
      "error": "string"
    }
  },
  "response": {
    "status": "success",
    "message": "PIX button sent successfully"
  }
}

400
Requisição inválida
Response Example

{
  "error": "Invalid keyType. Allowed: CPF, CNPJ, PHONE, EMAIL, EVP"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to send PIX button"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/send/pix-button \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "pixType": "EVP",
  "pixKey": "123e4567-e89b-12d3-a456-426614174000",
  "pixName": "Loja Exemplo"
}'

POST
/message/download
Baixar arquivo de uma mensagem
Baixa o arquivo associado a uma mensagem de mídia (imagem, vídeo, áudio, documento ou sticker).

Parâmetros
id (string, obrigatório): ID da mensagem
return_base64 (boolean, default: false): Retorna arquivo em base64
generate_mp3 (boolean, default: true): Para áudios, define formato de retorno
true: Retorna MP3
false: Retorna OGG
return_link (boolean, default: true): Retorna URL pública do arquivo
transcribe (boolean, default: false): Transcreve áudios para texto
openai_apikey (string, opcional): Chave OpenAI para transcrição
Se não informada, usa a chave salva na instância
Se informada, atualiza e salva na instância para próximas chamadas
download_quoted (boolean, default: false): Baixa mídia da mensagem citada
Útil para baixar conteúdo original de status do WhatsApp
Quando uma mensagem é resposta a um status, permite baixar a mídia do status original
Contextualização: Ao baixar a mídia citada, você identifica o contexto da conversa
Exemplo: Se alguém responde a uma promoção, baixando a mídia você saberá que a pergunta é sobre aquela promoção específica
Exemplos
Baixar áudio como MP3:
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "generate_mp3": true
}
Transcrever áudio:
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "transcribe": true
}
Apenas base64 (sem salvar):
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "return_base64": true,
  "return_link": false
}
Baixar mídia de status (mensagem citada):
{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "download_quoted": true
}
Útil quando o cliente responde a uma promoção/status - você baixa a mídia original para entender sobre qual produto/oferta ele está perguntando.

Resposta
{
  "fileURL": "https://api.exemplo.com/files/arquivo.mp3",
  "mimetype": "audio/mpeg",
  "base64Data": "UklGRkj...",
  "transcription": "Texto transcrito"
}
Nota:

Por padrão, se não definido o contrário:
áudios são retornados como MP3.
E todos os pedidos de download são retornados com URL pública.
Transcrição requer chave OpenAI válida. A chave pode ser configurada uma vez na instância e será reutilizada automaticamente.
Request
Body
id
string
required
ID da mensagem contendo o arquivo

Example: "7EB0F01D7244B421048F0706368376E0"

return_base64
boolean
Se verdadeiro, retorna o conteúdo em base64

generate_mp3
boolean
Para áudios, define formato de retorno (true=MP3, false=OGG)

return_link
boolean
Salva e retorna URL pública do arquivo

transcribe
boolean
Se verdadeiro, transcreve áudios para texto

openai_apikey
string
Chave da API OpenAI para transcrição (opcional)

Example: "sk-..."

download_quoted
boolean
Se verdadeiro, baixa mídia da mensagem citada ao invés da mensagem principal

Responses

200
Successful file download
Response Example

{
  "fileURL": "https://api.exemplo.com/files/arquivo.mp3",
  "mimetype": "audio/mpeg",
  "base64Data": "UklGRkj...",
  "transcription": "Texto transcrito"
}

400
Bad Request
Response Example

{
  "error": "Unsupported media type or no media found in message"
}

401
Unauthorized
Response Example

{
  "error": "Invalid token"
}

404
Not Found

500
Internal Server Error
Response Example

{
  "error": "Failed to download media"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/message/download \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "id": "7EB0F01D7244B421048F0706368376E0",
  "return_base64": false,
  "generate_mp3": false,
  "return_link": false,
  "transcribe": false,
  "openai_apikey": "sk-...",
  "download_quoted": false
}'

POST
/message/find
Buscar mensagens em um chat
Busca mensagens com múltiplos filtros disponíveis. Este endpoint permite:

Busca por ID específico: Use id para encontrar uma mensagem exata
Filtrar por chat: Use chatid para mensagens de uma conversa específica
Filtrar por rastreamento: Use track_source e track_id para mensagens com dados de tracking
Limitar resultados: Use limit para controlar quantas mensagens retornar
Ordenação: Resultados ordenados por data (mais recentes primeiro)
Request
Body
id
string
ID específico da mensagem para busca exata

Example: "user123:r3EB0538"

chatid
string
ID do chat no formato internacional

Example: "5511999999999@s.whatsapp.net"

track_source
string
Origem do rastreamento para filtrar mensagens

Example: "chatwoot"

track_id
string
ID de rastreamento para filtrar mensagens

Example: "msg_123456789"

limit
integer
Numero maximo de mensagens a retornar (padrao 100)

Example: 20

offset
integer
Deslocamento para paginacao (0 retorna as mensagens mais recentes)

Responses

200
Lista de mensagens encontradas com metadados de paginacao
Response Example

{
  "returnedMessages": 0,
  "messages": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "messageid": "string",
      "chatid": "string",
      "fromMe": false,
      "isGroup": false,
      "messageType": "text",
      "messageTimestamp": 0,
      "edited": "string",
      "quoted": "string",
      "reaction": "string",
      "sender": "string",
      "senderName": "string",
      "source": "ios",
      "status": "pending",
      "text": "string",
      "vote": "string",
      "buttonOrListid": "string",
      "convertOptions": "string",
      "fileURL": "https://example.com",
      "content": "string",
      "owner": "string",
      "track_source": "string",
      "track_id": "string",
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z",
      "ai_metadata": {
        "agent_id": "string",
        "request": {
          "messages": [
            "item"
          ],
          "tools": [
            "item"
          ],
          "options": {
            "model": "string",
            "temperature": 0,
            "maxTokens": 0,
            "topP": 0,
            "frequencyPenalty": 0,
            "presencePenalty": 0
          }
        },
        "response": {
          "choices": [
            "item"
          ],
          "toolResults": [
            "item"
          ],
          "error": "string"
        }
      }
    }
  ],
  "limit": 0,
  "offset": 0,
  "nextOffset": 0,
  "hasMore": false
}

400
Parametros invalidos
No response body for this status code.

401
Token invalido ou expirado
No response body for this status code.

404
Chat nao encontrado

500
Erro interno do servidor
No response body for this statu

curl --request POST \
  --url https://dnxplataforma.uazapi.com/message/find \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "chatid": "5511999999999@s.whatsapp.net",
  "limit": 10
}'

POST
/message/markread
Marcar mensagens como lidas
Marca uma ou mais mensagens como lidas. Este endpoint permite:

Marcar múltiplas mensagens como lidas de uma vez
Atualizar o status de leitura no WhatsApp
Sincronizar o status de leitura entre dispositivos
Exemplo de requisição básica:

{
  "id": [
    "62AD1AD844E518180227BF68DA7ED710",
    "ECB9DE48EB41F77BFA8491BFA8D6EF9B"  
  ]
}
Exemplo de resposta:

{
  "success": true,
  "message": "Messages marked as read",
  "markedMessages": [
    {
      "id": "62AD1AD844E518180227BF68DA7ED710",
      "timestamp": 1672531200000
    },
    {
      "id": "ECB9DE48EB41F77BFA8491BFA8D6EF9B",
      "timestamp": 1672531300000
    }
  ]
}
Parâmetros disponíveis:

id: Lista de IDs das mensagens a serem marcadas como lidas
Erros comuns:

401: Token inválido ou expirado
400: Lista de IDs vazia ou inválida
404: Uma ou mais mensagens não encontradas
500: Erro ao marcar mensagens como lidas
Request
Body
id
array
required
Lista de IDs das mensagens a serem marcadas como lidas

Example: ["62AD1AD844E518180227BF68DA7ED710","ECB9DE48EB41F77BFA8491BFA8D6EF9B"]

Responses

200
Messages successfully marked as read
Response Example

{
  "results": [
    {
      "message_id": "62AD1AD844E518180227BF68DA7ED710",
      "status": "success"
    },
    {
      "message_id": "ECB9DE48EB41F77BFA8491BFA8D6EF9B",
      "status": "error",
      "error": "Message not found"
    }
  ]
}

400
Invalid request payload or missing required fields
Response Example

{
  "error": "Missing Id in Payload"
}

401
Unauthorized - invalid or missing token
No response body for this status code.

500
Server error while processing the request
No response body for this sta

curl --request POST \
  --url https://dnxplataforma.uazapi.com/message/markread \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "id": [
    "62AD1AD844E518180227BF68DA7ED710",
    "ECB9DE48EB41F77BFA8491BFA8D6EF9B"
  ]
}'

POST
/message/react
Enviar reação a uma mensagem
Envia uma reação (emoji) a uma mensagem específica. Este endpoint permite:

Adicionar ou remover reações em mensagens

Usar qualquer emoji Unicode válido

Reagir a mensagens em chats individuais ou grupos

Remover reações existentes

Verificar o status da reação enviada

Tipos de reações suportados:

Qualquer emoji Unicode válido (👍, ❤️, 😂, etc)

String vazia para remover reação

Exemplo de requisição básica:


{
  "number": "5511999999999@s.whatsapp.net",
  "text": "👍",
  "id": "3EB0538DA65A59F6D8A251"
}

Exemplo de requisição para remover reação:


{
  "number": "5511999999999@s.whatsapp.net",
  "text": "",
  "id": "3EB0538DA65A59F6D8A251"
}

Exemplo de resposta:


{
  "success": true,
  "message": "Reaction sent",
  "reaction": {
    "id": "3EB0538DA65A59F6D8A251",
    "emoji": "👍",
    "timestamp": 1672531200000,
    "status": "sent"
  }
}

Exemplo de resposta ao remover reação:


{
  "success": true,
  "message": "Reaction removed",
  "reaction": {
    "id": "3EB0538DA65A59F6D8A251",
    "emoji": null,
    "timestamp": 1672531200000,
    "status": "removed"
  }
}

Parâmetros disponíveis:

number: Número do chat no formato internacional (ex: 5511999999999@s.whatsapp.net)

text: Emoji Unicode da reação (ou string vazia para remover reação)

id: ID da mensagem que receberá a reação

Erros comuns:

401: Token inválido ou expirado

400: Número inválido ou emoji não suportado

404: Mensagem não encontrada

500: Erro ao enviar reação

Limitações:

Só é possível reagir a mensagens enviadas por outros usuários

Não é possível reagir a mensagens antigas (mais de 7 dias)

O mesmo usuário só pode ter uma reação ativa por mensagem

Request
Body
number
string
required
Número do chat no formato internacional

Example: "5511999999999@s.whatsapp.net"

text
string
required
Emoji Unicode da reação (ou string vazia para remover reação)

Example: "👍"

id
string
required
ID da mensagem que receberá a reação

Example: "3EB0538DA65A59F6D8A251"

Responses

200
Reação enviada com sucesso
Response Example

{
  "id": "owner:generated_message_id",
  "messageid": "generated_message_id",
  "content": {},
  "messageTimestamp": 1672531200000,
  "messageType": "reaction",
  "status": "Pending",
  "owner": "instance_owner"
}

400
Erro nos dados da requisição
Response Example

{
  "error": "Missing Id in Payload"
}

401
Não autorizado
Response Example

{
  "error": "No session"
}

404
Mensagem não encontrada

500
Erro interno do servidor
Response Example

{
  "error": "Error sending message"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/message/react \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999@s.whatsapp.net",
  "text": "👍",
  "id": "3EB0538DA65A59F6D8A251"
}'

POST
/message/delete
Apagar Mensagem Para Todos
Apaga uma mensagem para todos os participantes da conversa.

Funcionalidades:
Apaga mensagens em conversas individuais ou grupos
Funciona com mensagens enviadas pelo usuário ou recebidas
Atualiza o status no banco de dados
Envia webhook de atualização
Notas Técnicas:

O ID da mensagem pode ser fornecido em dois formatos:
ID completo (contém ":"): usado diretamente
ID curto: concatenado com o owner para busca
Gera evento webhook do tipo "messages_update"
Atualiza o status da mensagem para "Deleted"
Request
Body
id
string
required
ID da mensagem a ser apagada

Responses

200
Mensagem apagada com sucesso
Response Example

{
  "timestamp": "2024-01-15T10:30:00Z",
  "id": "string"
}

400
Payload inválido ou ID de chat/sender inválido
Response Example

{
  "error": "invalid payload"
}

401
Token não fornecido
Response Example

{
  "error": "Unauthorized"
}

404
Mensagem não encontrada

500
Erro interno do servidor ou sessão não iniciada
Response Example

{
  "error": "No session"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/message/delete \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "id": "string"
}'

POST
/message/edit
Edita uma mensagem enviada
Edita o conteúdo de uma mensagem já enviada usando a funcionalidade nativa do WhatsApp.

O endpoint realiza:

Busca a mensagem original no banco de dados usando o ID fornecido
Edita o conteúdo da mensagem para o novo texto no WhatsApp
Gera um novo ID para a mensagem editada
Retorna objeto de mensagem completo seguindo o padrão da API
Dispara eventos SSE/Webhook automaticamente
Importante:

Só é possível editar mensagens enviadas pela própria instância
A mensagem deve existir no banco de dados
O ID pode ser fornecido no formato completo (owner:messageid) ou apenas messageid
A mensagem deve estar dentro do prazo permitido pelo WhatsApp para edição
Request
Body
id
string
required
ID único da mensagem que será editada (formato owner:messageid ou apenas messageid)

Example: "3A12345678901234567890123456789012"

text
string
required
Novo conteúdo de texto da mensagem

Example: "Texto editado da mensagem"

Responses

200
Mensagem editada com sucesso
Response Example

{
  "id": "5511999999999:3A12345678901234567890123456789012",
  "messageid": "3A12345678901234567890123456789012",
  "content": "Texto editado da mensagem",
  "messageTimestamp": 1704067200000,
  "messageType": "text",
  "status": "Pending",
  "owner": "5511999999999"
}

400
Dados inválidos na requisição
Response Example

{
  "error": "Invalid payload"
}

401
Sem sessão ativa
Response Example

{
  "error": "No session"
}

404
Mensagem não encontrada

500
Erro interno do servidor
Response Example

{
  "error": "Error fetching message from database"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/message/edit \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "id": "3A12345678901234567890123456789012",
  "text": "Texto editado da mensagem"
}'

POST
/chat/delete
Deleta chat
Deleta um chat e/ou suas mensagens do WhatsApp e/ou banco de dados. Você pode escolher deletar:

Apenas do WhatsApp
Apenas do banco de dados
Apenas as mensagens do banco de dados
Qualquer combinação das opções acima
Request
Body
number
string
required
Número do chat no formato internacional. Para grupos use o ID completo do grupo.

Example: "5511999999999"

deleteChatDB
boolean
Se true, deleta o chat do banco de dados

Example: true

deleteMessagesDB
boolean
Se true, deleta todas as mensagens do chat do banco de dados

Example: true

deleteChatWhatsApp
boolean
Se true, deleta o chat do WhatsApp

Example: true

Responses

200
Operação realizada com sucesso
Response Example

{
  "response": "Chat deletion process completed",
  "actions": [
    "Chat deleted from WhatsApp",
    "Chat deleted from database",
    "Messages associated with chat deleted from database: 42"
  ],
  "errors": [
    "Error deleting chat from WhatsApp: connection timeout"
  ]
}

400
Erro nos parâmetros da requisição
Response Example

{
  "error": "Missing number in payload"
}

401
Token inválido ou não fornecido
No response body for this status code.

404
Chat não encontrado

500
Erro interno do servidor
No response body for this status cod

curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/delete \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "deleteChatDB": true,
  "deleteMessagesDB": true,
  "deleteChatWhatsApp": true
}'
POST
/chat/archive
Arquivar/desarquivar chat
Altera o estado de arquivamento de um chat do WhatsApp.

Quando arquivado, o chat é movido para a seção de arquivados no WhatsApp
A ação é sincronizada entre todos os dispositivos conectados
Não afeta as mensagens ou o conteúdo do chat
Request
Body
number
string
required
Número do telefone (formato E.164) ou ID do grupo

Example: "5511999999999"

archive
boolean
required
true para arquivar, false para desarquivar

Example: true

Responses

200
Chat arquivado/desarquivado com sucesso
Response Example

{
  "response": "Chat updated successfully"
}

400
Dados da requisição inválidos
Response Example

{
  "error": "Invalid phone number format"
}

401
Token de autenticação ausente ou inválido
No response body for this status code.

500
Erro ao executar a operação
Response Example

{
  "error": "Error archiving chat"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/archive \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "archive": true
}'

POST
/chat/read
Marcar chat como lido/não lido
Atualiza o status de leitura de um chat no WhatsApp.

Quando um chat é marcado como lido:

O contador de mensagens não lidas é zerado
O indicador visual de mensagens não lidas é removido
O remetente recebe confirmação de leitura (se ativado)
Quando marcado como não lido:

O chat aparece como pendente de leitura
Não afeta as confirmações de leitura já enviadas
Request
Body
number
string
required
Identificador do chat no formato:

Para usuários: [número]@s.whatsapp.net (ex: 5511999999999@s.whatsapp.net)
Para grupos: [id-grupo]@g.us (ex: 123456789-987654321@g.us)
Example: "5511999999999@s.whatsapp.net"

read
boolean
required
true: marca o chat como lido
false: marca o chat como não lido
Responses

200
Status de leitura atualizado com sucesso
Response Example

{
  "response": "Chat read status updated successfully"
}

401
Token de autenticação ausente ou inválido
No response body for this status code.

404
Chat não encontrado

500
Erro ao atualizar status de leitura
No response body for this status code

curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/read \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999@s.whatsapp.net",
  "read": false
}'

POST
/chat/mute
Silenciar chat
Silencia notificações de um chat por um período específico. As opções de silenciamento são:

0 - Remove o silenciamento
8 - Silencia por 8 horas
168 - Silencia por 1 semana (168 horas)
-1 - Silencia permanentemente
Request
Body
number
string
required
ID do chat no formato 123456789@s.whatsapp.net ou 123456789-123456@g.us

Example: "5511999999999@s.whatsapp.net"

muteEndTime
integer
required
Duração do silenciamento:

0 = Remove silenciamento
8 = Silencia por 8 horas
168 = Silencia por 1 semana
-1 = Silencia permanentemente
Example: 8

Responses

200
Chat silenciado com sucesso
Response Example

{
  "response": "Chat mute settings updated successfully"
}

400
Duração inválida ou formato de número incorreto
No response body for this status code.

401
Token inválido ou ausente
No response body for this status code.

404
Chat não encontrado

curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/mute \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999@s.whatsapp.net",
  "muteEndTime": 8
}'

POST
/chat/pin
Fixar/desafixar chat
Fixa ou desafixa um chat no topo da lista de conversas. Chats fixados permanecem no topo mesmo quando novas mensagens são recebidas em outros chats.

Request
Body
number
string
required
Número do chat no formato internacional completo (ex: "5511999999999") ou ID do grupo (ex: "123456789-123456@g.us")

Example: "5511999999999"

pin
boolean
required
Define se o chat deve ser fixado (true) ou desafixado (false)

Example: true

Responses

200
Chat fixado/desafixado com sucesso
Response Example

{
  "response": "Chat pinned"
}

400
Erro na requisição
Response Example

{
  "error": "Could not parse phone"
}

401
Não autorizado
Response Example

{
  "error": "Invalid token"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/pin \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "pin": true
}'

POST
/chat/find
Busca chats com filtros
Busca chats com diversos filtros e ordenação. Suporta filtros em todos os campos do chat, paginação e ordenação customizada.

Operadores de filtro:

~ : LIKE (contém)
!~ : NOT LIKE (não contém)
!= : diferente
>= : maior ou igual
> : maior que
<= : menor ou igual
< : menor que
Sem operador: LIKE (contém)
Request
Body
operator
string
Operador lógico entre os filtros

sort
string
Campo para ordenação (+/-campo). Ex -wa_lastMsgTimestamp

limit
integer
Limite de resultados por página

offset
integer
Offset para paginação

wa_fastid
string
wa_chatid
string
wa_archived
boolean
wa_contactName
string
wa_name
string
name
string
wa_isBlocked
boolean
wa_isGroup
boolean
wa_isGroup_admin
boolean
wa_isGroup_announce
boolean
wa_isGroup_member
boolean
wa_isPinned
boolean
wa_label
string
lead_tags
string
lead_isTicketOpen
boolean
lead_assignedAttendant_id
string
lead_status
string
Responses

200
Lista de chats encontrados
Response Example

{
  "chats": [
    {
      "id": "string",
      "wa_fastid": "string",
      "wa_chatid": "string",
      "wa_archived": false,
      "wa_contactName": "string",
      "wa_name": "string",
      "name": "string",
      "image": "string",
      "imagePreview": "string",
      "wa_ephemeralExpiration": 0,
      "wa_isBlocked": false,
      "wa_isGroup": false,
      "wa_isGroup_admin": false,
      "wa_isGroup_announce": false,
      "wa_isGroup_community": false,
      "wa_isGroup_member": false,
      "wa_isPinned": false,
      "wa_label": "string",
      "wa_lastMessageTextVote": "string",
      "wa_lastMessageType": "string",
      "wa_lastMsgTimestamp": 0,
      "wa_lastMessageSender": "string",
      "wa_muteEndTime": 0,
      "owner": "string",
      "wa_unreadCount": 0,
      "phone": "string",
      "wa_common_groups": "Grupo Família(120363123456789012@g.us),Trabalho(987654321098765432@g.us)",
      "lead_name": "string",
      "lead_fullName": "string",
      "lead_email": "string",
      "lead_personalid": "string",
      "lead_status": "string",
      "lead_tags": "string",
      "lead_notes": "string",
      "lead_isTicketOpen": false,
      "lead_assignedAttendant_id": "string",
      "lead_kanbanOrder": 0,
      "lead_field01": "string",
      "lead_field02": "string",
      "lead_field03": "string",
      "lead_field04": "string",
      "lead_field05": "string",
      "lead_field06": "string",
      "lead_field07": "string",
      "lead_field08": "string",
      "lead_field09": "string",
      "lead_field10": "string",
      "lead_field11": "string",
      "lead_field12": "string",
      "lead_field13": "string",
      "lead_field14": "string",
      "lead_field15": "string",
      "lead_field16": "string",
      "lead_field17": "string",
      "lead_field18": "string",
      "lead_field19": "string",
      "lead_field20": "string",
      "chatbot_agentResetMemoryAt": 0,
      "chatbot_lastTrigger_id": "string",
      "chatbot_lastTriggerAt": 0,
      "chatbot_disableUntil": 0,
      "created": "string",
      "updated": "string"
    }
  ],
  "totalChatsStats": {},
  "pagination": {
    "totalRecords": 0,
    "pageSize": 0,
    "currentPage": 0,
    "totalPages": 0
  }
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/find \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "operator": "AND",
  "sort": "-wa_lastMsgTimestamp",
  "limit": 50,
  "offset": 0,
  "wa_isGroup": true,
  "lead_status": "~novo",
  "wa_label": "~importante"
}'

GET
/contacts
Retorna lista de contatos do WhatsApp
Retorna a lista de contatos salvos na agenda do celular e que estão no WhatsApp.

O endpoint realiza:

Busca todos os contatos armazenados
Retorna dados formatados incluindo JID e informações de nome
Responses

200
Lista de contatos retornada com sucesso
Response Example

[
  {
    "jid": "5511999999999@s.whatsapp.net",
    "contactName": "João Silva",
    "contact_FirstName": "João"
  }
]

401
Sem sessão ativa
Response Example

{
  "error": "No session"
}

500
Erro interno do servidor
Response Example

{
  "error": "Internal server error"
}    

curl --request GET \
  --url https://dnxplataforma.uazapi.com/contacts \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'

  POST
/contacts/list
Listar todos os contatos com paginacao
Retorna uma lista paginada de contatos da instancia do WhatsApp. Use este endpoint (POST) para controlar pagina, tamanho e offset via corpo da requisicao. A rota GET /contacts continua disponivel para quem prefere a lista completa sem paginacao.

Request
Body
page
integer
Numero da pagina para paginacao (padrao 1)

pageSize
integer
Quantidade de resultados por pagina (padrao 100, maximo 1000)

limit
integer
Alias opcional para pageSize

offset
integer
Deslocamento base zero para paginacao; se informado recalcula a pagina

Responses

200
Lista de contatos recuperada com sucesso
Response Example

{
  "contacts": [
    {
      "jid": "5511999999999@s.whatsapp.net",
      "contact_name": "Joao Silva",
      "contact_FirstName": "Joao"
    }
  ],
  "pagination": {
    "totalRecords": 0,
    "totalDeviceContacts": 0,
    "pageSize": 0,
    "currentPage": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}

401
Token nao fornecido ou invalido
Response Example

{
  "error": "No session"
}

500
Erro interno do servidor ao recuperar contatos
Response Example

{
  "error": "string"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/contacts/list \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "page": 0,
  "pageSize": 0,
  "limit": 0,
  "offset": 0
}'

POST
/contact/add
Adiciona um contato à agenda
Adiciona um novo contato à agenda do celular.

O endpoint realiza:

Adiciona o contato à agenda usando o WhatsApp
Usa o campo 'name' tanto para o nome completo quanto para o primeiro nome
Salva as informações do contato na agenda do WhatsApp
Retorna informações do contato adicionado
Request
Body
phone
string
required
Número de telefone no formato internacional com código do país obrigatório. Para Brasil, deve começar com 55. Aceita variações com/sem símbolo +, com/sem parênteses, com/sem hífen e com/sem espaços. Também aceita formato JID do WhatsApp (@s.whatsapp.net). Não aceita contatos comerciais (@lid) nem grupos (@g.us).

name
string
required
Nome completo do contato (será usado como primeiro nome e nome completo)

Example: "João Silva"

Responses

200
Contato adicionado com sucesso
Response Example

{
  "success": true,
  "message": "Contato adicionado com sucesso",
  "contact": {
    "jid": "5511999999999@s.whatsapp.net",
    "name": "João Silva",
    "phone": "5511999999999"
  }
}

400
Dados inválidos na requisição
Response Example

{
  "error": "Número de telefone inválido"
}

401
Sem sessão ativa
Response Example

{
  "error": "No session"
}

500
Erro interno do servidor
Response Example

{
  "error": "Erro ao adicionar contato"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/contact/add \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "phone": "string",
  "name": "João Silva"
}'

POST
/contact/remove
Remove um contato da agenda
Remove um contato da agenda do celular.

O endpoint realiza:

Remove o contato da agenda usando o WhatsApp AppState
Atualiza a lista de contatos sincronizada
Retorna confirmação da remoção
Request
Body
phone
string
required
Número de telefone no formato internacional com código do país obrigatório. Para Brasil, deve começar com 55. Aceita variações com/sem símbolo +, com/sem parênteses, com/sem hífen e com/sem espaços. Também aceita formato JID do WhatsApp (@s.whatsapp.net). Não aceita contatos comerciais (@lid) nem grupos (@g.us).

Responses

200
Contato removido com sucesso
Response Example

{
  "success": true,
  "message": "Contato removido com sucesso",
  "removed_contact": {
    "jid": "5511999999999@s.whatsapp.net",
    "phone": "5511999999999"
  }
}

400
Dados inválidos na requisição
Response Example

{
  "error": "Número de telefone inválido"
}

401
Sem sessão ativa
Response Example

{
  "error": "No session"
}

404
Contato não encontrado

500
Erro interno do servidor
Response Example

{
  "error": "Erro ao remover contato"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/contact/remove \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "phone": "string"
}'

POST
/chat/details
Obter Detalhes Completos
Retorna informações completas sobre um contato ou chat, incluindo todos os campos disponíveis do modelo Chat.

Funcionalidades:
Retorna chat completo: Todos os campos do modelo Chat (mais de 60 campos)
Busca informações para contatos individuais e grupos
URLs de imagem em dois tamanhos: preview (menor) ou full (original)
Combina informações de diferentes fontes: WhatsApp, contatos salvos, leads
Atualiza automaticamente dados desatualizados no banco
Campos Retornados:
Informações básicas: id, wa_fastid, wa_chatid, owner, name, phone
Dados do WhatsApp: wa_name, wa_contactName, wa_archived, wa_isBlocked, etc.
Dados de lead/CRM: lead_name, lead_email, lead_status, lead_field01-20, etc.
Informações de grupo: wa_isGroup, wa_isGroup_admin, wa_isGroup_announce, etc.
Chatbot: chatbot_summary, chatbot_lastTrigger_id, chatbot_disableUntil, etc.
Configurações: wa_muteEndTime, wa_isPinned, wa_unreadCount, etc.
Comportamento:

Para contatos individuais:
Busca nome verificado do WhatsApp
Verifica nome salvo nos contatos
Formata número internacional
Calcula grupos em comum
Para grupos:
Busca nome do grupo
Verifica status de comunidade
Request
Body
number
string
required
Número do telefone ou ID do grupo

Example: "5511999999999"

preview
boolean
Controla o tamanho da imagem de perfil retornada:

true: Retorna imagem em tamanho preview (menor, otimizada para listagens)
false (padrão): Retorna imagem em tamanho full (resolução original, maior qualidade)
Responses

200
Informações completas do chat retornadas com sucesso
Response Example

{
  "id": "string",
  "wa_fastid": "string",
  "wa_chatid": "string",
  "wa_archived": false,
  "wa_contactName": "string",
  "wa_name": "string",
  "name": "string",
  "image": "string",
  "imagePreview": "string",
  "wa_ephemeralExpiration": 0,
  "wa_isBlocked": false,
  "wa_isGroup": false,
  "wa_isGroup_admin": false,
  "wa_isGroup_announce": false,
  "wa_isGroup_community": false,
  "wa_isGroup_member": false,
  "wa_isPinned": false,
  "wa_label": "string",
  "wa_lastMessageTextVote": "string",
  "wa_lastMessageType": "string",
  "wa_lastMsgTimestamp": 0,
  "wa_lastMessageSender": "string",
  "wa_muteEndTime": 0,
  "owner": "string",
  "wa_unreadCount": 0,
  "phone": "string",
  "wa_common_groups": "Grupo Família(120363123456789012@g.us),Trabalho(987654321098765432@g.us)",
  "lead_name": "string",
  "lead_fullName": "string",
  "lead_email": "string",
  "lead_personalid": "string",
  "lead_status": "string",
  "lead_tags": "string",
  "lead_notes": "string",
  "lead_isTicketOpen": false,
  "lead_assignedAttendant_id": "string",
  "lead_kanbanOrder": 0,
  "lead_field01": "string",
  "lead_field02": "string",
  "lead_field03": "string",
  "lead_field04": "string",
  "lead_field05": "string",
  "lead_field06": "string",
  "lead_field07": "string",
  "lead_field08": "string",
  "lead_field09": "string",
  "lead_field10": "string",
  "lead_field11": "string",
  "lead_field12": "string",
  "lead_field13": "string",
  "lead_field14": "string",
  "lead_field15": "string",
  "lead_field16": "string",
  "lead_field17": "string",
  "lead_field18": "string",
  "lead_field19": "string",
  "lead_field20": "string",
  "chatbot_agentResetMemoryAt": 0,
  "chatbot_lastTrigger_id": "string",
  "chatbot_lastTriggerAt": 0,
  "chatbot_disableUntil": 0,
  "created": "string",
  "updated": "string"
}

400
Payload inválido ou número inválido
Response Example

{
  "error": "Invalid request payload"
}

401
Token não fornecido
Response Example

{
  "error": "Unauthorized"
}

500
Erro interno do servidor ou sessão não iniciada
Response Example

{
  "error": "No session"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/details \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "number": "5511999999999",
  "preview": false
}'

POST
/chat/check
Verificar Números no WhatsApp
Verifica se números fornecidos estão registrados no WhatsApp e retorna informações detalhadas.

Funcionalidades:
Verifica múltiplos números simultaneamente
Suporta números individuais e IDs de grupo
Retorna nome verificado quando disponível
Identifica grupos e comunidades
Verifica subgrupos de comunidades
Comportamento específico:

Para números individuais:
Verifica registro no WhatsApp
Retorna nome verificado se disponível
Normaliza formato do número
Para grupos:
Verifica existência
Retorna nome do grupo
Retorna id do grupo de anúncios se buscado por id de comunidade
Request
Body
numbers
array
Lista de números ou IDs de grupo para verificar

Example: ["5511999999999","123456789@g.us"]

Responses

200
Resultado da verificação
Response Example

[
  {
    "query": "string",
    "jid": "string",
    "lid": "string",
    "isInWhatsapp": false,
    "verifiedName": "string",
    "groupName": "string",
    "error": "string"
  }
]

400
Payload inválido ou sem números
Response Example

{
  "error": "Missing numbers in payload"
}

401
Sem sessão ativa
Response Example

{
  "error": "No active session"
}

500
Erro interno do servidor
Response Example

{
  "error": "WhatsApp client is not connected"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/chat/check \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "numbers": [
    "5511999999999",
    "123456789@g.us"
  ]
}'
POST
/sender/simple
Criar nova campanha (Simples)
Cria uma nova campanha de envio com configurações básicas

Request
Body
numbers
array
required
Lista de números para envio

Example: ["5511999999999@s.whatsapp.net"]

type
string
required
Tipo da mensagem

delayMin
integer
required
Delay mínimo entre mensagens em segundos

Example: 10

delayMax
integer
required
Delay máximo entre mensagens em segundos

Example: 30

scheduled_for
integer
required
Timestamp em milissegundos ou minutos a partir de agora para agendamento

Example: 1706198400000

info
string
Informações adicionais sobre a campanha

delay
integer
Delay fixo entre mensagens (opcional)

mentions
string
Menções na mensagem em formato JSON

text
string
Texto da mensagem

linkPreview
boolean
Habilitar preview de links em mensagens de texto. O preview será gerado automaticamente a partir da URL contida no texto.

linkPreviewTitle
string
Título personalizado para o preview do link (opcional)

linkPreviewDescription
string
Descrição personalizada para o preview do link (opcional)

linkPreviewImage
string
URL ou dados base64 da imagem para o preview do link (opcional)

linkPreviewLarge
boolean
Se deve usar preview grande ou pequeno (opcional, padrão false)

file
string
URL da mídia ou arquivo (quando type é image, video, audio, document, etc.)

docName
string
Nome do arquivo (quando type é document)

fullName
string
Nome completo (quando type é contact)

phoneNumber
string
Número do telefone (quando type é contact)

organization
string
Organização (quando type é contact)

email
string
Email (quando type é contact)

url
string
URL (quando type é contact)

latitude
number
Latitude (quando type é location)

longitude
number
Longitude (quando type é location)

name
string
Nome do local (quando type é location)

address
string
Endereço (quando type é location)

footerText
string
Texto do rodapé (quando type é list, button, poll ou carousel)

buttonText
string
Texto do botão (quando type é list, button, poll ou carousel)

listButton
string
Texto do botão da lista (quando type é list)

selectableCount
integer
Quantidade de opções selecionáveis (quando type é poll)

choices
array
Lista de opções (quando type é list, button, poll ou carousel). Para carousel, use formato específico com [texto], {imagem} e botões

imageButton
string
URL da imagem para o botão (quando type é button)

Responses

200
campanha criada com sucesso
Response Example

{
  "folder_id": "string",
  "count": 0,
  "status": "queued"
}

400
Erro nos parâmetros da requisição
Response Example

{
  "error": "string"
}

401
Erro de autenticação
Response Example

{
  "error": "string"
}

409
Conflito - campanha já existe

500
Erro interno do servidor
Response Example

{
  "error": "string"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/sender/simple \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "numbers": [
    "5511999999999@s.whatsapp.net"
  ],
  "type": "text",
  "delayMin": 10,
  "delayMax": 30,
  "scheduled_for": 1706198400000,
  "info": "string",
  "delay": 0,
  "mentions": "string",
  "text": "string",
  "linkPreview": false,
  "linkPreviewTitle": "string",
  "linkPreviewDescription": "string",
  "linkPreviewImage": "string",
  "linkPreviewLarge": false,
  "file": "string",
  "docName": "string",
  "fullName": "string",
  "phoneNumber": "string",
  "organization": "string",
  "email": "string",
  "url": "string",
  "latitude": 0,
  "longitude": 0,
  "name": "string",
  "address": "string",
  "footerText": "string",
  "buttonText": "string",
  "listButton": "string",
  "selectableCount": 0,
  "choices": [
    "string"
  ],
  "imageButton": "string"
}'
POST
/sender/advanced
Criar envio em massa avançado
Cria um novo envio em massa com configurações avançadas, permitindo definir múltiplos destinatários e mensagens com delays personalizados.

Request
Body
delayMin
integer
Delay mínimo entre mensagens (segundos)

Example: 3

delayMax
integer
Delay máximo entre mensagens (segundos)

Example: 6

info
string
Descrição ou informação sobre o envio em massa

Example: "Campanha de lançamento"

scheduled_for
integer
Timestamp em milissegundos (date unix) ou minutos a partir de agora para agendamento

Example: 1

messages
array
required
Lista de mensagens a serem enviadas

Responses

200
Mensagens adicionadas à fila com sucesso
Response Example

{
  "folder_id": "string",
  "count": 0,
  "status": "queued"
}

400
Erro nos parâmetros da requisição
Response Example

{
  "error": "Formato de número inválido"
}

401
Não autorizado - token inválido ou ausente
Response Example

{
  "error": "Token inválido ou ausente"
}

500
Erro interno do servidor
Response Example

{
  "error": "string"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/sender/advanced \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "delayMin": 3,
  "delayMax": 6,
  "info": "teste avançado",
  "scheduled_for": 1,
  "messages": [
    {
      "number": "5511999999999",
      "type": "text",
      "text": "First message"
    },
    {
      "number": "5511999999999",
      "type": "button",
      "text": "Promoção Especial!\nConfira nossas ofertas incríveis",
      "footerText": "Válido até 31/12/2024",
      "imageButton": "https://exemplo.com/banner-promocao.jpg",
      "choices": [
        "Ver Ofertas|https://loja.exemplo.com/ofertas",
        "Falar com Vendedor|reply:vendedor",
        "Copiar Cupom|copy:PROMO2024"
      ]
    },
    {
      "number": "5511999999999",
      "type": "list",
      "text": "Escolha sua categoria preferida:",
      "listButton": "Ver Categorias",
      "choices": [
        "[Eletrônicos]",
        "Smartphones|eletronicos_smartphones",
        "Notebooks|eletronicos_notebooks",
        "[Roupas]",
        "Camisetas|roupas_camisetas",
        "Sapatos|roupas_sapatos"
      ]
    },
    {
      "number": "5511999999999",
      "type": "document",
      "file": "https://example.com/doc.pdf",
      "docName": "Documento.pdf"
    },
    {
      "number": "5511999999999",
      "type": "carousel",
      "text": "Conheça nossos produtos",
      "choices": [
        "[Smartphone XYZ\nO mais avançado smartphone da linha]",
        "{https://exemplo.com/produto1.jpg}",
        "Copiar Código|copy:PROD123",
        "Ver no Site|https://exemplo.com/xyz",
        "[Notebook ABC\nO notebook ideal para profissionais]",
        "{https://exemplo.com/produto2.jpg}",
        "Copiar Código|copy:NOTE456",
        "Comprar Online|https://exemplo.com/abc"
      ]
    }
  ]
}'

POST
/sender/edit
Controlar campanha de envio em massa
Permite controlar campanhas de envio de mensagens em massa através de diferentes ações:

Ações Disponíveis:
🛑 stop - Pausar campanha

Pausa uma campanha ativa ou agendada
Altera o status para "paused"
Use quando quiser interromper temporariamente o envio
Mensagens já enviadas não são afetadas
▶️ continue - Continuar campanha

Retoma uma campanha pausada
Altera o status para "scheduled"
Use para continuar o envio após pausar uma campanha
Não funciona em campanhas já concluídas ("done")
🗑️ delete - Deletar campanha

Remove completamente a campanha
Deleta apenas mensagens NÃO ENVIADAS (status "scheduled")
Mensagens já enviadas são preservadas no histórico
Operação é executada de forma assíncrona
Status de Campanhas:
scheduled: Agendada para envio
sending: Enviando mensagens
paused: Pausada pelo usuário
done: Concluída (não pode ser alterada)
deleting: Sendo deletada (operação em andamento)
Request
Body
folder_id
string
required
Identificador único da campanha de envio

Example: "folder_123"

action
string
required
Ação a ser executada na campanha:

stop: Pausa a campanha (muda para status "paused")
continue: Retoma campanha pausada (muda para status "scheduled")
delete: Remove campanha e mensagens não enviadas (assíncrono)
Example: "stop"

Responses

200
Ação realizada com sucesso
Response Example

null

400
Requisição inválida
Response Example

{
  "error": "folder_id is required"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/sender/edit \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "folder_id": "folder_123",
  "action": "stop"
}'

POST
/sender/cleardone
Limpar mensagens enviadas
Inicia processo de limpeza de mensagens antigas em lote que já foram enviadas com sucesso. Por padrão, remove mensagens mais antigas que 7 dias.

Request
Body
hours
integer
Quantidade de horas para manter mensagens. Mensagens mais antigas que esse valor serão removidas.

Example: 168

Responses

200
Limpeza iniciada com sucesso
Response Example

{
  "status": "cleanup started"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/sender/cleardone \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "hours": 168
}'
DELETE
/sender/clearall
Limpar toda fila de mensagens
Remove todas as mensagens da fila de envio em massa, incluindo mensagens pendentes e já enviadas. Esta é uma operação irreversível.

Responses

200
Fila de mensagens limpa com sucesso
Response Example

{
  "info": "Fila de mensagens limpa com sucesso"
}

401
Não autorizado - token inválido ou ausente
Response Example

{
  "error": "Token inválido ou ausente"
}

500
Erro interno do servidor
Response Example

{
  "error": "string"
}

curl --request DELETE \
  --url https://dnxplataforma.uazapi.com/sender/clearall \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'

  GET
/sender/listfolders
Listar campanhas de envio
Retorna todas as campanhas de mensagens em massa com possibilidade de filtro por status

Parameters
Query Parameters
status
string
Filtrar campanhas por status

Responses

200
Lista de campanhas retornada com sucesso
Response Example

[
  {
    "id": "string",
    "info": "string",
    "status": "ativo",
    "scheduled_for": 0,
    "delayMax": 0,
    "delayMin": 0,
    "log_delivered": 0,
    "log_failed": 0,
    "log_played": 0,
    "log_read": 0,
    "log_sucess": 0,
    "log_total": 0,
    "owner": "string",
    "created": "2024-01-15T10:30:00Z",
    "updated": "2024-01-15T10:30:00Z"
  }
]

500
Erro interno do servidor
Response Example

{
  "error": "string"
}

curl --request GET \
  --url https://dnxplataforma.uazapi.com/sender/listfolders \
  --header 'Accept: application/json'

  POST
/sender/listmessages
Listar mensagens de uma campanha
Retorna a lista de mensagens de uma campanha específica, com opções de filtro por status e paginação

Request
Body
folder_id
string
required
ID da campanha a ser consultada

messageStatus
string
Status das mensagens para filtrar

page
integer
Número da página para paginação

pageSize
integer
Quantidade de itens por página

Responses

200
Lista de mensagens retornada com sucesso
Response Example

{
  "messages": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "messageid": "string",
      "chatid": "string",
      "fromMe": false,
      "isGroup": false,
      "messageType": "text",
      "messageTimestamp": 0,
      "edited": "string",
      "quoted": "string",
      "reaction": "string",
      "sender": "string",
      "senderName": "string",
      "source": "ios",
      "status": "pending",
      "text": "string",
      "vote": "string",
      "buttonOrListid": "string",
      "convertOptions": "string",
      "fileURL": "https://example.com",
      "content": "string",
      "owner": "string",
      "track_source": "string",
      "track_id": "string",
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z",
      "ai_metadata": {
        "agent_id": "string",
        "request": {
          "messages": [
            "item"
          ],
          "tools": [
            "item"
          ],
          "options": {
            "model": "string",
            "temperature": 0,
            "maxTokens": 0,
            "topP": 0,
            "frequencyPenalty": 0,
            "presencePenalty": 0
          }
        },
        "response": {
          "choices": [
            "item"
          ],
          "toolResults": [
            "item"
          ],
          "error": "string"
        }
      }
    }
  ],
  "pagination": {
    "total": 0,
    "page": 0,
    "pageSize": 0,
    "lastPage": 0
  }
}

400
Requisição inválida
Response Example

{
  "error": "folder_id is required"
}

500
Erro interno do servidor
Response Example

{
  "error": "Failed to fetch messages"
}

curl --request POST \
  --url https://dnxplataforma.uazapi.com/sender/listmessages \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "folder_id": "string",
  "messageStatus": "Scheduled",
  "page": 1,
  "pageSize": 1
}'

GET
/instance/proxy
Obter configuração de proxy da instância
A uazapiGO já utiliza um proxy gerenciado por padrão. Para dar liberdade ao cliente, é possível informar um proxy próprio. Retorna o estado atual do proxy, com a URL mascarada e informações do último teste de conectividade.

Responses

200
Configuração de proxy recuperada com sucesso
Response Example

{
  "enabled": false,
  "proxy_url": "string",
  "last_test_at": 0,
  "last_test_error": "string",
  "validation_error": false
}

401
Token inválido ou expirado
Response Example

{
  "error": "Unauthorized"
}

500
Erro interno do servidor ao recuperar a configuração
Response Example

{
  "error": "string"
}
curl --request GET \
  --url https://dnxplataforma.uazapi.com/instance/proxy \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'


  POST
/instance/proxy
Configurar ou alterar o proxy
Permite habilitar ou trocar para um proxy próprio. A URL é validada antes de salvar. Quando já usamos o proxy gerenciado padrão, você pode substituí-lo enviando seu proxy_url. A conexão pode ser reiniciada automaticamente para aplicar a mudança.

Request
Body
enable
boolean
required
Define se o proxy deve ser habilitado; se false, remove o proxy atual

proxy_url
string
URL do proxy a ser usado (obrigatória se enable=true)

Example: "http://usuario:senha@ip:porta"

Responses

200
Proxy configurado com sucesso
Response Example

{
  "details": "Proxy configurado",
  "proxy": {
    "enabled": false,
    "proxy_url": "string",
    "last_test_at": 0,
    "last_test_error": "string",
    "validation_error": false
  },
  "restart_requested": false
}

400
Payload inválido ou falha na validação do proxy
Response Example

{
  "error": "Falha ao validar proxy: ..."
}

401
Token inválido ou expirado
Response Example

{
  "error": "Unauthorized"
}

500
Erro interno do servidor ao configurar o proxy
Response Example

{
  "error": "string"
}
curl --request POST \
  --url https://dnxplataforma.uazapi.com/instance/proxy \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f' \
  --data '{
  "enable": false,
  "proxy_url": "http://usuario:senha@ip:porta"
}'

DELETE
/instance/proxy
Remover o proxy configurado
Desativa e apaga o proxy personalizado, voltando ao comportamento padrão (proxy gerenciado). Pode reiniciar a conexão para aplicar a remoção.

Responses

200
Configuração de proxy removida com sucesso
Response Example

{
  "details": "Proxy removido",
  "proxy": {
    "enabled": false
  },
  "restart_requested": false
}

401
Token inválido ou expirado
Response Example

{
  "error": "Unauthorized"
}

500
Erro interno do servidor ao deletar a configuração de proxy
Response Example

{
  "error": "string"
}
curl --request DELETE \
  --url https://dnxplataforma.uazapi.com/instance/proxy \
  --header 'Accept: application/json' \
  --header 'token: 6ee6a878-2372-459f-bdf7-8889c1e1b99f'