# Documentação: Implementação de Sistema de Upload de Arquivos com Backblaze B2

> **Objetivo**: Guia completo para implementar um sistema de upload, gerenciamento e visualização de arquivos usando Next.js 14 (App Router), Supabase PostgreSQL e Backblaze B2 Storage.

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-requisitos e Configuração](#2-pré-requisitos-e-configuração)
3. [Database Schema](#3-database-schema)
4. [API Routes - Backend](#4-api-routes-backend)
5. [Frontend - Interface do Usuário](#5-frontend-interface-do-usuário)
6. [Controle de Acesso e Permissões](#6-controle-de-acesso-e-permissões)
7. [Deployment e Variáveis de Ambiente](#7-deployment-e-variáveis-de-ambiente)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Visão Geral da Arquitetura

### Stack Tecnológica

```yaml
Frontend: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
Backend: Next.js API Routes (App Router)
Database: Supabase PostgreSQL
Storage: Backblaze B2 (S3-compatible)
Icons: Lucide React
Authentication: Custom auth context (useAuth hook)
```

### Fluxo de Dados

```
[Frontend] → [API Route /api/arquivos/upload] → [Backblaze B2] ✓
                                                ↓
                                        [Supabase DB] (metadata)
                                                ↓
[Frontend] ← [API Route /api/arquivos (GET)] ← [Supabase DB]
```

### Estrutura de Arquivos

```
app/
├── arquivos/
│   └── page.tsx                    # Frontend da página de arquivos
├── api/
│   └── arquivos/
│       ├── route.ts                # GET (listar) e DELETE
│       └── upload/
│           └── route.ts            # POST (upload)
database/
└── migration_add_acesso_arquivos.sql
docs/
└── IMPLEMENTACAO_SISTEMA_ARQUIVOS.md (este arquivo)
```

---

## 2. Pré-requisitos e Configuração

### 2.1 Configuração do Backblaze B2

**Passo 1: Criar Bucket**
1. Acesse [Backblaze B2 Console](https://www.backblaze.com/b2/cloud-storage.html)
2. Vá em "Buckets" → "Create a Bucket"
3. Configure:
   - **Bucket Name**: `appdnxplataformas` (ou seu nome)
   - **Files in Bucket**: Public
   - **Encryption**: Disable (ou configure conforme necessário)
4. Anote o **Bucket ID** (ex: `4a2d8d0e1becc7ac9c950513`)

**Passo 2: Criar Application Key**
1. Vá em "App Keys" → "Add a New Application Key"
2. Configure:
   - **Name**: `dnx-plataformas-app`
   - **Allow access to Bucket(s)**: Selecione seu bucket
   - **Type of Access**: Read and Write
3. **IMPORTANTE**: Copie e salve imediatamente:
   - **keyID** (ex: `005addebc7cc5530000000006`)
   - **applicationKey** (ex: `K005qPI3/OXtJVzv620hYNHnA7Gct8I`)
   - A chave só aparece uma vez!

**Passo 3: Identificar Região e Endpoint**
1. No dashboard do bucket, encontre:
   - **Endpoint**: `https://s3.us-east-005.backblazeb2.com`
   - **Region**: `us-east-005`

### 2.2 Variáveis de Ambiente

Adicione ao seu `.env.local` (desenvolvimento) e `.env.production.local` (produção):

```bash
# Backblaze B2 Storage Configuration
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET_NAME=appdnxplataformas
B2_BUCKET_ID=4a2d8d0e1becc7ac9c950513
B2_KEY_ID=005addebc7cc5530000000006
B2_APPLICATION_KEY=K005qPI3/OXtJVzv620hYNHnA7Gct8I
```

⚠️ **ATENÇÃO**:
- NÃO adicione aspas ao redor das chaves
- NÃO commite arquivos `.env.local` ou `.env.production.local` no Git
- Atualize `.env.example` apenas com placeholders

---

## 3. Database Schema

### 3.1 Tabela `arquivos`

```sql
-- Criar tabela de arquivos
CREATE TABLE IF NOT EXISTS public.arquivos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  mediatype VARCHAR(50) NOT NULL,
  arquivo TEXT NOT NULL,
  descricao TEXT,
  produto VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_arquivos_user_id ON public.arquivos(user_id);
CREATE INDEX idx_arquivos_produto ON public.arquivos(produto);
CREATE INDEX idx_arquivos_mediatype ON public.arquivos(mediatype);

-- RLS (Row Level Security) - IMPORTANTE para segurança
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

-- Policy: usuários veem apenas seus próprios arquivos
CREATE POLICY "Users can view their own files"
  ON public.arquivos
  FOR SELECT
  USING (auth.uid()::integer = user_id);

-- Policy: usuários podem inserir seus próprios arquivos
CREATE POLICY "Users can insert their own files"
  ON public.arquivos
  FOR INSERT
  WITH CHECK (auth.uid()::integer = user_id);

-- Policy: usuários podem deletar seus próprios arquivos
CREATE POLICY "Users can delete their own files"
  ON public.arquivos
  FOR DELETE
  USING (auth.uid()::integer = user_id);
```

### 3.2 Controle de Acesso via Planos

```sql
-- Adicionar coluna de acesso aos planos
ALTER TABLE public.planos
ADD COLUMN IF NOT EXISTS acesso_arquivos BOOLEAN DEFAULT FALSE;

-- Atualizar view de usuários com permissões
DROP VIEW IF EXISTS public.view_usuarios_planos;

CREATE VIEW public.view_usuarios_planos AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.plano_id,
  p.nome_plano,
  p.acesso_arquivos,
  -- outras colunas conforme necessário
FROM public.users u
LEFT JOIN public.planos p ON u.plano_id = p.id;
```

### 3.3 Estrutura de Dados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL | ID único do arquivo |
| `nome` | VARCHAR(255) | Nome original do arquivo |
| `mimetype` | VARCHAR(100) | Tipo MIME (ex: `image/jpeg`) |
| `mediatype` | VARCHAR(50) | Tipo de mídia (`image`, `video`, `document`) |
| `arquivo` | TEXT | URL completa do arquivo no B2 |
| `descricao` | TEXT | Descrição opcional fornecida pelo usuário |
| `produto` | VARCHAR(255) | Nome do produto associado |
| `user_id` | INTEGER | ID do usuário dono do arquivo |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

---

## 4. API Routes - Backend

### 4.1 Upload Route - `/app/api/arquivos/upload/route.ts`

**Funcionalidades**:
- Upload múltiplo de arquivos
- Integração nativa com API Backblaze B2 (sem AWS SDK)
- Cálculo de SHA1 (obrigatório para B2)
- Cache de autorização B2 (23 horas)
- Armazenamento de metadados no Supabase

**Código Completo**:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import axios from 'axios'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cache de autorização B2 (válido por 23 horas)
let b2AuthCache: {
  token: string
  apiUrl: string
  expiresAt: number
} | null = null

/**
 * Autoriza com Backblaze B2 e retorna token + API URL
 * Implementa cache de 23 horas para evitar múltiplas autorizações
 */
async function getB2Authorization() {
  // Retornar cache se ainda válido
  if (b2AuthCache && b2AuthCache.expiresAt > Date.now()) {
    console.log('[B2] Usando token em cache')
    return b2AuthCache
  }

  console.log('[B2] Autorizando com Backblaze B2...')
  const authString = Buffer.from(
    `${process.env.B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`
  ).toString('base64')

  try {
    const response = await axios.get(
      'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
      {
        headers: {
          Authorization: `Basic ${authString}`,
        },
      }
    )

    // Cachear por 23 horas (token válido por 24h)
    b2AuthCache = {
      token: response.data.authorizationToken,
      apiUrl: response.data.apiUrl,
      expiresAt: Date.now() + 23 * 60 * 60 * 1000,
    }

    console.log('[B2] Autorização bem-sucedida')
    return b2AuthCache
  } catch (error: any) {
    console.error('[B2] Erro na autorização:', error.response?.data || error.message)
    throw new Error('Falha na autorização B2')
  }
}

/**
 * Obtém URL de upload do B2 para o bucket
 */
async function getB2UploadUrl(
  bucketId: string,
  auth: { token: string; apiUrl: string }
) {
  console.log('[B2] Obtendo URL de upload...')
  try {
    const response = await axios.post(
      `${auth.apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId },
      {
        headers: {
          Authorization: auth.token,
        },
      }
    )

    return {
      uploadUrl: response.data.uploadUrl,
      authorizationToken: response.data.authorizationToken,
    }
  } catch (error: any) {
    console.error('[B2] Erro ao obter URL de upload:', error.response?.data || error.message)
    throw new Error('Falha ao obter URL de upload')
  }
}

/**
 * Determina o tipo de mídia baseado no MIME type
 */
function getMediaType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  if (mimetype === 'application/pdf') return 'document'
  return 'other'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const userId = formData.get('userId') as string
    const nomeProduto = formData.get('nomeProduto') as string
    const descricao = formData.get('descricao') as string | null

    // Validações
    if (!userId || !nomeProduto) {
      return NextResponse.json(
        { error: 'userId e nomeProduto são obrigatórios' },
        { status: 400 }
      )
    }

    // Coletar todos os arquivos do FormData
    const files: { file: File; key: string }[] = []
    for (const [key, value] of formData.entries()) {
      // Node.js 18 não tem File global, verificar por propriedades
      if (
        key.startsWith('files[') &&
        typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        'type' in value
      ) {
        files.push({ file: value as File, key })
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    console.log(`[Upload] Processando ${files.length} arquivo(s) para usuário ${userId}`)

    // Autenticar com B2
    const b2Auth = await getB2Authorization()
    const bucketId = process.env.B2_BUCKET_ID!

    const uploadedFiles = []

    // Upload de cada arquivo
    for (const { file } of files) {
      console.log(`[Upload] Processando arquivo: ${file.name}`)

      // Gerar nome único para evitar conflitos
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const extension = file.name.split('.').pop()
      const fileName = `${userId}/${nomeProduto}/${timestamp}_${randomStr}.${extension}`

      // Obter URL de upload
      const uploadAuth = await getB2UploadUrl(bucketId, b2Auth)

      // Converter file para buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Calcular SHA1 (obrigatório para B2)
      const sha1 = crypto.createHash('sha1').update(buffer).digest('hex')

      console.log(`[Upload] Enviando para B2: ${fileName} (${buffer.length} bytes)`)

      // Upload para B2
      const uploadResponse = await axios.post(uploadAuth.uploadUrl, buffer, {
        headers: {
          Authorization: uploadAuth.authorizationToken,
          'X-Bz-File-Name': encodeURIComponent(fileName),
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': buffer.length.toString(),
          'X-Bz-Content-Sha1': sha1,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      })

      // URL pública do arquivo
      const fileUrl = `${process.env.B2_ENDPOINT}/file/${process.env.B2_BUCKET_NAME}/${fileName}`

      console.log(`[Upload] Arquivo enviado com sucesso: ${fileUrl}`)

      // Salvar metadados no Supabase
      const { data: dbData, error: dbError } = await supabase
        .from('arquivos')
        .insert({
          nome: file.name,
          mimetype: file.type,
          mediatype: getMediaType(file.type),
          arquivo: fileUrl,
          descricao: descricao || null,
          produto: nomeProduto,
          user_id: parseInt(userId),
        })
        .select()

      if (dbError) {
        console.error('[Database] Erro ao salvar metadados:', dbError)
        throw new Error('Erro ao salvar metadados no banco')
      }

      uploadedFiles.push(dbData[0])
    }

    console.log(`[Upload] ${uploadedFiles.length} arquivo(s) processado(s) com sucesso`)

    return NextResponse.json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
    })
  } catch (error: any) {
    console.error('[Upload] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}
```

### 4.2 CRUD Route - `/app/api/arquivos/route.ts`

**Funcionalidades**:
- GET: Listar arquivos do usuário
- DELETE: Deletar arquivo (com verificação de ownership)

**Código Completo**:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET - Listar arquivos do usuário
 * Query params: userId, role
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    console.log('[API Arquivos] GET - userId:', userId, 'role:', role)

    // SEMPRE filtrar por user_id
    // Mesmo admin vê apenas seus próprios arquivos
    const { data, error } = await supabase
      .from('arquivos')
      .select('*')
      .eq('user_id', parseInt(userId))
      .order('id', { ascending: false })

    if (error) {
      console.error('[API Arquivos] Erro ao buscar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[API Arquivos] Arquivos encontrados:', data?.length || 0)

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API Arquivos] Erro GET:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar arquivos' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Deletar arquivo
 * Query params: id, userId, role
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('[API Arquivos] DELETE - id:', id, 'userId:', userId, 'role:', role)

    // Verificar se o arquivo pertence ao usuário
    const { data: arquivo, error: fetchError } = await supabase
      .from('arquivos')
      .select('user_id')
      .eq('id', parseInt(id))
      .single()

    if (fetchError || !arquivo) {
      console.error('[API Arquivos] Arquivo não encontrado:', fetchError)
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    // Verificar ownership
    if (arquivo.user_id !== parseInt(userId)) {
      console.error('[API Arquivos] Usuário não autorizado a deletar')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Deletar do banco (arquivo permanece no B2 por enquanto)
    const { error: deleteError } = await supabase
      .from('arquivos')
      .delete()
      .eq('id', parseInt(id))

    if (deleteError) {
      console.error('[API Arquivos] Erro ao deletar:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log('[API Arquivos] Arquivo deletado com sucesso')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API Arquivos] Erro DELETE:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar arquivo' },
      { status: 500 }
    )
  }
}
```

### 4.3 Pontos Importantes da API

**Por que não usar AWS SDK v3?**
- Node.js 18 em Docker Alpine tem problemas com AWS SDK
- Erros `IncompleteBody` persistentes mesmo com várias tentativas
- API nativa do B2 é mais simples e confiável

**Autenticação B2**:
```typescript
// Basic Auth = Base64(keyID:applicationKey)
const authString = Buffer.from(`${keyID}:${applicationKey}`).toString('base64')
Authorization: `Basic ${authString}`
```

**SHA1 Obrigatório**:
```typescript
const sha1 = crypto.createHash('sha1').update(buffer).digest('hex')
headers: { 'X-Bz-Content-Sha1': sha1 }
```

**Node.js 18 File Detection**:
```typescript
// NÃO use: value instanceof File (não existe em Node 18)
// USE:
if (typeof value === 'object' && value !== null && 'name' in value && 'type' in value)
```

---

## 5. Frontend - Interface do Usuário

### 5.1 Página Principal - `/app/arquivos/page.tsx`

**Funcionalidades**:
- Upload múltiplo de arquivos
- Visualização agrupada por produto
- Thumbnails para imagens
- Delete com confirmação
- Feedback visual de loading

**Código Completo**:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { UploadCloud, FileText, Image as ImageIcon, Video, Trash2, Loader2, FolderOpen } from 'lucide-react'
import { useAuth } from '../../components/AuthWrapper'

interface Arquivo {
  id: number
  nome: string
  mimetype: string
  mediatype: string
  arquivo: string
  descricao: string | null
  produto: string
  user_id: number
}

export default function ArquivosPage() {
  const { user } = useAuth()
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [nomeProduto, setNomeProduto] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    if (user?.id) {
      fetchArquivos()
    }
  }, [user])

  const fetchArquivos = async () => {
    if (!user?.id) return

    try {
      console.log('[Frontend] Buscando arquivos - userId:', user.id, 'role:', user.role)
      const response = await fetch(`/api/arquivos?userId=${user.id}&role=${user.role}`)
      const data = await response.json()
      console.log('[Frontend] Arquivos recebidos:', data.data?.length || 0)
      setArquivos(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFiles || selectedFiles.length === 0 || !nomeProduto || !user?.id) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('userId', user.id.toString())
      formData.append('nomeProduto', nomeProduto)
      if (descricao) {
        formData.append('descricao', descricao)
      }

      // Adicionar todos os arquivos selecionados
      Array.from(selectedFiles).forEach((file, index) => {
        formData.append(`files[${index}]`, file)
      })

      const response = await fetch('/api/arquivos/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        alert(`Upload de ${data.count} arquivo(s) realizado com sucesso!`)
        setSelectedFiles(null)
        setNomeProduto('')
        setDescricao('')
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchArquivos()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este arquivo?') || !user?.id) {
      return
    }

    try {
      const response = await fetch(`/api/arquivos?id=${id}&userId=${user.id}&role=${user.role}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Arquivo deletado com sucesso!')
        fetchArquivos()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      alert('Erro ao deletar arquivo')
    }
  }

  const getFileIcon = (mediatype: string) => {
    switch (mediatype) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-blue-500" />
      case 'video':
        return <Video className="h-8 w-8 text-purple-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  const getTotalSize = () => {
    if (!selectedFiles) return ''
    let total = 0
    Array.from(selectedFiles).forEach(file => {
      total += file.size
    })
    return ` (${(total / 1024 / 1024).toFixed(2)} MB)`
  }

  // Agrupar arquivos por produto
  const groupByProduct = () => {
    const grouped: { [key: string]: Arquivo[] } = {}
    arquivos.forEach(arquivo => {
      if (!grouped[arquivo.produto]) {
        grouped[arquivo.produto] = []
      }
      grouped[arquivo.produto].push(arquivo)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Arquivos</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie seus arquivos e faça upload de novos (múltiplos arquivos permitidos)
        </p>
      </div>

      {/* Formulário de Upload */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Enviar Novos Arquivos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Faça upload de uma ou várias imagens, vídeos ou documentos
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo(s) <span className="text-red-500">*</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,application/pdf"
                  multiple
                  required
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
                >
                  <UploadCloud className="mr-2 h-5 w-5 text-gray-500" />
                  Escolher Arquivos
                </label>
                {selectedFiles && selectedFiles.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    ✓ {selectedFiles.length} arquivo(s) selecionado(s){getTotalSize()}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="nomeProduto" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <input
                  id="nomeProduto"
                  type="text"
                  placeholder="Ex: brx_iadados"
                  value={nomeProduto}
                  onChange={(e) => setNomeProduto(e.target.value)}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  id="descricao"
                  placeholder="Descreva o conteúdo dos arquivos..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Enviar Arquivo(s)
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Arquivos Agrupados por Produto */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Arquivos Enviados</h2>
          <p className="mt-1 text-sm text-gray-600">
            Total: {arquivos.length} arquivo{arquivos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-6">
          {arquivos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum arquivo enviado ainda
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupByProduct()).map(([produto, files]) => (
                <div key={produto} className="space-y-3">
                  {/* Header do Produto */}
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{produto}</h3>
                    <span className="text-sm text-gray-500">
                      ({files.length} arquivo{files.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Grid de Arquivos do Produto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((arquivo) => (
                      <div
                        key={arquivo.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {getFileIcon(arquivo.mediatype)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {arquivo.nome}
                              </p>
                              <p className="text-xs text-gray-500">
                                {arquivo.produto}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(arquivo.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {arquivo.descricao && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {arquivo.descricao}
                          </p>
                        )}

                        {arquivo.mediatype === 'image' && (
                          <div className="mb-2">
                            <img
                              src={arquivo.arquivo}
                              alt={arquivo.nome}
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}

                        <a
                          href={arquivo.arquivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-600 hover:underline truncate"
                        >
                          Ver arquivo
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 5.2 Componentes e UX

**Botão Customizado de Upload**:
```typescript
// Input nativo escondido
<input id="file-upload" type="file" className="hidden" />

// Label estilizado como botão
<label htmlFor="file-upload" className="inline-flex items-center...">
  <UploadCloud className="mr-2 h-5 w-5" />
  Escolher Arquivos
</label>
```

**Agrupamento por Produto**:
```typescript
const groupByProduct = () => {
  const grouped: { [key: string]: Arquivo[] } = {}
  arquivos.forEach(arquivo => {
    if (!grouped[arquivo.produto]) {
      grouped[arquivo.produto] = []
    }
    grouped[arquivo.produto].push(arquivo)
  })
  return grouped
}
```

**Ícones por Tipo**:
```typescript
const getFileIcon = (mediatype: string) => {
  switch (mediatype) {
    case 'image': return <ImageIcon className="h-8 w-8 text-blue-500" />
    case 'video': return <Video className="h-8 w-8 text-purple-500" />
    default: return <FileText className="h-8 w-8 text-gray-500" />
  }
}
```

---

## 6. Controle de Acesso e Permissões

### 6.1 Admin - Gerenciamento de Planos

Adicionar checkbox na página de administração de planos:

```typescript
// Exemplo simplificado
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    checked={plano.acesso_arquivos}
    onChange={(e) => handleUpdatePlano(plano.id, 'acesso_arquivos', e.target.checked)}
  />
  <label>Acesso aos Arquivos</label>
</div>
```

### 6.2 Sidebar - Exibição Condicional

```typescript
// Verificar permissão via view_usuarios_planos
{user?.acesso_arquivos && (
  <Link href="/arquivos">
    <FileText className="mr-2 h-4 w-4" />
    Arquivos
  </Link>
)}
```

### 6.3 Middleware de Proteção

```typescript
// Opcional: proteger rota no middleware
export function middleware(request: NextRequest) {
  const user = getUserFromToken(request)

  if (request.nextUrl.pathname.startsWith('/arquivos')) {
    if (!user?.acesso_arquivos) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
}
```

---

## 7. Deployment e Variáveis de Ambiente

### 7.1 Docker Compose

Adicionar variáveis ao `docker-compose.yml`:

```yaml
environment:
  # Outras variáveis...

  # Backblaze B2 Storage Configuration
  - B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
  - B2_REGION=us-east-005
  - B2_BUCKET_NAME=appdnxplataformas
  - B2_KEY_ID=005addebc7cc5530000000006
  - B2_BUCKET_ID=4a2d8d0e1becc7ac9c950513
  - B2_APPLICATION_KEY=K005qPI3/OXtJVzv620hYNHnA7Gct8I
```

⚠️ **IMPORTANTE**: Após alterar variáveis de ambiente, é necessário recriar o container:

```bash
# Remover stack
docker stack rm dnx-plataformas

# Redeployar com novas variáveis
docker stack deploy -c docker-compose.yml dnx-plataformas
```

### 7.2 Exemplo de `.env.example`

```bash
# =====================================================
# BACKBLAZE B2 STORAGE
# =====================================================

# Backblaze B2 Storage Configuration
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_ID=your-bucket-id-here
B2_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-application-key
```

---

## 8. Troubleshooting

### 8.1 Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| **401 Unauthorized** | Credenciais B2 incorretas | Verificar B2_KEY_ID e B2_APPLICATION_KEY (sem aspas!) |
| **IncompleteBody** | AWS SDK v3 incompatível | Usar API nativa B2 conforme documentação |
| **File is not defined** | Node.js 18 sem File global | Usar property checking: `'name' in value` |
| **Variáveis não atualizam** | Docker container em cache | Redeployar stack Docker |
| **Upload sem SHA1** | Header faltando | Adicionar `X-Bz-Content-Sha1` calculado |
| **RLS bloqueando** | Policies mal configuradas | Verificar policies do Supabase |

### 8.2 Debug Logs

Adicionar logs estratégicos:

```typescript
// Upload
console.log('[B2] Autorizando...')
console.log('[B2] Upload URL obtida')
console.log('[Upload] Enviando para B2:', fileName)
console.log('[Database] Salvando metadados')

// API
console.log('[API Arquivos] GET - userId:', userId)
console.log('[API Arquivos] Arquivos encontrados:', data?.length)
```

### 8.3 Validação de Credenciais

Teste manual via curl:

```bash
# Autorizar
curl https://api.backblazeb2.com/b2api/v2/b2_authorize_account \
  -u "KEY_ID:APPLICATION_KEY"

# Upload (após obter token e upload URL)
curl -X POST "UPLOAD_URL" \
  -H "Authorization: TOKEN" \
  -H "X-Bz-File-Name: test.txt" \
  -H "Content-Type: text/plain" \
  -H "X-Bz-Content-Sha1: SHA1_HASH" \
  --data "test content"
```

---

## 📝 Checklist de Implementação

- [ ] Criar bucket no Backblaze B2
- [ ] Gerar Application Key
- [ ] Adicionar variáveis de ambiente
- [ ] Criar tabela `arquivos` no Supabase
- [ ] Configurar RLS policies
- [ ] Adicionar coluna `acesso_arquivos` em `planos`
- [ ] Criar API route de upload (`/api/arquivos/upload/route.ts`)
- [ ] Criar API route CRUD (`/api/arquivos/route.ts`)
- [ ] Implementar página frontend (`/app/arquivos/page.tsx`)
- [ ] Adicionar checkbox no admin de planos
- [ ] Adicionar link na sidebar (condicional)
- [ ] Testar upload de múltiplos arquivos
- [ ] Testar agrupamento por produto
- [ ] Testar delete com ownership
- [ ] Configurar Docker com variáveis corretas
- [ ] Testar em produção

---

## 🎯 Melhorias Futuras (Opcional)

- [ ] Deletar arquivo do B2 ao deletar do banco
- [ ] Upload com drag & drop
- [ ] Progress bar de upload
- [ ] Filtros e busca de arquivos
- [ ] Download em lote
- [ ] Compartilhamento de arquivos entre usuários
- [ ] Versionamento de arquivos
- [ ] Compressão automática de imagens
- [ ] Preview de vídeos
- [ ] Limite de storage por plano

---

## 📚 Referências

- [Backblaze B2 API Documentation](https://www.backblaze.com/b2/docs/)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [Lucide React Icons](https://lucide.dev/)

---

**Versão**: 1.0
**Data**: 2025-10-11
**Autor**: DNX Plataformas
**Status**: ✅ Implementado e Testado
