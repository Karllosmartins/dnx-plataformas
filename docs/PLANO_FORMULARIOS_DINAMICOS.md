# Plano de Implementação: Sistema 100% Dinâmico de Formulários

> **Objetivo:** Eliminar todo código hardcoded relacionado a tipos de negócio e criar sistema completamente dinâmico baseado em `campos_personalizados` do banco de dados.

---

## 📋 Status Atual

### ✅ O que já foi feito:
1. Dashboard filtra leads por `tipo_negocio_id` corretamente
2. IDs de tipo de negócio não são mais hardcoded (usam ID real do banco)
3. Status inicial usa primeiro `status_personalizado` do tipo
4. Componente `DynamicFormFields.tsx` criado e funcional

### ❌ O que ainda está hardcoded:
1. **Modal de criação de leads** (`app/leads/page.tsx` linhas 141-570)
   - Campos diferentes para cada tipo (B2B, Previdenciário, Limpa Nome)
   - Múltiplos `if (userTipoNegocio?.nome === 'b2b')` espalhados
   - Formulário tem 300+ linhas de código repetido

2. **Função de criar leads de exemplo** (`app/leads/page.tsx`)
   - Usa `tipo_negocio_id: 1` fixo
   - Campos hardcoded de limpa_nome
   - Não respeita tipo do usuário

3. **Opções de origem** (linhas 419-448)
   - Diferentes opções para cada tipo
   - Hardcoded no JSX

---

## 🎯 Plano de Ação

### **Fase 1: Refatorar Modal de Leads**
**Arquivo:** `app/leads/page.tsx`

#### 1.1. Simplificar State do Formulário
```typescript
// ANTES (14 campos fixos)
const [formData, setFormData] = useState({
  nome_cliente: '',
  cpf: '',
  cpf_cnpj: '',
  nome_empresa: '',
  telefone: '',
  origem: 'WhatsApp',
  tipo_consulta_interesse: 'Consulta Rating',
  valor_estimado_divida: '',
  tempo_negativado: '',
  segmento_empresa: '',
  porte_empresa: 'pequena'
})

// DEPOIS (apenas campos básicos)
const [formData, setFormData] = useState({
  nome_cliente: '',
  telefone: '',
  origem: 'WhatsApp'
})
const [camposPersonalizados, setCamposPersonalizados] = useState({})
```

#### 1.2. Usar Componente Dinâmico
```typescript
// Substituir 300+ linhas de JSX condicional por:
<DynamicFormFields
  campos={userTipoNegocio?.campos_personalizados || []}
  valores={camposPersonalizados}
  onChange={(nome, valor) => {
    setCamposPersonalizados(prev => ({ ...prev, [nome]: valor }))
  }}
/>
```

#### 1.3. Atualizar handleSubmit
```typescript
const leadData = {
  user_id: parseInt(userId),
  nome_cliente: formData.nome_cliente,
  telefone: formData.telefone,
  origem: formData.origem,
  status_generico: userTipoNegocio.status_personalizados[0],
  tipo_negocio_id: userTipoNegocio.id,
  dados_personalizados: camposPersonalizados // Todo o resto vai aqui
}
```

#### 1.4. Tornar Origem Dinâmica
Adicionar campo `origens_padrao` na tabela `tipos_negocio`:
```sql
ALTER TABLE tipos_negocio
ADD COLUMN origens_padrao JSONB DEFAULT '["WhatsApp", "Site", "Indicação", "Telefone", "Facebook", "Instagram", "Google", "Outros"]'::jsonb;
```

---

### **Fase 2: Corrigir Função "Criar Leads de Exemplo"**
**Arquivo:** `app/leads/page.tsx`

#### 2.1. Localizar Função
Buscar por `CreateSampleLeads` ou similar nos logs

#### 2.2. Tornar Dinâmica
```typescript
// ANTES
const sampleLeads = [
  {
    user_id: userId,
    tipo_negocio_id: 1, // ❌ HARDCODED
    status_limpa_nome: 'qualificacao', // ❌ Campo específico
    // ... campos fixos de limpa_nome
  }
]

// DEPOIS
const sampleLeads = [
  {
    user_id: userId,
    tipo_negocio_id: userTipoNegocio.id, // ✅ Dinâmico
    status_generico: userTipoNegocio.status_personalizados[1], // ✅ Dinâmico
    dados_personalizados: {} // ✅ Genérico
  }
]
```

---

### **Fase 3: Adicionar Campos Padrão aos Tipos Existentes**
**Arquivo:** `sql/migration_add_campos_padrao_tipos.sql`

#### 3.1. Adicionar Campos Comuns
```json
{
  "nome": "cpf",
  "label": "CPF",
  "tipo": "cpf",
  "obrigatorio": false
}
```

#### 3.2. MCMV Imóveis (exemplo)
```sql
UPDATE tipos_negocio
SET campos_personalizados = '[
  {
    "nome": "cpf",
    "label": "CPF do Cliente",
    "tipo": "cpf",
    "obrigatorio": true
  },
  {
    "nome": "renda_familiar",
    "label": "Renda Familiar Mensal",
    "tipo": "number",
    "obrigatorio": true,
    "ajuda": "Informar renda total da família"
  },
  {
    "nome": "cidade_interesse",
    "label": "Cidade de Interesse",
    "tipo": "text",
    "obrigatorio": true
  },
  {
    "nome": "valor_imovel",
    "label": "Faixa de Valor do Imóvel",
    "tipo": "select",
    "opcoes": ["ate_240mil", "240mil_350mil", "acima_350mil"],
    "obrigatorio": true
  },
  {
    "nome": "possui_fgts",
    "label": "Possui FGTS para utilizar?",
    "tipo": "select",
    "opcoes": ["sim", "nao", "nao_sei"],
    "obrigatorio": false
  }
]'::jsonb
WHERE nome = 'mcmv_imoveis';
```

---

### **Fase 4: Atualizar Componente DynamicFormFields**
**Arquivo:** `components/DynamicFormFields.tsx`

#### 4.1. Adicionar Novos Tipos de Campo
- ✅ `text`, `email`, `tel` - Já implementado
- ✅ `cpf`, `cnpj` - Já implementado
- ✅ `number`, `date`, `textarea` - Já implementado
- ✅ `select`, `multiselect` - Já implementado
- ⚠️ `currency` - Adicionar (formato R$ 0,00)
- ⚠️ `phone` - Adicionar (máscara telefone brasileiro)
- ⚠️ `cep` - Adicionar (máscara 00000-000)

#### 4.2. Melhorar Validações
- Adicionar validação de CPF válido
- Adicionar validação de CNPJ válido
- Adicionar validação de email
- Suportar validações customizadas via regex

---

### **Fase 5: Testar com Todos os Tipos**
**Checklist de testes:**

- [ ] Limpa Nome
  - [ ] Dashboard mostra apenas leads deste tipo
  - [ ] Formulário renderiza campos corretos
  - [ ] Criar lead funciona
  - [ ] Leads de exemplo funcionam

- [ ] Previdenciário
  - [ ] Dashboard mostra apenas leads deste tipo
  - [ ] Formulário renderiza campos corretos
  - [ ] Criar lead funciona
  - [ ] Leads de exemplo funcionam

- [ ] B2B
  - [ ] Dashboard mostra apenas leads deste tipo
  - [ ] Formulário renderiza campos corretos
  - [ ] Criar lead funciona
  - [ ] Leads de exemplo funcionam

- [ ] MCMV Imóveis (novo tipo personalizado)
  - [ ] Dashboard mostra apenas leads deste tipo
  - [ ] Formulário renderiza campos personalizados
  - [ ] Criar lead funciona
  - [ ] Todos os campos são salvos corretamente

- [ ] Qualquer Novo Tipo (teste final)
  - [ ] Criar tipo novo no admin
  - [ ] Definir campos_personalizados
  - [ ] Criar usuário com este tipo
  - [ ] Verificar se tudo funciona SEM mexer no código

---

## 🔧 Arquivos que Serão Modificados

### Principais:
1. ✅ `components/DynamicFormFields.tsx` - Já criado
2. ⚠️ `app/leads/page.tsx` - Refatorar completamente modal (linhas 141-570)
3. ⚠️ `app/leads/page.tsx` - Corrigir função criar leads de exemplo
4. ⚠️ `sql/migration_add_origens_tipos.sql` - Adicionar campo origens_padrao
5. ⚠️ `sql/migration_update_campos_mcmv.sql` - Adicionar campos ao MCMV

### Secundários:
6. `components/DynamicFormFields.tsx` - Adicionar tipos currency, phone, cep
7. `app/page.tsx` - Já corrigido ✅
8. `app/api/*/route.ts` - Já corrigido ✅

---

## 📊 Estimativa de Trabalho

| Fase | Tempo Estimado | Complexidade |
|------|---------------|--------------|
| Fase 1 | ~30 min | Média |
| Fase 2 | ~10 min | Baixa |
| Fase 3 | ~15 min | Baixa |
| Fase 4 | ~20 min | Média |
| Fase 5 | ~30 min | Alta |
| **TOTAL** | **~1h 45min** | - |

---

## 🎯 Resultado Final Esperado

### Antes (sistema atual):
```typescript
// Para adicionar novo tipo de negócio:
// 1. Editar app/leads/page.tsx
// 2. Adicionar if (tipo === 'novo_tipo')
// 3. Criar campos específicos no JSX
// 4. Atualizar handleSubmit com novo case
// 5. Atualizar função de exemplo
// TOTAL: ~100 linhas de código por tipo
```

### Depois (sistema dinâmico):
```sql
-- Para adicionar novo tipo de negócio:
-- 1. INSERT no banco com campos_personalizados em JSON
-- FIM! Zero linhas de código.
```

**Benefício:** Qualquer pessoa pode criar novos tipos de negócio pelo admin sem precisar de desenvolvedor!

---

## 🚨 Pontos de Atenção

1. **Backward Compatibility:** Manter compatibilidade com leads antigos que usam campos antigos
2. **Migração de Dados:** Leads existentes podem ter dados em campos diferentes
3. **Validações:** Garantir que campos obrigatórios sejam validados
4. **Performance:** Não fazer queries desnecessárias ao carregar tipos
5. **UX:** Formulário deve ser intuitivo mesmo com campos dinâmicos

---

## 📝 Próximos Passos

1. ✅ Criar este plano
2. ⏳ **Commit e push do plano**
3. ⏳ Implementar Fase 1
4. ⏳ Implementar Fase 2
5. ⏳ Implementar Fase 3
6. ⏳ Implementar Fase 4
7. ⏳ Implementar Fase 5
8. ⏳ Documentar uso para outros desenvolvedores

---

**Criado em:** 2025-01-19
**Autor:** Claude Code
**Status:** Planejamento concluído, aguardando implementação
