# 📚 Documentação Completa - Fluxo de Consulta, Relatórios e Salvamento

## Índice
1. [Visão Geral do Fluxo](#visão-geral-do-fluxo)
2. [Banco de Dados - Schema](#banco-de-dados---schema)
3. [Página de Consulta](#página-de-consulta)
4. [Página de Relatórios](#página-de-relatórios)
5. [Processo de Salvamento](#processo-de-salvamento)
6. [APIs Envolvidas](#apis-envolvidas)
7. [Fluxo Completo - Passo a Passo](#fluxo-completo---passo-a-passo)

---

## 1. Visão Geral do Fluxo

### 1.1 O Ciclo de Vida dos Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DOS DADOS                  │
└─────────────────────────────────────────────────────────────┘

1. ENRIQUECIMENTO / EXTRAÇÃO
   └─> Upload de CNPJs ou Lista de Contatos
   └─> Chamada API Datecode
   └─> Recepção de dados (empresa, sócios, contatos)
   └─> Salvamento automático na tabela "leads"

2. CONSULTA INDIVIDUAL
   └─> Usuário busca por CPF/CNPJ específico
   └─> Chamada API Datecode em tempo real
   └─> Exibição dos dados estruturados
   └─> Possibilidade de salvar como lead (futuro)

3. RELATÓRIOS
   └─> Consulta dados da tabela "leads"
   └─> Filtra por campanha, origem, período
   └─> Agrega estatísticas e métricas
   └─> Exibe gráficos e KPIs
   └─> Exporta em Excel (futuro)
```

### 1.2 Três Componentes Principais

| Página | Função | Dados | Origem |
|--------|--------|-------|--------|
| **Consulta** | Buscar dados em tempo real | Dados vivos da API | Datecode API |
| **Enriquecimento** | Processar listas em massa | Dados armazenados | Datecode API + Supabase |
| **Relatórios** | Analisar histórico | Leads salvos | Tabela "leads" Supabase |

---

## 2. Banco de Dados - Schema

### 2.1 Tabela: `leads`

Armazena todos os contatos capturados (enriquecimento, extração, consulta manual).

```sql
CREATE TABLE leads (
  -- Identificação
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id BIGINT NOT NULL,

  -- Informações do Lead
  nome_cliente TEXT,
  numero_formatado TEXT,        -- Telefone formatado: (XX) 9XXXX-XXXX
  email_usuario TEXT,
  nome_empresa TEXT,
  cpf_cnpj TEXT,

  -- Origem e Campanha
  origem TEXT,                  -- 'Enriquecimento', 'Extração de Leads', 'Consulta Manual'
  nome_campanha TEXT,           -- Nome da campanha/extração

  -- Status e Controle
  ativo BOOLEAN DEFAULT true,
  status_negociacao TEXT,       -- Status personalizado por tipo de negócio

  -- Metadata
  dados_completos JSONB,        -- Guarda dados completos da API
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Foreign Keys
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES usuarios(id),
  CONSTRAINT unique_lead_per_user UNIQUE(user_id, numero_formatado)
);

-- Índices para performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_origem ON leads(origem);
CREATE INDEX idx_leads_campanha ON leads(nome_campanha);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_numero ON leads(numero_formatado);
```

### 2.2 Tabela: `tipos_negocio` (Referência)

Define os tipos de negócio e suas métricas customizadas.

```sql
CREATE TABLE tipos_negocio (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome TEXT NOT NULL,
  nome_exibicao TEXT,
  descricao TEXT,
  icone TEXT,
  cor TEXT,

  -- Configurações customizadas
  campos_personalizados JSONB,  -- Campos extras por tipo de negócio
  status_personalizados TEXT[],  -- Status possíveis
  metricas_config JSONB,        -- Quais métricas mostrar no dashboard

  ativo BOOLEAN DEFAULT true,
  ordem INT,
  created_at TIMESTAMP DEFAULT now()
);
```

### 2.3 Exemplo de Dados na Tabela `leads`

```json
{
  "id": 1,
  "user_id": 24,
  "nome_cliente": "João Silva",
  "numero_formatado": "(51) 99902-2949",
  "email_usuario": null,
  "nome_empresa": "MY SELLERS IA",
  "cpf_cnpj": "60489014000142",
  "origem": "Extração de Leads",
  "nome_campanha": "Extração - Setembro 2025",
  "ativo": true,
  "status_negociacao": "novo",
  "dados_completos": {
    "empresa": {
      "cnpj": "60489014000142",
      "razaoSocial": "MY SELLERS IA EM VENDAS LTDA",
      "nomefantasia": null,
      "dataAbertura": "22/04/2025",
      "score": "300",
      "risco": "ALTO RISCO"
    },
    "telefones": [{...}],
    "emails": [],
    "socios": [{...}]
  },
  "created_at": "2025-10-21T14:30:00Z",
  "updated_at": "2025-10-21T14:30:00Z"
}
```

---

## 3. Página de Consulta

### 3.1 Objetivo
Consultar dados de **uma pessoa específica** em tempo real, sem salvar automaticamente.

**URL**: `/consulta`

### 3.2 Fluxo de Funcionamento

```
┌─────────────────────────────────────────┐
│  PÁGINA DE CONSULTA - FLUXO             │
└─────────────────────────────────────────┘

1. Usuário preenche formulário
   - CPF ou CNPJ
   - Tipo Pessoa (PF ou PJ)
   - Critérios adicionais (opcional)

2. Click em "Consultar"
   │
   └─> Backend valida credenciais
   └─> Backend chama Datecode API
   └─> Backend retorna dados

3. Componente exibe dados
   │
   └─> Abas: Geral, Contatos, Endereços, etc
   └─> Mostra informações formatadas
   └─> Botão "Salvar como Lead" (opcional)

4. Usuário pode:
   - Visualizar dados
   - Baixar dados (futuro)
   - Salvar como lead (futuro)
```

### 3.3 Estrutura da Página

```
app/consulta/page.tsx
├── Estado do Formulário
│   ├── document (CPF/CNPJ)
│   ├── tipoPessoa ('PF' | 'PJ')
│   ├── critérios adicionais
│   └── resultado da consulta
│
├── Função: realizarConsulta()
│   ├── Valida input
│   ├── POST /api/datecode/consulta
│   ├── Recebe e armazena resultado
│   └── Atualiza UI
│
└── Componentes Filhos
    ├── <ConsultaResultados />
    │   ├── Abas de resultados
    │   ├── Formatação de dados
    │   └── Botões de ação
    └── <PlanProtection />
        └── Valida se usuário tem créditos
```

### 3.4 Dados Capturados na Consulta

**Para Pessoa Física:**
```javascript
{
  document: "12345678901",           // CPF
  tipoPessoa: "PF",
  // Retorno da API
  nome: "João da Silva",
  dataNascimento: "15/03/1990",
  cpf: "123.456.789-01",
  nacionalidade: "Brasileiro",
  profissao: "Desenvolvedor",

  // Contatos
  telefones: [{ ddd, numero, tipo }],
  emails: [{ email, tipo }],

  // Localização
  enderecos: [{ logradouro, numero, bairro, cidade, uf }],

  // Scores
  score: "750",
  risco: "BAIXO RISCO"
}
```

**Para Pessoa Jurídica:**
```javascript
{
  document: "60489014000142",        // CNPJ
  tipoPessoa: "PJ",
  // Retorno da API
  razaoSocial: "MY SELLERS IA EM VENDAS LTDA",
  nomefantasia: null,
  cnpj: "60.489.014/0001-42",
  dataAbertura: "22/04/2025",

  // Informações da Receita Federal
  porte: "DEMAIS",
  nJur: "2062 - Sociedade Empresária Limitada",
  cnaeCod: "6202300",
  cnaeDesc: "Desenvolvimento e licenciamento de programas de computador",
  capitalSocial: "10000",

  // Sócios e representantes
  socios: [
    {
      cpfCnpj: "02382957026",
      nomeRazaoSocial: "MARCELO FULBER",
      participacao: "33.33",
      qualificacao: "Sócio-Administrador",
      dataNascimentoAbertura: "24/06/1992"
    }
  ],

  // Contatos
  telefones: [],
  emails: [],
  enderecos: [],

  // Risco
  score: "300",
  risco: "ALTO RISCO"
}
```

### 3.5 API Chamada

```
POST /api/datecode/consulta

Request:
{
  "document": "60489014000142",
  "tipoPessoa": "PJ",
  "userId": 24,
  "apiKey": "xxx..."
}

Response:
{
  "success": true,
  "extracao": {
    "empresa": {...},
    "telefones": [...],
    "emails": [...],
    "enderecos": [...],
    "socios": [...],
    "veiculos": [...],
    "funcionarios": [...]
  },
  "usage": {
    "consultasRealizadas": 30,
    "consultasRestantes": 999970,
    "limiteConsultas": 1000000
  }
}
```

---

## 4. Página de Relatórios

### 4.1 Objetivo
Mostrar **análise agregada** de todos os leads salvos, com filtros, gráficos e KPIs.

**URL**: `/relatorios`

### 4.2 Fluxo de Funcionamento

```
┌─────────────────────────────────────────┐
│  PÁGINA DE RELATÓRIOS - FLUXO           │
└─────────────────────────────────────────┘

1. Página carrega
   │
   └─> Busca tipo_negocio do usuário
   └─> Busca configuração do dashboard
   └─> Carrega todos os leads

2. Processa dados
   │
   └─> Filtra por campanhas/origens/período
   └─> Calcula métricas principais
   └─> Agrupa por status
   └─> Monta dados para gráficos

3. Usuário aplica filtros
   │
   ├─> Campanha
   ├─> Origem
   ├─> Status
   ├─> Data início/fim
   └─> Recalcula relatório

4. Exibe visualizações
   │
   ├─> Cards de KPI (números principales)
   ├─> Gráfico de distribuição por status
   ├─> Gráfico de timeline
   ├─> Gráfico de origem dos leads
   └─> Tabela detalhada
```

### 4.3 Estrutura da Página

```
app/relatorios/page.tsx
├── Estado
│   ├── leads: Lead[]
│   ├── campanhas: string[]
│   ├── origens: string[]
│   ├── userTipoNegocio: TipoNegocio
│   ├── dashboardConfig: DashboardConfig
│   └── filters: FiltersState
│
├── Funções de Carregamento
│   ├── fetchUserTipoNegocio()
│   ├── fetchLeads()
│   ├── fetchCampanhas()
│   └── fetchOrigens()
│
├── Funções de Processamento
│   ├── aplicarFiltros(leads)
│   ├── calcularMetricas(filteredLeads)
│   ├── agruparPorStatus(leads)
│   ├── agruparPorOrigem(leads)
│   └── prepararDadosGrafico(leads)
│
└── Componentes de Exibição
    ├── Cards de Métricas
    │   ├── Total de Leads
    │   ├── Novos (últimos 7 dias)
    │   ├── Qualificados
    │   ├── Em Andamento
    │   ├── Fechados
    │   ├── Taxa de Conversão
    │   └── Valor Potencial (futuro)
    │
    ├── Gráficos
    │   ├── Distribuição por Status (Pie Chart)
    │   ├── Leads ao Longo do Tempo (Line Chart)
    │   ├── Origem dos Leads (Bar Chart)
    │   └── Funil de Vendas (Progressão de Status)
    │
    └── Tabelas e Filtros
        ├── Filtros interativos
        └── Tabela de leads com ações
```

### 4.4 Métricas Principais

**KPIs Calculados:**

```javascript
{
  // Números principais
  totalLeads: 150,                    // Total de leads
  leadsNovos: 12,                     // Últimos 7 dias
  leadsQualificados: 45,              // Status qualificado
  leadsEmAndamento: 30,               // Status em andamento
  leadsFechados: 20,                  // Status fechado
  leadsPerdidos: 10,                  // Status perdido

  // Taxas
  taxaConversao: "13.3%",            // fechados / total
  taxaQualificacao: "30%",           // qualificados / total

  // Distribuição
  distribuicaoPorStatus: {
    novo: 43,
    qualificado: 45,
    emAndamento: 30,
    negociacao: 12,
    fechado: 20
  },

  // Origens
  distribuicaoPorOrigem: {
    "Enriquecimento": 80,
    "Extração de Leads": 50,
    "Consulta Manual": 20
  },

  // Campanhas
  topCampanhas: [
    { nome: "Campanha Setembro", total: 50 },
    { nome: "Campanha Outubro", total: 40 }
  ]
}
```

### 4.5 Estrutura de Dados para Gráficos

**Gráfico de Status (Pie Chart):**
```javascript
[
  { name: 'Novo', value: 43, fill: '#3B82F6' },
  { name: 'Qualificado', value: 45, fill: '#10B981' },
  { name: 'Em Andamento', value: 30, fill: '#F59E0B' },
  { name: 'Negociação', value: 12, fill: '#EF4444' },
  { name: 'Fechado', value: 20, fill: '#8B5CF6' }
]
```

**Gráfico de Timeline (Line Chart):**
```javascript
[
  { date: '01/10', total: 5, novo: 3, qualificado: 2 },
  { date: '02/10', total: 8, novo: 4, qualificado: 4 },
  { date: '03/10', total: 12, novo: 5, qualificado: 7 },
  // ... mais dados
]
```

### 4.6 Filtros Disponíveis

```javascript
filters: {
  campanha: '',          // String vazia = todos
  origem: '',            // 'Enriquecimento' | 'Extração' | 'Consulta'
  status: '',            // Status personalizado por tipo negócio
  dataInicio: '',        // YYYY-MM-DD
  dataFim: '',           // YYYY-MM-DD
  cnpj: ''               // Filtro por CNPJ/CPF
}

// Quando algum filtro muda, recalcular tudo:
leads_filtrados = aplicarFiltros(leads, filters)
metricas = calcularMetricas(leads_filtrados)
graficos = prepararGraficos(leads_filtrados)
```

---

## 5. Processo de Salvamento

### 5.1 Salvamento Automático (Enriquecimento)

**Local**: `app/enriquecimento-api/page.tsx` > função `upsertContato()`

**Quando**: Após receber dados da API Datecode

**O que salva**:

```javascript
// Para cada telefone encontrado:
{
  user_id: 24,                        // ID do usuário logado
  nome_cliente: "Marcelo Fulber",     // Nome extraído dos dados
  numero_formatado: "(51) 99902-2949", // Telefone formatado
  email_usuario: email || null,
  nome_empresa: razaoSocial,          // Empresa do CNPJ
  cpf_cnpj: cnpj,                     // CPF ou CNPJ
  nome_campanha: "Campanha Manual",   // Nome da campanha
  origem: "Enriquecimento",           // Origem fixa
  ativo: true,
  dados_completos: {...},             // JSON completo da API
  created_at: new Date().toISOString()
}
```

**Fluxo Completo**:

```javascript
// 1. Usuário faz upload de CNPJs
// 2. Componente processa cada CNPJ
for (let cnpj of cnpjs) {
  // 3. Chama API Datecode
  const dadosEmpresa = await buscarDadosEmpresa(cnpj)

  // 4. Extrai todos os telefones (empresa + sócios)
  const todosOsTelefones = extrairTelefones(dadosEmpresa)

  // 5. Para cada telefone
  for (let telefone of todosOsTelefones) {
    // 6. Verifica se já existe
    const existe = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .eq('numero_formatado', telefone)
      .maybeSingle()

    // 7. Se não existe, salva
    if (!existe) {
      await supabase
        .from('leads')
        .insert({
          user_id: userId,
          nome_cliente: nomePessoa,
          numero_formatado: telefone,
          nome_empresa: nomeEmpresa,
          cpf_cnpj: cnpj,
          nome_campanha: nomeCampanhaDoUsuario,
          origem: 'Enriquecimento',
          dados_completos: dadosEmpresa
        })
    }
  }
}
```

### 5.2 Salvamento Automático (Extração)

**Local**: `components/ExtracaoProgress.tsx` > função `salvarExtracoesNoBanco()`

**Quando**: Quando extraction status = 'Processado' ou 'Finalizada'

**O que faz**:

```javascript
const salvarExtracoesNoBanco = async () => {
  // 1. Busca arquivo de extração
  const fileResponse = await fetch(
    `/api/extracoes/download?idExtracao=${idExtracao}&apiKey=${apiKey}`
  )

  // 2. Parse do CSV (esperado: nome, telefone)
  const csvContent = await fileResponse.text()
  const linhas = csvContent.split('\n')

  // 3. Para cada linha (ignorar cabeçalho)
  for (let i = 1; i < linhas.length; i++) {
    const [nome, telefone] = linhas[i].split(',')

    // 4. Formata telefone
    const numeroFormatado = formatarTelefone(telefone)

    // 5. Verifica duplicata
    const existe = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .eq('numero_formatado', numeroFormatado)
      .maybeSingle()

    // 6. Se não existe, salva
    if (!existe) {
      await supabase
        .from('leads')
        .insert({
          user_id: userId,
          nome_cliente: nome,
          numero_formatado: numeroFormatado,
          nome_campanha: nomeArquivo,    // Nome da extração
          origem: 'Extração de Leads',
          created_at: new Date().toISOString()
        })
    }
  }
}
```

### 5.3 Salvamento Manual (Consulta)

**Local**: `app/consulta/page.tsx` (futuro)

**Quando**: Usuário clica em "Salvar como Lead" após consulta

**O que faz**:

```javascript
const salvarConsultaComoLead = async (resultadoConsulta) => {
  // 1. Extrai dados principais
  const dados = resultadoConsulta.extracao

  // 2. Para cada telefone encontrado
  for (let telefone of dados.telefones) {
    // 3. Valida duplicata
    const existe = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .eq('numero_formatado', telefone.numero_formatado)
      .maybeSingle()

    // 4. Se não existe, salva
    if (!existe) {
      await supabase
        .from('leads')
        .insert({
          user_id: userId,
          nome_cliente: dados.nomeRazaoSocial || dados.nome,
          numero_formatado: telefone.numero_formatado,
          nome_empresa: dados.razaoSocial || null,
          cpf_cnpj: dados.cnpj || dados.cpf,
          nome_campanha: 'Consulta Manual',
          origem: 'Consulta Manual',
          dados_completos: dados
        })
    }
  }
}
```

### 5.4 Lógica de Deduplicação

**Regra**: Um telefone **não pode ser salvo 2x para o MESMO usuário**, mas **pode para usuários diferentes**.

```sql
-- Validação no banco
UNIQUE(user_id, numero_formatado)

-- No código
const existe = await supabase
  .from('leads')
  .select('id')
  .eq('user_id', userId)                    -- ← Por usuário
  .eq('numero_formatado', numeroFormatado)  -- ← E por número
  .maybeSingle()

if (!existe) {
  // Salva apenas se a combinação (user_id, numero) não existir
  await supabase.from('leads').insert({...})
}
```

---

## 6. APIs Envolvidas

### 6.1 API Datecode (Externa)

**Função**: Enriquecer dados de CPF/CNPJ

**Endpoints**:
- `POST /api/datecode/consulta` - Buscar 1 pessoa
- `POST /api/datecode/extracao` - Extrair múltiplas pessoas

**Request**:
```javascript
{
  "document": "60489014000142",
  "tipoPessoa": "PJ"  // ou "PF"
}
```

**Response**:
```javascript
{
  "msg": "Consulta realizada com sucesso.",
  "empresa": { /* dados da empresa */ },
  "telefones": [ /* array de telefones */ ],
  "emails": [ /* array de emails */ ],
  "enderecos": [ /* array de endereços */ ],
  "socios": [ /* array de sócios */ ],
  "funcionarios": [],
  "veiculos": []
}
```

### 6.2 API Interna - `/api/datecode/consulta`

**Função**: Intermediar chamadas à Datecode com validação

**Localização**: `app/api/datecode/consulta/route.ts`

**Request**:
```javascript
{
  "document": "60489014000142",
  "tipoPessoa": "PJ",
  "userId": 24,
  "apiKey": "xxx..."
}
```

**Response**:
```javascript
{
  "success": true,
  "extracao": { /* dados da API */ },
  "usage": {
    "consultasRealizadas": 30,
    "consultasRestantes": 999970
  }
}
```

### 6.3 API Interna - `/api/extracoes`

**Função**: Gerenciar extrações de leads

**Endpoints**:
- `POST /api/extracoes` - Criar extração
- `GET /api/extracoes` - Listar extrações
- `PUT /api/extracoes` - Verificar status
- `GET /api/extracoes/download` - Baixar resultado

### 6.4 API Interna - `/api/users/limits`

**Função**: Buscar limites de consultas

**Request**:
```javascript
GET /api/users/limits?userId=24
```

**Response**:
```javascript
{
  "consultasRealizadas": 30,
  "consultasRestantes": 999970,
  "limiteTotal": 1000000,
  "plano": "enterprise"
}
```

---

## 7. Fluxo Completo - Passo a Passo

### 7.1 Fluxo: Enriquecimento com Salvamento

```
┌──────────────────────────────────────────────────────────┐
│ FLUXO ENRIQUECIMENTO COMPLETO                            │
└──────────────────────────────────────────────────────────┘

1️⃣ USUARIO ACESSA /enriquecimento-api
   └─> Página carrega
   └─> Estado vazio

2️⃣ USUARIO SELECIONA ARQUIVO (XLSX)
   ├─> Upload: teste.xlsx
   ├─> Extração de CNPJs: [60489014000142]
   └─> Estado: etapa = 'enriquecendo'

3️⃣ PROCESSAMENTO CADA CNPJ
   ├─> 1. Chamada API: POST /api/datecode/consulta
   │   └─> Response: { empresa, telefones, emails, socios }
   │
   ├─> 2. Extração de Telefones
   │   ├─> Telefone da empresa: (51) 99902-2949
   │   ├─> Telefones dos sócios: (outros telefones)
   │   └─> Total: 2 telefones
   │
   └─> 3. Para cada telefone:
       ├─> Verificar duplicata
       │   └─> SELECT * FROM leads
       │       WHERE user_id = 24
       │       AND numero_formatado = "(51) 99902-2949"
       │
       └─> Salvar na tabela leads
           └─> INSERT INTO leads {
               user_id: 24,
               nome_cliente: "Marcelo Fulber",
               numero_formatado: "(51) 99902-2949",
               nome_empresa: "MY SELLERS IA",
               cpf_cnpj: "60489014000142",
               nome_campanha: "Campanha Manual",
               origem: "Enriquecimento",
               dados_completos: {...}
           }

4️⃣ INTERFACE MOSTRA RESULTADOS
   ├─> Empresas Processadas: 1
   ├─> Total de Contatos: 2
   ├─> Status: ✅ Concluído
   └─> Botão: "Baixar Leads em Excel"

5️⃣ USUARIO CLICA "BAIXAR LEADS EM EXCEL"
   ├─> Formata dados em 2 abas
   │   ├─> Aba "Empresas": razaoSocial, cnpj, telefone, etc
   │   └─> Aba "Pessoas Físicas": nome, cpf, participacao, etc
   └─> Download: leads_campanha_manual.xlsx

6️⃣ DADOS AGORA EM SUPABASE
   └─> Visível em:
       ├─> Página /relatorios (agregado)
       └─> Tabela "leads" (detalhe)
```

### 7.2 Fluxo: Extração com Salvamento Automático

```
┌──────────────────────────────────────────────────────────┐
│ FLUXO EXTRAÇÃO COM SALVAMENTO AUTOMÁTICO                 │
└──────────────────────────────────────────────────────────┘

1️⃣ USUARIO ACESSA /extracao-leads
   └─> Configura filtros (UF, renda, etc)
   └─> Clica "Iniciar Extração"

2️⃣ EXTRAÇÃO INICIA NA API
   ├─> Modal: "Processando..."
   ├─> Polling a cada 10 segundos
   └─> Status: "Processando" (azul) → "Finalizada" (verde)

3️⃣ EXTRAÇÃO COMPLETA - STATUS = 'PROCESSADO'
   ├─> Modal detecta status = 'Finalizada'
   └─> Trigger automático: salvarExtracoesNoBanco()

4️⃣ SALVAMENTO AUTOMÁTICO INICIA
   ├─> Modal mostra: "Salvando leads no banco de dados..."
   │
   ├─> Função busca arquivo
   │   └─> GET /api/extracoes/download
   │   └─> Retorna CSV com nomes e telefones
   │
   ├─> Parsing linha por linha
   │   ├─> Linha 1: "João Silva, 11987654321"
   │   ├─> Formata: "(11) 98765-4321"
   │   ├─> Verifica: existe com user_id=24?
   │   │   └─> Se não → Salva
   │   │   └─> Se sim → Skip (duplicado)
   │   └─> Próxima linha...
   │
   └─> Resultado:
       ├─> "✅ Salvamento concluído!"
       ├─> "Leads salvos: 45"
       ├─> "Duplicados: 3"
       └─> "Erros: 0"

5️⃣ USUARIO VÊ MENSAGEM DE SUCESSO
   └─> Modal fecha ou mostra sucesso

6️⃣ DADOS APARECEM EM RELATÓRIOS
   └─> /relatorios mostra:
       ├─> +45 novos leads
       ├─> Origem: "Extração de Leads"
       ├─> Campanha: "Extração - Outubro 2025"
       └─> Gráficos atualizam
```

### 7.3 Fluxo: Consulta + Visualização em Relatórios

```
┌──────────────────────────────────────────────────────────┐
│ FLUXO CONSULTA → RELATÓRIO                               │
└──────────────────────────────────────────────────────────┘

1️⃣ USUARIO VÃO PARA /consulta
   ├─> Busca: "60489014000142"
   ├─> Tipo: "PJ"
   └─> Clica "Consultar"

2️⃣ API RETORNA DADOS
   ├─> Empresa: MY SELLERS IA
   ├─> Telefones: 1
   ├─> Sócios: 4
   └─> Exibe em abas

3️⃣ USUARIO VISUALIZA E FECHA
   └─> (Não salva ainda - apenas consulta)

4️⃣ USUARIO VAI PARA /relatorios
   ├─> Vê dados anteriores
   ├─> Campanha: "Extração Setembro"
   │   └─> 45 leads
   └─> Origem: "Enriquecimento"
       └─> 120 leads

5️⃣ APLICA FILTROS
   ├─> Data início: 01/10/2025
   ├─> Data fim: 21/10/2025
   └─> Recalcula:
       ├─> Total: 80 leads
       ├─> Novos: 20
       ├─> Qualificados: 15
       ├─> Gráficos atualizam
       └─> Tabela filtra

6️⃣ EXPORTA DADOS (futuro)
   └─> Download: relatorio_outubro_2025.xlsx
```

---

## 8. Estrutura de Pastas

```
projeto/
├── app/
│   ├── consulta/
│   │   └── page.tsx          ← Página de consulta individual
│   │
│   ├── enriquecimento-api/
│   │   └── page.tsx          ← Página de enriquecimento com salvamento
│   │
│   ├── extracao-leads/
│   │   └── page.tsx          ← Página de extração
│   │
│   ├── relatorios/
│   │   └── page.tsx          ← Página de relatórios
│   │
│   └── api/
│       ├── datecode/
│       │   ├── consulta/
│       │   │   └── route.ts  ← Endpoint consulta individual
│       │   └── extracao/
│       │       └── route.ts  ← Endpoint extração massa
│       │
│       ├── extracoes/
│       │   └── route.ts      ← Endpoints de extração
│       │
│       └── users/
│           └── limits/
│               └── route.ts  ← Endpoint limites
│
├── components/
│   ├── ConsultaResultados.tsx       ← Exibe resultados consulta
│   ├── ExtracaoProgress.tsx         ← Modal extração + salvamento
│   ├── HistoricoContagens.tsx       ← Histórico de extrações
│   ├── ResultadosContagem.tsx       ← Resultados enriquecimento
│   └── ...
│
└── lib/
    └── supabase.ts          ← Tipos e cliente Supabase
```

---

## 9. Checklist de Implementação

### Para Página de Consulta:
- [ ] Formulário com CPF/CNPJ
- [ ] Chamada API `/api/datecode/consulta`
- [ ] Exibição em abas (Geral, Contatos, Endereços, etc)
- [ ] Limite de créditos (PlanProtection)
- [ ] Botão "Salvar como Lead" (futuro)

### Para Página de Relatórios:
- [ ] Carregamento de tipo_negocio do usuário
- [ ] Carregamento de todos os leads
- [ ] Cálculo de métricas (total, novos, qualificados, etc)
- [ ] Cards de KPI
- [ ] Gráfico Pie (distribuição por status)
- [ ] Gráfico Line (timeline)
- [ ] Gráfico Bar (origem)
- [ ] Filtros (campanha, origem, status, período)
- [ ] Tabela com ações
- [ ] Exportação Excel (futuro)

### Para Salvamento:
- [ ] Validar deduplicação (user_id + numero_formatado)
- [ ] Formatar telefone corretamente
- [ ] Salvar dados_completos como JSONB
- [ ] Log detalhado no console
- [ ] Mensagem de sucesso na UI
- [ ] Tratamento de erros

---

## 10. Exemplos de Código

### Exemplo 1: Validar e Formatar Telefone

```typescript
function formatarTelefone(telefone: string): string {
  // Remove tudo que não é número
  const numerico = telefone.replace(/\D/g, '')

  if (numerico.length === 11) {
    // Com 9 dígito: (XX) 9XXXX-XXXX
    return `(${numerico.slice(0, 2)}) ${numerico.slice(2, 7)}-${numerico.slice(7)}`
  } else if (numerico.length === 10) {
    // Sem 9 dígito: (XX) XXXX-XXXX
    return `(${numerico.slice(0, 2)}) ${numerico.slice(2, 6)}-${numerico.slice(6)}`
  }

  return telefone // Retorna original se não conseguir formatar
}
```

### Exemplo 2: Verificar Duplicata e Salvar

```typescript
async function salvarLeadComDeduplicacao(
  userId: number,
  numeroFormatado: string,
  dados: any
) {
  // 1. Verificar se existe
  const { data: existe } = await supabase
    .from('leads')
    .select('id')
    .eq('user_id', userId)
    .eq('numero_formatado', numeroFormatado)
    .maybeSingle()

  if (existe) {
    console.log(`Telefone ${numeroFormatado} já existe para usuário ${userId}`)
    return null
  }

  // 2. Salvar novo
  const { data: novoLead, error } = await supabase
    .from('leads')
    .insert({
      user_id: userId,
      nome_cliente: dados.nome,
      numero_formatado: numeroFormatado,
      nome_campanha: dados.campanha,
      origem: dados.origem,
      dados_completos: dados.completos,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao salvar lead:', error)
    return null
  }

  console.log(`Lead salvo: ${dados.nome} - ${numeroFormatado}`)
  return novoLead
}
```

### Exemplo 3: Calcular Métricas

```typescript
function calcularMetricas(leads: Lead[]) {
  const agora = new Date()
  const seteDisasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)

  const leadsNovos = leads.filter(lead => {
    const criadoEm = new Date(lead.created_at)
    return criadoEm >= seteDisasAtras
  })

  const leadsQualificados = leads.filter(
    lead => lead.status_negociacao === 'qualificado'
  )

  const leadsFechados = leads.filter(
    lead => lead.status_negociacao === 'fechado'
  )

  return {
    totalLeads: leads.length,
    leadsNovos: leadsNovos.length,
    leadsQualificados: leadsQualificados.length,
    leadsFechados: leadsFechados.length,
    taxaConversao: (
      (leadsFechados.length / leads.length) * 100
    ).toFixed(1) + '%'
  }
}
```

---

## 11. Próximas Etapas (Futuro)

- [ ] Implementar "Salvar como Lead" na página de consulta
- [ ] Implementar exportação Excel em relatórios
- [ ] Adicionar filtro por CNPJ em relatórios
- [ ] Implementar status personalizados por tipo de negócio
- [ ] Adicionar funil de vendas em relatórios
- [ ] Implementar webhook de atualização de status
- [ ] Adicionar atribuição de leads a vendedores
- [ ] Implementar follow-up automático

---

**Última atualização**: 21/10/2025
**Versão**: 1.0
**Status**: Documentação Completa
