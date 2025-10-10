'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Image as ImageIcon, Video, Trash2, Loader2 } from 'lucide-react'

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
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [nomeProduto, setNomeProduto] = useState('')
  const [nomeFoto, setNomeFoto] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    fetchArquivos()
  }, [])

  const fetchArquivos = async () => {
    try {
      const response = await fetch('/api/arquivos')
      const data = await response.json()
      setArquivos(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      if (!nomeFoto) {
        setNomeFoto(file.name.split('.')[0])
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile || !nomeProduto || !nomeFoto) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('nomeProduto', nomeProduto)
      formData.append('nomeFoto', nomeFoto)
      if (descricao) {
        formData.append('descricao', descricao)
      }

      const response = await fetch('/api/arquivos/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        alert('Arquivo enviado com sucesso!')
        setSelectedFile(null)
        setNomeProduto('')
        setNomeFoto('')
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
    if (!confirm('Tem certeza que deseja deletar este arquivo?')) {
      return
    }

    try {
      const response = await fetch(`/api/arquivos?id=${id}`, {
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
          Gerencie seus arquivos e faça upload de novos
        </p>
      </div>

      {/* Formulário de Upload */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Enviar Novo Arquivo</h2>
          <p className="mt-1 text-sm text-gray-600">
            Faça upload de imagens, vídeos ou documentos
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
                  Arquivo <span className="text-red-500">*</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,application/pdf"
                  required
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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

              <div>
                <label htmlFor="nomeFoto" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Foto <span className="text-red-500">*</span>
                </label>
                <input
                  id="nomeFoto"
                  type="text"
                  placeholder="Ex: demonstracao"
                  value={nomeFoto}
                  onChange={(e) => setNomeFoto(e.target.value)}
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
                  placeholder="Descreva o conteúdo do arquivo..."
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
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Arquivo
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Arquivos */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arquivos.map((arquivo) => (
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
                        <p className="text-xs text-gray-500 truncate">
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
          )}
        </div>
      </div>
    </div>
  )
}
