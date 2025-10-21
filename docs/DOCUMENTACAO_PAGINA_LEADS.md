# 📋 Documentação da Página de Leads

> **Versão**: 1.0
> **Data**: Outubro 2025
> **Status**: Completo
> **Foco**: Campos Personalizados e Boas Práticas

---

## 📑 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura de Campos Personalizados](#2-arquitetura-de-campos-personalizados)
3. [Interface de Campos](#3-interface-de-campos)
4. [Componentes Principais](#4-componentes-principais)
5. [Como Criar Leads Corretamente](#5-como-criar-leads-corretamente)
6. [Tipos de Campos Suportados](#6-tipos-de-campos-suportados)
7. [Adicionando Novos Tipos de Negócio](#7-adicionando-novos-tipos-de-negócio)
8. [Boas Práticas](#8-boas-práticas)
9. [Troubleshooting](#9-troubleshooting)
10. [Referência Técnica](#10-referência-técnica)

---

## 1. Visão Geral

### O que é a Página de Leads?

A página de leads é o **hub central de gerenciamento de contatos e prospectos** no sistema DNX Recuperação de Crédito. Ela funciona como:

- 📱 **Portal de entrada** de novos clientes
- 📊 **Dashboard de análise** com métricas e funil de vendas
- 🎯 **Gerenciador de status** personalizáveis por tipo de negócio
- 💾 **Repositório de dados** estruturado e rastreável

### Localização

```
app/
  └── leads/
      ├── page.tsx          (Componente principal)
      └── layout.tsx        (Layout específico)

components/
  ├── LeadForm.tsx          (Formulário reutilizável)
  └── DynamicFormFields.tsx (Renderização de campos dinâmicos)
```

### Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Criar Lead** | Novo formulário com campos padrão + personalizados |
| **Editar Lead** | Modificar dados existentes |
| **Filtrar Leads** | Por tipo de negócio, status, busca por nome |
| **Dashboard** | Gráficos de funil e métricas |
| **Status Customizável** | Cada tipo de negócio tem seus próprios status |

---

## 2. Arquitetura de Campos Personalizados

### Fluxo de Dados

```mermaid
Banco de Dados (Supabase)
    ↓
┌─────────────────────────────┐
│ tipos_negocio.              │
│ campos_personalizados (JSON)│
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ LeadForm.tsx                │
│ (Carrega tipos do usuário)  │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ DynamicFormFields.tsx       │
│ (Renderiza campos)          │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ leads.dados_personalizados  │
│ (Salva valores JSON)        │
└─────────────────────────────┘
```

### Estrutura no Banco de Dados

#### Tabela `tipos_negocio`

```sql
id               INTEGER       -- ID único
nome             VARCHAR(100)  -- Identificador único (snake_case)
nome_exibicao    VARCHAR(150)  -- Nome bonito para usuário
cor              VARCHAR(7)    -- Cor do badge (#3B82F6)
ativo            BOOLEAN       -- Ativo ou inativo
campos_personalizados JSONB    -- Array de CampoPersonalizado
status_personalizados JSONB    -- Array de status permitidos
created_at       TIMESTAMP     -- Quando foi criado
```

**Exemplo de `campos_personalizados` armazenado:**

```json
[
  {
    "nome": "cpf",
    "label": "CPF do Cliente",
    "tipo": "cpf",
    "obrigatorio": true,
    "ajuda": "Formato: 000.000.000-00"
  },
  {
    "nome": "valor_estimado_divida",
    "label": "Valor Estimado da Dívida",
    "tipo": "number",
    "obrigatorio": false,
    "ajuda": "Valor em reais (R$)"
  },
  {
    "nome": "tipo_divida",
    "label": "Tipo de Dívida",
    "tipo": "select",
    "opcoes": ["Pessoa Física", "Pessoa Jurídica", "Tributária"],
    "obrigatorio": true
  },
  {
    "nome": "historico_negativacao",
    "label": "Histórico de Negativação",
    "tipo": "textarea",
    "obrigatorio": false,
    "ajuda": "Descreva o histórico de negativações"
  }
]
```

#### Tabela `leads`

```sql
id                    BIGSERIAL   -- ID único
user_id               INTEGER     -- Usuário que criou
nome_cliente          VARCHAR     -- Nome do cliente
telefone              VARCHAR     -- Telefone de contato
email_usuario         VARCHAR     -- Email
nome_empresa          VARCHAR     -- Empresa (se aplicável)
tipo_negocio_id       INTEGER     -- FK para tipos_negocio
status_generico       VARCHAR     -- Status customizado
dados_personalizados  JSONB       -- Valores dos campos dinâmicos
created_at            TIMESTAMP   -- Data de criação
updated_at            TIMESTAMP   -- Última atualização
```

**Exemplo de `dados_personalizados` armazenado:**

```json
{
  "cpf": "123.456.789-10",
  "valor_estimado_divida": 5000.00,
  "tipo_divida": "Pessoa Física",
  "historico_negativacao": "Negativado desde 2021 por falta de pagamento"
}
```

---

## 3. Interface de Campos

### Definição TypeScript

```typescript
/**
 * Define um campo personalizável para um tipo de negócio
 */
interface CampoPersonalizado {
  // Identificador único em snake_case (salvo no JSON)
  nome: string;

  // Texto exibido ao usuário no formulário
  label: string;

  // Tipo de validação e renderização
  tipo:
    | "text"
    | "number"
    | "select"
    | "multiselect"
    | "boolean"
    | "date"
    | "textarea"
    | "email"
    | "tel"
    | "cpf"
    | "cnpj";

  // Opções para select/multiselect
  opcoes?: string[];

  // Se deve ser preenchido obrigatoriamente
  obrigatorio: boolean;

  // Texto de ajuda sob o campo
  ajuda?: string;
}
```

### Regras Importantes

| Campo | Regra |
|-------|-------|
| **nome** | Deve ser único dentro do tipo, usar snake_case (ex: `cpf`, `valor_divida`) |
| **label** | Texto legível para o usuário (ex: "CPF do Cliente") |
| **tipo** | Determine a validação e formato |
| **obrigatorio** | `true` força preenchimento antes de salvar |
| **opcoes** | Obrigatório para `select` e `multiselect` |
| **ajuda** | Dica contextual para o usuário |

---

## 4. Componentes Principais

### 4.1 LeadForm.tsx

**Responsabilidade**: Gerenciar a criação e edição de leads com suporte a campos personalizados.

**Props**:
```typescript
interface LeadFormProps {
  tipoNegocioIdInicial?: number;  // Se já sabe o tipo
  leadIdParaEditar?: number;      // Para modo edição
  onSucesso?: (lead: Lead) => void;
}
```

**Fluxo Interno**:

1. **Carregamento** (linhas 79-151)
   - Busca tipos de negócio do usuário
   - Parse JSON automático de `campos_personalizados`
   - Se tem apenas 1 tipo, seleciona automaticamente

2. **Renderização** (linhas 200-582)
   - Campos padrão: nome, telefone, email, origem
   - Tipo de negócio (dropdown)
   - Status (dropdown dinâmico baseado no tipo)
   - Campos personalizados via `<DynamicFormFields />`

3. **Salvamento** (linhas 341-421)
   - Valida campos obrigatórios
   - Monta objeto com `dados_personalizados`
   - Insert ou update na tabela `leads`

**Exemplo de Uso**:

```tsx
import LeadForm from '@/components/forms/LeadForm';

export default function MinhaPage() {
  return (
    <LeadForm
      tipoNegocioIdInicial={1}
      onSucesso={(lead) => {
        console.log('Lead criado:', lead);
        // Recarregar lista, fechar modal, etc
      }}
    />
  );
}
```

### 4.2 DynamicFormFields.tsx

**Responsabilidade**: Renderizar campos de forma dinâmica baseado no array de configuração.

**Props**:
```typescript
interface DynamicFormFieldsProps {
  campos: CampoPersonalizado[];  // Array de campos a renderizar
  valores: Record<string, any>;  // Valores atuais
  onChange: (nome: string, valor: any) => void;  // Callback de mudança
}
```

**Tipos Suportados**:

- ✅ `text` - Campo texto simples
- ✅ `email` - Email com validação HTML5
- ✅ `tel` - Telefone
- ✅ `number` - Número (não permite letras)
- ✅ `date` - Data (picker HTML5)
- ✅ `textarea` - Múltiplas linhas
- ✅ `cpf` - CPF com máscara automática (###.###.###-##)
- ✅ `cnpj` - CNPJ com máscara automática (##.###.###/####-##)
- ✅ `select` - Dropdown (seleciona um)
- ✅ `multiselect` - Checkboxes (seleciona múltiplos)
- ✅ `boolean` - Checkbox simples

**Exemplo de Uso**:

```tsx
import { DynamicFormFields } from '@/components/DynamicFormFields';

const campos: CampoPersonalizado[] = [
  {
    nome: "cpf",
    label: "CPF",
    tipo: "cpf",
    obrigatorio: true
  }
];

const [valores, setValores] = useState({});

function handleMudanca(nome: string, valor: any) {
  setValores(prev => ({
    ...prev,
    [nome]: valor
  }));
}

return (
  <DynamicFormFields
    campos={campos}
    valores={valores}
    onChange={handleMudanca}
  />
);
```

---

## 5. Como Criar Leads Corretamente

### Passo 1: Verificar o Tipo de Negócio

Antes de criar um lead, entenda qual tipo de negócio está usando:

```typescript
// Em app/leads/page.tsx
const [userTipos, setUserTipos] = useState<TipoNegocio[]>([]);

useEffect(() => {
  const carregarTipos = async () => {
    const { data } = await supabase
      .from('user_tipos_negocio')
      .select(`tipos_negocio(...)`)
      .eq('user_id', userId)
      .eq('ativo', true);

    setUserTipos(data?.map(d => ({
      ...d.tipos_negocio,
      campos_personalizados:
        typeof d.tipos_negocio.campos_personalizados === 'string'
          ? JSON.parse(d.tipos_negocio.campos_personalizados)
          : d.tipos_negocio.campos_personalizados || []
    })) || []);
  };

  carregarTipos();
}, [userId]);
```

### Passo 2: Selecionar o Tipo de Negócio

O usuário seleciona qual tipo de negócio o lead pertence:

```tsx
<select
  value={tipoNegocioId || ''}
  onChange={(e) => setTipoNegocioId(Number(e.target.value))}
>
  <option value="">Selecione um tipo de negócio</option>
  {userTipos.map(tipo => (
    <option key={tipo.id} value={tipo.id}>
      {tipo.nome_exibicao}
    </option>
  ))}
</select>
```

### Passo 3: Preencher Dados Padrão

Campos que TODO lead deve ter:

```typescript
const formData = {
  nome_cliente: "João Silva",           // ✅ Obrigatório
  telefone: "(11) 99999-9999",         // ✅ Obrigatório
  email_usuario: "joao@email.com",     // ✅ Obrigatório
  origem: "Indicação",                 // ✅ Obrigatório
  nome_empresa: "Empresa LTDA",        // ❌ Opcional
  tipo_negocio_id: 1,                  // ✅ Obrigatório
  status_generico: "novo_lead",        // ✅ Obrigatório
  dados_personalizados: {}              // ⚠️ Será preenchido no passo 4
};
```

### Passo 4: Preencher Campos Personalizados

A partir do tipo selecionado, o `DynamicFormFields` renderiza campos:

```typescript
const tipoSelecionado = userTipos.find(t => t.id === tipoNegocioId);

if (tipoSelecionado?.campos_personalizados?.length > 0) {
  return (
    <DynamicFormFields
      campos={tipoSelecionado.campos_personalizados}
      valores={formData.dados_personalizados}
      onChange={(nome, valor) => {
        setFormData(prev => ({
          ...prev,
          dados_personalizados: {
            ...prev.dados_personalizados,
            [nome]: valor
          }
        }));
      }}
    />
  );
}
```

### Passo 5: Validar Campos Obrigatórios

Antes de salvar, verificar se todos os campos obrigatórios foram preenchidos:

```typescript
function validarFormulario(): boolean {
  // Campos padrão obrigatórios
  if (!formData.nome_cliente?.trim()) {
    alert('Nome do cliente é obrigatório');
    return false;
  }

  if (!formData.telefone?.trim()) {
    alert('Telefone é obrigatório');
    return false;
  }

  // Campos personalizados obrigatórios
  const tipoSelecionado = userTipos.find(
    t => t.id === formData.tipo_negocio_id
  );

  const camposObrigatorios =
    tipoSelecionado?.campos_personalizados?.filter(c => c.obrigatorio) || [];

  for (const campo of camposObrigatorios) {
    const valor = formData.dados_personalizados[campo.nome];

    if (!valor) {
      alert(`O campo "${campo.label}" é obrigatório`);
      return false;
    }
  }

  return true;
}
```

### Passo 6: Salvar no Banco

```typescript
async function salvarLead() {
  if (!validarFormulario()) return;

  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        user_id: userId,
        nome_cliente: formData.nome_cliente,
        telefone: formData.telefone,
        email_usuario: formData.email_usuario,
        nome_empresa: formData.nome_empresa,
        tipo_negocio_id: formData.tipo_negocio_id,
        status_generico: formData.status_generico,
        dados_personalizados: formData.dados_personalizados  // ✅ JSON salvo aqui
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('Lead criado com sucesso:', data);
    // Recarregar lista, fechar modal, etc
  } catch (error) {
    console.error('Erro ao salvar:', error);
    alert('Erro ao salvar lead. Tente novamente.');
  }
}
```

---

## 6. Tipos de Campos Suportados

### 6.1 Texto Simples (`text`)

**Renderização**:
```tsx
<input
  type="text"
  placeholder="Digite aqui..."
  required={campo.obrigatorio}
/>
```

**Exemplo de Campo**:
```json
{
  "nome": "observacoes",
  "label": "Observações Adicionais",
  "tipo": "text",
  "obrigatorio": false,
  "ajuda": "Informações extras sobre o cliente"
}
```

---

### 6.2 Email (`email`)

**Renderização**:
```tsx
<input
  type="email"
  placeholder="exemplo@email.com"
  required={campo.obrigatorio}
/>
```

**Validação HTML5**: Valida automaticamente formato de email

**Exemplo de Campo**:
```json
{
  "nome": "email_secundario",
  "label": "Email Secundário",
  "tipo": "email",
  "obrigatorio": false
}
```

---

### 6.3 Telefone (`tel`)

**Renderização**:
```tsx
<input
  type="tel"
  placeholder="(11) 99999-9999"
  required={campo.obrigatorio}
/>
```

**Exemplo de Campo**:
```json
{
  "nome": "telefone_comercial",
  "label": "Telefone Comercial",
  "tipo": "tel",
  "obrigatorio": false
}
```

---

### 6.4 Número (`number`)

**Renderização**:
```tsx
<input
  type="number"
  step="0.01"
  min="0"
  required={campo.obrigatorio}
/>
```

**Características**: Permite apenas dígitos, seta para aumentar/diminuir

**Exemplo de Campo**:
```json
{
  "nome": "valor_estimado_divida",
  "label": "Valor Estimado da Dívida (R$)",
  "tipo": "number",
  "obrigatorio": true,
  "ajuda": "Valor em reais"
}
```

---

### 6.5 Data (`date`)

**Renderização**:
```tsx
<input
  type="date"
  required={campo.obrigatorio}
/>
```

**Características**: Abre date picker nativo do navegador

**Exemplo de Campo**:
```json
{
  "nome": "data_negativacao",
  "label": "Data da Negativação",
  "tipo": "date",
  "obrigatorio": true,
  "ajuda": "Quando foi negativado"
}
```

---

### 6.6 Área de Texto (`textarea`)

**Renderização**:
```tsx
<textarea
  rows="3"
  placeholder="Digite..."
  required={campo.obrigatorio}
/>
```

**Exemplo de Campo**:
```json
{
  "nome": "historico_pagamentos",
  "label": "Histórico de Pagamentos",
  "tipo": "textarea",
  "obrigatorio": false,
  "ajuda": "Descreva os últimos pagamentos realizados"
}
```

---

### 6.7 CPF (`cpf`)

**Renderização**:
```tsx
<input
  type="text"
  placeholder="000.000.000-00"
  maxLength="14"
  // Máscara automática aplicada
/>
```

**Características**:
- Máscara automática: `###.###.###-##`
- Remove automaticamente caracteres não-numéricos
- Valida 11 dígitos

**Algoritmo da Máscara**:
```typescript
let valor = e.target.value.replace(/\D/g, '');  // Remove não-dígitos
valor = valor.replace(/(\d{3})(\d)/, '$1.$2');  // 123.456...
valor = valor.replace(/(\d{3})(\d)/, '$1.$2');  // 123.456.789...
valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');  // 123.456.789-10
```

**Exemplo de Campo**:
```json
{
  "nome": "cpf",
  "label": "CPF do Cliente",
  "tipo": "cpf",
  "obrigatorio": true,
  "ajuda": "Formato: 000.000.000-00"
}
```

---

### 6.8 CNPJ (`cnpj`)

**Renderização**:
```tsx
<input
  type="text"
  placeholder="00.000.000/0000-00"
  maxLength="18"
  // Máscara automática aplicada
/>
```

**Características**:
- Máscara automática: `##.###.###/####-##`
- Remove automaticamente caracteres não-numéricos
- Valida 14 dígitos

**Algoritmo da Máscara**:
```typescript
let valor = e.target.value.replace(/\D/g, '');
valor = valor.replace(/(\d{2})(\d)/, '$1.$2');
valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
valor = valor.replace(/(\d{4})(\d)/, '$1/$2');
valor = valor.replace(/(\d{2})(\d)$/, '$1-$2');
```

**Exemplo de Campo**:
```json
{
  "nome": "cnpj_empresa",
  "label": "CNPJ da Empresa",
  "tipo": "cnpj",
  "obrigatorio": true
}
```

---

### 6.9 Select (`select`)

**Renderização**:
```tsx
<select required={campo.obrigatorio}>
  <option value="">Selecione uma opção</option>
  {campo.opcoes?.map(op => (
    <option key={op} value={op}>{op}</option>
  ))}
</select>
```

**Características**: Dropdown de seleção única

**Exemplo de Campo**:
```json
{
  "nome": "tipo_divida",
  "label": "Tipo de Dívida",
  "tipo": "select",
  "opcoes": [
    "Pessoa Física",
    "Pessoa Jurídica",
    "Tributária",
    "Outro"
  ],
  "obrigatorio": true,
  "ajuda": "Selecione o tipo principal"
}
```

---

### 6.10 Múltipla Seleção (`multiselect`)

**Renderização**:
```tsx
{campo.opcoes?.map(op => (
  <label key={op}>
    <input
      type="checkbox"
      value={op}
      checked={valor?.includes(op)}
      onChange={...}
    />
    {op}
  </label>
))}
```

**Características**: Checkboxes múltiplas, armazena como array

**Valores Armazenados**:
```json
{
  "canais_comunicacao": ["WhatsApp", "Email", "SMS"]
}
```

**Exemplo de Campo**:
```json
{
  "nome": "canais_comunicacao",
  "label": "Canais de Comunicação Preferidos",
  "tipo": "multiselect",
  "opcoes": ["WhatsApp", "Email", "SMS", "Ligação"],
  "obrigatorio": false
}
```

---

### 6.11 Booleano (`boolean`)

**Renderização**:
```tsx
<input
  type="checkbox"
  checked={valor === true}
  onChange={(e) => onChange(campo.nome, e.target.checked)}
/>
```

**Características**: Simples true/false

**Exemplo de Campo**:
```json
{
  "nome": "aceita_negociacao",
  "label": "Cliente Aceita Negociação?",
  "tipo": "boolean",
  "obrigatorio": false
}
```

---

## 7. Adicionando Novos Tipos de Negócio

### Método Correto (Sem Tocar em Código)

A grande vantagem do sistema é que você **não precisa mexer em código** para adicionar novos tipos. Tudo é configuração de banco de dados.

### Passo 1: Criar o Tipo de Negócio

Execute este SQL no seu banco Supabase:

```sql
INSERT INTO tipos_negocio (
  nome,
  nome_exibicao,
  cor,
  campos_personalizados,
  status_personalizados,
  ativo
) VALUES (
  'nome_do_tipo',                    -- snake_case
  'Nome de Exibição',               -- Bonito para usuário
  '#FF5733',                        -- Cor do badge (hex)
  '[
    {
      "nome": "campo1",
      "label": "Rótulo Campo 1",
      "tipo": "text",
      "obrigatorio": true,
      "ajuda": "Dica para o usuário"
    },
    {
      "nome": "campo2",
      "label": "Rótulo Campo 2",
      "tipo": "cpf",
      "obrigatorio": false
    }
  ]'::jsonb,
  '[
    "novo_lead",
    "qualificacao",
    "fechado",
    "desqualificado"
  ]'::jsonb,
  true                              -- Ativo
);
```

### Passo 2: Atribuir Usuários (Opcional)

Se o tipo não for para TODOS os usuários, atribua específicos:

```sql
-- Atribuir tipo ao usuário ID 5
INSERT INTO user_tipos_negocio (
  user_id,
  tipo_negocio_id,
  ativo
) VALUES (
  5,                                    -- ID do usuário
  (SELECT id FROM tipos_negocio
   WHERE nome = 'nome_do_tipo'),       -- ID do tipo
  true
);
```

### Passo 3: Testar

1. Faça login com a conta
2. Vá para página de leads
3. Clique em "Novo Lead"
4. O novo tipo deve aparecer no dropdown
5. Preencha os campos personalizados
6. Salve e confirme que funcionou

### Exemplo Prático: Tipo "Limpeza de Nome"

```sql
INSERT INTO tipos_negocio (
  nome,
  nome_exibicao,
  cor,
  campos_personalizados,
  status_personalizados,
  ativo
) VALUES (
  'limpeza_nome',
  'Limpeza de Nome',
  '#3B82F6',
  '[
    {
      "nome": "cpf",
      "label": "CPF",
      "tipo": "cpf",
      "obrigatorio": true,
      "ajuda": "Formato: 000.000.000-00"
    },
    {
      "nome": "valor_divida",
      "label": "Valor da Dívida (R$)",
      "tipo": "number",
      "obrigatorio": true,
      "ajuda": "Valor em reais"
    },
    {
      "nome": "data_negativacao",
      "label": "Data da Negativação",
      "tipo": "date",
      "obrigatorio": true
    },
    {
      "nome": "tipo_divida",
      "label": "Tipo de Dívida",
      "tipo": "select",
      "opcoes": ["Cartão de Crédito", "Empréstimo", "Débito", "Outro"],
      "obrigatorio": true
    },
    {
      "nome": "banco_negativador",
      "label": "Banco Negativador",
      "tipo": "text",
      "obrigatorio": false,
      "ajuda": "Qual banco/instituição fez a negativação"
    },
    {
      "nome": "observacoes",
      "label": "Observações",
      "tipo": "textarea",
      "obrigatorio": false,
      "ajuda": "Informações adicionais sobre o caso"
    }
  ]'::jsonb,
  '[
    "novo_lead",
    "qualificacao_pendente",
    "enviado_para_negociacao",
    "negociacao_em_andamento",
    "nome_limpo",
    "nao_conseguiu_limpar",
    "desistiu"
  ]'::jsonb,
  true
);
```

---

## 8. Boas Práticas

### ✅ FAÇA

#### 1. Use nomes descritivos para campos

```json
// ✅ BOM
{
  "nome": "valor_estimado_divida",
  "label": "Valor Estimado da Dívida"
}

// ❌ RUIM
{
  "nome": "vl",
  "label": "Valor"
}
```

#### 2. Sempre forneça rótulos claros

```json
// ✅ BOM
{
  "label": "CPF do Cliente (com pontuação)"
}

// ❌ RUIM
{
  "label": "CPF"
}
```

#### 3. Use tipos específicos para validação

```json
// ✅ BOM
{
  "nome": "data_negativacao",
  "tipo": "date"
}

// ❌ RUIM - Deixa o usuário digitar errado
{
  "nome": "data_negativacao",
  "tipo": "text"
}
```

#### 4. Adicione ajuda contextual para campos complexos

```json
// ✅ BOM
{
  "nome": "valor_divida",
  "label": "Valor da Dívida",
  "tipo": "number",
  "ajuda": "Valor em reais (R$). Se não sabe, deixe em branco."
}

// ❌ RUIM
{
  "nome": "valor_divida",
  "label": "Valor"
}
```

#### 5. Valide com campos obrigatórios

```json
// ✅ BOM
{
  "nome": "cpf",
  "label": "CPF",
  "tipo": "cpf",
  "obrigatorio": true
}

// ❌ RUIM - Campo importante mas opcionalmente preenchido
{
  "nome": "cpf",
  "obrigatorio": false
}
```

#### 6. Parse JSON com fallback

```typescript
// ✅ BOM
const campos = typeof dados.campos_personalizados === 'string'
  ? JSON.parse(dados.campos_personalizados)
  : dados.campos_personalizados || [];

// ❌ RUIM - Quebra se for string
const campos = dados.campos_personalizados;
```

---

### ❌ EVITE

#### 1. Não coloque lógica complexa em validação

```json
// ❌ EVITAR
{
  "nome": "valor_com_logica_complexa",
  "tipo": "text",
  "validacao": "valor > 100 && valor < 10000"
}
```

Validações complexas devem estar no backend ou em handlers JavaScript específicos.

#### 2. Não misture JSON e tipos primitivos

```typescript
// ❌ RUIM - Às vezes é string, às vezes é array
if (typeof dados === 'string') {
  // Faz X
} else {
  // Faz Y
}

// ✅ BOM - Sempre normaliza
const dados = typeof dados === 'string'
  ? JSON.parse(dados)
  : dados || [];
```

#### 3. Não crie tipos de negócio sem estrutura

```json
// ❌ EVITAR - Sem campos, sem status
{
  "nome": "tipo_vazio",
  "campos_personalizados": [],
  "status_personalizados": []
}
```

#### 4. Não use caracteres especiais em nomes de campos

```json
// ❌ RUIM
{
  "nome": "campo com espaço",
  "nome": "campo-com-hífen",
  "nome": "campo@com#caracteres"
}

// ✅ BOM
{
  "nome": "campo_com_underline",
  "nome": "campoComCamelCase"
}
```

#### 5. Não confie apenas em validação frontend

```typescript
// ❌ RUIM - Confia apenas no frontend
if (validarFormulario()) {
  salvarDados();
}

// ✅ BOM - Valida também no backend
const validarBackend = async (dados) => {
  const response = await fetch('/api/leads/validar', {
    method: 'POST',
    body: JSON.stringify(dados)
  });
  return response.json();
};
```

---

## 9. Troubleshooting

### Problema: Campos não aparecem no formulário

**Causa Provável**: JSON mal formatado em `campos_personalizados`

**Solução**:
```typescript
try {
  const campos = JSON.parse(dadosJSON);
  console.log('Campos parseados:', campos);
} catch (error) {
  console.error('JSON inválido:', error);
}
```

Verifique se o JSON está válido usando [jsonlint.com](https://www.jsonlint.com/)

---

### Problema: Valores não salvam corretamente

**Causa Provável**: `dados_personalizados` não está sendo enviado corretamente

**Solução**:
```typescript
// Adicione log antes de salvar
console.log('Enviando dados_personalizados:', formData.dados_personalizados);

// Confirme que é um objeto válido
const isValido = typeof formData.dados_personalizados === 'object' &&
                 formData.dados_personalizados !== null;

if (!isValido) {
  console.error('dados_personalizados inválido');
  return;
}
```

---

### Problema: Máscara de CPF/CNPJ não funciona

**Causa Provável**: Função de máscara não está sendo chamada no onChange

**Solução**:
```typescript
// Verificar se o onChange está chamando a função corretamente
const handleCpfChange = (e) => {
  let valor = e.target.value.replace(/\D/g, '');
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
  valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

  onChange(campo.nome, valor);
};
```

---

### Problema: Status não aparecem no formulário

**Causa Provável**: `status_personalizados` não corresponde ao tipo selecionado

**Solução**:
```typescript
const tipoSelecionado = userTipos.find(t => t.id === tipoNegocioId);
const statusDisponiveis =
  tipoSelecionado?.status_personalizados || [];

if (statusDisponiveis.length === 0) {
  console.warn('Nenhum status disponível para este tipo');
}
```

---

### Problema: Erro ao salvar "dados_personalizados inválido"

**Causa Provável**: Supabase não consegue serializar o objeto

**Solução**:
```typescript
// Certifique-se que todos os valores são serializáveis
const dados_personalizados = {
  cpf: "123.456.789-10",        // ✅ String
  valor: 1000,                   // ✅ Number
  aceita: true,                  // ✅ Boolean
  data: "2025-10-21",           // ✅ String ISO
  opcoes: ["op1", "op2"]        // ✅ Array
  // ❌ NÃO use: Funções, Dates diretos, undefined
};
```

---

## 10. Referência Técnica

### Arquivos Importantes

| Arquivo | Responsabilidade |
|---------|-----------------|
| `app/leads/page.tsx` | Página principal com dashboard |
| `components/forms/LeadForm.tsx` | Formulário reutilizável |
| `components/DynamicFormFields.tsx` | Renderização dinâmica |
| `lib/supabase.ts` | Tipos TypeScript e configuração |
| `docs/PLANO_FORMULARIOS_DINAMICOS.md` | Plano de implementação |

### Funções Úteis

#### Parse JSON com Fallback

```typescript
function parseJSON<T>(data: any, fallback: T): T {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data || fallback;
  } catch {
    return fallback;
  }
}

// Uso
const campos = parseJSON(tipo.campos_personalizados, []);
```

#### Validar Campo Obrigatório

```typescript
function ehValido(valor: any, tipo: string): boolean {
  if (valor === undefined || valor === null) return false;
  if (typeof valor === 'string' && valor.trim() === '') return false;
  if (Array.isArray(valor) && valor.length === 0) return false;
  return true;
}

// Uso
if (!ehValido(formData.cpf, 'cpf')) {
  alert('CPF é obrigatório');
}
```

#### Formatar CPF para Exibição

```typescript
function formatarCPF(cpf: string): string {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
```

### Queries SQL Úteis

#### Buscar Tipos de um Usuário

```sql
SELECT DISTINCT tn.*
FROM tipos_negocio tn
INNER JOIN user_tipos_negocio utn ON tn.id = utn.tipo_negocio_id
WHERE utn.user_id = $1 AND utn.ativo = true AND tn.ativo = true
ORDER BY utn.ordem DESC;
```

#### Buscar Leads com Dados Personalizados

```sql
SELECT
  id,
  nome_cliente,
  telefone,
  tipo_negocio_id,
  dados_personalizados,
  created_at
FROM leads
WHERE user_id = $1 AND tipo_negocio_id = $2
ORDER BY created_at DESC
LIMIT 50;
```

#### Atualizar Campo Personalizado

```sql
UPDATE leads
SET dados_personalizados = jsonb_set(
  dados_personalizados,
  '{cpf}',
  to_jsonb($1)
)
WHERE id = $2;
```

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- [DOCUMENTACAO_FLUXO_COMPLETO.md](DOCUMENTACAO_FLUXO_COMPLETO.md) - Fluxo completo do sistema
- [IMPLEMENTACAO_SISTEMA_EXTRACAO_LEADS.md](IMPLEMENTACAO_SISTEMA_EXTRACAO_LEADS.md) - Sistema de extração
- [PLANO_FORMULARIOS_DINAMICOS.md](PLANO_FORMULARIOS_DINAMICOS.md) - Planejamento técnico

### Links Úteis

- [Supabase JSON Documentation](https://supabase.com/docs/reference/javascript/generated/json_query_operators)
- [React Hook Form](https://react-hook-form.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Contato e Suporte

Para dúvidas ou melhorias, consulte:
- **Responsável**: Desenvolvedor Senior
- **Último Update**: Outubro 2025
- **Versão da Documentação**: 1.0

---

**Última atualização**: 21 de outubro de 2025
**Versão**: 1.0
**Status**: ✅ Completo e Pronto para Uso
