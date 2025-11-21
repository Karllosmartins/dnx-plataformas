'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../shared/AuthWrapper'
import { supabase, UserAgentVectorStore } from '../../../lib/supabase'
import { 
  Database, 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  Settings, 
  RefreshCw,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react'

interface VectorStoreManagerProps {
  agentId: number
}

interface VectorStoreFile {
  id: string
  object: string
  bytes: number
  created_at: number
  filename: string
  purpose: string
  status: string
  status_details?: any
}

export default function VectorStoreManager({ agentId }: VectorStoreManagerProps) {
  const { user } = useAuth()
  const [vectorStore, setVectorStore] = useState<UserAgentVectorStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<VectorStoreFile[]>([])
  const [showFiles, setShowFiles] = useState(false)
  const [vectorStoreName, setVectorStoreName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (user && agentId) {
      checkVectorStore()
    }
  }, [user, agentId])

  const checkVectorStore = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/vectorstores?userId=${user.id}&agentId=${agentId}`)
      const data = await response.json()
      
      if (data.hasVectorStore && data.vectorStore) {
        setVectorStore(data.vectorStore)
        loadFiles()
      } else {
        setVectorStore(null)
      }
    } catch (error) {
      console.error('Erro ao verificar vector store:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/vectorstores/files?userId=${user.id}&agentId=${agentId}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    }
  }

  const createVectorStore = async () => {
    if (!user || !vectorStoreName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/vectorstores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          agentId: agentId,
          vectorStoreName: vectorStoreName.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Vector Store criado com sucesso!')
        setVectorStoreName('')
        setShowCreateForm(false)
        checkVectorStore()
      } else {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Erro ao criar Vector Store'
        alert(errorMessage)
        console.error('Erro detalhado:', data)
      }
    } catch (error) {
      console.error('Erro ao criar vector store:', error)
      alert('Erro ao criar Vector Store')
    } finally {
      setCreating(false)
    }
  }

  const toggleVectorStore = async () => {
    if (!user || !vectorStore) return

    try {
      const response = await fetch('/api/vectorstores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          agentId: agentId,
          isActive: !vectorStore.is_active
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setVectorStore({ ...vectorStore, is_active: !vectorStore.is_active })
      } else {
        alert(data.error || 'Erro ao alterar status do Vector Store')
      }
    } catch (error) {
      console.error('Erro ao alterar vector store:', error)
      alert('Erro ao alterar Vector Store')
    }
  }

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)
      formData.append('agentId', agentId.toString())

      const response = await fetch('/api/vectorstores/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Arquivo enviado com sucesso!')
        loadFiles()
      } else {
        alert(data.error || 'Erro ao enviar arquivo')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      // Reset input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Tem certeza que deseja remover este arquivo?')) return

    try {
      const response = await fetch('/api/vectorstores/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          agentId: agentId,
          fileId: fileId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Arquivo removido com sucesso!')
        loadFiles()
      } else {
        alert(data.error || 'Erro ao remover arquivo')
      }
    } catch (error) {
      console.error('Erro ao remover arquivo:', error)
      alert('Erro ao remover arquivo')
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Verificando Vector Store...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h4 className="text-sm font-medium text-gray-900">Vector Store</h4>
        </div>
        
        {vectorStore && (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={vectorStore.is_active}
              onChange={toggleVectorStore}
              className="sr-only"
            />
            <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              vectorStore.is_active ? 'bg-green-600' : 'bg-gray-300'
            }`}>
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                vectorStore.is_active ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className="ml-2 text-xs text-gray-600">
              {vectorStore.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </label>
        )}
      </div>

      {!vectorStore ? (
        <div className="text-center py-4">
          <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-4">
            Nenhum Vector Store configurado para este agente
          </p>
          
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              Criar Vector Store
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={vectorStoreName}
                onChange={(e) => setVectorStoreName(e.target.value)}
                placeholder="Nome do Vector Store"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={255}
              />
              <div className="flex gap-2">
                <button
                  onClick={createVectorStore}
                  disabled={creating || !vectorStoreName.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {creating ? 'Criando...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setVectorStoreName('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-900">Vector Store ativo</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  onChange={uploadFile}
                  disabled={uploading || !vectorStore.is_active}
                  className="sr-only"
                  accept=".pdf,.txt,.doc,.docx,.md"
                />
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  vectorStore.is_active && !uploading
                    ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}>
                  {uploading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {uploading ? 'Enviando...' : 'Upload'}
                </div>
              </label>
              
              <button
                onClick={() => setShowFiles(!showFiles)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs"
              >
                <FileText className="h-3 w-3" />
                Arquivos ({files.length})
              </button>
            </div>
          </div>

          {showFiles && (
            <div className="border-t pt-3 mt-3">
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(file.bytes / 1024).toFixed(1)} KB • {file.status}
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Remover arquivo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Nenhum arquivo enviado</p>
                </div>
              )}
            </div>
          )}

          {!vectorStore.is_active && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                Vector Store desativado. Ative para usar upload de arquivos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}