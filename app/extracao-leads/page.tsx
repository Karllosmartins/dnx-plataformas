'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import PlanProtection from '../../components/PlanProtection'
import { supabase } from '../../lib/supabase'
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
      setUfs(data || [])
    } catch (error) {
      console.error('Erro ao carregar UFs:', error)
    }
  }

  // Carregar cidades baseado nas UFs selecionadas
  const loadCidades = async () => {
    if (!apiConfig.token || selectedUfs.length === 0) {
      setCidades([])
      return
    }

    try {
      const endpoint = tipoPessoa === 'pf' ? '/ContagemPf/ListarMunicipios' : '/ContagemPj/ListarMunicipios'
      const params = new URLSearchParams()
      selectedUfs.forEach(uf => params.append('idsUfs', uf.toString()))
      
      const response = await fetch(`/api/profile-proxy?endpoint=${endpoint}&${params}`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.token}`
        }
      })
      const data = await response.json()
      setCidades(data || [])
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

      setSexos(sexosData || [])
      setClassesSociais(classesSociaisData || [])
      setEstadosCivis(estadosCivisData || [])
      setProfissoes(profissoesData || [])
      setScoresPf(scoresData || [])
      setOperadoras(operadorasData || [])
      setDdds(dddsData || { estados: [] })

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

      setCnaes(cnaesData || [])
      setPortes(portesData || [])
      setTiposEmpresa(tiposEmpresaData || [])
      setScoresPj(scoresData || [])
      setOperadoras(operadorasData || [])
      setDdds(dddsData || { estados: [] })

    } catch (error) {
      console.error('Erro ao carregar dados PJ:', error)
    }
  }

  // Autenticar na API Profile
  const authenticateAPI = async () => {
    if (!user) return

    setLoading(true)
    try {
      const credenciais = await supabase
        .from('configuracoes_credenciais')
        .select('apikeydados')
        .eq('user_id', user.id)
        .single()

      if (!credenciais.data?.apikeydados) {
        throw new Error('API Key da Profile não encontrada.')
      }

      const response = await fetch('/api/profile-proxy?endpoint=/Auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: credenciais.data.apikeydados
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
        setContagemRealizada(true)
        alert('✅ Contagem criada com sucesso!')
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

  // Effects
  useEffect(() => {
    if (apiConfig.authenticated && !loading) {
      loadUfs()
    }
  }, [apiConfig.token, tipoPessoa])

  useEffect(() => {
    if (apiConfig.authenticated && !loading) {
      loadCidades()
    }
  }, [selectedUfs, apiConfig.token, tipoPessoa])

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

        {/* Autenticação */}
        {!apiConfig.authenticated ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <Database className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conectar à API Profile</h2>
              <p className="text-gray-600 mb-6">Faça a autenticação para acessar os dados de leads</p>
              
              <button
                onClick={authenticateAPI}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Settings className="h-5 w-5" />}
                {loading ? 'Conectando...' : 'Conectar API'}
              </button>
            </div>
          </div>
        ) : (
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
                  <select
                    multiple
                    value={selectedUfs.map(String)}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => Number(option.value))
                      setSelectedUfs(values)
                      setSelectedCidades([]) // Reset cidades
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                  >
                    {ufs.map(uf => (
                      <option key={uf.idUf} value={uf.idUf}>
                        {uf.uf1} - {uf.ufDescricao}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Segure Ctrl/Cmd para selecionar múltiplos</p>
                </div>

                {/* Cidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidades</label>
                  <select
                    multiple
                    value={selectedCidades.map(String)}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => Number(option.value))
                      setSelectedCidades(values)
                    }}
                    disabled={selectedUfs.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 disabled:bg-gray-50"
                  >
                    {cidades.map(cidade => (
                      <option key={cidade.idcidade} value={cidade.idcidade}>
                        {cidade.cidade1} - {cidade.uf}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedUfs.length === 0 ? 'Selecione estados primeiro' : 'Segure Ctrl/Cmd para selecionar múltiplos'}
                  </p>
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

            {/* Ações */}
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

              {contagemRealizada && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-semibold">Contagem criada com sucesso!</span>
                  </div>
                  <p className="text-green-700 mt-1">Você pode acompanhar o progresso na aba de histórico.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {classesSociais.map(classe => (
            <label key={classe.codigo} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.classesSociais?.includes(classe.codigo) || false}
                onChange={(e) => {
                  const current = filtros.classesSociais || []
                  if (e.target.checked) {
                    setFiltros({...filtros, classesSociais: [...current, classe.codigo]})
                  } else {
                    setFiltros({...filtros, classesSociais: current.filter(c => c !== classe.codigo)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{classe.descricao}</span>
            </label>
          ))}
        </div>
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
        
        <div className="max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {profissoes.map(profissao => (
              <label key={profissao.cdCbo} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={filtros.profissoes?.includes(profissao.cdCbo) || false}
                  onChange={(e) => {
                    const current = filtros.profissoes || []
                    if (e.target.checked) {
                      setFiltros({...filtros, profissoes: [...current, profissao.cdCbo]})
                    } else {
                      setFiltros({...filtros, profissoes: current.filter(p => p !== profissao.cdCbo)})
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{profissao.dsCbo}</span>
              </label>
            ))}
          </div>
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {operadoras.map(operadora => (
            <label key={operadora.nomeOperadora} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.operadorasCelular?.includes(operadora.nomeOperadora) || false}
                onChange={(e) => {
                  const current = filtros.operadorasCelular || []
                  if (e.target.checked) {
                    setFiltros({...filtros, operadorasCelular: [...current, operadora.nomeOperadora]})
                  } else {
                    setFiltros({...filtros, operadorasCelular: current.filter(o => o !== operadora.nomeOperadora)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{operadora.nomeOperadora}</span>
            </label>
          ))}
        </div>
      </div>

      {/* DDDs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DDDs</h3>
        
        <div className="space-y-4">
          {ddds.estados.map(estado => (
            <div key={estado.siglaUf}>
              <h4 className="font-medium text-gray-900 mb-2">{estado.nome} ({estado.siglaUf})</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 ml-4">
                {estado.ddds.map(ddd => (
                  <label key={`${estado.siglaUf}-${ddd.prefixo}`} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filtros.dddsCelular?.includes(ddd.prefixo.toString()) || false}
                      onChange={(e) => {
                        const current = filtros.dddsCelular || []
                        const dddStr = ddd.prefixo.toString()
                        if (e.target.checked) {
                          setFiltros({...filtros, dddsCelular: [...current, dddStr]})
                        } else {
                          setFiltros({...filtros, dddsCelular: current.filter(d => d !== dddStr)})
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">({ddd.prefixo})</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
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
        
        <div className="max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            {cnaes.map(cnae => (
              <label key={cnae.cnae} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={filtros.cnaes?.includes(cnae.cnae) || false}
                  onChange={(e) => {
                    const current = filtros.cnaes || []
                    if (e.target.checked) {
                      setFiltros({...filtros, cnaes: [...current, cnae.cnae]})
                    } else {
                      setFiltros({...filtros, cnaes: current.filter(c => c !== cnae.cnae)})
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{cnae.cnae} - {cnae.descricaoCnae}</span>
              </label>
            ))}
          </div>
        </div>
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {operadoras.map(operadora => (
            <label key={operadora.nomeOperadora} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filtros.operadorasCelular?.includes(operadora.nomeOperadora) || false}
                onChange={(e) => {
                  const current = filtros.operadorasCelular || []
                  if (e.target.checked) {
                    setFiltros({...filtros, operadorasCelular: [...current, operadora.nomeOperadora]})
                  } else {
                    setFiltros({...filtros, operadorasCelular: current.filter(o => o !== operadora.nomeOperadora)})
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{operadora.nomeOperadora}</span>
            </label>
          ))}
        </div>
      </div>

      {/* DDDs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DDDs</h3>
        
        <div className="space-y-4">
          {ddds.estados.map(estado => (
            <div key={estado.siglaUf}>
              <h4 className="font-medium text-gray-900 mb-2">{estado.nome} ({estado.siglaUf})</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 ml-4">
                {estado.ddds.map(ddd => (
                  <label key={`${estado.siglaUf}-${ddd.prefixo}`} className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={filtros.dddsCelular?.includes(ddd.prefixo.toString()) || false}
                      onChange={(e) => {
                        const current = filtros.dddsCelular || []
                        const dddStr = ddd.prefixo.toString()
                        if (e.target.checked) {
                          setFiltros({...filtros, dddsCelular: [...current, dddStr]})
                        } else {
                          setFiltros({...filtros, dddsCelular: current.filter(d => d !== dddStr)})
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">({ddd.prefixo})</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}