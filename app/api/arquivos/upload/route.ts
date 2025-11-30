import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'
import axios from 'axios'
import crypto from 'crypto'

// Cache do token de autorização B2
let b2AuthCache: {
  token: string
  apiUrl: string
  expiresAt: number
} | null = null

// Função para autorizar com B2 e obter token
async function getB2Authorization() {
  // Verificar se temos token válido em cache
  if (b2AuthCache && b2AuthCache.expiresAt > Date.now()) {
    return b2AuthCache
  }

  const authString = Buffer.from(
    `${process.env.B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`
  ).toString('base64')

  const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: {
      Authorization: `Basic ${authString}`,
    },
  })

  // Cache por 23 horas (token válido por 24h)
  b2AuthCache = {
    token: response.data.authorizationToken,
    apiUrl: response.data.apiUrl,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  }

  return b2AuthCache
}

// Função para obter URL de upload
async function getB2UploadUrl(bucketId: string, auth: { token: string; apiUrl: string }) {
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
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get('userId') as string
    const workspaceId = formData.get('workspaceId') as string | null
    const nomeProduto = formData.get('nomeProduto') as string
    const descricao = formData.get('descricao') as string | null

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    if (!nomeProduto) {
      return NextResponse.json(
        { error: 'Nome do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Se não tiver workspaceId, buscar do usuário
    let wsId = workspaceId
    if (!wsId) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('current_workspace_id')
        .eq('id', parseInt(userId))
        .single()
      wsId = userData?.current_workspace_id || null
    }

    // Obter autorização B2
    const auth = await getB2Authorization()

    // Obter todos os arquivos do FormData
    const files: any[] = []
    formData.forEach((value, key) => {
      // Verificar se é um arquivo checando se tem as propriedades necessárias
      if (key.startsWith('files[') && typeof value === 'object' && value !== null && 'name' in value && 'type' in value) {
        files.push(value)
      }
    })

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um arquivo é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const uploadedFiles: any[] = []

    // Obter URL de upload
    const uploadAuth = await getB2UploadUrl(process.env.B2_BUCKET_ID!, auth)

    // Upload de cada arquivo
    for (const file of files) {
      // Converter arquivo para Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(7)
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const sanitizedProduto = nomeProduto.replace(/[^a-zA-Z0-9_-]/g, '_')
      const fileName = `${sanitizedProduto}/${sanitizedFileName}_${timestamp}_${randomSuffix}`

      // Calcular SHA1 do arquivo (obrigatório para B2)
      const sha1 = crypto.createHash('sha1').update(buffer).digest('hex')

      try {
        // Upload usando API nativa do B2
        const uploadResponse = await axios.post(uploadAuth.uploadUrl, buffer, {
          headers: {
            'Authorization': uploadAuth.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(fileName),
            'Content-Type': file.type || 'application/octet-stream',
            'Content-Length': buffer.length.toString(),
            'X-Bz-Content-Sha1': sha1,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        })
      } catch (uploadError: any) {
        throw uploadError
      }

      const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`

      const mediaType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'file'

      // Salvar no banco
      const { data, error } = await supabase
        .from('arquivos')
        .insert({
          nome: file.name,
          mimetype: file.type,
          mediatype: mediaType,
          arquivo: fileUrl,
          descricao: descricao || null,
          produto: nomeProduto,
          user_id: parseInt(userId),
          workspace_id: wsId || null,
        })
        .select()
        .single()

      if (error) {
        continue // Continua com os próximos arquivos
      }

      uploadedFiles.push({
        id: data.id,
        nome: data.nome,
        arquivo: data.arquivo,
        produto: data.produto,
        mediatype: data.mediatype,
      })
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Erro ao fazer upload dos arquivos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles,
      count: uploadedFiles.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}
