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
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
                  Arquivo(s) <span className="text-red-500">*</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,application/pdf"
                  multiple
                  required
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                {selectedFiles && selectedFiles.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedFiles.length} arquivo(s) selecionado(s){getTotalSize()}
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
