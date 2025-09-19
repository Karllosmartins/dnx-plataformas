# Migração: Configurações Completas de Usuários

## Instruções de Aplicação

Para aplicar a migração que adiciona todas as configurações completas para os usuários, siga os passos abaixo:

### 1. Acesse o Supabase Dashboard
- Vá até [https://app.supabase.com](https://app.supabase.com)
- Acesse seu projeto

### 2. Aplique a Migração
- Vá para **SQL Editor**
- Copie e cole o conteúdo do arquivo `database/migration_usuarios_configuracoes_completas.sql`
- Execute a migração

### 3. Verificação
Após aplicar a migração, verifique se as novas colunas foram criadas:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name LIKE '%api%'
ORDER BY column_name;
```

### 4. O que foi adicionado

#### Configurações Operacionais
- `delay_entre_mensagens` (INTEGER) - Delay entre mensagens em segundos
- `delay_apos_intervencao` (INTEGER) - Delay após intervenção em minutos
- `inicio_expediente` (INTEGER) - Hora de início do expediente
- `fim_expediente` (INTEGER) - Hora de fim do expediente
- `numero_instancias` (INTEGER) - Número de instâncias simultâneas

#### Tipos de Negócio
- `tipos_negocio` (TEXT) - Array JSON com tipos de negócio

#### Integração CRM
- `crm_url` (TEXT) - URL do CRM
- `crm_usuario` (TEXT) - Usuário CRM
- `crm_senha` (TEXT) - Senha CRM
- `crm_token` (TEXT) - Token CRM

#### Google Drive
- `pasta_drive` (TEXT) - ID da pasta Drive
- `id_pasta_rag` (TEXT) - ID da pasta RAG

#### Informações do Cliente
- `nome_cliente_empresa` (TEXT) - Nome do cliente/empresa
- `structured_output_schema` (TEXT) - Schema JSON

#### APIs de IA
- `openai_api_token` (TEXT) - Token OpenAI
- `gemini_api_key` (TEXT) - Chave Gemini
- `modelo_ia` (TEXT) - Modelo de IA
- `tipo_tool_supabase` (TEXT) - Tipo tool Supabase
- `reasoning_effort` (TEXT) - Reasoning effort
- `api_key_dados` (TEXT) - API Key de dados

#### ElevenLabs
- `elevenlabs_api_key` (TEXT) - API Key ElevenLabs
- `elevenlabs_voice_id` (TEXT) - ID da voz

#### FireCrawl
- `firecrawl_api_key` (TEXT) - API Key FireCrawl

### 5. Atualização da View

A view `view_usuarios_planos` foi atualizada para incluir todas as novas colunas, permitindo que o frontend tenha acesso a todas as configurações do usuário junto com os dados do plano.

## Resultado

Após aplicar esta migração, o formulário de usuário na página de configurações administrativas terá acesso completo a todas as configurações especificadas, permitindo criar e editar usuários com:

- ✅ Informações básicas
- ✅ Configurações operacionais (delays, horários, limites)
- ✅ Seleção de tipos de negócio
- ✅ Configuração de integração CRM
- ✅ Configuração Google Drive
- ✅ Informações do cliente
- ✅ Configuração de APIs de IA (OpenAI, Gemini)
- ✅ Configuração ElevenLabs
- ✅ Configuração FireCrawl
- ✅ Status ativo/inativo

Todas as configurações são opcionais e podem ser preenchidas ou deixadas em branco para usar os valores padrão do sistema.