import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSupabaseAdmin } from '../../../../lib/supabase'

const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
  // Desabilitar checksums que podem causar problemas com B2
  requestChecksumCalculation: 'WHEN_REQUIRED' as const,
})

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Configuração B2:', {
      endpoint: process.env.B2_ENDPOINT,
      region: process.env.B2_REGION,
      bucket: process.env.B2_BUCKET_NAME,
      hasKeyId: !!process.env.B2_KEY_ID,
      hasAppKey: !!process.env.B2_APPLICATION_KEY,
    })

    const formData = await request.formData()
    const userId = formData.get('userId') as string
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

    // Obter todos os arquivos do FormData
    const files: any[] = []
    formData.forEach((value, key) => {
      // Verificar se é um arquivo checando se tem as propriedades necessárias
      if (key.startsWith('files[') && typeof value === 'object' && value !== null && 'name' in value && 'type' in value) {
        files.push(value)
      }
    })

    console.log('[Upload] Total de arquivos encontrados:', files.length)

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um arquivo é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const uploadedFiles: any[] = []

    // Upload de cada arquivo
    for (const file of files) {
      console.log('[Upload] Processando arquivo:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size)

      // Converter arquivo para Buffer - a forma mais compatível com S3
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      console.log('[Upload] Buffer criado - Tamanho:', buffer.length, 'bytes', 'Original size:', file.size)

      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(7)
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const sanitizedProduto = nomeProduto.replace(/[^a-zA-Z0-9_-]/g, '_')
      const key = `${sanitizedProduto}/${sanitizedFileName}_${timestamp}_${randomSuffix}`

      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ContentLength: buffer.length,
      })

      console.log('[Upload] Enviando para B2 - Key:', key, 'ContentLength:', buffer.length, 'bytes')

      try {
        const uploadResult = await s3Client.send(uploadCommand)
        console.log('[Upload] Upload para B2 concluído com sucesso:', uploadResult)
      } catch (uploadError: any) {
        console.error('[Upload] Erro detalhado ao enviar para B2:', {
          message: uploadError.message,
          code: uploadError.Code || uploadError.code,
          statusCode: uploadError.$metadata?.httpStatusCode,
          requestId: uploadError.$metadata?.requestId,
        })
        throw uploadError
      }

      const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`

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
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar arquivo no banco:', error)
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
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}
