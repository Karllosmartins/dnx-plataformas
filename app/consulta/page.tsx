'use client'

import React, { useState } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import PlanProtection from '../../components/PlanProtection'
import {
  Search,
  User,
  FileText,
  Building,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle
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

  const realizarConsulta = async () => {
    if (!consultaForm.document || !user?.id) {
      alert('CPF/CNPJ é obrigatório')
      return
    }

    setConsultando(true)
    setConsultaResult(null)

    try {
      const response = await fetch('/api/datecode/consulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...consultaForm,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na consulta')
      }

      setConsultaResult(data.data)
      setLimiteInfo(data.usage)

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

  return (
    <PlanProtection feature="consulta">
      <div className="space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Search className="h-8 w-8 mr-3 text-green-600" />
            Consulta Individual
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Realize consultas individuais de CPF ou CNPJ usando a API DataCode
          </p>
        </div>

        <div className="space-y-6">
          {/* Formulário de Consulta */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Search className="h-5 w-5 mr-2 text-green-600" />
                Nova Consulta
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Preencha os campos para realizar uma consulta individual
              </p>
            </div>

            <div className="p-6">
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      {consultaForm.tipoPessoa === 'PF' ? 'CPF *' : 'CNPJ *'}
                    </label>
                    <input
                      type="text"
                      value={consultaForm.document}
                      onChange={(e) => setConsultaForm({...consultaForm, document: e.target.value})}
                      placeholder={consultaForm.tipoPessoa === 'PF' ? '123.456.789-00' : '12.345.678/0001-99'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={consultando}
                      required
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={consultando}
                    />
                  </div>

                  {/* Informações de limite */}
                  {limiteInfo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        📊 Uso de Consultas
                      </h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>Consultas realizadas: {limiteInfo.consultasRealizadas}</p>
                        <p>Limite total: {limiteInfo.limiteConsultas}</p>
                        <p>Consultas restantes: {limiteInfo.consultasRestantes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={realizarConsulta}
                  disabled={consultando || !consultaForm.document}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Resultados da Consulta */}
          {consultaResult && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Resultados da Consulta
                </h3>
              </div>

              <div className="p-6">
                {Array.isArray(consultaResult) && consultaResult.length > 0 ? (
                  consultaResult.map((resultado, index) => (
                    <div key={index} className="space-y-6">
                      {/* Mensagem de sucesso */}
                      {resultado.msg && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <p className="text-green-800">{resultado.msg}</p>
                        </div>
                      )}

                      {/* Dados da Empresa */}
                      {resultado.empresa && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Dados da Empresa
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><strong>Razão Social:</strong> {resultado.empresa.razaoSocial}</div>
                            <div><strong>CNPJ:</strong> {resultado.empresa.cnpjFormatado}</div>
                            <div><strong>Nome Fantasia:</strong> {resultado.empresa.nomefantasia || 'N/A'}</div>
                            <div><strong>Data de Abertura:</strong> {resultado.empresa.dataAbertura}</div>
                            <div><strong>CNAE:</strong> {resultado.empresa.cnae}</div>
                            <div><strong>Porte:</strong> {resultado.empresa.porte}</div>
                            <div><strong>Natureza Jurídica:</strong> {resultado.empresa.nJur}</div>
                            <div><strong>Faturamento Anual:</strong> R$ {resultado.empresa.faturamentoPresumidoAnual ? Number(resultado.empresa.faturamentoPresumidoAnual).toLocaleString('pt-BR') : 'N/A'}</div>
                            <div><strong>Score:</strong> {resultado.empresa.score}</div>
                            <div>
                              <strong>Risco:</strong>
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                resultado.empresa.risco === 'ALTO RISCO' ? 'bg-red-100 text-red-800' :
                                resultado.empresa.risco === 'MÉDIO RISCO' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {resultado.empresa.risco}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dados da Pessoa */}
                      {resultado.pessoa && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Dados Pessoais
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><strong>Nome:</strong> {resultado.pessoa.nome}</div>
                            <div><strong>CPF:</strong> {resultado.pessoa.cpfFormatado}</div>
                            <div><strong>Sexo:</strong> {resultado.pessoa.sexo}</div>
                            <div><strong>Data de Nascimento:</strong> {resultado.pessoa.dataNascimento}</div>
                            <div><strong>Idade:</strong> {resultado.pessoa.idade} anos</div>
                            <div><strong>Signo:</strong> {resultado.pessoa.signo}</div>
                            <div><strong>Nome da Mãe:</strong> {resultado.pessoa.nomeMae}</div>
                          </div>
                        </div>
                      )}

                      {/* Telefones */}
                      {resultado.telefones && resultado.telefones.length > 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                          <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Telefones ({resultado.telefones.length})
                          </h4>
                          <div className="space-y-2">
                            {resultado.telefones.map((telefone: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-white rounded px-3 py-2">
                                <span><strong>{telefone.telefoneFormatado}</strong> - {telefone.tipoTelefone}</span>
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  Q: {telefone.qualificacao}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Endereços */}
                      {resultado.enderecos && resultado.enderecos.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                          <h4 className="font-medium text-orange-900 mb-3 flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Endereços ({resultado.enderecos.length})
                          </h4>
                          <div className="space-y-2">
                            {resultado.enderecos.map((endereco: any, idx: number) => (
                              <div key={idx} className="bg-white rounded px-3 py-2">
                                <div className="text-sm">
                                  <strong>{endereco.endereco}</strong>
                                  {endereco.numero && `, ${endereco.numero}`}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {endereco.bairro} - {endereco.cidade}/{endereco.uf} - {endereco.cepFormatado}
                                </div>
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  Qualificação: {endereco.qualificacao}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* E-mails */}
                      {resultado.emails && resultado.emails.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                          <h4 className="font-medium text-green-900 mb-3 flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            E-mails ({resultado.emails.length})
                          </h4>
                          <div className="space-y-2">
                            {resultado.emails.map((email: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-white rounded px-3 py-2">
                                <span>{email.email}</span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Q: {email.qualificacao}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Perfil de Consumo */}
                      {resultado.perfilConsumo && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
                          <h4 className="font-medium text-indigo-900 mb-3">
                            📈 Perfil de Consumo
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {Object.entries(resultado.perfilConsumo).map(([key, value]) => (
                              <div key={key} className="bg-white rounded px-2 py-1">
                                <strong>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</strong> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Perfil Sociodemográfico */}
                      {resultado.perfilSociodemografico && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <h4 className="font-medium text-yellow-900 mb-3">
                            👥 Perfil Sociodemográfico
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><strong>Classe:</strong> {resultado.perfilSociodemografico.classe}</div>
                            <div><strong>Score de Risco:</strong> {resultado.perfilSociodemografico.scoreRisco}</div>
                            <div><strong>Segmento:</strong> {resultado.perfilSociodemografico.segmento}</div>
                            <div><strong>Estado Civil:</strong> {resultado.perfilSociodemografico.estadoCivil}</div>
                            <div><strong>Escolaridade:</strong> {resultado.perfilSociodemografico.escolaridade}</div>
                            <div><strong>Renda Presumida:</strong> R$ {resultado.perfilSociodemografico.rendaPresumida}</div>
                          </div>
                        </div>
                      )}

                      {/* Veículos */}
                      {resultado.veiculos && resultado.veiculos.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <h4 className="font-medium text-red-900 mb-3">
                            🚗 Veículos ({resultado.veiculos.length})
                          </h4>
                          <div className="space-y-2">
                            {resultado.veiculos.map((veiculo: any, idx: number) => (
                              <div key={idx} className="bg-white rounded px-3 py-2">
                                <div className="text-sm">
                                  <strong>{veiculo.marcaModelo}</strong> - {veiculo.anoFabricacao}/{veiculo.anoModelo}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Placa: {veiculo.placa} | RENAVAM: {veiculo.renavam}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Receita Federal */}
                      {resultado.receitaFederal && (
                        <div className="bg-cyan-50 border border-cyan-200 rounded-md p-4">
                          <h4 className="font-medium text-cyan-900 mb-3">
                            🏛️ Dados da Receita Federal
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                            <div><strong>Situação Cadastral:</strong> {resultado.receitaFederal.situacaoCadastral}</div>
                            <div><strong>Capital Social:</strong> R$ {resultado.receitaFederal.capitalSocial ? Number(resultado.receitaFederal.capitalSocial).toLocaleString('pt-BR') : 'N/A'}</div>
                            <div><strong>Descrição Matriz/Filial:</strong> {resultado.receitaFederal.descricaoMatriz}</div>
                            <div><strong>Situação Especial:</strong> {resultado.receitaFederal.situacaoEspecial || 'N/A'}</div>
                          </div>

                          {/* CNAEs Secundários */}
                          {resultado.receitaFederal.cnaesSecundarios && resultado.receitaFederal.cnaesSecundarios.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-cyan-900 mb-2">CNAEs Secundários:</h5>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {resultado.receitaFederal.cnaesSecundarios.map((cnae: any, idx: number) => (
                                  <div key={idx} className="text-xs bg-white rounded px-2 py-1">
                                    <strong>{cnae.cnaeCod}</strong> - {cnae.cnaeDesc}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sócios */}
                          {resultado.receitaFederal.socios && resultado.receitaFederal.socios.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-cyan-900 mb-2">Sócios ({resultado.receitaFederal.socios.length}):</h5>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {resultado.receitaFederal.socios.map((socio: any, idx: number) => (
                                  <div key={idx} className="bg-white rounded px-3 py-2">
                                    <div className="text-sm">
                                      <strong>{socio.nomeRazaoSocial}</strong>
                                      {socio.participacao > 0 && ` - ${socio.participacao}%`}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Doc: {socio.cpfCnpj} | {socio.qualificacaoDesc}
                                      {socio.dataNascimentoAbertura && ` | Nascimento: ${socio.dataNascimentoAbertura}`}
                                    </div>
                                    {socio.representanteLegal && (
                                      <div className="text-xs text-blue-600 mt-1">
                                        Rep. Legal: {socio.representanteLegal.nome}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Funcionários */}
                      {resultado.funcionarios && resultado.funcionarios.length > 0 && (
                        <div className="bg-violet-50 border border-violet-200 rounded-md p-4">
                          <h4 className="font-medium text-violet-900 mb-3">
                            👥 Funcionários ({resultado.funcionarios.length})
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {resultado.funcionarios.map((funcionario: any, idx: number) => (
                              <div key={idx} className="bg-white rounded px-3 py-2">
                                <div className="text-sm">
                                  <strong>{funcionario.nome}</strong>
                                </div>
                                <div className="text-xs text-gray-600">
                                  Cargo: {funcionario.cargo} | Salário: R$ {funcionario.salario}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Participação Empresarial */}
                      {resultado.participacaoEmpresarial && resultado.participacaoEmpresarial.length > 0 && (
                        <div className="bg-teal-50 border border-teal-200 rounded-md p-4">
                          <h4 className="font-medium text-teal-900 mb-3">
                            🏢 Participação Empresarial ({resultado.participacaoEmpresarial.length})
                          </h4>
                          <div className="space-y-2">
                            {resultado.participacaoEmpresarial.map((empresa: any, idx: number) => (
                              <div key={idx} className="bg-white rounded px-3 py-2">
                                <div className="text-sm">
                                  <strong>{empresa.razaoSocial}</strong>
                                  {empresa.nomeFantasia && ` (${empresa.nomeFantasia})`}
                                </div>
                                <div className="text-xs text-gray-600">
                                  CNPJ: {empresa.cnpjFormatado} | Participação: {empresa.participacao}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
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