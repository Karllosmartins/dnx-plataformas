# Opções de Consulta Datecode API

> **Data:** 2025-10-18
> **Versão:** 1.0
> **Endpoint:** `/api/datecode/consulta`

---

## 📋 Visão Geral

A API de consulta Datecode aceita **múltiplos critérios de busca**, não sendo mais obrigatório fornecer CPF ou CNPJ. Você pode consultar por:

- ✅ **Documento** (CPF ou CNPJ)
- ✅ **Telefone**
- ✅ **Email**
- ✅ **Placa de Veículo**
- ✅ **Nome + Localização** (cidade, UF ou CEP)

---

## 🔍 Regras de Validação

### Campos Obrigatórios

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `userId` | ✅ Sim | ID do usuário fazendo a consulta |

### Campos de Busca (Pelo Menos 1 Obrigatório)

Você **deve fornecer pelo menos um** dos seguintes critérios:

- `document` (CPF/CNPJ)
- `numeroTelefone`
- `email`
- `placaVeiculo`
- `nomeRazao` + (`cidade` OU `uf` OU `cep`)

### Regra Especial: Documento + TipoPessoa

⚠️ **Se você fornecer `document` (CPF/CNPJ), o campo `tipoPessoa` é obrigatório.**

---

## 📝 Estrutura da Requisição

### Parâmetros Disponíveis

```typescript
{
  // OBRIGATÓRIO
  userId: number

  // CRITÉRIOS DE BUSCA (pelo menos 1 obrigatório)
  document?: string          // CPF ou CNPJ
  numeroTelefone?: string    // Telefone
  email?: string             // Email
  placaVeiculo?: string      // Placa do veículo
  nomeRazao?: string         // Nome completo ou razão social

  // CONDICIONAL: Obrigatório se 'document' for fornecido
  tipoPessoa?: 'PF' | 'PJ'   // Tipo de pessoa (Física ou Jurídica)

  // OPCIONAIS (Melhoram a precisão da busca)
  cidade?: string            // Cidade
  uf?: string                // Estado (sigla)
  cep?: string               // CEP
  numeroEndereco?: string    // Número do endereço
  dataNascimentoAbertura?: string  // Data nascimento (PF) ou abertura (PJ)
}
```

---

## 💡 Exemplos de Uso

### 1. Consulta por CPF (Tradicional)

```bash
curl -X POST http://localhost:3000/api/datecode/consulta \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "document": "123.456.789-00",
    "tipoPessoa": "PF"
  }'
```

**Campos enviados à API Datecode:**
```json
{
  "document": "12345678900",
  "tipoPessoa": "PF"
}
```

---

### 2. Consulta por Telefone

```bash
curl -X POST http://localhost:3000/api/datecode/consulta \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "numeroTelefone": "(11) 98765-4321"
  }'
```

**Campos enviados à API Datecode:**
```json
{
  "numeroTelefone": "11987654321"
}
```

---

### 3. Consulta por Email

```bash
curl -X POST http://localhost:3000/api/datecode/consulta \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "email": "joao.silva@exemplo.com"
  }'
```

**Campos enviados à API Datecode:**
```json
{
  "email": "joao.silva@exemplo.com"
}
```

---

### 4. Consulta por Placa de Veículo

```bash
curl -X POST http://localhost:3000/api/datecode/consulta \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "placaVeiculo": "ABC-1234"
  }'
```

**Campos enviados à API Datecode:**
```json
{
  "placaVeiculo": "ABC1234"
}
```

---

### 5. Consulta por Nome + Localização

```bash
curl -X POST http://localhost:3000/api/datecode/consulta \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "nomeRazao": "João da Silva",
    "cidade": "São Paulo",
    "uf": "SP"
  }'
```

**Campos enviados à API Datecode:**
```json
{
  "nomeRazao": "João da Silva",
  "cidade": "São Paulo",
  "uf": "SP"
}
```

---

### 6. Consulta Combinada (Múltiplos Critérios)

```bash
curl -X POST http://localhost:3000/api/datecode/consulta \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "nomeRazao": "João da Silva",
    "numeroTelefone": "(11) 98765-4321",
    "email": "joao.silva@exemplo.com",
    "cidade": "São Paulo",
    "uf": "SP",
    "cep": "01310-100"
  }'
```

**Campos enviados à API Datecode:**
```json
{
  "nomeRazao": "João da Silva",
  "numeroTelefone": "11987654321",
  "email": "joao.silva@exemplo.com",
  "cidade": "São Paulo",
  "uf": "SP",
  "cep": "01310100"
}
```

---

### 7. Consulta CNPJ + Dados Complementares

```bash
curl -X POST http://localhost:3000/api/datecode/consulta \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 42,
    "document": "12.345.678/0001-90",
    "tipoPessoa": "PJ",
    "nomeRazao": "Empresa Exemplo Ltda",
    "cidade": "São Paulo",
    "uf": "SP"
  }'
```

**Campos enviados à API Datecode:**
```json
{
  "document": "12345678000190",
  "tipoPessoa": "PJ",
  "nomeRazao": "Empresa Exemplo Ltda",
  "cidade": "São Paulo",
  "uf": "SP"
}
```

---

## ❌ Exemplos de Requisições Inválidas

### Erro 1: Nenhum Critério de Busca

```json
{
  "userId": 42
}
```

**Resposta:**
```json
{
  "error": "Pelo menos um campo de busca deve ser fornecido",
  "details": "Forneça: documento (CPF/CNPJ), telefone, email, placa de veículo, ou nome completo com localização (cidade/UF/CEP)"
}
```

---

### Erro 2: Documento sem TipoPessoa

```json
{
  "userId": 42,
  "document": "123.456.789-00"
}
```

**Resposta:**
```json
{
  "error": "tipoPessoa é obrigatório quando documento (CPF/CNPJ) é fornecido"
}
```

---

### Erro 3: Nome sem Localização

```json
{
  "userId": 42,
  "nomeRazao": "João da Silva"
}
```

**Resposta:**
```json
{
  "error": "Pelo menos um campo de busca deve ser fornecido",
  "details": "Forneça: documento (CPF/CNPJ), telefone, email, placa de veículo, ou nome completo com localização (cidade/UF/CEP)"
}
```

**Solução:** Adicionar `cidade`, `uf` ou `cep`:
```json
{
  "userId": 42,
  "nomeRazao": "João da Silva",
  "cidade": "São Paulo"  // ✅ Agora válido
}
```

---

### Erro 4: Sem userId

```json
{
  "document": "123.456.789-00",
  "tipoPessoa": "PF"
}
```

**Resposta:**
```json
{
  "error": "userId é obrigatório"
}
```

---

## 🔄 Processamento Automático

A API processa automaticamente:

### 1. Limpeza de Formatação

| Campo Original | Processado |
|---------------|------------|
| `document: "123.456.789-00"` | `"12345678900"` |
| `numeroTelefone: "(11) 98765-4321"` | `"11987654321"` |
| `cep: "01310-100"` | `"01310100"` |
| `placaVeiculo: "ABC-1234"` | `"ABC1234"` |

### 2. Normalização de Texto

| Campo Original | Processado |
|---------------|------------|
| `tipoPessoa: "pf"` | `"PF"` |
| `uf: "sp"` | `"SP"` |
| `placaVeiculo: "abc1234"` | `"ABC1234"` |

---

## 📊 Resposta da API

### Sucesso (200 OK)

```json
{
  "success": true,
  "data": {
    // Dados retornados pela API Datecode
    "nome": "João da Silva",
    "cpf": "12345678900",
    "telefones": ["11987654321"],
    // ... outros dados
  },
  "usage": {
    "consultasRealizadas": 15,
    "limiteConsultas": 100,
    "consultasRestantes": 85
  }
}
```

### Erro de Validação (400 Bad Request)

```json
{
  "error": "Pelo menos um campo de busca deve ser fornecido",
  "details": "Forneça: documento (CPF/CNPJ), telefone, email, placa de veículo, ou nome completo com localização (cidade/UF/CEP)"
}
```

### Erro de Limite Excedido (429 Too Many Requests)

```json
{
  "error": "Limite de consultas excedido",
  "details": "Você não possui consultas disponíveis. Consultas restantes: 0"
}
```

### Erro de Credenciais (500 Internal Server Error)

```json
{
  "error": "Credenciais do Datecode não configuradas. Configure suas credenciais no cadastro de usuário."
}
```

---

## 📝 Registro de Consultas

Cada consulta é registrada no banco de dados com informações sobre o tipo:

| Critério de Busca | Tipo de Consulta Registrada |
|-------------------|----------------------------|
| CPF/CNPJ | `"Consulta PF"` ou `"Consulta PJ"` |
| Telefone | `"Consulta por telefone"` |
| Email | `"Consulta por email"` |
| Placa | `"Consulta por placa"` |
| Nome + Localização | `"Consulta por nome"` |

**Tabela:** `leads`

**Campos preenchidos:**
- `user_id`: ID do usuário
- `nome_cliente`: Nome fornecido ou "Consulta Individual"
- `cpf_cnpj`: Documento (se fornecido) ou `null`
- `origem`: "Consulta Individual"
- `status_limpa_nome`: "consulta_realizada"
- `observacoes_limpa_nome`: Tipo de consulta realizada

---

## 🎯 Casos de Uso Práticos

### Caso 1: Pesquisa Inversa de Telefone

**Cenário:** Cliente ligou, mas não se identificou. Você tem apenas o número.

```javascript
const response = await fetch('/api/datecode/consulta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 42,
    numeroTelefone: '11987654321'
  })
})
```

---

### Caso 2: Validação de Email

**Cenário:** Verificar se email pertence a pessoa conhecida.

```javascript
const response = await fetch('/api/datecode/consulta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 42,
    email: 'cliente@exemplo.com'
  })
})
```

---

### Caso 3: Pesquisa de Veículo

**Cenário:** Consultar proprietário de veículo por placa.

```javascript
const response = await fetch('/api/datecode/consulta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 42,
    placaVeiculo: 'ABC1234'
  })
})
```

---

### Caso 4: Enriquecimento de Lead

**Cenário:** Tem apenas nome e cidade, quer mais informações.

```javascript
const response = await fetch('/api/datecode/consulta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 42,
    nomeRazao: 'João da Silva',
    cidade: 'São Paulo',
    uf: 'SP'
  })
})
```

---

## 🔐 Considerações de Segurança

### Rate Limiting
- Cada consulta consome 1 crédito do limite do usuário
- Verificação de limite antes de processar
- Retorno de saldo restante em cada resposta

### Credenciais
- Credenciais buscadas por usuário (tabela `credencias_diversas`)
- Fallback para variáveis de ambiente se usuário não tiver
- Autenticação Basic Auth com API Datecode

### Logs
- Todas as consultas são logadas
- Tipo de consulta identificado automaticamente
- Não loga dados sensíveis retornados pela API

---

## 📚 Referências

- **Endpoint:** `/api/datecode/consulta`
- **Método:** `POST`
- **Arquivo:** `app/api/datecode/consulta/route.ts`
- **Documentação Datecode:** https://date-solutions.readme.io/reference/consulta-pessoa-f%C3%ADsica-1

---

curl -X POST https://api.datecode.com.br/v2/dados/consulta \
  -H "Authorization: Basic $(echo -n 'seu@email.com:suasenha' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "document": "12345678900",
    "tipoPessoa": "PF",
    "nomeRazao": "João da Silva",
    "cidade": "São Paulo",
    "uf": "SP",
    "cep": "01001-000",
    "numeroEndereco": "100",
    "numeroTelefone": "11999999999",
    "email": "joao@email.com",
    "dataNascimentoAbertura": "1990-01-01",
    "placaVeiculo": "ABC1D23"
  }'
ou const options = {
  method: 'POST',
  headers: {accept: 'application/json', 'content-type': 'application/json'}
};

fetch('https://api.datecode.com.br/v2/dados/consulta', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));

Consulta de Dados - PF/PJ
post
https://api.datecode.com.br/v2/dados/consulta

Esta API permite a consulta de dados a partir de um documento, seja CPF ou CNPJ, entre outros dados

Recent Requests
Log in to see full request history
Time	Status	User Agent	
Make a request to see history.

Consulta de Dados
Esta API permite a consulta de dados a partir de um documento, seja CPF ou CNPJ. É necessário autenticação via Basic Auth e o envio de um JSON com as informações mínimas para processar a solicitação.

🔐 Autenticação
Utilize autenticação Basic Auth com seu email:senha.

Exemplo de cabeçalho:
Authorization: Basic <base64(email:senha)>
Content-Type: application/json



📤 Endpoint

POST https://api.datecode.com.br/v2/dados/consulta



Corpo da Requisição

  {
  "document": "12345678900",
  "tipoPessoa": "PF",
  "nomeRazao": "João da Silva",
  "cidade": "São Paulo",
  "uf": "SP",
  "cep": "01001-000",
  "numeroEndereco": "100",
  "numeroTelefone": "11999999999",
  "email": "joao@email.com",
  "dataNascimentoAbertura": "1990-01-01",
  "placaVeiculo": "ABC1D23"
}

Exemplo de Resposta

[
  {
    "msg": "Consulta realizada com sucesso.",
    "pessoa": {
      "cpfFormatado": "123.456.789-00",
      "sexo": "FEMININO",
      "nome": "ANA CAROLINA MENDES",
      "dataNascimento": "12/03/1985 - Terça-feira",
      "idade": 40,
      "signo": "PEIXES",
      "nomeMae": "HELENA MENDES DA COSTA"
    },
    "restricoes": {
      "isPep": false,
      "isPepRelacionado": false,
      "isMenorIdade": false,
      "isPossivelAposentado": false,
      "isProfissionalNotorio": false,
      "isFamoso": false,
      "hasOutraRestricao": false
    },
    "telefones": [
      {
        "ddd": "21",
        "telefone": "998877665",
        "telefoneFormatado": "(21) 99887-7665",
        "tipoTelefone": "TELEFONE MÓVEL",
        "qualificacao": 1
      },
      {
        "ddd": "21",
        "telefone": "987654321",
        "telefoneFormatado": "(21) 98765-4321",
        "tipoTelefone": "TELEFONE FIXO",
        "qualificacao": 2
      }
    ],
    "enderecos": [
      {
        "endereco": "RUA DAS FLORES",
        "tipoLogradouro": "R",
        "logradouro": "DAS FLORES",
        "numero": "45",
        "bairro": "CENTRO",
        "cidade": "RIO DE JANEIRO",
        "uf": "RJ",
        "cep": "20010030",
        "cepFormatado": "20010-030",
        "qualificacao": 1
      }
    ],
    "emails": [
      {
        "email": "ana.mendes@example.com",
        "qualificacao": 1
      },
      {
        "email": "ana.c.mendes@empresa.com",
        "qualificacao": 2
      }
    ],
    "situacaoCadastral": {
      "cpf": "12345678900",
      "cpfFormatado": "123.456.789-00",
      "situacaoCadastral": "REGULAR",
      "dataHora": "20/04/2025 10:45:00",
      "codControle": "A1B2.C3D4.E5F6.G7H8"
    },
    "pessoasLigadas": [
      {
        "cpf": "32165498700",
        "cpfFormatado": "321.654.987-00",
        "nome": "MARCELA MENDES",
        "idade": 38,
        "grauParentesco": "IRMÃ"
      }
    ],
    "participacaoEmpresarial": [
      {
        "cnpj": "12345678000199",
        "cnpjFormatado": "12.345.678/0001-99",
        "razaoSocial": "MENDES SOLUÇÕES DIGITAIS LTDA",
        "nomeFantasia": "MENDES TECH",
        "participacao": "100.00"
      }
    ],
    "perfilConsumo": {
      "cartaoCredito": "SIM",
      "turismo": "NÃO",
      "luxo": "NÃO",
      "celular": "SIM",
      "tvCabo": "NÃO",
      "bandaLarga": "SIM",
      "creditoImobiliario": "NÃO",
      "ecommerce": "SIM",
      "consignado": "NÃO",
      "celularPosPago": "SIM",
      "possuiVeiculo": "SIM",
      "compraInternet": "SIM",
      "propensaoCartaoCarrefour": "NÃO",
      "propensaoCartaoMarisa": "SIM",
      "seguroSaude": "NÃO",
      "cartaoSupermercado": "SIM",
      "videoGame": "SIM",
      "transportePublico": "SIM",
      "tomadorCredito": "NÃO",
      "seguroVida": "SIM",
      "seguroResidencial": "NÃO",
      "seguroAuto": "SIM",
      "resgateMilhas": "NÃO",
      "previdenciaPrivada": "SIM",
      "perfilTomador": "NÃO",
      "perfilMobile": "SIM",
      "multiplosCartoes": "NÃO",
      "investidor": "SIM",
      "internetHighUser": "SIM",
      "internetBanking": "SIM",
      "gamesOnline": "SIM",
      "fitness": "NÃO",
      "creditoScoreFaixa": "MÉDIO RISCO",
      "creditoScore": "724",
      "creditoPessoal": "SIM",
      "clientePremium": "SIM",
      "celularPrePago": "NÃO",
      "casaPropria": "NÃO",
      "cartaoPriventLabel": "NÃO",
      "cartaoPrime": "NÃO",
      "cartaoCreditoBv": "SIM",
      "cacadorDescontos": "SIM"
    },
    "perfilSociodemografico": {
      "scoreRisco": "MÉDIO RISCO",
      "classe": "B2",
      "segmento": "Profissional Estável",
      "descricao": "Pessoas com ocupação formal e renda estável, comportamento financeiro previsível.",
      "estadoCivil": "Casada",
      "regiao": "ZONA SUL",
      "escolaridade": "SUPERIOR",
      "ocupacao": "FORMAL",
      "renda": "MÉDIA",
      "rendaPresumida": "8.500,00",
      "cbo": 142205,
      "cboDesc": "Gerente de Projetos"
    },
    "veiculos": [
      {
        "documento": "12345678900",
        "proprietario": "ANA CAROLINA MENDES",
        "marcaModelo": "FORD/KA SE 1.0",
        "placa": "ABC1D23",
        "anoFabricacao": "2019",
        "anoModelo": "2020",
        "renavam": "123456789",
        "dataLicenciamento": "10/01/2024",
        "qualificacao": 1
      }
    ],
    "obito": null,
    "historicoProfissional": [
      {
        "cnpj": "98765432000111",
        "cnpjFormatado": "98.765.432/0001-11",
        "razaoSocial": "INOVA CORP",
        "descricaoCbo": "Analista de Sistemas",
        "mediaSalario": "6.200,00"
      }
    ]
  }
]

 
 

**Fim da Documentação**

*Última atualização: 2025-10-18*
