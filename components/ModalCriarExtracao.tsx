'use client'

import { useState } from 'react'
import { 
  X, 
  Download, 
  Settings,
  Database,
  Users
} from 'lucide-react'

interface TipoExtracao {
  idTipoAcesso: number
  descricao: string
  limiteUtilizacao?: number
  totalUtilizado: number
}

interface ModalCriarExtracaoProps {
  idContagem: number
  nomeContagem: string
  tipoPessoa: 'pf' | 'pj'
  totalRegistros: number
  onConfirmar: (dados: {
    idContagem: number
    idTipoAcesso: number
    qtdeSolicitada: number
    removerRegistrosExtraidos: boolean
  }) => void
  onCancelar: () => void
}

const TIPOS_EXTRACAO: TipoExtracao[] = [
  {
    idTipoAcesso: 3,
    descricao: "Extração pessoa física",
    limiteUtilizacao: null,
    totalUtilizado: 400174
  },
  {
    idTipoAcesso: 4,
    descricao: "Extração pessoa jurídica",
    limiteUtilizacao: null,
    totalUtilizado: 1015932
  },
  {
    idTipoAcesso: 11,
    descricao: "Qualificação celular pessoa física",
    limiteUtilizacao: null,
    totalUtilizado: 5145
  },
  {
    idTipoAcesso: 12,
    descricao: "Qualificação celular pessoa jurídica",
    limiteUtilizacao: null,
    totalUtilizado: 110
  },
  {
    idTipoAcesso: 13,
    descricao: "Extração + Qualificação celular pessoa física",
    limiteUtilizacao: null,
    totalUtilizado: 9593358
  },
  {
    idTipoAcesso: 14,
    descricao: "Extração + Qualificação celular pessoa jurídica",
    limiteUtilizacao: null,
    totalUtilizado: 3532056
  }
]

export default function ModalCriarExtracao({
  idContagem,
  nomeContagem,
  tipoPessoa,
  totalRegistros,
  onConfirmar,
  onCancelar
}: ModalCriarExtracaoProps) {
  const [idTipoAcesso, setIdTipoAcesso] = useState<number>(tipoPessoa === 'pf' ? 3 : 4)
  const [qtdeSolicitada, setQtdeSolicitada] = useState<number>(Math.min(1000, totalRegistros))
  const [removerRegistrosExtraidos, setRemoverRegistrosExtraidos] = useState<boolean>(true)

  // Filtrar tipos de extração baseado no tipo de pessoa
  const tiposDisponiveis = TIPOS_EXTRACAO.filter(tipo => {
    if (tipoPessoa === 'pf') {
      // Para PF: tipos 3, 11, 13
      return [3, 11, 13].includes(tipo.idTipoAcesso)
    } else {
      // Para PJ: tipos 4, 12, 14  
      return [4, 12, 14].includes(tipo.idTipoAcesso)
    }
  })

  const tipoSelecionado = TIPOS_EXTRACAO.find(t => t.idTipoAcesso === idTipoAcesso)

  const handleConfirmar = () => {
    if (qtdeSolicitada <= 0 || qtdeSolicitada > totalRegistros) {
      alert(`Quantidade deve ser entre 1 e ${totalRegistros.toLocaleString('pt-BR')}`)
      return
    }

    onConfirmar({
      idContagem,
      idTipoAcesso,
      qtdeSolicitada,
      removerRegistrosExtraidos
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Criar Extração</h3>
              <p className="text-sm text-gray-600">Configure os parâmetros da extração</p>
            </div>
          </div>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informações da Contagem */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Contagem Selecionada</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nome:</span>
              <div className="font-medium">{nomeContagem}</div>
            </div>
            <div>
              <span className="text-gray-600">ID:</span>
              <div className="font-mono font-medium">{idContagem}</div>
            </div>
            <div>
              <span className="text-gray-600">Tipo:</span>
              <div className="font-medium">{tipoPessoa === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</div>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <div className="font-medium">{totalRegistros.toLocaleString('pt-BR')} registros</div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="space-y-6">
          {/* Tipo de Acesso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Settings className="inline h-4 w-4 mr-1" />
              Tipo de Extração
            </label>
            <select
              value={idTipoAcesso}
              onChange={(e) => setIdTipoAcesso(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {tiposDisponiveis.map(tipo => (
                <option key={tipo.idTipoAcesso} value={tipo.idTipoAcesso}>
                  {tipo.descricao} (Usado: {tipo.totalUtilizado.toLocaleString('pt-BR')})
                </option>
              ))}
            </select>
            {tipoSelecionado && (
              <p className="mt-1 text-xs text-gray-500">
                ID: {tipoSelecionado.idTipoAcesso} • Total utilizado: {tipoSelecionado.totalUtilizado.toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          {/* Quantidade Solicitada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Quantidade Solicitada
            </label>
            <input
              type="number"
              value={qtdeSolicitada}
              onChange={(e) => setQtdeSolicitada(Number(e.target.value))}
              min={1}
              max={totalRegistros}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 1000"
            />
            <p className="mt-1 text-xs text-gray-500">
              Máximo disponível: {totalRegistros.toLocaleString('pt-BR')} registros
            </p>
          </div>

          {/* Remover Registros Extraídos */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={removerRegistrosExtraidos}
                onChange={(e) => setRemoverRegistrosExtraidos(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Remover registros já extraídos
                </div>
                <div className="text-xs text-gray-500">
                  Remove da contagem os registros que já foram extraídos anteriormente
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Criar Extração
          </button>
        </div>
      </div>
    </div>
  )
}