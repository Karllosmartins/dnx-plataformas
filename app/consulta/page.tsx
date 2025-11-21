'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import PlanProtection from '../../components/shared/PlanProtection'
import ConsultaResultados from '../../components/features/consulta/ConsultaResultados'
import {
  Search,
  User,
  FileText,
  Building,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Eye,
  MapPin,
  Car,
  Users,
  TrendingUp,
  BarChart3,
  Shield,
  Briefcase,
  Home,
  CreditCard
} from 'lucide-react'

export default function ConsultaPage() {
  const { user } = useAuth()

  // Estados da consulta individual
  const [consultaForm, setConsultaForm] = useState({
    document: '',
    tipoPessoa: 'PF' as 'PF' | 'PJ',
    nomeRazao: '',
    cidade: '',
    uf: '',
    cep: '',
    numeroEndereco: '',
    numeroTelefone: '',
    email: '',
    dataNascimentoAbertura: '',
    placaVeiculo: ''
  })
  const [consultaResult, setConsultaResult] = useState<any>(null)
  const [consultando, setConsultando] = useState(false)
  const [limiteInfo, setLimiteInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('geral')

  // Carregar informações de limite quando a página carrega
  useEffect(() => {
    if (user?.id) {
      carregarLimiteInfo()
    }
  }, [user])

  const carregarLimiteInfo = async () => {
    try {
      // Fazer uma requisição para uma API que busca os dados do usuário
      const response = await fetch(`/api/users/limits?userId=${user?.id}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar limites')
      }

      const data = await response.json()
      setLimiteInfo(data)
    } catch (error) {
      console.error('Erro ao carregar limite:', error)
    }
  }

  const realizarConsulta = async () => {
    if (!user?.id) {
      alert('Usuário não autenticado')
      return
    }

    // Validar se pelo menos um critério de busca foi fornecido
    const hasSearchCriteria = consultaForm.document ||
                               consultaForm.numeroTelefone ||
                               consultaForm.email ||
                               consultaForm.placaVeiculo ||
                               (consultaForm.nomeRazao && (consultaForm.cidade || consultaForm.uf || consultaForm.cep))

    if (!hasSearchCriteria) {
      alert('Forneça pelo menos um critério de busca: CPF/CNPJ, telefone, email, placa de veículo, ou nome completo com localização (cidade/UF/CEP)')
      return
    }

    // tipoPessoa é sempre obrigatório pela API Datecode
    if (!consultaForm.tipoPessoa) {
      alert('Tipo de Pessoa (PF/PJ) é obrigatório')
      return
    }

    setConsultando(true)
    setConsultaResult(null)

    try {
      // Preparar body da requisição - tipoPessoa é sempre obrigatório pela API Datecode
      const requestBody: any = {
        userId: user.id,
        tipoPessoa: consultaForm.tipoPessoa, // Sempre enviar tipoPessoa
        nomeRazao: consultaForm.nomeRazao,
        cidade: consultaForm.cidade,
        uf: consultaForm.uf,
        cep: consultaForm.cep,
        numeroEndereco: consultaForm.numeroEndereco,
        numeroTelefone: consultaForm.numeroTelefone,
        email: consultaForm.email,
        dataNascimentoAbertura: consultaForm.dataNascimentoAbertura,
        placaVeiculo: consultaForm.placaVeiculo
      }

      // Adicionar document apenas se foi fornecido
      if (consultaForm.document && consultaForm.document.trim() !== '') {
        requestBody.document = consultaForm.document
      }

      const response = await fetch('/api/datecode/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na consulta')
      }

      console.log('Resposta da API:', data)
      console.log('Usage data:', data.usage)

      setConsultaResult(data.data)

      // Atualizar limiteInfo se vier na resposta
      if (data.usage) {
        setLimiteInfo(data.usage)
      }

    } catch (error) {
      console.error('Erro na consulta:', error)
      alert(error instanceof Error ? error.message : 'Erro ao realizar consulta')
    } finally {
      setConsultando(false)
    }
  }

  const limparConsulta = () => {
    setConsultaForm({
      document: '',
      tipoPessoa: 'PF',
      nomeRazao: '',
      cidade: '',
      uf: '',
      cep: '',
      numeroEndereco: '',
      numeroTelefone: '',
      email: '',
      dataNascimentoAbertura: '',
      placaVeiculo: ''
    })
    setConsultaResult(null)
    setLimiteInfo(null)
  }

  // Detectar tipo de resultado
  const detectarTipoResultado = (resultado: any) => {
    if (Array.isArray(resultado)) {
      // Se é array, pode ser pesquisa simples por telefone
      if (resultado.length > 0 && resultado[0].cpfCnpj && !resultado[0].msg) {
        return 'lista_simples'
      }
    }

    // Se tem propriedade 'empresa', é consulta de CNPJ
    if (resultado?.empresa || resultado?.[0]?.empresa) {
      return 'pessoa_juridica'
    }

    // Se tem propriedade 'pessoa', é consulta de CPF
    if (resultado?.pessoa || resultado?.[0]?.pessoa) {
      return 'pessoa_fisica'
    }

    return 'desconhecido'
  }

  const consultarDocumento = async (documento: string, tipoPessoa: 'PF' | 'PJ') => {
    if (!user?.id) {
      alert('Usuário não autenticado')
      return
    }

    setConsultando(true)

    try {
      const response = await fetch('/api/datecode/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: documento,
          tipoPessoa: tipoPessoa,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na consulta')
      }

      console.log('Resposta consultarDocumento:', data)
      console.log('Usage data:', data.usage)

      setConsultaResult(data.data)

      // Atualizar limiteInfo se vier na resposta
      if (data.usage) {
        setLimiteInfo(data.usage)
      }

      // Rolar para o topo dos resultados
      window.scrollTo({ top: 400, behavior: 'smooth' })

    } catch (error) {
      console.error('Erro na consulta:', error)
      alert(error instanceof Error ? error.message : 'Erro ao realizar consulta')
    } finally {
      setConsultando(false)
    }
  }

  return (
    <PlanProtection feature="consulta">
      <div className="space-y-6 p-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Search className="h-8 w-8 mr-3 text-blue-600" />
            Consulta Individual
          </h1>
          <p className="mt-2 text-gray-600">
            Realize consultas por CPF, CNPJ, telefone, email, placa de veículo ou nome + localização
          </p>
        </div>

        <div className="space-y-6">
          {/* Formulário de Consulta */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Consulta</h3>

            {/* Aviso sobre critérios de busca */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Preencha qualquer critério de busca: CPF/CNPJ, telefone, email, placa de veículo ou nome + localização.
                Quanto mais informações fornecer, mais preciso será o resultado.
              </p>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  {/* Tipo de Pessoa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      Tipo de Pessoa *
                    </label>
                    <select
                      value={consultaForm.tipoPessoa}
                      onChange={(e) => setConsultaForm({...consultaForm, tipoPessoa: e.target.value as 'PF' | 'PJ'})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    >
                      <option value="PF">Pessoa Física (CPF)</option>
                      <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                    </select>
                  </div>

                  {/* Documento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="inline h-4 w-4 mr-1" />
                      {consultaForm.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                      <span className="text-xs text-gray-500 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={consultaForm.document}
                      onChange={(e) => setConsultaForm({...consultaForm, document: e.target.value})}
                      placeholder={consultaForm.tipoPessoa === 'PF' ? '123.456.789-00' : '12.345.678/0001-99'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Nome/Razão Social */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {consultaForm.tipoPessoa === 'PF' ? 'Nome Completo' : 'Razão Social'}
                    </label>
                    <input
                      type="text"
                      value={consultaForm.nomeRazao}
                      onChange={(e) => setConsultaForm({...consultaForm, nomeRazao: e.target.value})}
                      placeholder={consultaForm.tipoPessoa === 'PF' ? 'João da Silva' : 'Empresa Ltda'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline h-4 w-4 mr-1" />
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={consultaForm.cidade}
                      onChange={(e) => setConsultaForm({...consultaForm, cidade: e.target.value})}
                      placeholder="São Paulo"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* UF */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UF
                    </label>
                    <input
                      type="text"
                      value={consultaForm.uf}
                      onChange={(e) => setConsultaForm({...consultaForm, uf: e.target.value})}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* CEP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={consultaForm.cep}
                      onChange={(e) => setConsultaForm({...consultaForm, cep: e.target.value})}
                      placeholder="01001-000"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  {/* Número do Endereço */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número do Endereço
                    </label>
                    <input
                      type="text"
                      value={consultaForm.numeroEndereco}
                      onChange={(e) => setConsultaForm({...consultaForm, numeroEndereco: e.target.value})}
                      placeholder="100"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={consultaForm.numeroTelefone}
                      onChange={(e) => setConsultaForm({...consultaForm, numeroTelefone: e.target.value})}
                      placeholder="11999999999"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-1" />
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={consultaForm.email}
                      onChange={(e) => setConsultaForm({...consultaForm, email: e.target.value})}
                      placeholder="exemplo@email.com"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Data de Nascimento/Abertura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {consultaForm.tipoPessoa === 'PF' ? 'Data de Nascimento' : 'Data de Abertura'}
                    </label>
                    <input
                      type="date"
                      value={consultaForm.dataNascimentoAbertura}
                      onChange={(e) => setConsultaForm({...consultaForm, dataNascimentoAbertura: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Placa do Veículo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placa do Veículo
                    </label>
                    <input
                      type="text"
                      value={consultaForm.placaVeiculo}
                      onChange={(e) => setConsultaForm({...consultaForm, placaVeiculo: e.target.value})}
                      placeholder="ABC1D23"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Informações de limite - Cards limpos */}
                  {limiteInfo && (
                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-xs font-medium uppercase mb-1">Realizadas</p>
                        <p className="text-3xl font-bold text-gray-900">{limiteInfo.consultasRealizadas}</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-xs font-medium uppercase mb-1">Limite Total</p>
                        <p className="text-3xl font-bold text-gray-900">{limiteInfo.limiteConsultas}</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600 text-xs font-medium uppercase mb-1">Restantes</p>
                        <p className="text-3xl font-bold text-gray-900">{limiteInfo.consultasRestantes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={realizarConsulta}
                  disabled={consultando}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {consultando ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Realizar Consulta
                    </>
                  )}
                </button>
                <button
                  onClick={limparConsulta}
                  disabled={consultando}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Limpar
                </button>
              </div>
          </div>

          {/* Resultados da Consulta */}
          {consultaResult && (
            <div className="bg-white rounded-lg shadow">
              {/* Header dos Resultados */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Resultados da Consulta
                </h3>
              </div>

              {/* Sistema de Abas */}
              {detectarTipoResultado(consultaResult) !== 'lista_simples' && (
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-4 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('geral')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'geral'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <User className="inline h-4 w-4 mr-1" />
                      Dados Gerais
                    </button>
                    <button
                      onClick={() => setActiveTab('contatos')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'contatos'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Phone className="inline h-4 w-4 mr-1" />
                      Contatos
                    </button>
                    {(consultaResult?.pessoa || consultaResult?.[0]?.pessoa) && (
                      <>
                        <button
                          onClick={() => setActiveTab('perfil')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'perfil'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <TrendingUp className="inline h-4 w-4 mr-1" />
                          Perfil
                        </button>
                        <button
                          onClick={() => setActiveTab('participacoes')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'participacoes'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Briefcase className="inline h-4 w-4 mr-1" />
                          Empresas
                        </button>
                      </>
                    )}
                    {(consultaResult?.empresa || consultaResult?.[0]?.empresa) && (
                      <button
                        onClick={() => setActiveTab('socios')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'socios'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Users className="inline h-4 w-4 mr-1" />
                        Sócios & Funcionários
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('veiculos')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'veiculos'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Car className="inline h-4 w-4 mr-1" />
                      Veículos
                    </button>
                  </nav>
                </div>
              )}

              {/* Conteúdo das Abas */}
              <div className="p-6">
                {/* Lista Simples (resultado de busca por telefone) */}
                {detectarTipoResultado(consultaResult) === 'lista_simples' && Array.isArray(consultaResult) && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      Encontrados {consultaResult.length} resultado(s)
                    </p>
                    {consultaResult.map((pessoa: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-lg">{pessoa.nomeRazaoSocial}</h4>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              <div><span className="font-medium text-gray-600">CPF/CNPJ:</span> <span className="text-gray-900">{pessoa.cpfCnpjFormatado}</span></div>
                              {pessoa.idade && <div><span className="font-medium text-gray-600">Idade:</span> <span className="text-gray-900">{pessoa.idade} anos</span></div>}
                              {pessoa.bairro && <div><span className="font-medium text-gray-600">Bairro:</span> <span className="text-gray-900">{pessoa.bairro}</span></div>}
                              {pessoa.cidade && pessoa.uf && (
                                <div><span className="font-medium text-gray-600">Localização:</span> <span className="text-gray-900">{pessoa.cidade}/{pessoa.uf}</span></div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const documento = pessoa.cpfCnpj.replace(/\D/g, '')
                              const tipo = documento.length === 11 ? 'PF' : 'PJ'
                              consultarDocumento(documento, tipo)
                            }}
                            disabled={consultando}
                            className="ml-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                            title="Ver detalhes completos"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resultados Detalhados (PF ou PJ) */}
                {detectarTipoResultado(consultaResult) !== 'lista_simples' && Array.isArray(consultaResult) && consultaResult.length > 0 && (
                  consultaResult.map((resultado, index) => (
                    <ConsultaResultados
                      key={index}
                      resultado={resultado}
                      activeTab={activeTab}
                      consultarDocumento={consultarDocumento}
                      consultando={consultando}
                    />
                  ))
                )}

                {/* Mensagem quando não encontra resultados */}
                {(!consultaResult || (Array.isArray(consultaResult) && consultaResult.length === 0)) && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum resultado encontrado</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PlanProtection>
  )
}