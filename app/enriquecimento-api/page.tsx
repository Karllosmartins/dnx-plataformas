'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthWrapper'
import PlanProtection from '../../components/PlanProtection'
import { supabase } from '../../lib/supabase'
import {
  Upload,
  Database,
  Users,
  Building,
  Phone,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Bot,
  MessageSquare,
  Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { WhatsAppOfficialAPI, WhatsAppOfficialTemplate } from '../../lib/whatsapp-official-api'

interface InstanciaWhatsApp {
  id: number
  nome: string
  numero_telefone: string
  status: string
}

interface TemplateAprovado {
  id: number
  nome: string
  conteudo: string
  variaveis: string[]
}

interface InstanciaCompleta {
  id: number
  instancia: string
  is_official_api: boolean
  waba_id: string | null
  apikey: string | null
}

interface AgenteIA {
  id: number
  nome: string
  funcao: string
}

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
  const [instanciaWhatsApp, setInstanciaWhatsApp] = useState('')
  const [templateAprovado, setTemplateAprovado] = useState('')
  const [variavel1, setVariavel1] = useState('nome')
  const [variavel2, setVariavel2] = useState('empresa')
  const [instrucaoAdicional, setInstrucaoAdicional] = useState('')
  const [agenteIA, setAgenteIA] = useState('')

  // Estados dos dados
  const [instancias, setInstancias] = useState<InstanciaWhatsApp[]>([])
  const [instanciasCompletas, setInstanciasCompletas] = useState<InstanciaCompleta[]>([])
  const [templates, setTemplates] = useState<TemplateAprovado[]>([])
  const [templatesOficiais, setTemplatesOficiais] = useState<WhatsAppOfficialTemplate[]>([])
  const [agentes, setAgentes] = useState<AgenteIA[]>([])

  // Estados do processo
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [cnpjs, setCnpjs] = useState<string[]>([])
  const [empresasEnriquecidas, setEmpresasEnriquecidas] = useState<EmpresaEnriquecida[]>([])

  // Estados de controle
  const [etapaAtual, setEtapaAtual] = useState<'upload' | 'enriquecendo' | 'resultados' | 'disparo'>('upload')
  const [enriquecendo, setEnriquecendo] = useState(false)
  const [progressoEnriquecimento, setProgressoEnriquecimento] = useState(0)
  const [statusEnriquecimento, setStatusEnriquecimento] = useState('')
  const [enviandoDisparo, setEnviandoDisparo] = useState(false)

  useEffect(() => {
    if (user) {
      carregarInstancias()
      carregarAgentes()
      // Templates são carregados quando uma instância é selecionada
    }
  }, [user])

  const carregarInstancias = async () => {
    try {
      const { data, error } = await supabase
        .from('instancia_whtats')
        .select('id, instancia, is_official_api, waba_id, apikey')
        .eq('user_id', parseInt(user?.id || '0'))
        .order('created_at', { ascending: false })

      if (error) throw error

      // Armazenar dados completos das instâncias
      setInstanciasCompletas(data || [])

      // Converter para formato esperado da interface
      const instanciasFormatadas = data?.map(inst => ({
        id: inst.id,
        nome: inst.instancia,
        numero_telefone: '', // Não usado neste contexto
        status: 'connected'
      })) || []

      setInstancias(instanciasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    }
  }

  const carregarTemplates = async (instanciaId: string) => {
    const instanciaCompleta = instanciasCompletas.find(i => i.instancia === instanciaId)

    if (!instanciaCompleta?.is_official_api || !instanciaCompleta.waba_id || !instanciaCompleta.apikey) {
      // Se não é API oficial, usar dados mockados
      const templatesMock: TemplateAprovado[] = [
        {
          id: 1,
          nome: 'Template Enriquecimento',
          conteudo: 'Olá {{var1}}, da empresa {{var2}}! Temos uma oportunidade para você.',
          variaveis: ['var1', 'var2']
        }
      ]
      setTemplates(templatesMock)
      return
    }

    try {
      const api = new WhatsAppOfficialAPI(instanciaCompleta.apikey, instanciaCompleta.waba_id)
      const templates = await api.getTemplates()
      setTemplatesOficiais(templates)

      // Converter para formato esperado
      const templatesFormatados = templates.map((template, index) => ({
        id: index + 1,
        nome: template.name,
        conteudo: template.components.find(c => c.type === 'BODY')?.text || '',
        variaveis: ['var1', 'var2'] // Simplificado por enquanto
      }))

      setTemplates(templatesFormatados)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      // Fallback para dados mockados em caso de erro
      const templatesMock: TemplateAprovado[] = [
        {
          id: 1,
          nome: 'Template Enriquecimento',
          conteudo: 'Olá {{var1}}, da empresa {{var2}}! Temos uma oportunidade para você.',
          variaveis: ['var1', 'var2']
        }
      ]
      setTemplates(templatesMock)
    }
  }

  const carregarAgentes = async () => {
    try {
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('user_id', user?.id)
        .eq('estagio', 'ativo')

      if (error) throw error
      setAgentes(data || [])
    } catch (error) {
      console.error('Erro ao carregar agentes:', error)
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
          cnpj: cnpj
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
          cpf: cpf
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

    setEnriquecendo(true)
    setEtapaAtual('enriquecendo')
    setProgressoEnriquecimento(0)
    setStatusEnriquecimento('Iniciando enriquecimento...')

    console.log('Enriquecimento: Estado atualizado, iniciando loop de CNPJs')

    const empresasEnriquecidas: EmpresaEnriquecida[] = []

    for (let i = 0; i < cnpjs.length; i++) {
      const cnpj = cnpjs[i]
      setStatusEnriquecimento(`Consultando empresa ${i + 1}/${cnpjs.length}: ${cnpj}`)

      // Buscar dados da empresa
      const dadosEmpresa = await buscarDadosEmpresa(cnpj)

      if (dadosEmpresa && dadosEmpresa.empresa) {
        const empresa: EmpresaEnriquecida = {
          cnpj: dadosEmpresa.empresa.cnpj,
          razaoSocial: dadosEmpresa.empresa.razaoSocial,
          nomeFantasia: dadosEmpresa.empresa.nomefantasia,
          telefones: dadosEmpresa.telefones || [],
          emails: dadosEmpresa.emails || [],
          socios: [],
          totalContatos: 0
        }

        // Buscar dados dos sócios
        if (dadosEmpresa.receitaFederal?.socios) {
          for (const socio of dadosEmpresa.receitaFederal.socios) {
            if (socio.cpfCnpj && socio.cpfCnpj.length === 11) { // CPF tem 11 dígitos
              setStatusEnriquecimento(`Consultando sócio: ${socio.nomeRazaoSocial}`)

              const dadosSocio = await buscarDadosSocio(socio.cpfCnpj)

              if (dadosSocio && dadosSocio.pessoa) {
                empresa.socios.push({
                  cpfCnpj: socio.cpfCnpj,
                  nome: dadosSocio.pessoa.nome,
                  participacao: socio.participacao,
                  telefones: dadosSocio.telefones || [],
                  emails: dadosSocio.emails || []
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
      }

      setProgressoEnriquecimento(((i + 1) / cnpjs.length) * 100)
    }

    setEmpresasEnriquecidas(empresasEnriquecidas)
    setEnriquecendo(false)
    setEtapaAtual('resultados')
  }

  const cadastrarContatos = async (empresa: EmpresaEnriquecida) => {
    try {
      // Cadastrar contatos da empresa
      for (const telefone of empresa.telefones) {
        await supabase.from('leads').insert({
          user_id: user?.id,
          nome: empresa.razaoSocial,
          telefone: telefone.telefoneFormatado,
          email: empresa.emails[0]?.email || null,
          empresa: empresa.razaoSocial,
          cnpj: empresa.cnpj,
          tipo_pessoa: 'PJ',
          origem: 'Enriquecimento API',
          nome_campanha: nomeCampanha,
          observacoes: `Telefone ${telefone.tipoTelefone} da empresa`
        })
      }

      // Cadastrar contatos dos sócios
      for (const socio of empresa.socios) {
        for (const telefone of socio.telefones) {
          await supabase.from('leads').insert({
            user_id: user?.id,
            nome: socio.nome,
            telefone: telefone.telefoneFormatado,
            email: socio.emails[0]?.email || null,
            empresa: empresa.razaoSocial,
            cnpj: empresa.cnpj,
            cpf: socio.cpfCnpj,
            tipo_pessoa: 'PF',
            origem: 'Enriquecimento API',
            nome_campanha: nomeCampanha,
            observacoes: `Sócio da empresa ${empresa.razaoSocial} - Participação: ${socio.participacao}%`
          })
        }
      }
    } catch (error) {
      console.error('Erro ao cadastrar contatos:', error)
    }
  }

  const iniciarDisparo = async () => {
    if (!instanciaWhatsApp || !templateAprovado) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }

    setEnviandoDisparo(true)

    try {
      // Buscar contatos da campanha no banco
      const { data: contatos, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user?.id)
        .eq('nome_campanha', nomeCampanha)
        .eq('origem', 'Enriquecimento API')

      if (error) throw error

      if (!contatos || contatos.length === 0) {
        alert('Nenhum contato encontrado para esta campanha.')
        return
      }

      // Preparar dados para o webhook
      const instancia = instancias.find(i => i.id.toString() === instanciaWhatsApp)
      const template = templates.find(t => t.id.toString() === templateAprovado)

      const webhookData = {
        campanha: nomeCampanha,
        instancia: instancia?.nome,
        template: template?.nome,
        variavel1: variavel1,
        variavel2: variavel2,
        instrucaoAdicional: instrucaoAdicional,
        agente: agenteIA,
        contatos: contatos.map(contato => ({
          nome: contato.nome,
          telefone: contato.telefone,
          email: contato.email,
          empresa: contato.empresa,
          cnpj: contato.cnpj,
          cpf: contato.cpf,
          tipo_pessoa: contato.tipo_pessoa,
          observacoes: contato.observacoes
        }))
      }

      console.log('Enviando disparo para webhook:', webhookData)

      // Enviar para o webhook
      const response = await fetch('https://webhooks.dnmarketing.com.br/webhook/49c846c0-3853-4dc9-85db-0824cd1d7c6e', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      })

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status}`)
      }

      const result = await response.json()
      console.log('Resposta do webhook:', result)

      alert(`Disparo iniciado com sucesso! ${contatos.length} contatos serão processados.`)

      // Voltar para início após sucesso
      setTimeout(() => {
        reiniciarProcesso()
      }, 2000)

    } catch (error) {
      console.error('Erro ao iniciar disparo:', error)
      alert('Erro ao iniciar disparo. Verifique os logs para mais detalhes.')
    } finally {
      setEnviandoDisparo(false)
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
    setInstanciaWhatsApp('')
    setTemplateAprovado('')
    setVariavel1('nome')
    setVariavel2('empresa')
    setInstrucaoAdicional('')
    setAgenteIA('')
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
            Enriqueça dados de empresas usando CNPJ e envie mensagens personalizadas
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    onClick={() => setEtapaAtual('disparo')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Configurar Disparo
                  </button>
                  <button
                    onClick={reiniciarProcesso}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Novo Enriquecimento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Etapa 4: Configuração do Disparo */}
        {etapaAtual === 'disparo' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Send className="h-5 w-5 mr-2 text-green-600" />
                4. Configurar Disparo
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Campanha: {nomeCampanha}</h4>
                    <p className="text-sm text-blue-700">
                      {empresasEnriquecidas.reduce((total, emp) => total + emp.totalContatos, 0)} contatos enriquecidos
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instância WhatsApp *
                    </label>
                    <select
                      value={instanciaWhatsApp}
                      onChange={(e) => {
                        setInstanciaWhatsApp(e.target.value)
                        // Carregar templates quando instância for selecionada
                        if (e.target.value) {
                          const instancia = instancias.find(i => i.id.toString() === e.target.value)
                          if (instancia) {
                            carregarTemplates(instancia.nome)
                          }
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Selecione uma instância</option>
                      {instancias.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Aprovado *
                    </label>
                    <select
                      value={templateAprovado}
                      onChange={(e) => setTemplateAprovado(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Selecione um template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variável 1
                    </label>
                    <select
                      value={variavel1}
                      onChange={(e) => setVariavel1(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="nome">Nome da Pessoa</option>
                      <option value="empresa">Nome da Empresa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variável 2
                    </label>
                    <select
                      value={variavel2}
                      onChange={(e) => setVariavel2(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="empresa">Nome da Empresa</option>
                      <option value="nome">Nome da Pessoa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agente para Atendimento
                    </label>
                    <select
                      value={agenteIA}
                      onChange={(e) => setAgenteIA(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Selecione um agente (opcional)</option>
                      {agentes.map((agente) => (
                        <option key={agente.id} value={agente.id}>
                          {agente.nome} - {agente.funcao}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrução Adicional (Opcional)
                </label>
                <textarea
                  value={instrucaoAdicional}
                  onChange={(e) => setInstrucaoAdicional(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Instruções especiais para o agente..."
                />
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={iniciarDisparo}
                  disabled={enviandoDisparo || !nomeCampanha || !instanciaWhatsApp || !templateAprovado}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {enviandoDisparo ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-5 w-5 mr-2" />
                  )}
                  {enviandoDisparo ? 'Enviando...' : 'Iniciar Disparo'}
                </button>
                <button
                  onClick={() => setEtapaAtual('resultados')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Voltar aos Resultados
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlanProtection>
  )
}