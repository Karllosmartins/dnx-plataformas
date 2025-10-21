'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import PlanProtection from '../../components/PlanProtection'
import { supabase } from '../../lib/supabase'
import { hasAvailableLeads, consumeLeads, getLeadsBalance, calculateEnriquecimentoLeadsConsumption } from '../../lib/permissions'
import {
  Upload,
  Database,
  Users,
  Building,
  Phone,
  CheckCircle,
  Download
} from 'lucide-react'
import * as XLSX from 'xlsx'

interface EmpresaEnriquecida {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  telefones: Array<{
    ddd: string
    telefone: string
    telefoneFormatado: string
    tipoTelefone: string
  }>
  emails: Array<{
    email: string
    qualificacao: number
  }>
  socios: Array<{
    cpfCnpj: string
    nome: string
    participacao: string
    telefones: Array<{
      ddd: string
      telefone: string
      telefoneFormatado: string
    }>
    emails: Array<{
      email: string
    }>
  }>
  totalContatos: number
}

export default function EnriquecimentoAPIPage() {
  const { user } = useAuth()

  // Estados do formulário
  const [nomeCampanha, setNomeCampanha] = useState('')

  // Estados do processo
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [cnpjs, setCnpjs] = useState<string[]>([])
  const [empresasEnriquecidas, setEmpresasEnriquecidas] = useState<EmpresaEnriquecida[]>([])

  // Estados de controle
  const [etapaAtual, setEtapaAtual] = useState<'upload' | 'enriquecendo' | 'resultados'>('upload')
  const [enriquecendo, setEnriquecendo] = useState(false)
  const [progressoEnriquecimento, setProgressoEnriquecimento] = useState(0)
  const [statusEnriquecimento, setStatusEnriquecimento] = useState('')

  // Estados para controle de limites
  const [userPlan, setUserPlan] = useState<any>(null)
  const [leadsConsumidosEnriquecimento, setLeadsConsumidosEnriquecimento] = useState(0)

  useEffect(() => {
    if (user) {
      carregarDadosUsuario()
    }
  }, [user])

  const carregarDadosUsuario = async () => {
    try {
      const { data, error } = await supabase
        .from('view_usuarios_planos')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setUserPlan(data)
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('Upload: Arquivo selecionado:', file?.name)

    if (!file) return

    setArquivo(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        console.log('Upload: Iniciando processamento do arquivo')
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        console.log('Upload: Nome da planilha:', sheetName)

        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        console.log('Upload: Dados brutos da planilha:', jsonData)

        // Extrair CNPJs da primeira coluna (ignorando cabeçalho)
        const cnpjsList = (jsonData as any[])
          .slice(1) // Remove cabeçalho
          .map(row => row[0])
          .filter(cnpj => cnpj && cnpj.toString().trim())
          .map(cnpj => cnpj.toString().replace(/\D/g, '')) // Remove formatação

        console.log('Upload: CNPJs extraídos:', cnpjsList)
        setCnpjs(cnpjsList)

        if (cnpjsList.length > 0) {
          console.log('Upload: Sucesso! Encontrados', cnpjsList.length, 'CNPJs')
        } else {
          console.log('Upload: Nenhum CNPJ encontrado na planilha')
          alert('Nenhum CNPJ encontrado na planilha. Verifique se os CNPJs estão na primeira coluna.')
        }
      } catch (error) {
        console.error('Erro ao processar arquivo:', error)
        alert('Erro ao processar arquivo. Verifique se é um arquivo Excel válido.')
      }
    }
    reader.readAsBinaryString(file)
  }

  const buscarDadosEmpresa = async (cnpj: string) => {
    try {
      const response = await fetch('/api/datecode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cnpj: cnpj,
          userId: user?.id
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Erro ao buscar dados da empresa ${cnpj}:`, error)
      return null
    }
  }

  const buscarDadosSocio = async (cpf: string) => {
    try {
      const response = await fetch('/api/datecode/cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cpf: cpf,
          userId: user?.id
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`Erro ao buscar dados do sócio ${cpf}:`, error)
      return null
    }
  }

  const iniciarEnriquecimento = async () => {
    console.log('Enriquecimento: Iniciando processo com', cnpjs.length, 'CNPJs')

    if (cnpjs.length === 0) {
      alert('Nenhum CNPJ encontrado na planilha.')
      return
    }

    if (!nomeCampanha.trim()) {
      alert('Por favor, informe o nome da campanha.')
      return
    }

    if (!userPlan) {
      alert('Erro ao carregar dados do usuário. Recarregue a página.')
      return
    }

    // Verificar se o usuário tem acesso ao enriquecimento
    if (!userPlan.acesso_enriquecimento) {
      alert('Seu plano não inclui acesso ao enriquecimento de dados.')
      return
    }

    // Estimativa básica: cada CNPJ pode ter até 3 sócios em média
    const estimativaLeadsMinimos = cnpjs.length // 1 lead por empresa
    const leadsDisponiveis = getLeadsBalance(userPlan)

    if (leadsDisponiveis < estimativaLeadsMinimos) {
      alert(`Você precisa de pelo menos ${estimativaLeadsMinimos} leads para este enriquecimento, mas possui apenas ${leadsDisponiveis} leads disponíveis.`)
      return
    }

    setEnriquecendo(true)
    setEtapaAtual('enriquecendo')
    setProgressoEnriquecimento(0)
    setStatusEnriquecimento('Iniciando enriquecimento...')

    console.log('Enriquecimento: Estado atualizado, iniciando loop de CNPJs')

    const empresasEnriquecidas: EmpresaEnriquecida[] = []

    for (let i = 0; i < cnpjs.length; i++) {
      const cnpj = cnpjs[i]
      console.log(`Enriquecimento: Processando CNPJ ${i + 1}/${cnpjs.length}: ${cnpj}`)
      setStatusEnriquecimento(`Consultando empresa ${i + 1}/${cnpjs.length}: ${cnpj}`)

      try {
        // Buscar dados da empresa
        console.log(`Enriquecimento: Chamando buscarDadosEmpresa para ${cnpj}`)
        const dadosEmpresa = await buscarDadosEmpresa(cnpj)
        console.log(`Enriquecimento: Resposta para ${cnpj}:`, dadosEmpresa)

      // A API retorna um array, pegar o primeiro item
      const dadosEmpresaItem = Array.isArray(dadosEmpresa) ? dadosEmpresa[0] : dadosEmpresa
      console.log(`Enriquecimento: Dados processados para ${cnpj}:`, dadosEmpresaItem)

      // Debug - verificar estrutura
      if (dadosEmpresaItem) {
        console.log(`Enriquecimento: DEBUG - tem dados, empresa: ${!!dadosEmpresaItem.empresa}, razaoSocial: ${!!dadosEmpresaItem.razaoSocial}, receitaFederal: ${!!dadosEmpresaItem.receitaFederal}`)
      }

      if (dadosEmpresaItem && dadosEmpresaItem.msg === 'Consulta realizada com sucesso.' && (dadosEmpresaItem.empresa || dadosEmpresaItem.receitaFederal?.razaoSocial || dadosEmpresaItem.razaoSocial)) {
        // Determinar estrutura dos dados
        const empresaInfo = dadosEmpresaItem.empresa || dadosEmpresaItem

        const empresa: EmpresaEnriquecida = {
          cnpj: empresaInfo.cnpj || cnpj,
          razaoSocial: empresaInfo.razaoSocial || empresaInfo.nomeRazaoSocial || 'Empresa não identificada',
          nomeFantasia: empresaInfo.nomeFantasia || empresaInfo.nomefantasia || null,
          telefones: dadosEmpresaItem.telefones || [],
          emails: dadosEmpresaItem.emails || [],
          socios: [],
          totalContatos: 0
        }

        console.log(`Enriquecimento: Empresa criada:`, empresa)

        // Buscar dados dos sócios
        const sociosData = dadosEmpresaItem.receitaFederal?.socios || dadosEmpresaItem.socios || []
        console.log(`Enriquecimento: Sócios encontrados para ${cnpj}:`, sociosData)

        // Calcular quantos leads serão consumidos (1 para empresa + 1 para cada sócio)
        const leadsParaConsumir = calculateEnriquecimentoLeadsConsumption(sociosData.length)

        // Verificar se ainda tem leads suficientes
        const userAtualizado = await supabase
          .from('view_usuarios_planos')
          .select('*')
          .eq('id', user?.id)
          .single()

        if (userAtualizado.data && !hasAvailableLeads(userAtualizado.data, leadsParaConsumir)) {
          const leadsRestantes = getLeadsBalance(userAtualizado.data)
          console.log(`Enriquecimento: Leads insuficientes. Necessário: ${leadsParaConsumir}, Disponível: ${leadsRestantes}`)
          setStatusEnriquecimento(`Leads insuficientes para continuar. Parando no CNPJ ${cnpj}`)
          break
        }

        // Consumir leads ANTES de fazer as consultas dos sócios
        if (sociosData.length > 0) {
          const consumeResult = await consumeLeads(parseInt(user?.id || '0'), leadsParaConsumir)
          if (!consumeResult.success) {
            console.error('Erro ao consumir leads:', consumeResult.error)
            setStatusEnriquecimento(`Erro ao processar ${cnpj}`)
            continue
          }
          setLeadsConsumidosEnriquecimento(prev => prev + leadsParaConsumir)
        }

        if (sociosData.length > 0) {
          for (const socio of sociosData) {
            const cpfSocio = socio.cpfCnpj || socio.cpf
            if (cpfSocio && cpfSocio.toString().replace(/\D/g, '').length === 11) { // CPF tem 11 dígitos
              const nomeSocio = socio.nomeRazaoSocial || socio.nome || 'Sócio não identificado'
              setStatusEnriquecimento(`Consultando sócio: ${nomeSocio}`)
              console.log(`Enriquecimento: Buscando dados do sócio ${nomeSocio} - CPF: ${cpfSocio}`)

              const dadosSocio = await buscarDadosSocio(cpfSocio)
              console.log(`Enriquecimento: Dados do sócio ${nomeSocio}:`, dadosSocio)

              // A API pode retornar um array ou objeto para CPF também
              const dadosSocioItem = Array.isArray(dadosSocio) ? dadosSocio[0] : dadosSocio

              if (dadosSocioItem && (dadosSocioItem.pessoa || dadosSocioItem.nome)) {
                const pessoaInfo = dadosSocioItem.pessoa || dadosSocioItem

                empresa.socios.push({
                  cpfCnpj: cpfSocio,
                  nome: pessoaInfo.nome || nomeSocio,
                  participacao: socio.participacao || '0%',
                  telefones: dadosSocioItem.telefones || [],
                  emails: dadosSocioItem.emails || []
                })
              }
            }
          }
        }

        // Calcular total de contatos
        empresa.totalContatos = empresa.telefones.length +
                               empresa.socios.reduce((total, socio) => total + socio.telefones.length, 0)

        empresasEnriquecidas.push(empresa)

        // Cadastrar contatos no banco
        await cadastrarContatos(empresa)
      } else {
        console.log(`Enriquecimento: Dados não encontrados para CNPJ ${cnpj}`)
      }

      } catch (error) {
        console.error(`Enriquecimento: Erro ao processar CNPJ ${cnpj}:`, error)
        setStatusEnriquecimento(`Erro ao processar ${cnpj}`)
      }

      setProgressoEnriquecimento(((i + 1) / cnpjs.length) * 100)
    }

    setEmpresasEnriquecidas(empresasEnriquecidas)
    setEnriquecendo(false)
    setEtapaAtual('resultados')
  }

  const upsertContato = async (contato: any, tipo: string) => {
    const userId = parseInt(user?.id || '0')

    // Verificar se já existe um lead com este user_id e telefone
    const { data: existingLead, error: searchError } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', userId)
      .eq('telefone', contato.telefone)
      .maybeSingle()

    if (searchError && searchError.code !== 'PGRST116') {
      console.error(`Cadastro: Erro ao buscar lead existente (${tipo}):`, searchError)
      return
    }

    if (existingLead) {
      // Atualizar lead existente
      console.log(`Cadastro: Atualizando ${tipo} existente:`, contato)
      const { data, error } = await supabase
        .from('leads')
        .update(contato)
        .eq('id', existingLead.id)

      if (error) {
        console.error(`Cadastro: Erro ao atualizar ${tipo}:`, error)
      } else {
        console.log(`Cadastro: ${tipo} atualizado com sucesso:`, data)
      }
    } else {
      // Inserir novo lead
      console.log(`Cadastro: Inserindo novo ${tipo}:`, contato)
      const { data, error } = await supabase.from('leads').insert(contato)

      if (error) {
        console.error(`Cadastro: Erro ao inserir ${tipo}:`, error)
      } else {
        console.log(`Cadastro: ${tipo} inserido com sucesso:`, data)
      }
    }
  }

  const cadastrarContatos = async (empresa: EmpresaEnriquecida) => {
    try {
      console.log('Cadastro: Iniciando cadastro de contatos para empresa:', empresa.razaoSocial)

      // Cadastrar contatos da empresa
      for (const telefone of empresa.telefones) {
        const contatoEmpresa = {
          user_id: parseInt(user?.id || '0'),
          nome_cliente: empresa.razaoSocial,
          numero_formatado: telefone.telefoneFormatado || telefone.telefone,
          email_usuario: empresa.emails[0]?.email || null,
          nome_empresa: empresa.razaoSocial,
          origem: 'Enriquecimento API',
          nome_campanha: nomeCampanha,
          cpf_cnpj: empresa.cnpj
        }

        await upsertContato(contatoEmpresa, 'contato da empresa')
      }

      // Cadastrar contatos dos sócios
      for (const socio of empresa.socios) {
        for (const telefone of socio.telefones) {
          const contatoSocio = {
            user_id: parseInt(user?.id || '0'),
            nome_cliente: socio.nome,
            numero_formatado: telefone.telefoneFormatado || telefone.telefone,
            email_usuario: socio.emails[0]?.email || null,
            nome_empresa: empresa.razaoSocial,
            origem: 'Enriquecimento API',
            nome_campanha: nomeCampanha,
            cpf_cnpj: empresa.cnpj
          }

          await upsertContato(contatoSocio, 'contato do sócio')
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar contatos:', error)
    }
  }


  const reiniciarProcesso = () => {
    setEtapaAtual('upload')
    setArquivo(null)
    setCnpjs([])
    setEmpresasEnriquecidas([])
    setProgressoEnriquecimento(0)
    setStatusEnriquecimento('')
    setNomeCampanha('')
    setLeadsConsumidosEnriquecimento(0)
    // Recarregar dados do usuário para atualizar saldos
    carregarDadosUsuario()
  }

  return (
    <PlanProtection feature="enriquecimentoAPI">
      <div className="space-y-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="h-8 w-8 mr-3 text-blue-600" />
            Enriquecimento com API
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Enriqueça dados de empresas usando CNPJ, consulte na API Datecode e cadastre automaticamente no banco de dados
          </p>
        </div>

        {/* Etapa 1: Upload da Planilha */}
        {etapaAtual === 'upload' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                1. Upload da Planilha de CNPJs
              </h3>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Selecione uma planilha com CNPJs
                      </span>
                      <span className="text-xs text-gray-500">
                        Apenas a primeira coluna será lida (formato Excel)
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              {arquivo && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm text-green-800">
                      Arquivo carregado: {arquivo.name} ({cnpjs.length} CNPJs encontrados)
                    </span>
                  </div>
                </div>
              )}

              {cnpjs.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Campanha *
                    </label>
                    <input
                      type="text"
                      value={nomeCampanha}
                      onChange={(e) => setNomeCampanha(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Ex: Enriquecimento Dezembro 2024"
                      required
                    />
                  </div>

                  <button
                    onClick={iniciarEnriquecimento}
                    disabled={!nomeCampanha.trim()}
                    className={`px-6 py-2 rounded-lg flex items-center ${
                      nomeCampanha.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Database className="h-5 w-5 mr-2" />
                    Iniciar Enriquecimento
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Etapa 2: Enriquecendo */}
        {etapaAtual === 'enriquecendo' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Database className="h-5 w-5 mr-2 text-blue-600" />
                2. Enriquecendo Dados
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-sm text-blue-800">{statusEnriquecimento}</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressoEnriquecimento}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Progresso: {Math.round(progressoEnriquecimento)}%
              </p>
            </div>
          </div>
        )}

        {/* Etapa 3: Resultados */}
        {etapaAtual === 'resultados' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  3. Resultados do Enriquecimento
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Building className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Empresas Processadas</p>
                        <p className="text-2xl font-bold text-blue-600">{empresasEnriquecidas.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Phone className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Contatos</p>
                        <p className="text-2xl font-bold text-green-600">
                          {empresasEnriquecidas.reduce((total, empresa) => total + empresa.totalContatos, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Sócios Encontrados</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {empresasEnriquecidas.reduce((total, empresa) => total + empresa.socios.length, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Database className="h-8 w-8 text-red-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Leads Consumidos</p>
                        <p className="text-2xl font-bold text-red-600">{leadsConsumidosEnriquecimento}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {empresasEnriquecidas.map((empresa, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{empresa.razaoSocial}</h4>
                          <p className="text-sm text-gray-600">CNPJ: {empresa.cnpj}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {empresa.totalContatos} contatos
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Telefones da Empresa ({empresa.telefones.length})</h5>
                          {empresa.telefones.slice(0, 3).map((tel, i) => (
                            <p key={i} className="text-sm text-gray-600">{tel.telefoneFormatado} - {tel.tipoTelefone}</p>
                          ))}
                          {empresa.telefones.length > 3 && (
                            <p className="text-sm text-gray-500">+{empresa.telefones.length - 3} telefones...</p>
                          )}
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Sócios ({empresa.socios.length})</h5>
                          {empresa.socios.slice(0, 3).map((socio, i) => (
                            <p key={i} className="text-sm text-gray-600">
                              {socio.nome} - {socio.telefones.length} tel(s)
                            </p>
                          ))}
                          {empresa.socios.length > 3 && (
                            <p className="text-sm text-gray-500">+{empresa.socios.length - 3} sócios...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={reiniciarProcesso}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Novo Enriquecimento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlanProtection>
  )
}