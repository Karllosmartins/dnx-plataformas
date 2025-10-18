'use client'

import React from 'react'
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Car,
  Users,
  TrendingUp,
  BarChart3,
  Shield,
  Briefcase,
  Home,
  CreditCard,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Props {
  resultado: any
  activeTab: string
  consultarDocumento: (documento: string, tipoPessoa: 'PF' | 'PJ') => Promise<void>
  consultando: boolean
}

export default function ConsultaResultados({ resultado, activeTab, consultarDocumento, consultando }: Props) {
  return (
    <div className="space-y-6">
      {/* Aba: Dados Gerais */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          {/* Dados da Empresa (PJ) */}
          {resultado.empresa && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <h4 className="text-xl font-bold mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Dados da Empresa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Razão Social</p>
                  <p className="font-semibold">{resultado.empresa.razaoSocial}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">CNPJ</p>
                  <p className="font-semibold">{resultado.empresa.cnpjFormatado}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Nome Fantasia</p>
                  <p className="font-semibold">{resultado.empresa.nomefantasia || 'N/A'}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Data de Abertura</p>
                  <p className="font-semibold">{resultado.empresa.dataAbertura}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Porte</p>
                  <p className="font-semibold">{resultado.empresa.porte}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Risco</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    resultado.empresa.risco === 'ALTO RISCO' ? 'bg-red-600' :
                    resultado.empresa.risco === 'MÉDIO RISCO' ? 'bg-yellow-500' :
                    'bg-green-600'
                  }`}>
                    {resultado.empresa.risco} (Score: {resultado.empresa.score})
                  </span>
                </div>
                <div className="bg-white/10 rounded-lg p-3 col-span-1 md:col-span-2">
                  <p className="text-white/70 text-xs mb-1">CNAE</p>
                  <p className="font-semibold text-xs">{resultado.empresa.cnae}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Faturamento Anual</p>
                  <p className="font-semibold">
                    R$ {resultado.empresa.faturamentoPresumidoAnual ? Number(resultado.empresa.faturamentoPresumidoAnual).toLocaleString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Situação Cadastral */}
              {resultado.receitaFederal && (
                <div className="mt-4 bg-white/10 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Situação Cadastral
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-white/70">Status:</span>
                      <span className="ml-2 px-2 py-1 bg-green-600 rounded text-white font-semibold">
                        {resultado.receitaFederal.situacaoCadastral}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/70">Capital Social:</span>
                      <span className="ml-2 font-semibold">
                        R$ {resultado.receitaFederal.capitalSocial ? Number(resultado.receitaFederal.capitalSocial).toLocaleString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/70">Natureza Jurídica:</span>
                      <span className="ml-2 font-semibold">{resultado.receitaFederal.nJurDesc}</span>
                    </div>
                    <div>
                      <span className="text-white/70">Tipo:</span>
                      <span className="ml-2 font-semibold">{resultado.receitaFederal.descricaoMatriz}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dados da Pessoa (PF) */}
          {resultado.pessoa && (
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h4 className="text-xl font-bold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Dados Pessoais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Nome</p>
                  <p className="font-semibold">{resultado.pessoa.nome}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">CPF</p>
                  <p className="font-semibold">{resultado.pessoa.cpfFormatado}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Sexo</p>
                  <p className="font-semibold">{resultado.pessoa.sexo}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Data de Nascimento</p>
                  <p className="font-semibold">{resultado.pessoa.dataNascimento}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Idade</p>
                  <p className="font-semibold">{resultado.pessoa.idade} anos</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Signo</p>
                  <p className="font-semibold">{resultado.pessoa.signo}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 col-span-1 md:col-span-2 lg:col-span-3">
                  <p className="text-white/70 text-xs mb-1">Nome da Mãe</p>
                  <p className="font-semibold">{resultado.pessoa.nomeMae}</p>
                </div>
              </div>

              {/* Restrições */}
              {resultado.restricoes && (
                <div className="mt-4 bg-white/10 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Restrições e Alertas
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                    {Object.entries(resultado.restricoes).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 bg-white/5 rounded px-2 py-1">
                        {value === true ? (
                          <CheckCircle className="h-3 w-3 text-green-300" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span className="capitalize">
                          {key.replace(/^is|^has/, '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Situação Cadastral CPF */}
              {resultado.situacaoCadastral && (
                <div className="mt-4 bg-white/10 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Situação Cadastral na Receita Federal
                  </h5>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="px-3 py-1 bg-green-600 rounded font-semibold">
                      {resultado.situacaoCadastral.situacaoCadastral}
                    </span>
                    <span className="text-white/70">
                      Consultado em: {resultado.situacaoCadastral.dataHora}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Aba: Contatos */}
      {activeTab === 'contatos' && (
        <div className="space-y-6">
          {/* Telefones */}
          {resultado.telefones && resultado.telefones.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-600" />
                Telefones ({resultado.telefones.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resultado.telefones.map((telefone: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-4 py-3 hover:bg-green-100 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">{telefone.telefoneFormatado}</p>
                      <p className="text-xs text-gray-600">{telefone.tipoTelefone}</p>
                      {telefone.operadora && <p className="text-xs text-gray-500">{telefone.operadora}</p>}
                    </div>
                    <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-medium">
                      Q{telefone.qualificacao}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Endereços */}
          {resultado.enderecos && resultado.enderecos.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                Endereços ({resultado.enderecos.length})
              </h4>
              <div className="space-y-3">
                {resultado.enderecos.map((endereco: any, idx: number) => (
                  <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 hover:bg-orange-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {endereco.endereco}
                          {endereco.complemento && `, ${endereco.complemento}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {endereco.bairro} - {endereco.cidade}/{endereco.uf} - {endereco.cepFormatado}
                        </p>
                      </div>
                      <span className="ml-3 text-xs bg-orange-600 text-white px-3 py-1 rounded-full font-medium whitespace-nowrap">
                        Q{endereco.qualificacao}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E-mails */}
          {resultado.emails && resultado.emails.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                E-mails ({resultado.emails.length})
              </h4>
              <div className="space-y-2">
                {resultado.emails.map((email: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 hover:bg-blue-100 transition-colors">
                    <p className="font-medium text-gray-900 lowercase">{email.email}</p>
                    <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                      Q{email.qualificacao}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aba: Perfil (apenas PF) */}
      {activeTab === 'perfil' && resultado.pessoa && (
        <div className="space-y-6">
          {/* Perfil Sociodemográfico */}
          {resultado.perfilSociodemografico && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h4 className="text-xl font-bold mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Perfil Sociodemográfico
              </h4>
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <p className="text-2xl font-bold">{resultado.perfilSociodemografico.classe}</p>
                <p className="text-white/80 text-sm mt-1">{resultado.perfilSociodemografico.segmento}</p>
                {resultado.perfilSociodemografico.descricao && (
                  <p className="text-white/70 text-xs mt-2 italic">{resultado.perfilSociodemografico.descricao}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Score de Risco</p>
                  <p className="font-semibold">{resultado.perfilSociodemografico.scoreRisco}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Renda Presumida</p>
                  <p className="font-semibold">R$ {resultado.perfilSociodemografico.rendaPresumida}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Atividade Financeira</p>
                  <p className="font-semibold">{resultado.perfilSociodemografico.atividadeFinanceira}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Escolaridade</p>
                  <p className="font-semibold">{resultado.perfilSociodemografico.escolaridade}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Ocupação</p>
                  <p className="font-semibold">{resultado.perfilSociodemografico.ocupacao}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-1">Região</p>
                  <p className="font-semibold">{resultado.perfilSociodemografico.regiao}</p>
                </div>
                {resultado.perfilSociodemografico.cboDesc && (
                  <div className="bg-white/10 rounded-lg p-3 col-span-1 md:col-span-2 lg:col-span-3">
                    <p className="text-white/70 text-xs mb-1">CBO (Classificação Brasileira de Ocupações)</p>
                    <p className="font-semibold">{resultado.perfilSociodemografico.cboDesc}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Perfil de Consumo */}
          {resultado.perfilConsumo && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Perfil de Consumo
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(resultado.perfilConsumo).map(([key, value]: [string, any]) => {
                  const isPositive = value === 'SIM' || value === true
                  const isScore = key.toLowerCase().includes('score')

                  return (
                    <div key={key} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                      isScore ? 'bg-blue-50 border-blue-200' :
                      isPositive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className="text-xs font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`text-xs font-bold ${
                        isScore ? 'text-blue-700' :
                        isPositive ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {String(value)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pessoas Ligadas */}
          {resultado.pessoasLigadas && resultado.pessoasLigadas.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Pessoas Ligadas ({resultado.pessoasLigadas.length})
              </h4>
              <div className="space-y-2">
                {resultado.pessoasLigadas.map((pessoa: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 hover:bg-purple-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{pessoa.nome}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                        <span>CPF: {pessoa.cpfFormatado}</span>
                        <span>Idade: {pessoa.idade} anos</span>
                        <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded">
                          {pessoa.grauParentesco}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => consultarDocumento(pessoa.cpf, 'PF')}
                      disabled={consultando}
                      className="ml-3 p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Consultar esta pessoa"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aba: Participações (apenas PF) */}
      {activeTab === 'participacoes' && resultado.participacaoEmpresarial && resultado.participacaoEmpresarial.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-teal-600" />
            Participação Empresarial ({resultado.participacaoEmpresarial.length})
          </h4>
          <div className="space-y-3">
            {resultado.participacaoEmpresarial.map((empresa: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 hover:bg-teal-100 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {empresa.razaoSocial}
                    {empresa.nomeFantasia && ` (${empresa.nomeFantasia})`}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mt-2">
                    <span>CNPJ: {empresa.cnpjFormatado}</span>
                    <span className="px-2 py-0.5 bg-teal-600 text-white rounded font-semibold">
                      {empresa.participacao}% de participação
                    </span>
                  </div>
                </div>
                {parseFloat(empresa.participacao) > 0 && (
                  <button
                    onClick={() => consultarDocumento(empresa.cnpjFormatado.replace(/\D/g, ''), 'PJ')}
                    disabled={consultando}
                    className="ml-3 p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Consultar esta empresa"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aba: Sócios & Funcionários (apenas PJ) */}
      {activeTab === 'socios' && resultado.empresa && (
        <div className="space-y-6">
          {/* Sócios */}
          {resultado.receitaFederal?.socios && resultado.receitaFederal.socios.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-cyan-600" />
                Sócios ({resultado.receitaFederal.socios.length})
              </h4>
              <div className="space-y-3">
                {resultado.receitaFederal.socios.map((socio: any, idx: number) => (
                  <div key={idx} className="bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-3 hover:bg-cyan-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{socio.nomeRazaoSocial}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                          <span>Doc: {socio.cpfCnpj}</span>
                          <span>{socio.qualificacaoDesc}</span>
                          {socio.dataNascimentoAbertura && <span>Nascimento: {socio.dataNascimentoAbertura}</span>}
                          {parseFloat(socio.participacao) > 0 && (
                            <span className="px-2 py-0.5 bg-cyan-600 text-white rounded font-semibold">
                              {socio.participacao}% de participação
                            </span>
                          )}
                          {socio.dataEntrada && <span>Entrada: {socio.dataEntrada}</span>}
                        </div>
                        {socio.representanteLegal && (
                          <p className="text-xs text-blue-600 mt-2 bg-blue-50 inline-block px-2 py-1 rounded">
                            Rep. Legal: {socio.representanteLegal.nome} - {socio.representanteLegal.qualificacaoDesc}
                          </p>
                        )}
                      </div>
                      {socio.cpfCnpj && parseFloat(socio.participacao) > 0 && (
                        <button
                          onClick={() => {
                            const documento = socio.cpfCnpj.replace(/\D/g, '')
                            const tipo = documento.length === 11 ? 'PF' : 'PJ'
                            consultarDocumento(documento, tipo)
                          }}
                          disabled={consultando}
                          className="ml-3 p-2 text-cyan-600 hover:text-cyan-800 hover:bg-cyan-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Consultar este sócio"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CNAEs Secundários */}
          {resultado.receitaFederal?.cnaesSecundarios && resultado.receitaFederal.cnaesSecundarios.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-indigo-600" />
                CNAEs Secundários ({resultado.receitaFederal.cnaesSecundarios.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {resultado.receitaFederal.cnaesSecundarios.map((cnae: any, idx: number) => (
                  <div key={idx} className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-gray-900">{cnae.cnaeCod}</span>
                    <span className="text-gray-600 ml-2">- {cnae.cnaeDesc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funcionários */}
          {resultado.funcionarios && resultado.funcionarios.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-violet-600" />
                Funcionários ({resultado.funcionarios.length})
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {resultado.funcionarios.map((funcionario: any, idx: number) => (
                  <div key={idx} className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2 hover:bg-violet-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{funcionario.nome}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                          <span>CPF: {funcionario.cpf}</span>
                          <span>Admissão: {funcionario.dataAdmissao}</span>
                          {funcionario.dataDesligamento ? (
                            <span className="text-red-600">Desligamento: {funcionario.dataDesligamento}</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-600 text-white rounded text-xs font-semibold">ATIVO</span>
                          )}
                        </div>
                      </div>
                      {!funcionario.dataDesligamento && (
                        <button
                          onClick={() => consultarDocumento(funcionario.cpf, 'PF')}
                          disabled={consultando}
                          className="ml-3 p-2 text-violet-600 hover:text-violet-800 hover:bg-violet-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Consultar este funcionário"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aba: Veículos */}
      {activeTab === 'veiculos' && resultado.veiculos && resultado.veiculos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="h-5 w-5 mr-2 text-red-600" />
            Veículos ({resultado.veiculos.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultado.veiculos.map((veiculo: any, idx: number) => (
              <div key={idx} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 hover:bg-red-100 transition-colors">
                <p className="font-semibold text-gray-900">{veiculo.marcaModelo}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                  <span>Placa: <span className="font-semibold">{veiculo.placa}</span></span>
                  <span>Ano: <span className="font-semibold">{veiculo.anoFabricacao}/{veiculo.anoModelo}</span></span>
                  <span>RENAVAM: <span className="font-semibold">{veiculo.renavam}</span></span>
                  <span>Chassi: <span className="font-semibold text-xs">{veiculo.chassi}</span></span>
                  {veiculo.dataLicenciamento && (
                    <span className="col-span-2">Licenciamento: {veiculo.dataLicenciamento}</span>
                  )}
                </div>
                {veiculo.proprietario && (
                  <p className="text-xs text-gray-700 mt-2 bg-gray-100 px-2 py-1 rounded">
                    Proprietário: {veiculo.proprietario}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Caso não tenha veículos e esteja na aba de veículos */}
      {activeTab === 'veiculos' && (!resultado.veiculos || resultado.veiculos.length === 0) && (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum veículo encontrado</p>
        </div>
      )}
    </div>
  )
}
