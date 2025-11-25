'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import PlanProtection from '../../components/shared/PlanProtection'
import SearchableMultiSelect from '../../components/forms/SearchableMultiSelect'
import ResultadosContagem from '../../components/features/extracao/ResultadosContagem'
import ExtracaoProgress from '../../components/features/extracao/ExtracaoProgress'
import HistoricoContagens from '../../components/features/extracao/HistoricoContagens'
import ModalCriarExtracao from '../../components/features/extracao/ModalCriarExtracao'
import { supabase, ContagemProfile, ExtracaoProfile } from '../../lib/supabase'
import { getProfileApiKey, validateProfileApiKey } from '../../lib/profile'
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
  RefreshCw,
  Plus,
  Minus,
  FileText,
  Upload
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

interface Sexo {
  tipo: string
  sexo1: string
}

interface ClasseSocialVM {
  codigo: string
  descricao: string
}

interface TbEstadoCivil {
  cdEstadoCivil: string
  dsEstadoCivil: string
}

interface TbCbo {
  cdCbo: string
  dsCbo: string
}

interface TbOperadorasNew {
  nomeOperadora: string
}

interface DddRegioesVM {
  estados: DddRegioesVMEstado[]
}

interface DddRegioesVMEstado {
  siglaUf: string
  nome: string
  ddds: DddRegioesVMDdd[]
}

interface DddRegioesVMDdd {
  prefixo: number
  nome: string
  alternativo: string
}

interface Tbcnae {
  cnae: string
  descricaoCnae: string
}

interface EstadoMunicipiosVM {
  idsUfs: number[]
  idsMunicipios: number[]
}

// Pessoa Física
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
  classesSociaisSiglas?: string[]
  estadosCivis?: string[]
  profissoes?: string[]
  scores?: string[]
  operadorasCelular?: string[]
  dddsCelular?: string[]
}

interface NovaContagemApiPfVM {
  nomeContagem: string
  estadosMunicipios: EstadoMunicipiosVM
  arquivoCepsBase64?: string
  arquivoCepsComNumero?: boolean
  contagemPf: ContagemPf
}

// Pessoa Jurídica
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

interface NovaContagemApiPjVM {
  nomeContagem: string
  estadosMunicipios: EstadoMunicipiosVM
  arquivoCepsBase64?: string
  arquivoCepsComNumero?: boolean
  contagemPj: ContagemPj
}

interface ResumoContagemVM {
  sucesso: boolean
  msg: string
  limiteContagem: string
  total: string
  permitido: boolean
}

interface ContagemRetornoVM {
  sucesso: boolean
  msg: string
  idContagem: number
  quantidades: any[]
}

export default function ExtracaoLeadsPage() {
  const { user } = useAuth()
  
  // Estados da API
  const [apiConfig, setApiConfig] = useState({
    token: '',
    authenticated: false
  })
  const [loading, setLoading] = useState(false)

  // Tipo de pessoa selecionado
  const [tipoPessoa, setTipoPessoa] = useState<'pf' | 'pj'>('pf')
  
  // Nome da contagem
  const [nomeContagem, setNomeContagem] = useState('')

  // Estados e Municípios
  const [ufs, setUfs] = useState<Uf[]>([])
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [selectedUfs, setSelectedUfs] = useState<number[]>([])
  const [selectedCidades, setSelectedCidades] = useState<number[]>([])
  
  // Filtros Pessoa Física
  const [sexos, setSexos] = useState<Sexo[]>([])
  const [classesSociais, setClassesSociais] = useState<ClasseSocialVM[]>([])
  const [estadosCivis, setEstadosCivis] = useState<TbEstadoCivil[]>([])
  const [profissoes, setProfissoes] = useState<TbCbo[]>([])
  const [scoresPf, setScoresPf] = useState<string[]>([])
  const [operadoras, setOperadoras] = useState<TbOperadorasNew[]>([])
  const [ddds, setDdds] = useState<DddRegioesVM>({ estados: [] })

  // Filtros Pessoa Jurídica
  const [cnaes, setCnaes] = useState<Tbcnae[]>([])
  const [portes, setPortes] = useState<string[]>([])
  const [tiposEmpresa, setTiposEmpresa] = useState<string[]>([])
  const [scoresPj, setScoresPj] = useState<string[]>([])

  // Valores dos filtros
  const [filtrosPf, setFiltrosPf] = useState<ContagemPf>({})
  const [filtrosPj, setFiltrosPj] = useState<ContagemPj>({})

  // Estados de contagem
  const [resumoContagem, setResumoContagem] = useState<ResumoContagemVM | null>(null)
  const [contagemRealizada, setContagemRealizada] = useState(false)
  const [resultadoContagem, setResultadoContagem] = useState<ContagemRetornoVM | null>(null)
  const [contagemLocalId, setContagemLocalId] = useState<number | null>(null)

  // Estados de extração
  const [extracaoEmAndamento, setExtracaoEmAndamento] = useState<{
    id: number
    idExtracaoAPI: number
    nomeArquivo: string
    status: string
    apiKey: string
  } | null>(null)

  // Estado da aba ativa
  const [abaAtiva, setAbaAtiva] = useState<'extracao' | 'historico'>('extracao')
  
  // Estado do modal de criação de extração
  const [modalCriarExtracaoAberto, setModalCriarExtracaoAberto] = useState(false)

  // Função helper para tratar desserialização incorreta de arrays
  const ensureArray = (data: any): any[] => {
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      const values = Object.values(data).filter(item => item && typeof item === 'object')
      return values.length > 0 ? values : []
    }
    return []
  }

  // Carregar UFs
  const loadUfs = async () => {
    if (!apiConfig.token) return

    try {
      const endpoint = tipoPessoa === 'pf' ? '/ContagemPf/ListarUfs' : '/ContagemPj/ListarUfs'
      const response = await fetch('/api/profile-proxy?endpoint=' + endpoint, {
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`
        }
      })
      const data = await response.json()
      setUfs(ensureArray(data))
    } catch (error) {
      console.error('Erro ao carregar UFs:', error)
    }
  }

  // Carregar cidades baseado nas UFs selecionadas
  const loadCidades = async () => {
    console.log('loadCidades chamado:', { token: !!apiConfig.token, selectedUfs })
    
    if (!apiConfig.token || selectedUfs.length === 0) {
      console.log('loadCidades: sem token ou UFs, limpando cidades')
      setCidades([])
      return
    }

    try {
      const endpoint = tipoPessoa === 'pf' ? '/ContagemPf/ListarMunicipios' : '/ContagemPj/ListarMunicipios'
      const params = new URLSearchParams()
      selectedUfs.forEach(uf => params.append('idsUfs', uf.toString()))
      
      // Construir URL corretamente
      const queryString = params.toString()
      const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint
      
      console.log('loadCidades: fazendo requisição:', { 
        endpoint: fullEndpoint, 
        selectedUfs,
        queryString 
      })
      
      const response = await fetch(`/api/profile-proxy?endpoint=${encodeURIComponent(fullEndpoint)}`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`
        }
      })
      const data = await response.json()

      console.log('loadCidades: resposta recebida:', { dataLength: data?.length || 0, data })
      setCidades(ensureArray(data))
    } catch (error) {
      console.error('Erro ao carregar cidades:', error)
    }
  }

  // Carregar dados específicos para Pessoa Física
  const loadDadosPf = async () => {
    if (!apiConfig.token) return

    try {
      const requests = [
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarSexos', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarClassesSociais', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarEstadosCivis', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarProfissoes', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarScores', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarOperadoras', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPf/ListarDds', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        })
      ]

      const responses = await Promise.all(requests)
      const [sexosData, classesSociaisData, estadosCivisData, profissoesData, scoresData, operadorasData, dddsData] = 
        await Promise.all(responses.map(r => r.json()))

      setSexos(ensureArray(sexosData))
      setClassesSociais(ensureArray(classesSociaisData))
      setEstadosCivis(ensureArray(estadosCivisData))
      setProfissoes(ensureArray(profissoesData))
      setScoresPf(ensureArray(scoresData))
      setOperadoras(ensureArray(operadorasData))
      setDdds(dddsData && typeof dddsData === 'object' && 'estados' in dddsData ? dddsData : { estados: [] })

    } catch (error) {
      console.error('Erro ao carregar dados PF:', error)
    }
  }

  // Carregar dados específicos para Pessoa Jurídica
  const loadDadosPj = async () => {
    if (!apiConfig.token) return

    try {
      const requests = [
        fetch('/api/profile-proxy?endpoint=/ContagemPj/ListarCNAEs', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPj/ListarPortes', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPj/ListarTiposEmpresa', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPj/ListarScores', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPj/ListarOperadoras', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        }),
        fetch('/api/profile-proxy?endpoint=/ContagemPj/ListarDds', {
          headers: { 'Authorization': `Bearer ${apiConfig.token}` }
        })
      ]

      const responses = await Promise.all(requests)
      const [cnaesData, portesData, tiposEmpresaData, scoresData, operadorasData, dddsData] = 
        await Promise.all(responses.map(r => r.json()))

      setCnaes(ensureArray(cnaesData))
      setPortes(ensureArray(portesData))
      setTiposEmpresa(ensureArray(tiposEmpresaData))
      setScoresPj(ensureArray(scoresData))
      setOperadoras(ensureArray(operadorasData))
      setDdds(dddsData && typeof dddsData === 'object' && 'estados' in dddsData ? dddsData : { estados: [] })

    } catch (error) {
      console.error('Erro ao carregar dados PJ:', error)
    }
  }

  // Autenticar na API Profile
  const authenticateAPI = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Buscar API Key usando função utilitária
      const apiKey = await getProfileApiKey(parseInt(user.id.toString()))

      if (!validateProfileApiKey(apiKey)) {
        throw new Error('API Key da Profile não encontrada. Configure suas credenciais em Usuários.')
      }

      const response = await fetch('/api/profile-proxy?endpoint=/Auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey
        })
      })

      const data: LoginResponse = await response.json()

      if (data.token) {
        setApiConfig({
          token: data.token,
          authenticated: true
        })
      } else {
        throw new Error(data.msg || 'Erro na autenticação')
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
      alert('Erro na autenticação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  // Realizar contagem resumida
  const realizarResumo = async () => {
    if (!apiConfig.token || !nomeContagem) return

    setLoading(true)
    try {
      const endpoint = tipoPessoa === 'pf' ? '/ContagemPf/ResumirContagem' : '/ContagemPj/ResumirContagem'
      
      const payload = tipoPessoa === 'pf' ? {
        nomeContagem,
        estadosMunicipios: {
          idsUfs: selectedUfs,
          idsMunicipios: selectedCidades
        },
        contagemPf: filtrosPf
      } : {
        nomeContagem,
        estadosMunicipios: {
          idsUfs: selectedUfs,
          idsMunicipios: selectedCidades
        },
        contagemPj: filtrosPj
      }

      const response = await fetch('/api/profile-proxy?endpoint=' + endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data: ResumoContagemVM = await response.json()
      setResumoContagem(data)

    } catch (error) {
      console.error('Erro ao realizar resumo:', error)
      alert('Erro ao realizar resumo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  // Realizar contagem completa
  const criarContagem = async () => {
    if (!apiConfig.token || !nomeContagem || !resumoContagem?.permitido) return

    setLoading(true)
    try {
      const endpoint = tipoPessoa === 'pf' ? '/ContagemPf/CriarContagem' : '/ContagemPj/CriarContagem'
      
      const payload = tipoPessoa === 'pf' ? {
        nomeContagem,
        estadosMunicipios: {
          idsUfs: selectedUfs,
          idsMunicipios: selectedCidades
        },
        contagemPf: filtrosPf
      } : {
        nomeContagem,
        estadosMunicipios: {
          idsUfs: selectedUfs,
          idsMunicipios: selectedCidades
        },
        contagemPj: filtrosPj
      }

      const response = await fetch('/api/profile-proxy?endpoint=' + endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data: ContagemRetornoVM = await response.json()
      
      if (data.sucesso) {
        // Salvar contagem no banco de dados
        await salvarContagemNoBanco(data, payload)
        
        setContagemRealizada(true)
        setResultadoContagem(data)
        console.log('Contagem iniciada com sucesso:', data)
      } else {
        throw new Error(data.msg)
      }

    } catch (error) {
      console.error('Erro ao criar contagem:', error)
      alert('Erro ao criar contagem: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  // Salvar contagem no banco de dados
  const salvarContagemNoBanco = async (resultado: ContagemRetornoVM, filtrosAplicados: any) => {
    if (!user) return

    try {
      const dadosContagem: Partial<ContagemProfile> = {
        user_id: parseInt(user.id.toString()),
        id_contagem_api: resultado.idContagem,
        nome_contagem: nomeContagem,
        tipo_pessoa: tipoPessoa,
        total_registros: resultado.quantidades.find(q => q.descricao === 'Total')?.total || 0,
        dados_filtros: filtrosAplicados,
        dados_resultado: resultado,
        status: 'concluida',
        data_criacao: new Date().toISOString(),
        data_conclusao: new Date().toISOString()
      }

      const { data: contagemSalva, error } = await supabase
        .from('contagens_profile')
        .insert([dadosContagem])
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar contagem no banco:', error)
      } else {
        console.log('Contagem salva no banco com sucesso')
        setContagemLocalId(contagemSalva.id) // Salvar o ID local da contagem
      }
    } catch (error) {
      console.error('Erro ao salvar contagem:', error)
    }
  }

  // Função para abrir o modal de criar extração
  const handleCriarExtracao = () => {
    setModalCriarExtracaoAberto(true)
  }

  // Função para confirmar a criação da extração (callback do modal)
  const handleConfirmarExtracao = async (dados: {
    idContagem: number
    idTipoAcesso: number
    qtdeSolicitada: number
    removerRegistrosExtraidos: boolean
  }) => {
    if (!user) return
    
    try {
      setLoading(true)

      // Buscar API Key usando função utilitária
      const apiKey = await getProfileApiKey(parseInt(user.id.toString()))

      if (!validateProfileApiKey(apiKey)) {
        throw new Error('API Key da Profile não encontrada. Configure suas credenciais em Usuários.')
      }

      // Chamar API de extração com dados do modal
      const response = await fetch('/api/extracoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contagemId: contagemLocalId, // Usar o ID local da contagem, não o da API
          userId: parseInt(user.id.toString()),
          idTipoAcesso: dados.idTipoAcesso,
          qtdeSolicitada: dados.qtdeSolicitada,
          removerRegistrosExtraidos: dados.removerRegistrosExtraidos,
          apiKey: apiKey
        })
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || 'Erro ao criar extração')
      }

      // Fechar modal
      setModalCriarExtracaoAberto(false)

      // Iniciar tracking da extração
      setExtracaoEmAndamento({
        id: resultado.extracaoId,
        idExtracaoAPI: resultado.idExtracaoAPI,
        nomeArquivo: resultado.nomeArquivo,
        status: resultado.status,
        apiKey: apiKey! // Garantido não-nulo pela validação anterior
      })

      // Opcional: mudar para aba de histórico após 3 segundos
      setTimeout(() => {
        setAbaAtiva('historico')
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao criar extração:', error)
      alert('Erro ao criar extração: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const handleNovaContagem = () => {
    setResultadoContagem(null)
    setContagemRealizada(false)
    setResumoContagem(null)
    setContagemLocalId(null)
    setNomeContagem('')
    setSelectedUfs([])
    setSelectedCidades([])
    setFiltrosPf({})
    setFiltrosPj({})
    setAbaAtiva('extracao') // Voltar para aba de extração
  }

  // Effects
  // Autenticar automaticamente ao carregar a página
  useEffect(() => {
    if (user && !apiConfig.authenticated) {
      authenticateAPI()
    }
  }, [user])

  useEffect(() => {
    if (apiConfig.authenticated && !loading) {
      loadUfs()
    }
  }, [apiConfig.token, tipoPessoa])

  useEffect(() => {
    console.log('UseEffect cidades disparado:', { 
      authenticated: apiConfig.authenticated, 
      loading, 
      selectedUfs: selectedUfs.length,
      hasToken: !!apiConfig.token 
    })
    
    if (apiConfig.authenticated && !loading && selectedUfs.length > 0) {
      console.log('Carregando cidades para UFs:', selectedUfs)
      loadCidades()
    } else if (selectedUfs.length === 0) {
      console.log('Limpando cidades pois nenhuma UF selecionada')
      setCidades([])
    }
  }, [selectedUfs, apiConfig.authenticated, loading, apiConfig.token])

  useEffect(() => {
    if (apiConfig.authenticated && !loading) {
      if (tipoPessoa === 'pf') {
        loadDadosPf()
      } else {
        loadDadosPj()
      }
    }
  }, [apiConfig.token, tipoPessoa])

  return (
    <PlanProtection feature="extracaoLeads">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Extração de Leads</h1>
          <p className="text-gray-600">Sistema completo de extração de leads com filtros avançados da API Profile</p>
        </div>

        {/* Autenticação Automática */}
        {!apiConfig.authenticated ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conectando à API Profile</h2>
              <p className="text-gray-600">Autenticando automaticamente...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Navegação por abas */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setAbaAtiva('extracao')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      abaAtiva === 'extracao'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Nova Extração
                    </div>
                  </button>
                  <button
                    onClick={() => setAbaAtiva('historico')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      abaAtiva === 'historico'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Histórico
                    </div>
                  </button>
                </nav>
              </div>
            </div>

            {/* Conteúdo das abas */}
            {abaAtiva === 'extracao' ? (
              <>
                {/* Seleção do tipo de pessoa */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Tipo de Pessoa
              </h3>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setTipoPessoa('pf')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    tipoPessoa === 'pf' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="h-5 w-5" />
                  Pessoa Física
                </button>
                
                <button
                  onClick={() => setTipoPessoa('pj')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                    tipoPessoa === 'pj' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building className="h-5 w-5" />
                  Pessoa Jurídica
                </button>
              </div>
            </div>

            {/* Nome da contagem */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Nome da Contagem
              </h3>
              
              <input
                type="text"
                value={nomeContagem}
                onChange={(e) => setNomeContagem(e.target.value)}
                placeholder="Digite um nome para identificar esta contagem"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtros de Localização */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Localização
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estados</label>
                  <SearchableMultiSelect
                    options={ufs.map(uf => ({
                      value: uf.idUf,
                      label: `${uf.uf1} - ${uf.ufDescricao}`
                    }))}
                    value={selectedUfs}
                    onChange={(values) => {
                      setSelectedUfs(values as number[])
                      setSelectedCidades([]) // Reset cidades
                    }}
                    placeholder="Selecione os estados"
                    searchPlaceholder="Pesquisar estados..."
                  />
                </div>

                {/* Cidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidades</label>
                  <SearchableMultiSelect
                    options={cidades.map(cidade => ({
                      value: cidade.idcidade,
                      label: `${cidade.cidade1} - ${cidade.uf}`
                    }))}
                    value={selectedCidades}
                    onChange={(values) => setSelectedCidades(values as number[])}
                    placeholder={selectedUfs.length === 0 ? "Selecione estados primeiro" : "Selecione as cidades"}
                    searchPlaceholder="Pesquisar cidades..."
                    disabled={selectedUfs.length === 0}
                  />
                </div>
              </div>
            </div>

            {/* Filtros específicos por tipo de pessoa */}
            {tipoPessoa === 'pf' ? (
              <PessoaFisicaFilters 
                filtros={filtrosPf}
                setFiltros={setFiltrosPf}
                sexos={sexos}
                classesSociais={classesSociais}
                estadosCivis={estadosCivis}
                profissoes={profissoes}
                scores={scoresPf}
                operadoras={operadoras}
                ddds={ddds}
              />
            ) : (
              <PessoaJuridicaFilters 
                filtros={filtrosPj}
                setFiltros={setFiltrosPj}
                cnaes={cnaes}
                portes={portes}
                tiposEmpresa={tiposEmpresa}
                scores={scoresPj}
                operadoras={operadoras}
                ddds={ddds}
              />
            )}

            {/* Ações - ocultar se resultado da contagem estiver sendo exibido */}
            {!resultadoContagem && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={realizarResumo}
                    disabled={loading || !nomeContagem}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                    {loading ? 'Calculando...' : 'Calcular Resumo'}
                  </button>

                  {resumoContagem && resumoContagem.permitido && (
                    <button
                      onClick={criarContagem}
                      disabled={loading || contagemRealizada}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                      {loading ? 'Criando...' : 'Criar Contagem'}
                    </button>
                  )}
                </div>

              {/* Resultado do resumo */}
              {resumoContagem && (
                <div className={`mt-6 p-4 rounded-lg ${resumoContagem.sucesso ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {resumoContagem.sucesso ? 
                      <CheckCircle className="h-5 w-5 text-green-600" /> : 
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    }
                    <h4 className={`font-semibold ${resumoContagem.sucesso ? 'text-green-800' : 'text-red-800'}`}>
                      {resumoContagem.sucesso ? 'Resumo Calculado' : 'Erro no Cálculo'}
                    </h4>
                  </div>
                  
                  {resumoContagem.sucesso ? (
                    <div className="text-green-700">
                      <p><strong>Total encontrado:</strong> {resumoContagem.total} registros</p>
                      <p><strong>Limite de contagem:</strong> {resumoContagem.limiteContagem}</p>
                      <p><strong>Status:</strong> {resumoContagem.permitido ? '✅ Permitido criar contagem' : '❌ Não permitido'}</p>
                    </div>
                  ) : (
                    <p className="text-red-700">{resumoContagem.msg}</p>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Resultado da Contagem */}
            {resultadoContagem && (
              <ResultadosContagem
                resultado={resultadoContagem}
                nomeContagem={nomeContagem}
                tipoPessoa={tipoPessoa}
                onCriarExtracao={handleCriarExtracao}
                onNovaContagem={handleNovaContagem}
              />
            )}
              </>
            ) : (
              /* Aba do Histórico */
              <HistoricoContagens
                apiConfig={apiConfig}
                authenticateAPI={authenticateAPI}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {/* Modal de progresso da extração */}
      {extracaoEmAndamento && (
        <ExtracaoProgress
          extracaoId={extracaoEmAndamento.id}
          idExtracaoAPI={extracaoEmAndamento.idExtracaoAPI}
          nomeArquivo={extracaoEmAndamento.nomeArquivo}
          initialStatus={extracaoEmAndamento.status}
          userId={parseInt(user?.id?.toString() || '0')}
          apiKey={extracaoEmAndamento.apiKey || ''}
          onClose={() => setExtracaoEmAndamento(null)}
        />
      )}

      {/* Modal para criar extração */}
      {modalCriarExtracaoAberto && resultadoContagem && contagemLocalId && (
        <ModalCriarExtracao
          idContagem={contagemLocalId} // Usar o ID local da contagem
          nomeContagem={nomeContagem}
          tipoPessoa={tipoPessoa}
          totalRegistros={resultadoContagem.quantidades.find(q => q.descricao === 'Total')?.total || 0}
          onConfirmar={handleConfirmarExtracao}
          onCancelar={() => setModalCriarExtracaoAberto(false)}
        />
      )}
    </PlanProtection>
  )
}

// Componente para filtros de Pessoa Física
function PessoaFisicaFilters({ 
  filtros, 
  setFiltros, 
  sexos, 
  classesSociais, 
  estadosCivis, 
  profissoes, 
  scores, 
  operadoras, 
  ddds 
}: {
  filtros: ContagemPf
  setFiltros: (filtros: ContagemPf) => void
  sexos: Sexo[]
  classesSociais: ClasseSocialVM[]
  estadosCivis: TbEstadoCivil[]
  profissoes: TbCbo[]
  scores: string[]
  operadoras: TbOperadorasNew[]
  ddds: DddRegioesVM
}) {
  return (
    <div className="space-y-6">
      {/* Idade e Renda */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Idade e Renda</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idade Mínima</label>
            <input
              type="number"
              value={filtros.idadeMinima || ''}
              onChange={(e) => setFiltros({...filtros, idadeMinima: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 18"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Idade Máxima</label>
            <input
              type="number"
              value={filtros.idadeMaxima || ''}
              onChange={(e) => setFiltros({...filtros, idadeMaxima: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 65"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Renda Mínima</label>
            <input
              type="number"
              value={filtros.rendaMinimo || ''}
              onChange={(e) => setFiltros({...filtros, rendaMinimo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Renda Máxima</label>
            <input
              type="number"
              value={filtros.rendaMaximo || ''}
              onChange={(e) => setFiltros({...filtros, rendaMaximo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 10000"
            />
          </div>
        </div>
      </div>

      {/* Dados Disponíveis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Disponíveis</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { key: 'possuiMae', label: 'Possui Mãe' },
            { key: 'possuiEndereco', label: 'Possui Endereço' },
            { key: 'possuiEmail', label: 'Possui E-mail' },
            { key: 'possuiTelefone', label: 'Possui Telefone' },
            { key: 'possuiCelular', label: 'Possui Celular' }
          ].map(item => (
            <label key={item.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros[item.key as keyof ContagemPf] === true}
                onChange={(e) => setFiltros({...filtros, [item.key]: e.target.checked ? true : undefined})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sexo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sexo</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sexos.map(sexo => (
            <label key={sexo.tipo} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.sexos?.includes(sexo.tipo) || false}
                onChange={(e) => {
                  const current = filtros.sexos || []
                  if (e.target.checked) {
                    setFiltros({...filtros, sexos: [...current, sexo.tipo]})
                  } else {
                    setFiltros({...filtros, sexos: current.filter(s => s !== sexo.tipo)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{sexo.sexo1}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Classes Sociais */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classes Sociais</h3>
        
        <SearchableMultiSelect
          options={classesSociais.map(classe => ({
            value: classe.codigo,
            label: classe.descricao
          }))}
          value={filtros.classesSociais || []}
          onChange={(values) => setFiltros({...filtros, classesSociais: values as string[]})}
          placeholder="Selecione as classes sociais"
          searchPlaceholder="Pesquisar classes sociais..."
        />
      </div>

      {/* Estados Civis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estados Civis</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {estadosCivis.map(estado => (
            <label key={estado.cdEstadoCivil} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.estadosCivis?.includes(estado.cdEstadoCivil) || false}
                onChange={(e) => {
                  const current = filtros.estadosCivis || []
                  if (e.target.checked) {
                    setFiltros({...filtros, estadosCivis: [...current, estado.cdEstadoCivil]})
                  } else {
                    setFiltros({...filtros, estadosCivis: current.filter(e => e !== estado.cdEstadoCivil)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{estado.dsEstadoCivil}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Profissões */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profissões (CBO)</h3>
        
        <SearchableMultiSelect
          options={profissoes.map(profissao => ({
            value: profissao.cdCbo,
            label: profissao.dsCbo
          }))}
          value={filtros.profissoes || []}
          onChange={(values) => setFiltros({...filtros, profissoes: values as string[]})}
          placeholder="Selecione as profissões"
          searchPlaceholder="Pesquisar profissões..."
          maxHeight="300px"
        />
      </div>

      {/* Scores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scores</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {scores.map(score => (
            <label key={score} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.scores?.includes(score) || false}
                onChange={(e) => {
                  const current = filtros.scores || []
                  if (e.target.checked) {
                    setFiltros({...filtros, scores: [...current, score]})
                  } else {
                    setFiltros({...filtros, scores: current.filter(s => s !== score)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{score}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Operadoras */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operadoras de Celular</h3>
        
        <SearchableMultiSelect
          options={operadoras.map(operadora => ({
            value: operadora.nomeOperadora,
            label: operadora.nomeOperadora
          }))}
          value={filtros.operadorasCelular || []}
          onChange={(values) => setFiltros({...filtros, operadorasCelular: values as string[]})}
          placeholder="Selecione as operadoras"
          searchPlaceholder="Pesquisar operadoras..."
        />
      </div>

      {/* DDDs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DDDs</h3>
        
        <SearchableMultiSelect
          options={ddds.estados.flatMap(estado => 
            estado.ddds.map(ddd => ({
              value: ddd.prefixo.toString(),
              label: `(${ddd.prefixo}) ${ddd.nome} - ${estado.siglaUf}`
            }))
          )}
          value={filtros.dddsCelular || []}
          onChange={(values) => setFiltros({...filtros, dddsCelular: values as string[]})}
          placeholder="Selecione os DDDs"
          searchPlaceholder="Pesquisar DDDs..."
          maxHeight="300px"
        />
      </div>
    </div>
  )
}

// Componente para filtros de Pessoa Jurídica
function PessoaJuridicaFilters({ 
  filtros, 
  setFiltros, 
  cnaes, 
  portes, 
  tiposEmpresa, 
  scores, 
  operadoras, 
  ddds 
}: {
  filtros: ContagemPj
  setFiltros: (filtros: ContagemPj) => void
  cnaes: Tbcnae[]
  portes: string[]
  tiposEmpresa: string[]
  scores: string[]
  operadoras: TbOperadorasNew[]
  ddds: DddRegioesVM
}) {
  return (
    <div className="space-y-6">
      {/* Datas e Números */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Datas e Números</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Abertura Mínima</label>
            <input
              type="date"
              value={filtros.dataAberturaMinima || ''}
              onChange={(e) => setFiltros({...filtros, dataAberturaMinima: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Abertura Máxima</label>
            <input
              type="date"
              value={filtros.dataAberturaMaxima || ''}
              onChange={(e) => setFiltros({...filtros, dataAberturaMaxima: e.target.value || undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.somenteMatriz === true}
                onChange={(e) => setFiltros({...filtros, somenteMatriz: e.target.checked ? true : undefined})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Somente Matriz</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nº Funcionários Mín.</label>
            <input
              type="number"
              value={filtros.numeroFuncionariosMinimo || ''}
              onChange={(e) => setFiltros({...filtros, numeroFuncionariosMinimo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nº Funcionários Máx.</label>
            <input
              type="number"
              value={filtros.numeroFuncionariosMaximo || ''}
              onChange={(e) => setFiltros({...filtros, numeroFuncionariosMaximo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nº Sócios Mín.</label>
            <input
              type="number"
              value={filtros.numeroSociosMinimo || ''}
              onChange={(e) => setFiltros({...filtros, numeroSociosMinimo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nº Sócios Máx.</label>
            <input
              type="number"
              value={filtros.numeroSociosMaximo || ''}
              onChange={(e) => setFiltros({...filtros, numeroSociosMaximo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Faturamento Mín.</label>
            <input
              type="number"
              value={filtros.faturamentoMinimo || ''}
              onChange={(e) => setFiltros({...filtros, faturamentoMinimo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Faturamento Máx.</label>
            <input
              type="number"
              value={filtros.faturamentoMaximo || ''}
              onChange={(e) => setFiltros({...filtros, faturamentoMaximo: e.target.value ? Number(e.target.value) : undefined})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1000000"
            />
          </div>
        </div>
      </div>

      {/* Dados Disponíveis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Disponíveis</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'possuiEndereco', label: 'Possui Endereço' },
            { key: 'possuiEmail', label: 'Possui E-mail' },
            { key: 'possuiTelefone', label: 'Possui Telefone' },
            { key: 'possuiCelular', label: 'Possui Celular' }
          ].map(item => (
            <label key={item.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros[item.key as keyof ContagemPj] === true}
                onChange={(e) => setFiltros({...filtros, [item.key]: e.target.checked ? true : undefined})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* CNAEs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CNAEs</h3>
        
        <SearchableMultiSelect
          options={cnaes.map(cnae => ({
            value: cnae.cnae,
            label: `${cnae.cnae} - ${cnae.descricaoCnae}`
          }))}
          value={filtros.cnaes || []}
          onChange={(values) => setFiltros({...filtros, cnaes: values as string[]})}
          placeholder="Selecione os CNAEs"
          searchPlaceholder="Pesquisar CNAEs..."
          maxHeight="300px"
        />
      </div>

      {/* Portes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Porte Empresarial</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {portes.map(porte => (
            <label key={porte} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.portes?.includes(porte) || false}
                onChange={(e) => {
                  const current = filtros.portes || []
                  if (e.target.checked) {
                    setFiltros({...filtros, portes: [...current, porte]})
                  } else {
                    setFiltros({...filtros, portes: current.filter(p => p !== porte)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{porte}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipos de Empresa */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Empresa</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tiposEmpresa.map(tipo => (
            <label key={tipo} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.tiposEmpresa?.includes(tipo) || false}
                onChange={(e) => {
                  const current = filtros.tiposEmpresa || []
                  if (e.target.checked) {
                    setFiltros({...filtros, tiposEmpresa: [...current, tipo]})
                  } else {
                    setFiltros({...filtros, tiposEmpresa: current.filter(t => t !== tipo)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{tipo}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Scores */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scores</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {scores.map(score => (
            <label key={score} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.scores?.includes(score) || false}
                onChange={(e) => {
                  const current = filtros.scores || []
                  if (e.target.checked) {
                    setFiltros({...filtros, scores: [...current, score]})
                  } else {
                    setFiltros({...filtros, scores: current.filter(s => s !== score)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{score}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Operadoras */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operadoras de Celular</h3>
        
        <SearchableMultiSelect
          options={operadoras.map(operadora => ({
            value: operadora.nomeOperadora,
            label: operadora.nomeOperadora
          }))}
          value={filtros.operadorasCelular || []}
          onChange={(values) => setFiltros({...filtros, operadorasCelular: values as string[]})}
          placeholder="Selecione as operadoras"
          searchPlaceholder="Pesquisar operadoras..."
        />
      </div>

      {/* DDDs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DDDs</h3>
        
        <SearchableMultiSelect
          options={ddds.estados.flatMap(estado => 
            estado.ddds.map(ddd => ({
              value: ddd.prefixo.toString(),
              label: `(${ddd.prefixo}) ${ddd.nome} - ${estado.siglaUf}`
            }))
          )}
          value={filtros.dddsCelular || []}
          onChange={(values) => setFiltros({...filtros, dddsCelular: values as string[]})}
          placeholder="Selecione os DDDs"
          searchPlaceholder="Pesquisar DDDs..."
          maxHeight="300px"
        />
      </div>
    </div>
  )
}