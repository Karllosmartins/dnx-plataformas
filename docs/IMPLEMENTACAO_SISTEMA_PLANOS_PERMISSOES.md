# Documentação: Sistema de Planos e Permissões

> **Criado em**: 2025-10-11
> **Versão**: 1.0
> **Objetivo**: Instruir a implementação de um sistema completo de planos, permissões por feature, gerenciamento de usuários e tipos de negócio

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Database Schema](#3-database-schema)
4. [Backend - APIs](#4-backend---apis)
5. [Frontend - Páginas Administrativas](#5-frontend---páginas-administrativas)
6. [Sistema de Permissões](#6-sistema-de-permissões)
7. [Integração com Sidebar](#7-integração-com-sidebar)
8. [Tipos de Negócio](#8-tipos-de-negócio)
9. [Credenciais por Usuário](#9-credenciais-por-usuário)
10. [Ferramentas (Tools) por Usuário](#10-ferramentas-tools-por-usuário)
11. [Fluxo Completo de Uso](#11-fluxo-completo-de-uso)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Visão Geral

### 1.1 O que é este Sistema?

Este é um **sistema de controle de acesso baseado em planos (RBAC - Role-Based Access Control)** que permite:

- ✅ Definir **planos** com diferentes níveis de acesso
- ✅ Cada plano possui **permissões granulares** (acesso a features específicas)
- ✅ **Limites de uso** (leads, consultas, instâncias)
- ✅ **Planos customizados** por usuário (overrides personalizados)
- ✅ **Tipos de negócio** multi-seleção por usuário
- ✅ **Credenciais específicas** por usuário (APIs, integrações)
- ✅ **Ferramentas (tools)** atribuídas por usuário

### 1.2 Funcionalidades Principais

#### Para Administradores:
- Criar, editar e excluir planos
- Definir permissões por feature em cada plano
- Atribuir planos aos usuários
- Configurar limites personalizados por usuário
- Gerenciar tipos de negócio disponíveis
- Atribuir tipos de negócio aos usuários
- Configurar credenciais específicas por usuário
- Ativar/desativar ferramentas por usuário

#### Para Usuários:
- Visualizar apenas as features permitidas pelo plano
- Sidebar dinâmica baseada em permissões
- Limites de uso (leads, consultas) baseados no plano
- Acesso a múltiplos tipos de negócio simultaneamente

---

## 2. Arquitetura do Sistema

### 2.1 Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE PLANOS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐   ┌───────────────┐ │
│  │   PLANOS     │───▶│    USERS     │──▶│     VIEW      │ │
│  │  (tabela)    │    │  (plano_id)  │   │view_usuarios_ │ │
│  │              │    │              │   │    planos     │ │
│  └──────────────┘    └──────────────┘   └───────────────┘ │
│         │                   │                              │
│         │                   ├─────────┐                    │
│         ▼                   ▼         ▼                    │
│  ┌──────────────┐    ┌──────────┐  ┌──────────────────┐  │
│  │ PERMISSÕES   │    │  TIPOS   │  │   CREDENCIAIS    │  │
│  │ (por feature)│    │  NEGÓCIO │  │  (por usuário)   │  │
│  └──────────────┘    └──────────┘  └──────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Fluxo de Verificação de Permissões

```
User Login
    │
    ▼
Buscar dados da view_usuarios_planos
    │
    ▼
Carregar permissões do plano
    │
    ▼
Verificar overrides customizados (plano_customizado)
    │
    ▼
Filtrar itens da sidebar baseado em permissões
    │
    ▼
Renderizar apenas features permitidas
```

---

## 3. Database Schema

### 3.1 Tabela `planos`

Esta tabela define os planos disponíveis no sistema.

**SQL de Criação:**

```sql
CREATE TABLE IF NOT EXISTS public.planos (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,

  -- Controles de acesso (features)
  acesso_dashboard BOOLEAN DEFAULT TRUE,
  acesso_crm BOOLEAN DEFAULT TRUE,
  acesso_whatsapp BOOLEAN DEFAULT TRUE,
  acesso_disparo_simples BOOLEAN DEFAULT TRUE,
  acesso_disparo_ia BOOLEAN DEFAULT FALSE,
  acesso_agentes_ia BOOLEAN DEFAULT FALSE,
  acesso_extracao_leads BOOLEAN DEFAULT FALSE,
  acesso_enriquecimento BOOLEAN DEFAULT FALSE,
  acesso_consulta BOOLEAN DEFAULT FALSE,
  acesso_usuarios BOOLEAN DEFAULT FALSE,
  acesso_integracoes BOOLEAN DEFAULT TRUE,
  acesso_arquivos BOOLEAN DEFAULT FALSE,

  -- Limites
  limite_leads INTEGER DEFAULT 1000,
  limite_consultas INTEGER DEFAULT 100,
  limite_instancias INTEGER DEFAULT 1,

  -- Metadados
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_planos_ativo ON public.planos(ativo);
CREATE INDEX IF NOT EXISTS idx_planos_nome ON public.planos(nome);
```

**Campos de Permissão:**

| Campo | Descrição |
|-------|-----------|
| `acesso_dashboard` | Acesso à página de dashboard |
| `acesso_crm` | Acesso ao CRM (gestão de leads) |
| `acesso_whatsapp` | Acesso à funcionalidade WhatsApp |
| `acesso_disparo_simples` | Disparo de mensagens simples |
| `acesso_disparo_ia` | Disparo de mensagens com IA |
| `acesso_agentes_ia` | Acesso a agentes IA |
| `acesso_extracao_leads` | Extração de leads |
| `acesso_enriquecimento` | Enriquecimento de dados |
| `acesso_consulta` | Consulta de dados |
| `acesso_usuarios` | Gerenciamento de usuários (admin) |
| `acesso_integracoes` | Página de integrações |
| `acesso_arquivos` | Gestão de arquivos |

**Inserir Planos Padrão:**

```sql
INSERT INTO public.planos (
  nome, descricao,
  acesso_dashboard, acesso_crm, acesso_whatsapp, acesso_disparo_simples,
  acesso_disparo_ia, acesso_agentes_ia, acesso_extracao_leads,
  acesso_enriquecimento, acesso_consulta, acesso_usuarios,
  acesso_integracoes, acesso_arquivos,
  limite_leads, limite_consultas, limite_instancias
) VALUES
-- Plano Básico
(
  'basico',
  'Acesso ao dashboard, CRM, WhatsApp e disparo simples',
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE,
  TRUE, FALSE,
  1000, 100, 1
),
-- Plano Premium 1 (IA)
(
  'premium1',
  'Acesso completo com IA e agentes',
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, FALSE,
  FALSE, FALSE, FALSE,
  TRUE, FALSE,
  5000, 500, 3
),
-- Plano Premium 2 (Extração)
(
  'premium2',
  'Acesso com extração de leads',
  TRUE, TRUE, TRUE, TRUE,
  FALSE, FALSE, TRUE,
  FALSE, FALSE, FALSE,
  TRUE, FALSE,
  5000, 500, 3
),
-- Plano Enterprise
(
  'enterprise',
  'Acesso completo a todas as funcionalidades',
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE,
  TRUE, TRUE,
  50000, 5000, 10
)
ON CONFLICT (nome) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  acesso_dashboard = EXCLUDED.acesso_dashboard,
  acesso_crm = EXCLUDED.acesso_crm,
  acesso_whatsapp = EXCLUDED.acesso_whatsapp,
  acesso_disparo_simples = EXCLUDED.acesso_disparo_simples,
  acesso_disparo_ia = EXCLUDED.acesso_disparo_ia,
  acesso_agentes_ia = EXCLUDED.acesso_agentes_ia,
  acesso_extracao_leads = EXCLUDED.acesso_extracao_leads,
  acesso_enriquecimento = EXCLUDED.acesso_enriquecimento,
  acesso_consulta = EXCLUDED.acesso_consulta,
  acesso_usuarios = EXCLUDED.acesso_usuarios,
  acesso_integracoes = EXCLUDED.acesso_integracoes,
  acesso_arquivos = EXCLUDED.acesso_arquivos,
  limite_leads = EXCLUDED.limite_leads,
  limite_consultas = EXCLUDED.limite_consultas,
  limite_instancias = EXCLUDED.limite_instancias,
  updated_at = NOW();
```

### 3.2 Alterações na Tabela `users`

Adicionar campos relacionados ao sistema de planos:

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plano_id BIGINT REFERENCES public.planos(id),
ADD COLUMN IF NOT EXISTS plano_customizado JSONB,
ADD COLUMN IF NOT EXISTS limite_leads INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS limite_consultas INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS leads_consumidos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consultas_realizadas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_instancias INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ultimo_reset_contagem TIMESTAMP WITH TIME ZONE;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_plano_id ON public.users(plano_id);
```

**Campos Importantes:**

| Campo | Descrição |
|-------|-----------|
| `plano_id` | Foreign key para a tabela `planos` |
| `plano_customizado` | JSONB com overrides de permissões específicas |
| `limite_leads` | Limite personalizado de leads (override do plano) |
| `limite_consultas` | Limite personalizado de consultas |
| `leads_consumidos` | Contador de leads já consumidos |
| `consultas_realizadas` | Contador de consultas realizadas |
| `numero_instancias` | Número de instâncias permitidas |

### 3.3 View `view_usuarios_planos`

Esta view combina dados dos usuários com as permissões dos planos:

```sql
CREATE OR REPLACE VIEW public.view_usuarios_planos AS
SELECT
    u.id,
    u.name,
    u.email,
    u.cpf,
    u.telefone,
    u.role,
    u.active,
    u.limite_leads,
    u.limite_consultas,
    u.leads_consumidos,
    u.consultas_realizadas,
    u.plano_id,
    u.plano,
    u.numero_instancias,
    u.plano_customizado,
    u.ultimo_reset_contagem,
    -- Dados do plano
    p.nome as plano_nome,
    p.descricao as plano_descricao,
    p.limite_leads as plano_limite_leads,
    p.limite_consultas as plano_limite_consultas,
    p.limite_instancias as plano_limite_instancias,
    p.ativo as plano_ativo,
    p.acesso_dashboard,
    p.acesso_crm,
    p.acesso_whatsapp,
    p.acesso_disparo_simples,
    p.acesso_disparo_ia,
    p.acesso_agentes_ia,
    p.acesso_extracao_leads,
    p.acesso_enriquecimento,
    p.acesso_consulta,
    p.acesso_usuarios,
    p.acesso_integracoes,
    p.acesso_arquivos,
    u.created_at,
    u.updated_at
FROM
    users u
LEFT JOIN
    planos p ON u.plano_id = p.id;

-- Conceder permissões
GRANT SELECT ON view_usuarios_planos TO authenticated;
GRANT SELECT ON view_usuarios_planos TO anon;
```

### 3.4 Tabela `tipos_negocio`

Sistema de tipos de negócio configuráveis:

```sql
CREATE TABLE IF NOT EXISTS public.tipos_negocio (
  id BIGSERIAL PRIMARY KEY,

  -- Identificação do tipo
  nome VARCHAR(50) UNIQUE NOT NULL, -- 'limpa_nome', 'previdenciario', 'b2b'
  nome_exibicao VARCHAR(100) NOT NULL, -- "Limpa Nome", "Advogado Previdenciário"
  descricao TEXT,
  icone VARCHAR(50) DEFAULT 'building',
  cor VARCHAR(7) DEFAULT '#3B82F6',

  -- Configuração dos campos específicos
  campos_personalizados JSONB DEFAULT '[]'::jsonb,
  status_personalizados JSONB DEFAULT '[]'::jsonb,

  -- Configuração de métricas
  metricas_config JSONB DEFAULT '{
    "metricas_principais": [],
    "campos_receita": [],
    "campos_conversao": []
  }'::jsonb,

  -- Controle
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tipos_negocio_nome ON public.tipos_negocio(nome);
CREATE INDEX IF NOT EXISTS idx_tipos_negocio_ativo ON public.tipos_negocio(ativo);
```

### 3.5 Tabela `user_tipos_negocio` (Many-to-Many)

Atribuição de tipos de negócio aos usuários:

```sql
CREATE TABLE IF NOT EXISTS public.user_tipos_negocio (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo_negocio_id BIGINT NOT NULL REFERENCES public.tipos_negocio(id) ON DELETE CASCADE,

  -- Configurações específicas do usuário para este tipo
  configuracoes_usuario JSONB DEFAULT '{}'::jsonb,

  -- Controle
  ativo BOOLEAN DEFAULT true,
  data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_tipo UNIQUE (user_id, tipo_negocio_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_tipos_negocio_user_id ON public.user_tipos_negocio(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tipos_negocio_tipo_id ON public.user_tipos_negocio(tipo_negocio_id);
```

### 3.6 Tabela `configuracoes_credenciais`

Credenciais personalizadas por usuário:

```sql
CREATE TABLE IF NOT EXISTS public.configuracoes_credenciais (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- APIs de IA
  openai_api_token TEXT,
  gemini_api_key TEXT,
  model VARCHAR(100),
  type_tool_supabase VARCHAR(50),
  reasoning_effort VARCHAR(20),
  apikeydados TEXT,

  -- ElevenLabs
  apikey_elevenlabs TEXT,
  id_voz_elevenlabs TEXT,

  -- FireCrawl
  firecrawl_apikey TEXT,

  -- WhatsApp Evolution API
  baseurl TEXT,
  instancia VARCHAR(100),
  apikey TEXT,

  -- Supabase Databases
  base_tools_supabase TEXT,
  base_leads_supabase TEXT,
  base_mensagens_supabase TEXT,
  base_agentes_supabase TEXT,
  base_rag_supabase TEXT,
  base_ads_supabase TEXT,

  -- Configurações do Agente
  prompt_do_agente TEXT,
  vector_store_ids TEXT,
  structured_output TEXT,

  -- Configurações Operacionais
  delay_entre_mensagens_em_segundos INTEGER,
  delay_apos_intervencao_humana_minutos INTEGER,
  inicio_expediente INTEGER,
  fim_expediente INTEGER,

  -- CRM Integration
  url_crm TEXT,
  usuario_crm TEXT,
  senha_crm TEXT,
  token_crm TEXT,

  -- Drive Integration
  pasta_drive TEXT,
  id_pasta_drive_rag TEXT,

  -- Cliente
  cliente TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_credentials UNIQUE (user_id)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_configuracoes_credenciais_user_id ON public.configuracoes_credenciais(user_id);
```

**⚠️ Importante - Configuração Padrão:**

Recomenda-se criar um usuário especial (por exemplo, `user_id = 24`) com as credenciais padrão do sistema. Quando um usuário não tiver credenciais específicas, o sistema usará essas credenciais como fallback.

### 3.7 Tabela `user_tools` (Tools por Usuário)

```sql
CREATE TABLE IF NOT EXISTS public.user_tools (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tool_id BIGINT NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  agente_id VARCHAR(50),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_tool UNIQUE (user_id, tool_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_tools_user_id ON public.user_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tools_tool_id ON public.user_tools(tool_id);
```

### 3.8 Row Level Security (RLS)

**RLS para `planos`:**

```sql
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_policy" ON public.planos
FOR ALL TO authenticated
USING (true);
```

**RLS para `tipos_negocio`:**

```sql
ALTER TABLE public.tipos_negocio ENABLE ROW LEVEL SECURITY;

-- Todos podem ler tipos ativos
CREATE POLICY "tipos_negocio_read_policy" ON public.tipos_negocio
  FOR SELECT USING (ativo = true);

-- Apenas admins podem modificar
CREATE POLICY "tipos_negocio_admin_policy" ON public.tipos_negocio
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::bigint
      AND users.role = 'admin'
    )
  );
```

**RLS para `user_tipos_negocio`:**

```sql
ALTER TABLE public.user_tipos_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tipos_negocio_policy" ON public.user_tipos_negocio
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()::bigint OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::bigint
      AND users.role = 'admin'
    )
  );
```

---

## 4. Backend - APIs

### 4.1 Não é Necessário API Específica

**Importante:** O sistema de planos é majoritariamente READ-ONLY pelo frontend. As operações são realizadas diretamente via Supabase Client no frontend.

**Operações realizadas:**

```typescript
// Buscar planos
const { data: planos } = await supabase
  .from('planos')
  .select('*')
  .eq('ativo', true)

// Buscar usuário com plano
const { data: user } = await supabase
  .from('view_usuarios_planos')
  .select('*')
  .eq('id', userId)
  .single()

// Atualizar plano do usuário
const { error } = await supabase
  .from('users')
  .update({ plano_id: novoPlanId })
  .eq('id', userId)
```

---

## 5. Frontend - Páginas Administrativas

### 5.1 Página de Gestão de Planos

**Localização:** `/app/admin/planos/page.tsx`

**Funcionalidades:**
- ✅ Listar todos os planos cadastrados
- ✅ Criar novo plano
- ✅ Editar plano existente
- ✅ Deletar plano
- ✅ Atribuir usuários a planos

**Código Principal:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Package, Users, Edit2, Trash2, Plus, Save, X, Check, AlertCircle } from 'lucide-react'

interface Plano {
  id: number
  nome: string
  descricao: string
  acesso_dashboard: boolean
  acesso_crm: boolean
  acesso_whatsapp: boolean
  acesso_disparo_simples: boolean
  acesso_disparo_ia: boolean
  acesso_agentes_ia: boolean
  acesso_extracao_leads: boolean
  acesso_enriquecimento: boolean
  acesso_consulta: boolean
  acesso_usuarios: boolean
  acesso_integracoes: boolean
  acesso_arquivos: boolean
  limite_leads: number
  limite_consultas: number
  limite_instancias: number
  ativo: boolean
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadPlanos()
    loadUsers()
  }, [])

  const loadPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('nome')

      if (error) throw error
      setPlanos(data || [])
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      alert('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('view_usuarios_planos')
        .select('*')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const savePlano = async (plano: Plano) => {
    try {
      if (plano.id) {
        // Atualizar
        const { error } = await supabase
          .from('planos')
          .update(plano)
          .eq('id', plano.id)

        if (error) throw error
      } else {
        // Criar
        const { error } = await supabase
          .from('planos')
          .insert([plano])

        if (error) throw error
      }

      alert('Plano salvo com sucesso!')
      loadPlanos()
      setEditingPlano(null)
      setIsCreating(false)
    } catch (error) {
      console.error('Erro ao salvar plano:', error)
      alert('Erro ao salvar plano')
    }
  }

  const deletePlano = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este plano?')) return

    try {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Plano deletado com sucesso!')
      loadPlanos()
    } catch (error) {
      console.error('Erro ao deletar plano:', error)
      alert('Erro ao deletar plano. Verifique se há usuários vinculados.')
    }
  }

  const assignUserToPlano = async (userId: number, planoId: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ plano_id: planoId })
        .eq('id', userId)

      if (error) throw error

      alert('Usuário atribuído ao plano com sucesso!')
      loadUsers()
    } catch (error) {
      console.error('Erro ao atribuir usuário:', error)
      alert('Erro ao atribuir usuário ao plano')
    }
  }

  // Componente de Card de Plano
  function PlanoCard({ plano, isEditing, isNew, onEdit, onSave, onCancel, onDelete }) {
    const [formData, setFormData] = useState<Plano>(plano)

    if (isEditing || isNew) {
      return (
        <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-xl font-semibold mb-4">
            {isNew ? 'Novo Plano' : `Editar: ${plano.nome}`}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="ex: premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
              />
            </div>

            {/* Permissões */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Permissões</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { key: 'acesso_dashboard', label: 'Dashboard' },
                  { key: 'acesso_crm', label: 'CRM' },
                  { key: 'acesso_whatsapp', label: 'WhatsApp' },
                  { key: 'acesso_disparo_simples', label: 'Disparo Simples' },
                  { key: 'acesso_disparo_ia', label: 'Disparo IA' },
                  { key: 'acesso_agentes_ia', label: 'Agentes IA' },
                  { key: 'acesso_extracao_leads', label: 'Extração' },
                  { key: 'acesso_enriquecimento', label: 'Enriquecimento' },
                  { key: 'acesso_consulta', label: 'Consulta' },
                  { key: 'acesso_usuarios', label: 'Usuários' },
                  { key: 'acesso_integracoes', label: 'Integrações' },
                  { key: 'acesso_arquivos', label: 'Arquivos' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData[key as keyof Plano] as boolean}
                      onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                      className="rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Limites */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite Leads</label>
                <input
                  type="number"
                  value={formData.limite_leads}
                  onChange={(e) => setFormData({...formData, limite_leads: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite Consultas</label>
                <input
                  type="number"
                  value={formData.limite_consultas}
                  onChange={(e) => setFormData({...formData, limite_consultas: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instâncias</label>
                <input
                  type="number"
                  value={formData.limite_instancias}
                  onChange={(e) => setFormData({...formData, limite_instancias: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Ativo */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Plano Ativo</span>
            </label>

            {/* Botões */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4 inline mr-1" />
                Cancelar
              </button>
              <button
                onClick={() => onSave(formData)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Save className="h-4 w-4 inline mr-1" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )
    }

    // View Mode
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{plano.nome}</h3>
            <p className="text-sm text-gray-600 mt-1">{plano.descricao}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            plano.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {plano.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Permissões Visual */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { key: 'acesso_dashboard', label: 'Dashboard' },
            { key: 'acesso_crm', label: 'CRM' },
            { key: 'acesso_whatsapp', label: 'WhatsApp' },
            { key: 'acesso_disparo_simples', label: 'Disparo Simples' },
            { key: 'acesso_disparo_ia', label: 'Disparo IA' },
            { key: 'acesso_agentes_ia', label: 'Agentes IA' },
            { key: 'acesso_extracao_leads', label: 'Extração' },
            { key: 'acesso_enriquecimento', label: 'Enriquecimento' },
            { key: 'acesso_consulta', label: 'Consulta' },
            { key: 'acesso_usuarios', label: 'Usuários' },
            { key: 'acesso_integracoes', label: 'Integrações' },
            { key: 'acesso_arquivos', label: 'Arquivos' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-1 text-xs">
              {plano[key as keyof Plano] ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Limites */}
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <span>Leads: {plano.limite_leads}</span>
          <span>•</span>
          <span>Consultas: {plano.limite_consultas}</span>
          <span>•</span>
          <span>Instâncias: {plano.limite_instancias}</span>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(plano)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Edit2 className="h-4 w-4 inline mr-1" />
            Editar
          </button>
          <button
            onClick={() => onDelete(plano.id)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="h-8 w-8 mr-3 text-blue-600" />
            Gestão de Planos
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure os planos e permissões do sistema
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPlano({
              id: 0,
              nome: '',
              descricao: '',
              acesso_dashboard: true,
              acesso_crm: true,
              acesso_whatsapp: true,
              acesso_disparo_simples: true,
              acesso_disparo_ia: false,
              acesso_agentes_ia: false,
              acesso_extracao_leads: false,
              acesso_enriquecimento: false,
              acesso_consulta: false,
              acesso_usuarios: false,
              acesso_integracoes: true,
              acesso_arquivos: false,
              limite_leads: 1000,
              limite_consultas: 100,
              limite_instancias: 1,
              ativo: true
            })
            setIsCreating(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 inline mr-2" />
          Novo Plano
        </button>
      </div>

      {/* Formulário de Criação/Edição */}
      {(editingPlano || isCreating) && (
        <PlanoCard
          plano={editingPlano!}
          isEditing={!!editingPlano && !isCreating}
          isNew={isCreating}
          onEdit={() => {}}
          onSave={(data) => savePlano(data)}
          onCancel={() => {
            setEditingPlano(null)
            setIsCreating(false)
          }}
          onDelete={() => {}}
        />
      )}

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            isEditing={false}
            isNew={false}
            onEdit={(p) => setEditingPlano(p)}
            onSave={savePlano}
            onCancel={() => setEditingPlano(null)}
            onDelete={deletePlano}
          />
        ))}
      </div>

      {/* Seção de Usuários */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-6 w-6 mr-2 text-blue-600" />
          Usuários por Plano
        </h2>

        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {user.plano_nome || 'Sem plano'}
                </span>
                <select
                  value={user.plano_id || ''}
                  onChange={(e) => assignUserToPlano(user.id, parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="">Selecione um plano</option>
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 5.2 Página de Gestão de Usuários

**Localização:** `/app/usuarios/page.tsx`

Esta página é muito extensa (1368 linhas). Vou destacar as partes principais:

**Funcionalidades:**
- ✅ Listar todos os usuários
- ✅ Criar novo usuário
- ✅ Editar usuário existente
- ✅ Deletar usuário
- ✅ Atribuir plano ao usuário
- ✅ Selecionar múltiplos tipos de negócio
- ✅ Configurar credenciais específicas
- ✅ Gerenciar ferramentas (tools) do usuário

**Estrutura de Dados do Formulário:**

```typescript
interface UserFormData {
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  plano: 'basico' | 'premium' | 'enterprise'
  limite_leads: number
  limite_consultas: number
  numero_instancias: number
  active: boolean
  cpf?: string
  telefone?: string
  tipos_negocio?: number[]
}

interface ConfigCredentials {
  // APIs de IA
  openai_api_token?: string
  gemini_api_key?: string
  model?: string
  type_tool_supabase?: string
  reasoning_effort?: string
  apikeydados?: string

  // ElevenLabs
  apikey_elevenlabs?: string
  id_voz_elevenlabs?: string

  // FireCrawl
  firecrawl_apikey?: string

  // WhatsApp Evolution API
  baseurl?: string
  instancia?: string
  apikey?: string

  // Supabase Databases
  base_tools_supabase?: string
  base_leads_supabase?: string
  base_mensagens_supabase?: string
  base_agentes_supabase?: string
  base_rag_supabase?: string
  base_ads_supabase?: string

  // Configurações do Agente
  prompt_do_agente?: string
  vector_store_ids?: string
  structured_output?: string

  // Configurações Operacionais
  delay_entre_mensagens_em_segundos?: number
  delay_apos_intervencao_humana_minutos?: number
  inicio_expediente?: number
  fim_expediente?: number

  // CRM Integration
  url_crm?: string
  usuario_crm?: string
  senha_crm?: string
  token_crm?: string

  // Drive Integration
  pasta_drive?: string
  id_pasta_drive_rag?: string

  // Cliente
  cliente?: string
}
```

**Lógica de Salvamento com Tipos de Negócio:**

```typescript
const saveUser = async (userData: UserFormData, credentials?: ConfigCredentials) => {
  try {
    // Separar tipos_negocio dos dados do usuário
    const { tipos_negocio, ...userDataOnly } = userData
    const dataToSave = {
      ...userDataOnly,
      updated_at: new Date().toISOString()
    }

    let userId: number

    if (editingUser && editingUser.id > 0) {
      // Atualizar usuário existente
      const { error } = await supabase
        .from('users')
        .update(dataToSave)
        .eq('id', editingUser.id)

      if (error) throw error
      userId = editingUser.id
    } else {
      // Criar novo usuário
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          ...dataToSave,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      userId = newUser.id
    }

    // Salvar credenciais se fornecidas
    if (credentials && userId) {
      const credentialsToSave = Object.fromEntries(
        Object.entries(credentials).filter(([_, value]) =>
          value !== undefined && value !== null && value !== ''
        )
      )

      if (Object.keys(credentialsToSave).length > 0) {
        // Merge com credenciais padrão
        const finalCredentials = {
          ...defaultCredentials, // Carregado do user_id 24
          ...credentialsToSave,
          user_id: userId,
          updated_at: new Date().toISOString()
        }

        const { data: existingConfig } = await supabase
          .from('configuracoes_credenciais')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()

        if (existingConfig) {
          // Atualizar
          const { error: credError } = await supabase
            .from('configuracoes_credenciais')
            .update(finalCredentials)
            .eq('user_id', userId)

          if (credError) throw credError
        } else {
          // Criar
          const { error: credError } = await supabase
            .from('configuracoes_credenciais')
            .insert([{
              ...finalCredentials,
              created_at: new Date().toISOString()
            }])

          if (credError) throw credError
        }
      }
    }

    // Salvar tipos de negócio do usuário
    if (userData.tipos_negocio && userId) {
      // Remover tipos existentes
      await supabase
        .from('user_tipos_negocio')
        .delete()
        .eq('user_id', userId)

      // Adicionar novos tipos se houver seleções
      if (userData.tipos_negocio.length > 0) {
        const userTipos = userData.tipos_negocio.map(tipoId => ({
          user_id: userId,
          tipo_negocio_id: tipoId,
          created_at: new Date().toISOString()
        }))

        const { error: tiposError } = await supabase
          .from('user_tipos_negocio')
          .insert(userTipos)

        if (tiposError) throw tiposError
      }
    }

    alert('Usuário e credenciais salvos com sucesso!')
    setEditingUser(null)
    loadUsers()
  } catch (error) {
    console.error('Erro ao salvar usuário:', error)
    alert('Erro ao salvar usuário')
  }
}
```

**Formulário de Tipos de Negócio no Modal:**

```typescript
{/* Seleção de Tipos de Negócio */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-3">
    Tipos de Negócio
  </label>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {tiposNegocio.map((tipo) => (
      <div key={tipo.id} className="flex items-center">
        <input
          type="checkbox"
          id={`tipo-${tipo.id}`}
          checked={formData.tipos_negocio?.includes(tipo.id) || false}
          onChange={(e) => {
            const currentTipos = formData.tipos_negocio || []
            if (e.target.checked) {
              setFormData({
                ...formData,
                tipos_negocio: [...currentTipos, tipo.id]
              })
            } else {
              setFormData({
                ...formData,
                tipos_negocio: currentTipos.filter(id => id !== tipo.id)
              })
            }
          }}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          htmlFor={`tipo-${tipo.id}`}
          className="ml-2 text-sm text-gray-700 cursor-pointer"
        >
          {tipo.nome_exibicao}
        </label>
      </div>
    ))}
  </div>
</div>
```

**Seção de Ferramentas (Tools):**

```typescript
function UserToolsSection({
  userId,
  tools,
  onClose
}: {
  userId: number
  tools: Tool[]
  onClose: () => void
}) {
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserTools()
  }, [userId])

  const loadUserTools = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tools')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      if (data) {
        setUserTools(data)
      }
    } catch (error) {
      console.error('Erro ao carregar user_tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserTool = async (toolId: number, isActive: boolean) => {
    try {
      const existingUserTool = userTools.find(ut => ut.tool_id === toolId)

      if (existingUserTool) {
        // Atualizar existente
        const { error } = await supabase
          .from('user_tools')
          .update({ is_active: !isActive })
          .eq('user_id', userId)
          .eq('tool_id', toolId)

        if (error) throw error
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('user_tools')
          .insert([{
            user_id: userId,
            tool_id: toolId,
            is_active: true,
            agente_id: '1'
          }])

        if (error) throw error
      }

      loadUserTools()
    } catch (error) {
      console.error('Erro ao alterar tool:', error)
      alert('Erro ao alterar ferramenta')
    }
  }

  const isToolActive = (toolId: number): boolean => {
    const userTool = userTools.find(ut => ut.tool_id === toolId)
    return userTool?.is_active === true
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h5 className="font-medium text-gray-900">Ferramentas Disponíveis</h5>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const isActive = isToolActive(tool.id)
          return (
            <div key={tool.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div>
                <h6 className="text-sm font-medium text-gray-900">{tool.nome}</h6>
                <p className="text-xs text-gray-500">{tool.type}</p>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleUserTool(tool.id, isActive)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 5.3 Página de Tipos de Negócio

**Localização:** `/app/admin/tipos-negocio/page.tsx`

**Funcionalidades:**
- ✅ Listar tipos de negócio
- ✅ Criar novo tipo
- ✅ Editar tipo existente
- ✅ Deletar tipo
- ✅ Ativar/Desativar tipo
- ✅ Configurar campos personalizados
- ✅ Configurar status do funil
- ✅ Configurar métricas

**Estrutura de Dados:**

```typescript
interface CampoPersonalizado {
  nome: string
  label: string
  tipo: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'textarea'
  opcoes?: string[]
  obrigatorio: boolean
  ajuda?: string
}

interface MetricasConfig {
  campos_receita: string[]
  campos_conversao: string[]
  metricas_principais: string[]
}

interface TipoNegocio {
  id: number
  nome: string
  nome_exibicao: string
  descricao: string
  icone: string
  cor: string
  campos_personalizados: CampoPersonalizado[]
  status_personalizados: string[]
  metricas_config: MetricasConfig
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}
```

**Exemplo de Renderização:**

```typescript
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 mb-8">
  {tipos.map((tipo) => (
    <Card key={tipo.id} className={`relative ${!tipo.ativo ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tipo.cor }}
            />
            <CardTitle className="text-base">{tipo.nome_exibicao}</CardTitle>
          </div>
          <Badge variant={tipo.ativo ? 'default' : 'secondary'}>
            {tipo.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          <p className="text-xs text-gray-500">ID: {tipo.nome}</p>
          <p className="text-sm text-gray-600 line-clamp-2">{tipo.descricao}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{tipo.campos_personalizados?.length || 0} campos</span>
            <span>•</span>
            <span>{tipo.status_personalizados?.length || 0} status</span>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-1 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alternarAtivo(tipo.id, tipo.ativo)}
            >
              {tipo.ativo ? 'Desativar' : 'Ativar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => iniciarEdicao(tipo)}
            >
              <Edit size={12} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => excluirTipo(tipo.id, tipo.nome_exibicao)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## 6. Sistema de Permissões

### 6.1 Biblioteca de Verificação de Permissões

**Localização:** `/lib/permissions.ts`

Esta biblioteca centraliza toda a lógica de verificação de permissões.

**Código Completo:**

```typescript
import { UsuarioComPlano, User, Plano } from './supabase'
import { supabase } from './supabase'

// Tipos de features disponíveis no sistema
export type FeatureType =
  | 'dashboard'
  | 'crm'
  | 'whatsapp'
  | 'disparoSimples'
  | 'disparoIA'
  | 'agentesIA'
  | 'extracaoLeads'
  | 'enriquecimento'
  | 'enriquecimentoAPI'
  | 'consulta'
  | 'usuarios'
  | 'integracoes'
  | 'arquivos'

// Configuração padrão dos planos (fallback)
export const PLANOS_DEFAULT = {
  basico: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: false,
    agentesIA: false,
    extracaoLeads: false,
    enriquecimento: false,
    enriquecimentoAPI: false,
    consulta: false,
    usuarios: false,
    integracoes: true,
    arquivos: false,
  },
  premium1: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: true,
    agentesIA: true,
    extracaoLeads: false,
    enriquecimento: false,
    enriquecimentoAPI: false,
    consulta: false,
    usuarios: false,
    integracoes: true,
    arquivos: false,
  },
  premium2: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: false,
    agentesIA: false,
    extracaoLeads: true,
    enriquecimento: false,
    enriquecimentoAPI: false,
    consulta: false,
    usuarios: false,
    integracoes: true,
    arquivos: false,
  },
  enterprise: {
    dashboard: true,
    crm: true,
    whatsapp: true,
    disparoSimples: true,
    disparoIA: true,
    agentesIA: true,
    extracaoLeads: true,
    enriquecimento: true,
    enriquecimentoAPI: true,
    consulta: true,
    usuarios: true,
    integracoes: true,
    arquivos: true,
  }
}

/**
 * Verifica se o usuário tem acesso a uma feature específica
 */
export function hasFeatureAccess(
  user: User | UsuarioComPlano,
  feature: FeatureType
): boolean {
  // Admin sempre tem acesso total
  if (user.role === 'admin') {
    return true
  }

  // Se é UsuarioComPlano (vem da view), usar os dados do plano
  if ('acesso_dashboard' in user) {
    const usuarioComPlano = user as UsuarioComPlano

    // Verificar overrides personalizados primeiro
    if (user.plano_customizado && user.plano_customizado[`acesso_${feature}`] !== undefined) {
      return user.plano_customizado[`acesso_${feature}`]
    }

    // Mapear features para campos do banco
    const featureMap: Record<FeatureType, keyof UsuarioComPlano> = {
      dashboard: 'acesso_dashboard',
      crm: 'acesso_crm',
      whatsapp: 'acesso_whatsapp',
      disparoSimples: 'acesso_disparo_simples',
      disparoIA: 'acesso_disparo_ia',
      agentesIA: 'acesso_agentes_ia',
      extracaoLeads: 'acesso_extracao_leads',
      enriquecimento: 'acesso_enriquecimento',
      enriquecimentoAPI: 'acesso_enriquecimento',
      consulta: 'acesso_consulta',
      usuarios: 'acesso_usuarios',
      integracoes: 'acesso_integracoes',
      arquivos: 'acesso_arquivos',
    }

    const fieldName = featureMap[feature]
    return Boolean(usuarioComPlano[fieldName])
  }

  // Fallback para compatibilidade com User legado
  const planoLegado = user.plano
  if (planoLegado === 'premium') {
    return PLANOS_DEFAULT.premium1[feature] || false
  }

  return PLANOS_DEFAULT[planoLegado as keyof typeof PLANOS_DEFAULT]?.[feature] || false
}

/**
 * Retorna as features disponíveis para o usuário
 */
export function getAvailableFeatures(user: User | UsuarioComPlano): FeatureType[] {
  const features: FeatureType[] = []

  const allFeatures: FeatureType[] = [
    'dashboard', 'crm', 'whatsapp', 'disparoSimples',
    'disparoIA', 'agentesIA', 'extracaoLeads',
    'enriquecimento', 'enriquecimentoAPI', 'consulta', 'usuarios', 'arquivos'
  ]

  for (const feature of allFeatures) {
    if (hasFeatureAccess(user, feature)) {
      features.push(feature)
    }
  }

  return features
}

/**
 * Retorna informações detalhadas do plano do usuário
 */
export function getUserPlanInfo(user: User | UsuarioComPlano) {
  if ('plano_nome' in user) {
    const usuarioComPlano = user as UsuarioComPlano
    return {
      nome: usuarioComPlano.plano_nome || user.plano,
      descricao: usuarioComPlano.plano_descricao,
      features: getAvailableFeatures(user),
      limites: {
        leads: user.limite_leads,
        consultas: user.limite_consultas,
        instancias: user.numero_instancias || 1
      }
    }
  }

  // Fallback para User legado
  const planoLegado = user.plano === 'premium' ? 'premium1' : user.plano
  return {
    nome: planoLegado,
    descricao: `Plano ${planoLegado}`,
    features: getAvailableFeatures(user),
    limites: {
      leads: user.limite_leads,
      consultas: user.limite_consultas,
      instancias: user.numero_instancias || 1
    }
  }
}

/**
 * Verifica se o usuário tem leads suficientes para uma operação
 */
export function hasAvailableLeads(user: User | UsuarioComPlano, requiredLeads: number): boolean {
  const leadsDisponiveis = user.limite_leads - (user.leads_consumidos || 0)
  return leadsDisponiveis >= requiredLeads
}

/**
 * Verifica se o usuário tem consultas suficientes para uma operação
 */
export function hasAvailableConsultas(user: User | UsuarioComPlano, requiredConsultas: number): boolean {
  const consultasDisponiveis = user.limite_consultas - (user.consultas_realizadas || 0)
  return consultasDisponiveis >= requiredConsultas
}

/**
 * Consome leads do usuário (atualiza no banco)
 */
export async function consumeLeads(userId: number, quantidade: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Primeiro, buscar o valor atual
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('leads_consumidos')
      .eq('id', userId)
      .single()

    if (selectError) {
      console.error('Erro ao buscar leads consumidos:', selectError)
      return { success: false, error: selectError.message }
    }

    const novoValor = (user?.leads_consumidos || 0) + quantidade

    const { error } = await supabase
      .from('users')
      .update({
        leads_consumidos: novoValor
      })
      .eq('id', userId)

    if (error) {
      console.error('Erro ao consumir leads:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao consumir leads:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Consome consultas do usuário (atualiza no banco)
 */
export async function consumeConsultas(userId: number, quantidade: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Primeiro, buscar o valor atual
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('consultas_realizadas')
      .eq('id', userId)
      .single()

    if (selectError) {
      console.error('Erro ao buscar consultas realizadas:', selectError)
      return { success: false, error: selectError.message }
    }

    const novoValor = (user?.consultas_realizadas || 0) + quantidade

    const { error } = await supabase
      .from('users')
      .update({
        consultas_realizadas: novoValor
      })
      .eq('id', userId)

    if (error) {
      console.error('Erro ao consumir consultas:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao consumir consultas:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Retorna o saldo atual de leads do usuário
 */
export function getLeadsBalance(user: User | UsuarioComPlano): number {
  return user.limite_leads - (user.leads_consumidos || 0)
}

/**
 * Retorna o saldo atual de consultas do usuário
 */
export function getConsultasBalance(user: User | UsuarioComPlano): number {
  return user.limite_consultas - (user.consultas_realizadas || 0)
}
```

### 6.2 Uso nas Páginas

**Exemplo de verificação em uma página:**

```typescript
'use client'

import { useAuth } from '@/components/AuthWrapper'
import { hasFeatureAccess } from '@/lib/permissions'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ExemploPage() {
  const { user } = useAuth()
  const [userWithPlan, setUserWithPlan] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadUserWithPlan()
    }
  }, [user?.id])

  const loadUserWithPlan = async () => {
    const { data } = await supabase
      .from('view_usuarios_planos')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setUserWithPlan(data)
    }
  }

  // Verificar permissão
  if (!userWithPlan || !hasFeatureAccess(userWithPlan, 'extracaoLeads')) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="text-gray-600 mt-2">
          Você não tem permissão para acessar esta funcionalidade.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Conteúdo da página */}
    </div>
  )
}
```

---

## 7. Integração com Sidebar

### 7.1 Sidebar Dinâmica

**Localização:** `/components/Sidebar.tsx`

A sidebar filtra automaticamente os itens do menu baseado nas permissões do usuário.

**Configuração de Navegação:**

```typescript
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, feature: 'dashboard' as const },
  { name: 'CRM', href: '/leads', icon: Users, feature: 'crm' as const },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, feature: 'dashboard' as const },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageCircle, feature: 'whatsapp' as const },
  { name: 'Agentes IA', href: '/agentes-ia', icon: Bot, feature: 'agentesIA' as const },
  { name: 'Disparo Simples', href: '/disparo-simples', icon: Send, feature: 'disparoSimples' as const },
  { name: 'Disparo com IA', href: '/disparo-ia', icon: Bot, feature: 'disparoIA' as const },
  { name: 'Enriquecimento API', href: '/enriquecimento-api', icon: Database, feature: 'enriquecimentoAPI' as const },
  { name: 'Consulta', href: '/consulta', icon: Search, feature: 'consulta' as const },
  { name: 'Extração Leads', href: '/extracao-leads', icon: Target, feature: 'extracaoLeads' as const },
  { name: 'Integrações', href: '/integracoes', icon: Plug, feature: 'integracoes' as const },
  { name: 'Arquivos', href: '/arquivos', icon: FileText, feature: 'arquivos' as const },
  { name: 'Configurações', href: '/configuracoes-admin', icon: Settings, feature: 'usuarios' as const, adminOnly: true },
]
```

**Lógica de Filtragem:**

```typescript
function SidebarContent({ pathname, user, onLogout, isCollapsed, setIsCollapsed, onCollapseChange }) {
  const [userWithPlan, setUserWithPlan] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUserWithPlan() {
      if (!user?.id) {
        return
      }

      try {
        const { data, error } = await supabase
          .from('view_usuarios_planos')
          .select('*')
          .eq('id', parseInt(user.id?.toString() || '0'))
          .single()

        if (!error && data) {
          // Garantir que o objeto tenha as propriedades necessárias
          const userWithPlanData = {
            ...user,
            ...data,
            // Garantir que as propriedades de plano existam
            acesso_consulta: data.acesso_consulta || false,
            acesso_integracoes: data.acesso_integracoes || false,
            acesso_dashboard: data.acesso_dashboard || false,
            acesso_crm: data.acesso_crm || false,
            acesso_whatsapp: data.acesso_whatsapp || false,
            acesso_disparo_simples: data.acesso_disparo_simples || false,
            acesso_disparo_ia: data.acesso_disparo_ia || false,
            acesso_agentes_ia: data.acesso_agentes_ia || false,
            acesso_extracao_leads: data.acesso_extracao_leads || false,
            acesso_enriquecimento: data.acesso_enriquecimento || false,
            acesso_usuarios: data.acesso_usuarios || false,
            acesso_arquivos: data.acesso_arquivos || false
          }
          setUserWithPlan(userWithPlanData)
        } else {
          // Fallback para user básico
          setUserWithPlan(user)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        setUserWithPlan(user)
      }
    }

    fetchUserWithPlan()
  }, [user?.id])

  // Filtrar navegação baseada nas permissões do usuário
  const filteredNavigation = navigation.filter(item => {
    if (!userWithPlan) return false

    // Se é um item apenas para admin, verificar se o usuário é admin
    if (item.adminOnly && userWithPlan.role !== 'admin') {
      return false
    }

    return hasFeatureAccess(userWithPlan, item.feature)
  })

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 pb-4">
      {/* ... resto da sidebar */}
      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.name : undefined}
                      className={`group flex rounded-md text-sm font-semibold leading-6 transition-colors ${
                        isCollapsed
                          ? 'p-2 justify-center'
                          : 'gap-x-3 p-2'
                      } ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {!isCollapsed && (
                        <span className="transition-opacity duration-300">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}
```

---

## 8. Tipos de Negócio

### 8.1 Conceito

Os **Tipos de Negócio** permitem que um usuário trabalhe com múltiplos segmentos de negócio simultaneamente. Cada tipo pode ter:

- ✅ Campos personalizados específicos
- ✅ Status de funil personalizado
- ✅ Métricas configuráveis
- ✅ Cores e ícones distintos

**Exemplo de uso:**
- Um advogado pode ter tipos: "Previdenciário", "Trabalhista", "Cível"
- Uma empresa pode ter: "B2B", "B2C", "Limpa Nome"
- Cada tipo terá campos e funis específicos

### 8.2 Fluxo de Atribuição

```
1. Admin cria tipos de negócio em /admin/tipos-negocio
2. Admin atribui tipos aos usuários em /usuarios (checkboxes)
3. Usuário visualiza apenas os tipos que foram atribuídos a ele
4. Sistema filtra leads por tipo de negócio automaticamente
```

### 8.3 Carregar Tipos do Usuário

```typescript
const loadUserTiposNegocio = async (userId: number) => {
  const { data, error } = await supabase
    .from('user_tipos_negocio')
    .select(`
      tipo_negocio_id,
      tipos_negocio!inner (
        id,
        nome,
        nome_exibicao,
        cor,
        icone,
        campos_personalizados,
        status_personalizados
      )
    `)
    .eq('user_id', userId)
    .eq('ativo', true)

  if (error) {
    console.error('Erro ao carregar tipos do usuário:', error)
    return []
  }

  return data?.map(item => item.tipos_negocio) || []
}
```

### 8.4 Exibir Badges de Tipos

```typescript
{user.tipos_negocio && user.tipos_negocio.length > 0 && (
  <div className="mb-3">
    <span className="text-sm font-medium text-gray-500 block mb-2">
      Tipos de Negócio:
    </span>
    <div className="flex flex-wrap gap-2">
      {user.tipos_negocio.map((tipo: any) => (
        <span
          key={tipo.id}
          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: tipo.cor || '#6B7280' }}
        >
          {tipo.nome_exibicao}
        </span>
      ))}
    </div>
  </div>
)}
```

---

## 9. Credenciais por Usuário

### 9.1 Conceito

Cada usuário pode ter credenciais específicas para:
- APIs de IA (OpenAI, Gemini)
- ElevenLabs (síntese de voz)
- FireCrawl (web scraping)
- WhatsApp Evolution API
- Bases Supabase separadas
- Configurações de agentes IA

**Padrão de Fallback:**
- Criar um usuário especial (ex: `user_id = 24`) com credenciais padrão
- Quando um usuário não tiver credenciais, usar as do `user_id = 24`

### 9.2 Carregar Credenciais Padrão

```typescript
const loadDefaultCredentials = async () => {
  try {
    const { data, error } = await supabase
      .from('configuracoes_credenciais')
      .select('*')
      .eq('user_id', 24)
      .maybeSingle()

    if (data && !error) {
      const { id, user_id, created_at, updated_at, ...credentials } = data
      setDefaultCredentials(credentials)
    }
  } catch (error) {
    console.error('Erro ao carregar credenciais padrão:', error)
  }
}
```

### 9.3 Carregar Credenciais do Usuário

```typescript
const loadUserCredentials = async (userId: number) => {
  try {
    const { data, error } = await supabase
      .from('configuracoes_credenciais')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (data && !error) {
      return data
    }

    // Fallback para credenciais padrão
    return defaultCredentials
  } catch (error) {
    console.error('Erro ao carregar credenciais do usuário:', error)
    return defaultCredentials
  }
}
```

### 9.4 Salvar Credenciais

Ver seção **5.2 - saveUser()** para lógica completa de salvamento.

---

## 10. Ferramentas (Tools) por Usuário

### 10.1 Conceito

Sistema de atribuição de ferramentas (tools) que podem ser ativadas/desativadas por usuário.

**Exemplo de tools:**
- Calculadora
- Verificador de CPF
- Integração com CRM específico
- Ferramentas customizadas

### 10.2 Gerenciamento de Tools

**Ver seção 5.2 - UserToolsSection** para código completo.

**Funcionalidades:**
- ✅ Listar todas as tools disponíveis
- ✅ Toggle on/off por usuário
- ✅ Persistir estado no banco
- ✅ Criar nova atribuição se não existir

---

## 11. Fluxo Completo de Uso

### 11.1 Configuração Inicial (Admin)

```
Passo 1: Criar Planos
  ├─ Acessar /admin/planos
  ├─ Clicar "Novo Plano"
  ├─ Definir nome, descrição
  ├─ Marcar permissões (checkboxes)
  ├─ Definir limites (leads, consultas, instâncias)
  └─ Salvar

Passo 2: Criar Tipos de Negócio (Opcional)
  ├─ Acessar /admin/tipos-negocio
  ├─ Clicar "Novo Tipo"
  ├─ Definir nome, cor, ícone
  ├─ Configurar campos personalizados
  ├─ Definir status do funil
  └─ Salvar

Passo 3: Criar Usuários
  ├─ Acessar /usuarios
  ├─ Clicar "Novo Usuário"
  ├─ Preencher dados básicos (nome, email, senha)
  ├─ Selecionar plano no dropdown
  ├─ Marcar tipos de negócio (checkboxes)
  ├─ (Opcional) Configurar credenciais específicas
  ├─ (Opcional) Definir limites personalizados
  └─ Salvar

Passo 4: Atribuir Ferramentas ao Usuário
  ├─ Na lista de usuários, clicar "Tools"
  ├─ Toggle on/off as ferramentas desejadas
  └─ Fechar
```

### 11.2 Experiência do Usuário

```
Login
  ↓
Sistema busca dados da view_usuarios_planos
  ↓
Carrega permissões do plano
  ↓
Carrega tipos de negócio atribuídos
  ↓
Renderiza sidebar com apenas itens permitidos
  ↓
Usuário navega apenas em páginas permitidas
  ↓
Páginas verificam permissões localmente com hasFeatureAccess()
  ↓
Bloqueio automático se tentar acessar feature não permitida
```

### 11.3 Consumo de Recursos

**Exemplo: Extração de Leads**

```typescript
import { consumeLeads, hasAvailableLeads, getLeadsBalance } from '@/lib/permissions'

async function extractLeads(userId: number, quantidade: number) {
  // 1. Buscar usuário
  const { data: user } = await supabase
    .from('view_usuarios_planos')
    .select('*')
    .eq('id', userId)
    .single()

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  // 2. Verificar se tem acesso à feature
  if (!hasFeatureAccess(user, 'extracaoLeads')) {
    throw new Error('Acesso negado: Extração de Leads')
  }

  // 3. Verificar se tem saldo suficiente
  if (!hasAvailableLeads(user, quantidade)) {
    const saldo = getLeadsBalance(user)
    throw new Error(`Saldo insuficiente. Disponível: ${saldo}, Necessário: ${quantidade}`)
  }

  // 4. Realizar extração
  const leads = await performExtraction(quantidade)

  // 5. Consumir leads
  const result = await consumeLeads(userId, quantidade)
  if (!result.success) {
    throw new Error(`Erro ao consumir leads: ${result.error}`)
  }

  return leads
}
```

---

## 12. Troubleshooting

### 12.1 Usuário não vê itens na sidebar

**Problema:** Sidebar vazia ou com poucos itens.

**Verificações:**
1. Usuário tem `plano_id` definido?
   ```sql
   SELECT id, name, plano_id FROM users WHERE id = ?;
   ```
2. Plano está ativo?
   ```sql
   SELECT * FROM planos WHERE id = ? AND ativo = true;
   ```
3. View está retornando dados?
   ```sql
   SELECT * FROM view_usuarios_planos WHERE id = ?;
   ```
4. Verificar no console do navegador:
   ```typescript
   console.log('User with plan:', userWithPlan)
   console.log('Filtered navigation:', filteredNavigation)
   ```

### 12.2 Permissões não estão sendo aplicadas

**Problema:** Usuário acessa features não permitidas.

**Verificações:**
1. Página está usando `hasFeatureAccess()`?
2. Verificar se está usando `view_usuarios_planos`:
   ```typescript
   const { data } = await supabase
     .from('view_usuarios_planos') // CORRETO
     .select('*')
     .eq('id', userId)
     .single()
   ```
3. Verificar se tem overrides no `plano_customizado`:
   ```sql
   SELECT plano_customizado FROM users WHERE id = ?;
   ```

### 12.3 Tipos de negócio não aparecem

**Problema:** Tipos não são exibidos para o usuário.

**Verificações:**
1. Tipos estão ativos?
   ```sql
   SELECT * FROM tipos_negocio WHERE ativo = true;
   ```
2. Usuário tem atribuição?
   ```sql
   SELECT * FROM user_tipos_negocio WHERE user_id = ?;
   ```
3. Foreign key está correta?
   ```sql
   SELECT utn.*, tn.nome_exibicao
   FROM user_tipos_negocio utn
   JOIN tipos_negocio tn ON utn.tipo_negocio_id = tn.id
   WHERE utn.user_id = ?;
   ```

### 12.4 Credenciais não são carregadas

**Problema:** Sistema não usa credenciais do usuário.

**Verificações:**
1. Credenciais padrão (user_id 24) existem?
   ```sql
   SELECT * FROM configuracoes_credenciais WHERE user_id = 24;
   ```
2. Credenciais do usuário foram salvas?
   ```sql
   SELECT * FROM configuracoes_credenciais WHERE user_id = ?;
   ```
3. Merge está correto no código?
   ```typescript
   const finalCredentials = {
     ...defaultCredentials,
     ...userCredentials
   }
   ```

### 12.5 Limites não são respeitados

**Problema:** Usuário ultrapassa limites de leads/consultas.

**Verificações:**
1. Verificar contadores:
   ```sql
   SELECT
     limite_leads,
     leads_consumidos,
     (limite_leads - leads_consumidos) as saldo
   FROM users
   WHERE id = ?;
   ```
2. Código está chamando `consumeLeads()` ou `consumeConsultas()`?
3. Verificar se há reset automático configurado:
   ```sql
   SELECT ultimo_reset_contagem FROM users WHERE id = ?;
   ```

### 12.6 View está desatualizada

**Problema:** View não reflete alterações recentes.

**Solução:**

```sql
-- Dropar e recriar a view
DROP VIEW IF EXISTS view_usuarios_planos;

CREATE VIEW view_usuarios_planos AS
SELECT
    u.id,
    u.name,
    u.email,
    u.cpf,
    u.telefone,
    u.role,
    u.active,
    u.limite_leads,
    u.limite_consultas,
    u.leads_consumidos,
    u.consultas_realizadas,
    u.plano_id,
    u.plano,
    u.numero_instancias,
    u.plano_customizado,
    u.ultimo_reset_contagem,
    p.nome as plano_nome,
    p.descricao as plano_descricao,
    p.limite_leads as plano_limite_leads,
    p.limite_consultas as plano_limite_consultas,
    p.limite_instancias as plano_limite_instancias,
    p.ativo as plano_ativo,
    p.acesso_dashboard,
    p.acesso_crm,
    p.acesso_whatsapp,
    p.acesso_disparo_simples,
    p.acesso_disparo_ia,
    p.acesso_agentes_ia,
    p.acesso_extracao_leads,
    p.acesso_enriquecimento,
    p.acesso_consulta,
    p.acesso_usuarios,
    p.acesso_integracoes,
    p.acesso_arquivos,
    u.created_at,
    u.updated_at
FROM
    users u
LEFT JOIN
    planos p ON u.plano_id = p.id;
```

---

## ✅ Checklist de Implementação

### Database
- [ ] Criar tabela `planos`
- [ ] Inserir planos padrão
- [ ] Alterar tabela `users` com campos de plano
- [ ] Criar view `view_usuarios_planos`
- [ ] Criar tabela `tipos_negocio`
- [ ] Criar tabela `user_tipos_negocio`
- [ ] Criar tabela `configuracoes_credenciais`
- [ ] Criar tabela `user_tools`
- [ ] Configurar RLS em todas as tabelas
- [ ] Criar índices necessários

### Backend/Lib
- [ ] Criar `/lib/permissions.ts` com funções de verificação
- [ ] Implementar `hasFeatureAccess()`
- [ ] Implementar `consumeLeads()` e `consumeConsultas()`
- [ ] Implementar funções auxiliares (getLeadsBalance, etc)

### Frontend - Admin
- [ ] Criar `/app/admin/planos/page.tsx`
- [ ] Implementar CRUD de planos
- [ ] Implementar atribuição de usuários a planos
- [ ] Criar `/app/admin/tipos-negocio/page.tsx`
- [ ] Implementar CRUD de tipos de negócio
- [ ] Criar `/app/usuarios/page.tsx`
- [ ] Implementar gerenciamento de usuários
- [ ] Implementar seleção de tipos de negócio
- [ ] Implementar formulário de credenciais
- [ ] Implementar gerenciamento de tools

### Frontend - Sidebar
- [ ] Atualizar `/components/Sidebar.tsx`
- [ ] Implementar filtro de navegação baseado em permissões
- [ ] Testar com diferentes planos

### Frontend - Páginas
- [ ] Adicionar verificações de permissão em todas as páginas
- [ ] Implementar bloqueio de acesso não autorizado
- [ ] Adicionar mensagens de erro amigáveis
- [ ] Implementar verificações de limite antes de operações

### Testes
- [ ] Testar criação de planos
- [ ] Testar atribuição de planos a usuários
- [ ] Testar filtro da sidebar
- [ ] Testar bloqueio de acesso
- [ ] Testar overrides customizados
- [ ] Testar consumo de leads/consultas
- [ ] Testar tipos de negócio
- [ ] Testar credenciais por usuário
- [ ] Testar ferramentas por usuário

---

## 📚 Resumo Executivo

Este sistema de planos e permissões oferece:

✅ **Controle Granular**: Permissões por feature individual
✅ **Flexibilidade**: Overrides personalizados por usuário
✅ **Limites**: Controle de consumo de recursos
✅ **Multi-Negócio**: Suporte a múltiplos tipos de negócio por usuário
✅ **Credenciais**: Configurações específicas por usuário
✅ **Tools**: Sistema de ferramentas ativadas por usuário
✅ **UX Dinâmica**: Sidebar e páginas adaptadas automaticamente
✅ **Segurança**: RLS nativo do Supabase
✅ **Escalabilidade**: Fácil adição de novas features

**Tecnologias:**
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + RLS)
- Tailwind CSS

**Resultado:** Sistema completo e profissional de gestão de planos e permissões pronto para produção.

---

> **Fim da Documentação**
> Para dúvidas ou sugestões, consulte os arquivos fonte mencionados ou entre em contato com a equipe de desenvolvimento.