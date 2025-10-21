'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  ExternalLink,
  Save
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ExtracaoProgressProps {
  extracaoId: number
  idExtracaoAPI: number
  nomeArquivo: string
  initialStatus: string
  userId: number
  apiKey: string
  onClose: () => void
}

interface ExtracaoStatus {
  idExtracao: number
  idContagem: number
  status: string // Status da API Profile: 'Processando', 'Finalizada', 'Erro', etc.
  nomeContagem?: string
  tipoPessoa?: string
  qtdeSolicitada?: number
  qtdeRetorno?: number
  dataCriacao?: string
  dataFinalizacao?: string
  usuario?: string
  tipoExtracao?: string
}

export default function ExtracaoProgress({ 
  extracaoId, 
  idExtracaoAPI,
  nomeArquivo, 
  initialStatus, 
  userId,
  apiKey, 
  onClose 
}: ExtracaoProgressProps) {
  const [status, setStatus] = useState<ExtracaoStatus>({
    idExtracao: idExtracaoAPI,
    idContagem: 0,
    status: initialStatus
  })
  const [polling, setPolling] = useState(true)
  const [consultandoManual, setConsultandoManual] = useState(false)
  const [salvandoNoBanco, setSalvandoNoBanco] = useState(false)
  const [mensagemSalvamento, setMensagemSalvamento] = useState<string | null>(null)
  const pollingCountRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const jaExtraidoRef = useRef(false) // Para evitar múltiplas tentativas

  // Função para salvar extrações no banco de dados
  const salvarExtracoesNoBanco = async () => {
    console.log('🔍 DEBUG: salvarExtracoesNoBanco chamada, jaExtraidoRef.current =', jaExtraidoRef.current)

    if (jaExtraidoRef.current) {
      console.log('⚠️ Extração já foi processada anteriormente')
      return
    }

    jaExtraidoRef.current = true
    setSalvandoNoBanco(true)
    setMensagemSalvamento('Salvando leads no banco de dados...')

    try {
      console.log('💾 Iniciando salvamento de leads para o banco de dados')
      console.log('📋 Props recebidas:', { idExtracaoAPI, nomeArquivo, userId, apiKey: apiKey ? 'presente' : 'ausente' })

      // Buscar arquivo de extração
      const downloadUrl = `/api/extracoes/download?idExtracao=${idExtracaoAPI}&apiKey=${encodeURIComponent(apiKey)}`

      console.log('📥 Buscando arquivo de extração:', downloadUrl)
      const fileResponse = await fetch(downloadUrl)

      console.log('📥 Resposta do fetch:', { status: fileResponse.status, ok: fileResponse.ok, headers: fileResponse.headers })

      if (!fileResponse.ok) {
        const errorText = await fileResponse.text()
        console.error('❌ Erro response:', { status: fileResponse.status, errorText })
        throw new Error(`Erro ao buscar arquivo: ${fileResponse.status} - ${errorText}`)
      }

      // Obter conteúdo do arquivo
      const fileContent = await fileResponse.text()
      console.log('📄 Arquivo recebido, tamanho:', fileContent.length, 'bytes')
      console.log('📄 Primeiras 500 caracteres:', fileContent.substring(0, 500))

      // Parsing: dividir por linhas e extrair dados
      // Esperamos formato CSV com cabeçalho (ignorar primeira linha)
      const linhas = fileContent.trim().split('\n')
      console.log(`🔍 DEBUG Parsing: Total de linhas brutas: ${linhas.length}`)

      if (linhas.length < 2) {
        throw new Error('Arquivo vazio ou sem dados válidos')
      }

      console.log(`📋 Total de linhas encontradas: ${linhas.length}`)
      console.log(`📋 Cabeçalho (linha 0): ${linhas[0]}`)

      let totalSalvos = 0
      let totalDuplicados = 0
      let totalErros = 0

      // Processar cada linha (ignorar cabeçalho)
      for (let i = 1; i < linhas.length; i++) {
        try {
          const linha = linhas[i].trim()
          if (!linha) {
            console.log(`⏭️ Linha ${i}: vazia, pulando`)
            continue
          }

          console.log(`🔍 Processando linha ${i}: "${linha.substring(0, 100)}"`)

          // Parsing simples: supor formato "nome,telefone" ou CSV mais complexo
          // Se for CSV, pode ter vírgulas dentro de aspas, então fazer parsing robusto
          const campos = linha.split(',').map(c => c.trim().replace(/^"|"$/g, ''))

          console.log(`🔍 Campos extraídos (${campos.length}):`, campos.slice(0, 3))

          if (campos.length < 2) {
            console.log(`⏭️ Linha ${i}: menos de 2 campos, pulando`)
            continue
          }

          const nomeLead = campos[0]?.trim() || 'Sem nome'
          const telefoneBruto = campos[1]?.trim() || ''
          console.log(`📝 Nome: "${nomeLead}", Telefone bruto: "${telefoneBruto}"`)

          // Formatar telefone: remover caracteres não numéricos
          const telefoneNumerico = telefoneBruto.replace(/\D/g, '')

          if (!telefoneNumerico || telefoneNumerico.length < 10) {
            console.log(`⏭️ Linha ${i}: Telefone inválido ou incompleto`)
            totalErros++
            continue
          }

          // Formatar telefone: (XX) 99999-9999 ou (XX) 9999-9999
          let numeroFormatado: string
          if (telefoneNumerico.length === 11) {
            // Com 9 dígito
            numeroFormatado = `(${telefoneNumerico.slice(0, 2)}) ${telefoneNumerico.slice(2, 7)}-${telefoneNumerico.slice(7)}`
          } else if (telefoneNumerico.length === 10) {
            // Sem 9 dígito
            numeroFormatado = `(${telefoneNumerico.slice(0, 2)}) ${telefoneNumerico.slice(2, 6)}-${telefoneNumerico.slice(6)}`
          } else {
            console.log(`⏭️ Linha ${i}: Telefone com formato desconhecido`)
            totalErros++
            continue
          }

          console.log(`📞 Processando: ${nomeLead} - ${numeroFormatado}`)

          // Verificar duplicata
          console.log(`🔍 Verificando duplicata: user_id=${userId}, numero_formatado=${numeroFormatado}`)
          const { data: existingLead, error: searchError } = await supabase
            .from('leads')
            .select('id')
            .eq('user_id', userId)
            .eq('numero_formatado', numeroFormatado)
            .maybeSingle()

          console.log(`🔍 Resultado busca duplicata:`, { existingLead, searchError })

          if (searchError) {
            console.error(`❌ Erro ao buscar duplicata para ${numeroFormatado}:`, searchError)
            totalErros++
            continue
          }

          if (existingLead) {
            console.log(`✅ Telefone ${numeroFormatado} já existe para este usuário`)
            totalDuplicados++
            continue
          }

          // Salvar novo lead
          console.log(`💾 Tentando inserir lead:`, {
            user_id: userId,
            nome_cliente: nomeLead,
            numero_formatado: numeroFormatado,
            nome_campanha: nomeArquivo
          })

          const { data: insertedLead, error: insertError } = await supabase
            .from('leads')
            .insert({
              user_id: userId,
              nome_cliente: nomeLead,
              numero_formatado: numeroFormatado,
              nome_campanha: nomeArquivo, // Usar nome da extração como campanha
              origem: 'Extração de Leads',
              email_usuario: null,
              nome_empresa: null,
              cpf_cnpj: null,
              ativo: true,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          console.log(`💾 Resultado insert:`, { insertedLead, insertError })

          if (insertError) {
            console.error(`❌ Erro ao inserir lead ${numeroFormatado}:`, insertError)
            totalErros++
            continue
          }

          console.log(`✔️ Lead salvo com sucesso: ${nomeLead} - ${numeroFormatado}`)
          totalSalvos++
        } catch (lineError) {
          console.error(`Erro ao processar linha ${i}:`, lineError)
          totalErros++
        }
      }

      const mensagem = `✅ Salvamento concluído! Leads salvos: ${totalSalvos}, Duplicados: ${totalDuplicados}, Erros: ${totalErros}`
      setMensagemSalvamento(mensagem)
      console.log('✅ Salvamento concluído:', { totalSalvos, totalDuplicados, totalErros, mensagem })
    } catch (error) {
      console.error('💥 Erro ao salvar extrações:', error)
      const mensagemErro = `❌ Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      setMensagemSalvamento(mensagemErro)
      console.error('💥 Mensagem de erro definida:', mensagemErro)
    } finally {
      console.log('🏁 Finalizando salvamento')
      setSalvandoNoBanco(false)
    }
  }

  // Função para verificar status da extração
  const verificarStatus = async (manual = false) => {
    if (manual) setConsultandoManual(true)

    try {
      pollingCountRef.current += 1
      console.log('🔄 Verificando status da extração:', { extracaoId, idExtracaoAPI, tentativa: pollingCountRef.current })

      const response = await fetch('/api/extracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extracaoId,
          userId,
          apiKey,
          idExtracaoAPI
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Status recebido:', data.extracao)
        setStatus(data.extracao)

        // Parar polling se processado, com erro ou cancelado
        if (data.extracao.status === 'Processado' ||
            data.extracao.status === 'Finalizada' ||
            data.extracao.status === 'Erro' ||
            data.extracao.status === 'Cancelada') {
          console.log('✅ Extração finalizada, parando polling:', data.extracao.status)
          setPolling(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }

          // Salvar no banco quando completar com sucesso
          if (data.extracao.status === 'Processado' || data.extracao.status === 'Finalizada') {
            console.log('💾 Iniciando salvamento automático no banco de dados...')
            console.log('💾 DEBUG: Chamando salvarExtracoesNoBanco()')
            await salvarExtracoesNoBanco()
            console.log('💾 DEBUG: salvarExtracoesNoBanco() concluída')
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ Erro na resposta da API:', response.status, errorData)

        // Se erro 404, pode ser que a extração não existe na API - parar polling
        if (response.status === 404) {
          console.log('🚫 Extração não encontrada, parando polling')
          setPolling(false)
          setStatus(prev => ({ ...prev, status: 'Erro' }))
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      }
    } catch (error) {
      console.error('💥 Erro ao verificar status:', error)
      // Não parar polling em caso de erro de rede - pode ser temporário
    } finally {
      if (manual) setConsultandoManual(false)
    }
  }

  // Polling para verificar status
  useEffect(() => {
    if (!polling) {
      // Limpar interval se polling foi desabilitado
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Verificar status imediatamente (apenas no primeiro uso)
    if (pollingCountRef.current === 0) {
      verificarStatus()
    }

    // Continuar verificando a cada 10 segundos por até 10 minutos (60 tentativas)
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (pollingCountRef.current < 60) {
          verificarStatus()
        } else {
          console.log('⏰ Timeout do polling após 10 minutos')
          setPolling(false)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      }, 10000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [polling, extracaoId, idExtracaoAPI])

  // Função para download
  const handleDownload = () => {
    if (status.status === 'Processado' || status.status === 'Finalizada') {
      const downloadUrl = `/api/extracoes/download?idExtracao=${idExtracaoAPI}&apiKey=${encodeURIComponent(apiKey)}`
      window.open(downloadUrl, '_blank')
    }
  }

  // Função para deletar extração
  const handleDelete = () => {
    if (confirm('Tem certeza que deseja remover esta extração da lista?')) {
      onClose()
    }
  }

  // Ícone baseado no status
  const getStatusIcon = () => {
    switch (status.status) {
      case 'Processado':
      case 'Finalizada':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'Erro':
      case 'Cancelada':
        return <AlertCircle className="h-6 w-6 text-red-600" />
      case 'Processando':
        return <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-6 w-6 text-yellow-600" />
    }
  }

  // Cor do status
  const getStatusColor = () => {
    switch (status.status) {
      case 'Processado':
      case 'Finalizada':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'Erro':
      case 'Cancelada':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'Processando':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  }

  // Texto do status
  const getStatusText = () => {
    switch (status.status) {
      case 'Processando':
        return 'Processando...'
      case 'Processado':
      case 'Finalizada':
        return 'Concluída'
      case 'Erro':
        return 'Erro no processamento'
      case 'Cancelada':
        return 'Cancelada'
      default:
        return status.status || 'Aguardando...'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Status da Extração</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          {/* Nome do arquivo */}
          <div>
            <label className="text-sm font-medium text-gray-700">Arquivo:</label>
            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
              {nomeArquivo}
            </div>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${getStatusColor()}`}>
            {getStatusIcon()}
            <div className="flex-1">
              <div className="font-semibold">{getStatusText()}</div>
              {status.dataFinalizacao && (
                <div className="text-sm opacity-75">
                  Concluída em: {new Date(status.dataFinalizacao).toLocaleString('pt-BR')}
                </div>
              )}
              {status.qtdeRetorno && (
                <div className="text-sm opacity-75">
                  Registros extraídos: {status.qtdeRetorno.toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {/* Mensagem de Salvamento */}
          {(salvandoNoBanco || mensagemSalvamento) && (
            <div className={`p-3 rounded-lg border ${
              salvandoNoBanco
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : mensagemSalvamento.includes('✅')
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {salvandoNoBanco && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                <span className="text-sm font-medium">{mensagemSalvamento}</span>
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          {status.tipoExtracao && (
            <div className="text-sm text-gray-600">
              Tipo: {status.tipoExtracao}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {status.status === 'Processado' || status.status === 'Finalizada' ? (
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Fazer Download
              </button>
            ) : status.status === 'Erro' || status.status === 'Cancelada' ? (
              <div className="flex-1 text-center text-red-600 py-2">
                {status.status === 'Erro' ? 'Erro no processamento. Tente novamente.' : 'Extração cancelada.'}
              </div>
            ) : (
              <button
                onClick={() => verificarStatus(true)}
                disabled={consultandoManual}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${consultandoManual ? 'animate-spin' : ''}`} />
                {consultandoManual ? 'Consultando...' : 'Consultar Status'}
              </button>
            )}

            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              title="Remover extração da lista"
            >
              <X className="h-4 w-4" />
              Deletar
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>

          {/* Atualização automática */}
          {polling && (
            <div className="text-xs text-gray-500 text-center">
              Status atualizado automaticamente a cada 10 segundos ({pollingCountRef.current}/60 tentativas)
            </div>
          )}
          {!polling && pollingCountRef.current >= 60 && (
            <div className="text-xs text-yellow-600 text-center">
              ⏰ Timeout após 10 minutos. Use "Consultar Status" para verificar manualmente.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}