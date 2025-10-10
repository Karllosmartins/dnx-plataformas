import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSupabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
})

async function getUserFromToken() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
    const { payload } = await jwtVerify(token, secret)

    return payload.userId as string
  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken()

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const nomeProduto = formData.get('nomeProduto') as string
    const nomeFoto = formData.get('nomeFoto') as string
    const descricao = formData.get('descricao') as string | null

    if (!file || !nomeProduto || !nomeFoto) {
      return NextResponse.json(
        { error: 'Arquivo, nome do produto e nome da foto são obrigatórios' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const timestamp = Date.now()
    const sanitizedFileName = nomeFoto.replace(/[^a-zA-Z0-9.-]/g, '_')
    const sanitizedProduto = nomeProduto.replace(/[^a-zA-Z0-9_-]/g, '_')
    const key = `${sanitizedProduto}/${sanitizedFileName}_${timestamp}`

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(uploadCommand)

    const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`

    const mediaType = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : 'file'

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('arquivos')
      .insert({
        nome: nomeFoto,
        mimetype: file.type,
        mediatype: mediaType,
        arquivo: fileUrl,
        descricao: descricao || null,
        produto: nomeProduto,
        user_id: parseInt(userId),
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar no banco:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar arquivo no banco de dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        nome: data.nome,
        arquivo: data.arquivo,
        produto: data.produto,
        mediatype: data.mediatype,
      },
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}
