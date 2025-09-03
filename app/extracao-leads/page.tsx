'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import { supabase } from '../../lib/supabase'
import PlanProtection from '../../components/PlanProtection'
import { 
  Target, 
  Search, 
  Users, 
  Database, 
  Download,
  Play,
  Pause,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Filter,
  Settings,
  History,
  X,
  RefreshCw
} from 'lucide-react'

// =================== INTERFACES API ===================

interface LoginResponse {
  msg: string
  token: string
  expiraEm: number
}

interface Uf {
  idUf: number
  uf1: string
  ufDescricao: string
}

interface Cidade {
  idcidade: number
  cidade1: string
  idUf: number
  uf: string
}

interface EstadoMunicipiosVM {
  idsUfs: number[]
  idsMunicipios: number[]
}

interface ContagemPf {
  idadeMinima?: number
  idadeMaxima?: number
  rendaMinimo?: number
  rendaMaximo?: number
  possuiMae?: boolean
  possuiEndereco?: boolean
  possuiEmail?: boolean
  possuiTelefone?: boolean
  possuiCelular?: boolean
  sexos?: string[]
  classesSociais?: string[]
  estadosCivis?: string[]
  profissoes?: string[]
  scores?: string[]
  operadorasCelular?: string[]
  dddsCelular?: string[]
}

interface ContagemPj {
  dataAberturaMinima?: string
  dataAberturaMaxima?: string
  numeroFuncionariosMinimo?: number
  numeroFuncionariosMaximo?: number
  numeroSociosMinimo?: number
  numeroSociosMaximo?: number
  faturamentoMinimo?: number
  faturamentoMaximo?: number
  somenteMatriz?: boolean
  possuiEndereco?: boolean
  possuiEmail?: boolean
  possuiTelefone?: boolean
  possuiCelular?: boolean
  cnaes?: string[]
  portes?: string[]
  tiposEmpresa?: string[]
  scores?: string[]
  operadorasCelular?: string[]
  dddsCelular?: string[]
}

interface NovaContagemApiPfVM {
  nomeContagem: string
  estadosMunicipios: EstadoMunicipiosVM
  contagemPf: ContagemPf
}

interface NovaContagemApiPjVM {
  nomeContagem: string
  estadosMunicipios: EstadoMunicipiosVM
  contagemPj: ContagemPj
}

interface ContagemRetornoVM {
  sucesso: boolean
  msg: string
  idContagem: number
  quantidades?: Array<{
    descricao: string
    total: number
  }>
}

interface CriarExtracaoVM {
  idContagem: number
  idTipoAcesso: number
  qtdeSolicitada: number
  removerRegistrosExtraidos: boolean
}

interface CriarExtracaoRetornoVM {
  sucesso: boolean
  msg: string
  idExtracao: number
}

interface DetalhesExtracaoVM {
  sucesso: boolean
  msg: string
  idExtracao: number
  idContagem: number
  status: string
  nomeContagem: string
  tipoPessoa: string
  qtdeSolicitada: number
  qtdeRetorno?: number
  dataFinalizacao?: string
  tipoExtracao: string
}

interface ResultadoExtracaoVM {
  idExtracao: number
  tipoExtracao: string
  tipoPessoa: string
  data: string
  status: string
  usuario: string
  qtdeSolicitada: number
}

// =================== COMPONENTE PRINCIPAL ===================

export default function ExtracaoLeadsPage() {
  const { user } = useAuth()
  const [apiConfig, setApiConfig] = useState<{
    baseUrl: string
    apiKey: string
    token?: string
  }>({
    baseUrl: 'https://apiprofile.infinititi.com.br/api',
    apiKey: '043d2754-cd7f-47ba-b83b-0dbbb3877f36'
  })

  // Estados da interface
  const [activeTab, setActiveTab] = useState<'pf' | 'pj'>('pf')
  const [currentStep, setCurrentStep] = useState<'config' | 'filtros' | 'contagem' | 'extracao' | 'historico'>('filtros')
  
  // Estados dos dados
  const [ufs, setUfs] = useState<Uf[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [selectedUfs, setSelectedUfs] = useState<number[]>([])
  const [selectedCidades, setSelectedCidades] = useState<number[]>([])

  // Estados do formulário PF
  const [formPf, setFormPf] = useState<ContagemPf>({
    possuiEmail: true,
    possuiCelular: true
  })

  // Estados do formulário PJ
  const [formPj, setFormPj] = useState<ContagemPj>({
    possuiEmail: true,
    possuiCelular: true
  })

  // Estados do processo
  const [nomeContagem, setNomeContagem] = useState('')
  const [contagemAtual, setContagemAtual] = useState<ContagemRetornoVM | null>(null)
  const [extracaoAtual, setExtracaoAtual] = useState<DetalhesExtracaoVM | null>(null)
  const [qtdeSolicitada, setQtdeSolicitada] = useState(100)
  
  // Estados de controle
  const [loading, setLoading] = useState(false)
  const [pollingContagem, setPollingContagem] = useState(false)
  const [pollingExtracao, setPollingExtracao] = useState(false)
  const [historico, setHistorico] = useState<ResultadoExtracaoVM[]>([])

  // =================== FUNÇÕES DA API ===================

  const authenticateAPI = async (): Promise<boolean> => {
    if (!apiConfig.apiKey.trim()) {
      alert('Configure sua API Key primeiro')
      return false
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/profile-proxy?endpoint=/Auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiConfig.apiKey })
      })

      const data: LoginResponse = await response.json()
      
      if (data.token) {
        setApiConfig(prev => ({ ...prev, token: data.token }))
        alert('Autenticado com sucesso!')
        setCurrentStep('filtros')
        return true
      } else {
        alert('Erro na autenticação: ' + data.msg)
        return false
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
      alert('Erro ao conectar com a API')
      return false
    } finally {
      setLoading(false)
    }
  }

  const loadUfs = async () => {
    if (!apiConfig.token) return

    try {
      const endpoint = activeTab === 'pf' ? 'ContagemPf' : 'ContagemPj'
      const response = await fetch(`/api/profile-proxy?endpoint=/${endpoint}/ListarUfs`, {
        headers: { 'Authorization': `Bearer ${apiConfig.token}` }
      })
      
      const data: Uf[] = await response.json()
      setUfs(data)
    } catch (error) {
      console.error('Erro ao carregar UFs:', error)
    }
  }

  const loadCidades = async (idsUfs: number[]) => {
    if (!apiConfig.token || idsUfs.length === 0) {
      setCidades([])
      return
    }

    try {
      const endpoint = activeTab === 'pf' ? 'ContagemPf' : 'ContagemPj'
      const queryString = idsUfs.map(id => `idsUfs=${id}`).join('&')
      const response = await fetch(`/api/profile-proxy?endpoint=/${endpoint}/ListarMunicipios?${queryString}`, {
        headers: { 'Authorization': `Bearer ${apiConfig.token}` }
      })
      
      const data: Cidade[] = await response.json()
      setCidades(data)
    } catch (error) {
      console.error('Erro ao carregar cidades:', error)
    }
  }

  const criarContagem = async () => {
    if (!apiConfig.token || !nomeContagem.trim()) {
      alert('Configure o nome da contagem')
      return
    }

    try {
      setLoading(true)
      const endpoint = activeTab === 'pf' ? 'ContagemPf' : 'ContagemPj'
      
      const payload = activeTab === 'pf' ? {
        nomeContagem,
        estadosMunicipios: {
          idsUfs: selectedUfs,
          idsMunicipios: selectedCidades
        },
        contagemPf: formPf
      } as NovaContagemApiPfVM : {
        nomeContagem,
        estadosMunicipios: {
          idsUfs: selectedUfs,
          idsMunicipios: selectedCidades
        },
        contagemPj: formPj
      } as NovaContagemApiPjVM

      const response = await fetch(`/api/profile-proxy?endpoint=/${endpoint}/CriarContagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data: ContagemRetornoVM = await response.json()
      
      if (data.sucesso) {
        setContagemAtual(data)
        setCurrentStep('contagem')
        startPollingContagem(data.idContagem)
      } else {
        alert('Erro ao criar contagem: ' + data.msg)
      }
    } catch (error) {
      console.error('Erro ao criar contagem:', error)
      alert('Erro ao criar contagem')
    } finally {
      setLoading(false)
    }
  }

  const startPollingContagem = async (idContagem: number) => {
    setPollingContagem(true)
    
    const poll = async () => {
      try {
        const endpoint = activeTab === 'pf' ? 'ContagemPf' : 'ContagemPj'
        const response = await fetch(`/api/profile-proxy?endpoint=/${endpoint}/BuscarContagem?idContagem=${idContagem}`, {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        })

        const data: ContagemRetornoVM = await response.json()
        setContagemAtual(data)

        if (data.quantidades && data.quantidades.length > 0) {
          setPollingContagem(false)
          return
        }
        
        // Continuar polling se ainda não terminou
        setTimeout(poll, 3000)
      } catch (error) {
        console.error('Erro no polling da contagem:', error)
        setPollingContagem(false)
      }
    }

    poll()
  }

  const criarExtracao = async () => {
    if (!contagemAtual || !apiConfig.token) return

    try {
      setLoading(true)
      
      const payload: CriarExtracaoVM = {
        idContagem: contagemAtual.idContagem,
        idTipoAcesso: 1, // Tipo padrão
        qtdeSolicitada: qtdeSolicitada,
        removerRegistrosExtraidos: true
      }

      const response = await fetch(`/api/profile-proxy?endpoint=/Extracao/CriarExtracao`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data: CriarExtracaoRetornoVM = await response.json()
      
      if (data.sucesso) {
        setCurrentStep('extracao')
        startPollingExtracao(data.idExtracao)
      } else {
        alert('Erro ao criar extração: ' + data.msg)
      }
    } catch (error) {
      console.error('Erro ao criar extração:', error)
      alert('Erro ao criar extração')
    } finally {
      setLoading(false)
    }
  }

  const startPollingExtracao = async (idExtracao: number) => {
    setPollingExtracao(true)
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/profile-proxy?endpoint=/Extracao/BuscarDetalhesExtracao?idExtracao=${idExtracao}`, {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        })

        const data: DetalhesExtracaoVM = await response.json()
        setExtracaoAtual(data)

        if (data.status === 'FINALIZADA') {
          setPollingExtracao(false)
          return
        }
        
        // Continuar polling
        setTimeout(poll, 5000)
      } catch (error) {
        console.error('Erro no polling da extração:', error)
        setPollingExtracao(false)
      }
    }

    poll()
  }

  const downloadExtracao = async (idExtracao: number) => {
    if (!apiConfig.token) return

    try {
      const response = await fetch(`/api/profile-proxy?endpoint=/Extracao/DownloadExtracao?idExtracao=${idExtracao}`, {
        headers: { 'Authorization': `Bearer ${apiConfig.token}` }
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `extracao_${idExtracao}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Salvar no histórico do usuário
      await salvarHistoricoExtracao(idExtracao)
    } catch (error) {
      console.error('Erro no download:', error)
      alert('Erro ao fazer download')
    }
  }

  const salvarHistoricoExtracao = async (idExtracao: number) => {
    if (!user || !extracaoAtual) return

    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          user_id: user.id,
          nome_cliente: `Extração ${idExtracao}`,
          origem: 'API Profile',
          nome_campanha: extracaoAtual.nomeContagem,
          status_limpa_nome: 'novo_lead',
          observacoes_limpa_nome: `${extracaoAtual.tipoPessoa} - ${extracaoAtual.qtdeRetorno} registros`,
          created_at: new Date().toISOString()
        }])

      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar histórico:', error)
    }
  }

  // =================== EFFECTS ===================

  useEffect(() => {
    if (apiConfig.token && currentStep === 'filtros') {
      loadUfs()
    }
  }, [apiConfig.token, currentStep, activeTab])

  useEffect(() => {
    if (selectedUfs.length > 0) {
      loadCidades(selectedUfs)
    }
  }, [selectedUfs])

  // Auto-autenticar quando carrega o componente
  useEffect(() => {
    if (apiConfig.apiKey && !apiConfig.token && !loading) {
      authenticateAPI()
    }
  }, [apiConfig.apiKey])

  // =================== RENDER ===================

  return (
    <PlanProtection feature="extracaoLeads">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Target className="h-8 w-8 mr-3 text-blue-600" />
            Extração de Leads
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Extraia leads qualificados de pessoa física e jurídica com filtros avançados
          </p>
        </div>

        {/* Tabs PF/PJ */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pf')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pf'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Pessoa Física
            </button>
            <button
              onClick={() => setActiveTab('pj')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pj'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="h-4 w-4 inline mr-2" />
              Pessoa Jurídica
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center space-x-4">
          {[
            { key: 'filtros', label: 'Filtros', icon: Filter },
            { key: 'contagem', label: 'Contagem', icon: Search },
            { key: 'extracao', label: 'Extração', icon: Database },
            { key: 'historico', label: 'Histórico', icon: History }
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className={`flex items-center ${
              currentStep === key ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <Icon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Conteúdo baseado no step */}
        <div className="bg-white shadow rounded-lg">

          {currentStep === 'filtros' && (
            <FiltersStep 
              activeTab={activeTab}
              ufs={ufs}
              cidades={cidades}
              selectedUfs={selectedUfs}
              setSelectedUfs={setSelectedUfs}
              selectedCidades={selectedCidades}
              setSelectedCidades={setSelectedCidades}
              formPf={formPf}
              setFormPf={setFormPf}
              formPj={formPj}
              setFormPj={setFormPj}
              nomeContagem={nomeContagem}
              setNomeContagem={setNomeContagem}
              onCreateContagem={criarContagem}
              loading={loading}
            />
          )}

          {currentStep === 'contagem' && (
            <CountingStep 
              contagem={contagemAtual}
              polling={pollingContagem}
              onCreateExtracao={criarExtracao}
              qtdeSolicitada={qtdeSolicitada}
              setQtdeSolicitada={setQtdeSolicitada}
              loading={loading}
            />
          )}

          {currentStep === 'extracao' && (
            <ExtractionStep 
              extracao={extracaoAtual}
              polling={pollingExtracao}
              onDownload={downloadExtracao}
              onNewExtraction={() => setCurrentStep('filtros')}
            />
          )}

          {currentStep === 'historico' && (
            <HistoryStep historico={historico} />
          )}
        </div>
      </div>
    </PlanProtection>
  )
}

// =================== COMPONENTES DOS STEPS ===================

function ConfigurationStep({
  apiConfig,
  setApiConfig,
  onAuthenticate,
  loading
}: {
  apiConfig: { baseUrl: string; apiKey: string; token?: string }
  setApiConfig: React.Dispatch<React.SetStateAction<{ baseUrl: string; apiKey: string; token?: string }>>
  onAuthenticate: () => Promise<boolean>
  loading: boolean
}) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Configuração da API
      </h3>
      
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Base da API
          </label>
          <input
            type="url"
            value={apiConfig.baseUrl}
            onChange={(e) => setApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://apiprofile.infinititi.com.br/api"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={apiConfig.apiKey}
            onChange={(e) => setApiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Sua chave de API"
          />
        </div>

        <button
          onClick={onAuthenticate}
          disabled={loading || !apiConfig.apiKey.trim()}
          className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Conectar à API
        </button>

        {apiConfig.token && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-sm text-green-700">Conectado com sucesso!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FiltersStep({
  activeTab,
  ufs,
  cidades,
  selectedUfs,
  setSelectedUfs,
  selectedCidades,
  setSelectedCidades,
  formPf,
  setFormPf,
  formPj,
  setFormPj,
  nomeContagem,
  setNomeContagem,
  onCreateContagem,
  loading
}: {
  activeTab: 'pf' | 'pj'
  ufs: Uf[]
  cidades: Cidade[]
  selectedUfs: number[]
  setSelectedUfs: React.Dispatch<React.SetStateAction<number[]>>
  selectedCidades: number[]
  setSelectedCidades: React.Dispatch<React.SetStateAction<number[]>>
  formPf: ContagemPf
  setFormPf: React.Dispatch<React.SetStateAction<ContagemPf>>
  formPj: ContagemPj
  setFormPj: React.Dispatch<React.SetStateAction<ContagemPj>>
  nomeContagem: string
  setNomeContagem: React.Dispatch<React.SetStateAction<string>>
  onCreateContagem: () => void
  loading: boolean
}) {
  const handleUfChange = (ufId: number, checked: boolean) => {
    if (checked) {
      setSelectedUfs(prev => [...prev, ufId])
    } else {
      setSelectedUfs(prev => prev.filter(id => id !== ufId))
      // Remove cidades desta UF
      const cidadesDaUf = cidades.filter(c => c.idUf === ufId).map(c => c.idcidade)
      setSelectedCidades(prev => prev.filter(id => !cidadesDaUf.includes(id)))
    }
  }

  const handleCidadeChange = (cidadeId: number, checked: boolean) => {
    if (checked) {
      setSelectedCidades(prev => [...prev, cidadeId])
    } else {
      setSelectedCidades(prev => prev.filter(id => id !== cidadeId))
    }
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Configurar Filtros - {activeTab === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
      </h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Contagem *
          </label>
          <input
            type="text"
            value={nomeContagem}
            onChange={(e) => setNomeContagem(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Leads SP - Jovens com email"
            required
          />
        </div>

        {/* Seleção de Estados */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estados
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
            {ufs.map((uf) => (
              <label key={uf.idUf} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={selectedUfs.includes(uf.idUf!)}
                  onChange={(e) => handleUfChange(uf.idUf!, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                {uf.uf1}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedUfs.length > 0 ? `${selectedUfs.length} estado(s) selecionado(s)` : 'Nenhum estado selecionado (buscará em todos)'}
          </p>
        </div>

        {/* Seleção de Cidades */}
        {cidades.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidades ({cidades.length} disponíveis)
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
              {cidades.map((cidade) => (
                <label key={cidade.idcidade} className="flex items-center text-sm py-1">
                  <input
                    type="checkbox"
                    checked={selectedCidades.includes(cidade.idcidade)}
                    onChange={(e) => handleCidadeChange(cidade.idcidade, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 mr-2"
                  />
                  {cidade.cidade1} - {cidade.uf}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedCidades.length > 0 ? `${selectedCidades.length} cidade(s) selecionada(s)` : 'Nenhuma cidade selecionada (buscará em todas do estado)'}
            </p>
          </div>
        )}

        {/* Filtros específicos */}
        {activeTab === 'pf' ? (
          <PessoaFisicaFilters formPf={formPf} setFormPf={setFormPf} />
        ) : (
          <PessoaJuridicaFilters formPj={formPj} setFormPj={setFormPj} />
        )}

        <button
          onClick={onCreateContagem}
          disabled={loading || !nomeContagem.trim()}
          className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Search className="h-5 w-5 mr-2" />
          )}
          Iniciar Contagem
        </button>
      </div>
    </div>
  )
}

function PessoaFisicaFilters({
  formPf,
  setFormPf
}: {
  formPf: ContagemPf
  setFormPf: React.Dispatch<React.SetStateAction<ContagemPf>>
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Filtros de Pessoa Física</h4>
      
      {/* Idade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Idade Mínima
          </label>
          <input
            type="number"
            min="18"
            max="100"
            value={formPf.idadeMinima || ''}
            onChange={(e) => setFormPf(prev => ({ ...prev, idadeMinima: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Idade Máxima
          </label>
          <input
            type="number"
            min="18"
            max="100"
            value={formPf.idadeMaxima || ''}
            onChange={(e) => setFormPf(prev => ({ ...prev, idadeMaxima: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPf.possuiEmail || false}
            onChange={(e) => setFormPf(prev => ({ ...prev, possuiEmail: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Possui E-mail
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPf.possuiCelular || false}
            onChange={(e) => setFormPf(prev => ({ ...prev, possuiCelular: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Possui Celular
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPf.possuiTelefone || false}
            onChange={(e) => setFormPf(prev => ({ ...prev, possuiTelefone: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Possui Telefone
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPf.possuiEndereco || false}
            onChange={(e) => setFormPf(prev => ({ ...prev, possuiEndereco: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Possui Endereço
        </label>
      </div>
    </div>
  )
}

function PessoaJuridicaFilters({
  formPj,
  setFormPj
}: {
  formPj: ContagemPj
  setFormPj: React.Dispatch<React.SetStateAction<ContagemPj>>
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Filtros de Pessoa Jurídica</h4>
      
      {/* Data de abertura */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Abertura Mín.
          </label>
          <input
            type="date"
            value={formPj.dataAberturaMinima || ''}
            onChange={(e) => setFormPj(prev => ({ ...prev, dataAberturaMinima: e.target.value || undefined }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Abertura Máx.
          </label>
          <input
            type="date"
            value={formPj.dataAberturaMaxima || ''}
            onChange={(e) => setFormPj(prev => ({ ...prev, dataAberturaMaxima: e.target.value || undefined }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Número de funcionários */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funcionários Mín.
          </label>
          <input
            type="number"
            min="0"
            value={formPj.numeroFuncionariosMinimo || ''}
            onChange={(e) => setFormPj(prev => ({ ...prev, numeroFuncionariosMinimo: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funcionários Máx.
          </label>
          <input
            type="number"
            min="0"
            value={formPj.numeroFuncionariosMaximo || ''}
            onChange={(e) => setFormPj(prev => ({ ...prev, numeroFuncionariosMaximo: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPj.possuiEmail || false}
            onChange={(e) => setFormPj(prev => ({ ...prev, possuiEmail: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Possui E-mail
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPj.possuiCelular || false}
            onChange={(e) => setFormPj(prev => ({ ...prev, possuiCelular: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Possui Celular
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPj.possuiTelefone || false}
            onChange={(e) => setFormPj(prev => ({ ...prev, possuiTelefone: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Possui Telefone
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={formPj.somenteMatriz || false}
            onChange={(e) => setFormPj(prev => ({ ...prev, somenteMatriz: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 mr-2"
          />
          Somente Matriz
        </label>
      </div>
    </div>
  )
}

function CountingStep({
  contagem,
  polling,
  onCreateExtracao,
  qtdeSolicitada,
  setQtdeSolicitada,
  loading
}: {
  contagem: ContagemRetornoVM | null
  polling: boolean
  onCreateExtracao: () => void
  qtdeSolicitada: number
  setQtdeSolicitada: React.Dispatch<React.SetStateAction<number>>
  loading: boolean
}) {
  if (!contagem) return null

  const totalEncontrado = contagem.quantidades?.[0]?.total || 0
  const contagemFinalizada = contagem.quantidades && contagem.quantidades.length > 0

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Resultado da Contagem
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          {polling ? (
            <>
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-blue-600">Processando contagem...</span>
            </>
          ) : contagemFinalizada ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-600">Contagem finalizada!</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-600">Aguardando resultado...</span>
            </>
          )}
        </div>

        {contagemFinalizada && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900">
                    {totalEncontrado.toLocaleString()} leads encontrados
                  </p>
                  <p className="text-sm text-blue-700">
                    ID da Contagem: {contagem.idContagem}
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade para Extração
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalEncontrado}
                  value={qtdeSolicitada}
                  onChange={(e) => setQtdeSolicitada(parseInt(e.target.value) || 1)}
                  className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: {totalEncontrado.toLocaleString()}
                </p>
              </div>

              <button
                onClick={onCreateExtracao}
                disabled={loading}
                className="w-full flex items-center justify-center bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                Iniciar Extração
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ExtractionStep({
  extracao,
  polling,
  onDownload,
  onNewExtraction
}: {
  extracao: DetalhesExtracaoVM | null
  polling: boolean
  onDownload: (id: number) => void
  onNewExtraction: () => void
}) {
  if (!extracao) return null

  const extracaoFinalizada = extracao.status === 'FINALIZADA'

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Status da Extração
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          {polling ? (
            <>
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-blue-600">Preparando arquivo...</span>
            </>
          ) : extracaoFinalizada ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-600">Arquivo pronto para download!</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-600">Status: {extracao.status}</span>
            </>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Nome:</p>
              <p className="text-gray-600">{extracao.nomeContagem}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Tipo:</p>
              <p className="text-gray-600">{extracao.tipoPessoa}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Solicitado:</p>
              <p className="text-gray-600">{extracao.qtdeSolicitada} registros</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Retornado:</p>
              <p className="text-gray-600">{extracao.qtdeRetorno || '-'} registros</p>
            </div>
          </div>
        </div>

        {extracaoFinalizada && (
          <div className="space-y-3">
            <button
              onClick={() => onDownload(extracao.idExtracao)}
              className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700"
            >
              <Download className="h-5 w-5 mr-2" />
              Fazer Download do Arquivo
            </button>

            <button
              onClick={onNewExtraction}
              className="w-full flex items-center justify-center border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
            >
              Fazer Nova Extração
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryStep({
  historico
}: {
  historico: ResultadoExtracaoVM[]
}) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Histórico de Extrações
      </h3>
      
      {historico.length > 0 ? (
        <div className="space-y-3">
          {historico.map((item) => (
            <div key={item.idExtracao} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{item.tipoExtracao}</p>
                  <p className="text-sm text-gray-600">{item.tipoPessoa}</p>
                  <p className="text-xs text-gray-500">{item.data}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.status === 'FINALIZADA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{item.qtdeSolicitada} registros</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma extração realizada ainda</p>
        </div>
      )}
    </div>
  )
}