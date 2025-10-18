# Documentação: Autenticação OAuth2 com Google (Validação e Obtenção de Token)

## Visão Geral

Este guia documenta o processo de configuração do OAuth2 com Google, incluindo a criação de credenciais no Google Cloud Console e a validação do fluxo de autenticação até a obtenção do token de acesso.

## Pré-requisitos

- Conta Google ativa
- Acesso ao Google Cloud Console
- URL de callback configurada em sua aplicação

## Etapa 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em **"Select a project"** → **"New Project"**
3. Defina o nome do projeto
4. Clique em **"Create"**

## Etapa 2: Configurar Tela de Consentimento OAuth

1. No menu lateral, navegue até **APIs & Services** → **OAuth consent screen**
2. Selecione o tipo de usuário:
   - **Internal**: Apenas usuários da organização
   - **External**: Qualquer usuário com conta Google
3. Preencha as informações obrigatórias:
   - **App name**: Nome da aplicação
   - **User support email**: Email de suporte
   - **Developer contact information**: Email do desenvolvedor
4. Clique em **"Save and Continue"**
5. Configure os **Scopes** necessários:
   - Para Gmail: `https://www.googleapis.com/auth/gmail.send`
   - Para Sheets: `https://www.googleapis.com/auth/spreadsheets`
   - Para Drive: `https://www.googleapis.com/auth/drive`
6. Continue até finalizar a configuração

## Etapa 3: Criar Credenciais OAuth2

1. Navegue até **APIs & Services** → **Credentials**
2. Clique em **"Create Credentials"** → **"OAuth client ID"**
3. Selecione **Application type**: "Web application"
4. Configure as informações:
   - **Name**: Nome identificador das credenciais
   - **Authorized JavaScript origins** (opcional): URLs de origem permitidas
   - **Authorized redirect URIs**: URLs de callback autorizadas
     - Exemplo: `http://localhost:5678/rest/oauth2-credential/callback`
5. Clique em **"Create"**
6. Copie e salve:
   - **Client ID**
   - **Client Secret**

## Etapa 4: Habilitar APIs Necessárias

1. Navegue até **APIs & Services** → **Library**
2. Busque e habilite as APIs necessárias:
   - Gmail API
   - Google Sheets API
   - Google Drive API
   - Ou outras conforme necessário
3. Clique em **"Enable"** para cada API

## Etapa 5: Estrutura das Credenciais OAuth2

As credenciais seguem o seguinte formato:

```json
{
  "clientId": "SEU_CLIENT_ID.apps.googleusercontent.com",
  "clientSecret": "SEU_CLIENT_SECRET",
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
  "accessTokenUrl": "https://oauth2.googleapis.com/token",
  "scope": "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets",
  "authQueryParameters": "access_type=offline&prompt=consent"
}
```

### Componentes da Estrutura

- **clientId**: Identificador único do cliente OAuth
- **clientSecret**: Chave secreta do cliente
- **authUrl**: Endpoint de autorização do Google
- **accessTokenUrl**: Endpoint para troca de código por token
- **scope**: Permissões solicitadas (separadas por espaço)
- **authQueryParameters**: Parâmetros adicionais:
  - `access_type=offline`: Permite obter refresh token
  - `prompt=consent`: Força tela de consentimento

## Etapa 6: Fluxo de Autenticação OAuth2

### 6.1 Solicitação de Autorização

URL de autorização gerada:

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=SEU_CLIENT_ID&
  redirect_uri=SUA_REDIRECT_URI&
  response_type=code&
  scope=https://www.googleapis.com/auth/gmail.send&
  access_type=offline&
  prompt=consent
```

### 6.2 Callback com Código de Autorização

Após autorização, o usuário é redirecionado:

```
http://localhost:5678/rest/oauth2-credential/callback?code=CODIGO_AUTORIZACAO&scope=...
```

### 6.3 Troca de Código por Token

Request POST para obter tokens:

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=CODIGO_AUTORIZACAO&
client_id=SEU_CLIENT_ID&
client_secret=SEU_CLIENT_SECRET&
redirect_uri=SUA_REDIRECT_URI&
grant_type=authorization_code
```

### 6.4 Resposta com Tokens

```json
{
  "access_token": "ya29.a0ARrdaM...",
  "refresh_token": "1//0gL9...",
  "expires_in": 3599,
  "token_type": "Bearer",
  "scope": "https://www.googleapis.com/auth/gmail.send"
}
```

## Etapa 7: Validação do Token

### 7.1 Teste de Validação

Endpoint de validação:

```http
GET https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=SEU_ACCESS_TOKEN
```

### 7.2 Resposta de Validação

```json
{
  "issued_to": "SEU_CLIENT_ID.apps.googleusercontent.com",
  "audience": "SEU_CLIENT_ID.apps.googleusercontent.com",
  "scope": "https://www.googleapis.com/auth/gmail.send",
  "expires_in": 3599,
  "access_type": "offline"
}
```

## Etapa 8: Uso do Access Token

### Exemplo: Enviar Email via Gmail API

```http
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
Authorization: Bearer SEU_ACCESS_TOKEN
Content-Type: application/json

{
  "raw": "BASE64_ENCODED_EMAIL"
}
```

## Etapa 9: Renovação de Token (Refresh)

Quando o `access_token` expirar, use o `refresh_token`:

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id=SEU_CLIENT_ID&
client_secret=SEU_CLIENT_SECRET&
refresh_token=SEU_REFRESH_TOKEN&
grant_type=refresh_token
```

## Troubleshooting Comum

### Erro: "redirect_uri_mismatch"
- Verificar se a URI de callback está cadastrada exatamente como configurada
- Incluir protocolo (http/https), porta e path completos

### Erro: "invalid_client"
- Verificar Client ID e Client Secret
- Confirmar que as credenciais estão ativas no Google Cloud Console

### Erro: "access_denied"
- Usuário negou permissões
- Verificar se os scopes solicitados são apropriados

### Token não contém refresh_token
- Adicionar `access_type=offline` aos parâmetros de autorização
- Adicionar `prompt=consent` para forçar nova aprovação

## Segurança

- **Nunca expor** Client Secret em código cliente
- **Armazenar tokens** de forma segura (criptografados)
- **Usar HTTPS** em produção para redirect URIs
- **Implementar PKCE** para aplicações públicas
- **Rotacionar credenciais** periodicamente

## Referências

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Reference](https://developers.google.com/gmail/api)
- [Google Sheets API Reference](https://developers.google.com/sheets/api)
