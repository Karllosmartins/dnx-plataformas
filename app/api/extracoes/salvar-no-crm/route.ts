import { NextRequest, NextResponse } from 'next/server'
import { supabase, getSupabaseAdmin } from '../../../../lib/supabase'
import AdmZip from 'adm-zip'

export const dynamic = 'force-dynamic'

const API_PROFILE_BASE_URL = 'https://apiprofile.infinititi.com.br'

// Função para autenticar na API Profile
async function authenticateAPI(apiKey: string) {
  const response = await fetch(`${API_PROFILE_BASE_URL}/api/Auth`, {
    method: 'POST',
    headers: {
      'accept': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ apiKey })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Falha na autenticação: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.token
}

// Função para fazer parsing de data brasileira "DD/MM/YYYY"
function parseDataBrasileira(dataStr: string | undefined): Date | null {
  if (!dataStr || dataStr.trim() === '') return null

  try {
    const partes = dataStr.split('/')
    if (partes.length === 3) {
      const [dia, mes, ano] = partes
      return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
    }
  } catch (error) {
    console.error('Erro ao parsear data:', dataStr, error)
  }

  return null
}

// Função para formatar telefone
function formatarTelefone(ddd: string | undefined, numero: string | undefined): string | null {
  if (!ddd || !numero) return null

  const telefoneNumerico = `${ddd}${numero}`.replace(/\D/g, '')

  if (telefoneNumerico.length === 11) {
    return `(${telefoneNumerico.slice(0, 2)}) ${telefoneNumerico.slice(2, 7)}-${telefoneNumerico.slice(7)}`
  } else if (telefoneNumerico.length === 10) {
    return `(${telefoneNumerico.slice(0, 2)}) ${telefoneNumerico.slice(2, 6)}-${telefoneNumerico.slice(6)}`
  }

  return null
}

// Função para parsear CSV em array de objetos
function parseCSV(csvContent: string): Record<string, string>[] {
  const linhas = csvContent.trim().split('\n')

  if (linhas.length < 2) {
    return []
  }

  // Primeira linha = cabeçalho
  const cabecalho = linhas[0].split('\t').map(col => col.trim())

  const dados: Record<string, string>[] = []

  // Processar linhas de dados
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim()
    if (!linha) continue

    const valores = linha.split('\t')
    const obj: Record<string, string> = {}

    cabecalho.forEach((coluna, index) => {
      obj[coluna] = valores[index]?.trim() || ''
    })

    dados.push(obj)
  }

  return dados
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { idExtracaoAPI, userId, apiKey, nomeArquivo } = body

    if (!idExtracaoAPI || !userId || !apiKey) {
      return NextResponse.json({
        error: 'idExtracaoAPI, userId e apiKey são obrigatórios'
      }, { status: 400 })
    }

    // 1. Autenticar na API Profile
    const token = await authenticateAPI(apiKey)

    // 2. Baixar arquivo ZIP
    const downloadResponse = await fetch(
      `${API_PROFILE_BASE_URL}/api/Extracao/DownloadExtracao?idExtracao=${idExtracaoAPI}`,
      {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!downloadResponse.ok) {
      throw new Error(`Erro ao baixar extração: ${downloadResponse.status}`)
    }

    // 3. Obter buffer do ZIP
    const arrayBuffer = await downloadResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4. Extrair arquivos do ZIP
    const zip = new AdmZip(buffer)
    const zipEntries = zip.getEntries()

    let totalSalvos = 0
    let totalDuplicados = 0
    let totalErros = 0

    // 5. Processar cada arquivo CSV no ZIP
    for (const entry of zipEntries) {
      if (!entry.entryName.endsWith('.csv')) continue

      const csvContent = entry.getData().toString('utf8')
      const dados = parseCSV(csvContent)

      if (dados.length === 0) continue

      // Detectar tipo baseado nas colunas
      const primeiroRegistro = dados[0]
      const isCNPJ = 'CNPJ' in primeiroRegistro
      const isSocios = 'cpf' in primeiroRegistro && 'cpfFormatado' in primeiroRegistro
      const isCPF = 'CPF' in primeiroRegistro && !isSocios

      console.log(`📄 Processando arquivo: ${entry.entryName}`)
      console.log(`   Tipo detectado: ${isCNPJ ? 'CNPJ' : isSocios ? 'Sócios' : isCPF ? 'CPF' : 'Desconhecido'}`)
      console.log(`   Total de registros: ${dados.length}`)

      if (isCNPJ) {
        // Processar empresas (CNPJ)
        for (const empresa of dados) {
          try {
            const cnpj = empresa.CNPJ?.replace(/\D/g, '')
            if (!cnpj) {
              totalErros++
              continue
            }

            // Verificar duplicata no leads por CNPJ
            const { data: leadExistente } = await supabase
              .from('leads')
              .select('id')
              .eq('user_id', userId)
              .eq('cpf_cnpj', cnpj)
              .maybeSingle()

            if (leadExistente) {
              totalDuplicados++
              continue
            }

            // Formatar telefones
            const tel1 = formatarTelefone(empresa.CEL1_DDD, empresa.CEL1_NUMERO)
            const tel2 = formatarTelefone(empresa.CEL2_DDD, empresa.CEL2_NUMERO)
            const telFixo1 = formatarTelefone(empresa.FIXO1_DDD, empresa.FIXO1_NUMERO)
            const telefoneParaLead = tel1 || tel2 || telFixo1

            // 1. Criar lead básico
            const { data: novoLead, error: leadError } = await supabase
              .from('leads')
              .insert({
                user_id: userId,
                nome_cliente: empresa.DSNOMERAZAO || empresa.DSNOMEFANTASIA,
                cpf_cnpj: cnpj,
                numero_formatado: telefoneParaLead,
                email_usuario: empresa.DSEMAIL,
                nome_campanha: nomeArquivo,
                origem: 'Extração de Leads - CNPJ',
                ativo: true
              })
              .select()
              .single()

            if (leadError) {
              console.error('Erro ao criar lead CNPJ:', leadError)
              totalErros++
              continue
            }

            // 2. Salvar dados completos da empresa
            const { error: pjError } = await supabase
              .from('extracao_dados_pj')
              .insert({
                lead_id: novoLead.id,
                user_id: userId,
                cnpj,
                ds_nome_razao: empresa.DSNOMERAZAO,
                ds_nome_fantasia: empresa.DSNOMEFANTASIA,
                ds_matriz: empresa.DSMATRIZ,
                dt_abertura: parseDataBrasileira(empresa.DTABERTURA),
                cd_cnae: empresa.CDCNAE,
                descricao_cnae: empresa.DESCRICAO_CNAE,
                cd_njur: empresa.CDNJUR,
                vl_capital_social: empresa.VLCAPITALSOCIAL ? parseFloat(empresa.VLCAPITALSOCIAL) : null,
                nr_funcionarios: empresa.NRFUNCIONARIOS ? parseInt(empresa.NRFUNCIONARIOS) : null,
                nr_funcionarios_grupo: empresa.NRFUNCIONARIOSGRUPO ? parseInt(empresa.NRFUNCIONARIOSGRUPO) : null,
                ds_porte: empresa.DSPORTE,
                vl_faturamento_presumido_anual: empresa.VLFATURAMENTOPRESUMIDOANUAL ? parseFloat(empresa.VLFATURAMENTOPRESUMIDOANUAL) : null,
                tipo_pj: empresa.TIPO_PJ,
                nr_proprietarios: empresa.NRPROPRIETARIOS ? parseInt(empresa.NRPROPRIETARIOS) : null,
                risco: empresa.RISCO,
                score_pj: empresa.SCOREPJ ? parseInt(empresa.SCOREPJ) : null,
                ds_endereco: empresa.DSENDERECO,
                ds_tipo: empresa.DSTIPO,
                ds_titulo: empresa.DSTITULO,
                ds_logradouro: empresa.DSLOGRADOURO,
                ds_numero: empresa.DSNUMERO,
                ds_complemento: empresa.DSCOMPLEMENTO,
                ds_bairro: empresa.DSBAIRRO,
                ds_cidade: empresa.DSCIDADE,
                ds_uf: empresa.DSUF,
                ds_cep: empresa.DSCEP,
                cel1_ddd: empresa.CEL1_DDD,
                cel1_numero: empresa.CEL1_NUMERO,
                cel1_operadora: empresa.CEL1_DSOPERADORA,
                cel2_ddd: empresa.CEL2_DDD,
                cel2_numero: empresa.CEL2_NUMERO,
                cel2_operadora: empresa.CEL2_DSOPERADORA,
                fixo1_ddd: empresa.FIXO1_DDD,
                fixo1_numero: empresa.FIXO1_NUMERO,
                fixo2_ddd: empresa.FIXO2_DDD,
                fixo2_numero: empresa.FIXO2_NUMERO,
                ds_email: empresa.DSEMAIL
              })

            if (pjError) {
              console.error('Erro ao salvar dados PJ:', pjError)
              // Lead criado mas dados completos não - ainda conta como sucesso
            }

            totalSalvos++
          } catch (error) {
            console.error('Erro ao processar empresa:', error)
            totalErros++
          }
        }
      } else if (isSocios) {
        // Processar sócios (vinculados ao CNPJ)
        for (const socio of dados) {
          try {
            const cnpjEmpresa = socio.CNPJ?.replace(/\D/g, '')
            const cpfSocio = socio.cpf?.replace(/\D/g, '')

            if (!cnpjEmpresa || !cpfSocio) {
              totalErros++
              continue
            }

            // Buscar a empresa (lead) pelo CNPJ
            const { data: leadEmpresa } = await supabase
              .from('leads')
              .select('id')
              .eq('user_id', userId)
              .eq('cpf_cnpj', cnpjEmpresa)
              .maybeSingle()

            if (!leadEmpresa) {
              // Empresa não encontrada, pular sócio
              continue
            }

            // Buscar extracao_dados_pj pelo lead_id
            const { data: dadosPJ } = await supabase
              .from('extracao_dados_pj')
              .select('id')
              .eq('lead_id', leadEmpresa.id)
              .maybeSingle()

            if (!dadosPJ) {
              continue
            }

            // Verificar se já existe lead para este sócio (CPF)
            const { data: leadSocio } = await supabase
              .from('leads')
              .select('id')
              .eq('user_id', userId)
              .eq('cpf_cnpj', cpfSocio)
              .maybeSingle()

            let leadSocioId = leadSocio?.id || null

            // Se não existe, criar lead para o sócio
            if (!leadSocio) {
              const telSocio = formatarTelefone(socio.CEL1_DDD, socio.CEL1_NUMERO) || formatarTelefone(socio.CEL2_DDD, socio.CEL2_NUMERO)

              const { data: novoLeadSocio } = await supabase
                .from('leads')
                .insert({
                  user_id: userId,
                  nome_cliente: socio.nome,
                  cpf_cnpj: cpfSocio,
                  numero_formatado: telSocio,
                  email_usuario: socio.DSEMAIL,
                  nome_campanha: `${nomeArquivo} - Sócio`,
                  origem: 'Extração de Leads - Sócio CNPJ',
                  ativo: true
                })
                .select()
                .maybeSingle()

              if (novoLeadSocio) {
                leadSocioId = novoLeadSocio.id
              }
            }

            // Salvar dados do sócio
            const { error: socioError } = await supabase
              .from('extracao_dados_socios')
              .insert({
                extracao_pj_id: dadosPJ.id,
                lead_id: leadSocioId,
                user_id: userId,
                cnpj_empresa: cnpjEmpresa,
                cpf: cpfSocio,
                cpf_formatado: socio.cpfFormatado,
                nome: socio.nome,
                data_nascimento: parseDataBrasileira(socio.dataNascimento),
                participacao: socio.participacao ? parseFloat(socio.participacao) : null,
                qualificacao: socio.qualificacao,
                data_entrada: parseDataBrasileira(socio.dataEntrada),
                ds_email: socio.DSEMAIL,
                cel1_ddd: socio.CEL1_DDD,
                cel1_numero: socio.CEL1_NUMERO,
                cel1_operadora: socio.CEL1_DSOPERADORA,
                cel2_ddd: socio.CEL2_DDD,
                cel2_numero: socio.CEL2_NUMERO,
                cel2_operadora: socio.CEL2_DSOPERADORA
              })

            if (socioError) {
              console.error('Erro ao salvar sócio:', socioError)
            }

          } catch (error) {
            console.error('Erro ao processar sócio:', error)
            totalErros++
          }
        }
      } else if (isCPF) {
        // Processar pessoas físicas (CPF)
        for (const pessoa of dados) {
          try {
            const cpf = pessoa.CPF?.replace(/\D/g, '')
            if (!cpf) {
              totalErros++
              continue
            }

            // Verificar duplicata no leads por CPF
            const { data: leadExistente } = await supabase
              .from('leads')
              .select('id')
              .eq('user_id', userId)
              .eq('cpf_cnpj', cpf)
              .maybeSingle()

            if (leadExistente) {
              totalDuplicados++
              continue
            }

            // Formatar telefones
            const tel1 = formatarTelefone(pessoa.CEL1_DDD, pessoa.CEL1_NUMERO)
            const tel2 = formatarTelefone(pessoa.CEL2_DDD, pessoa.CEL2_NUMERO)
            const telFixo1 = formatarTelefone(pessoa.FIXO1_DDD, pessoa.FIXO1_NUMERO)
            const telefoneParaLead = tel1 || tel2 || telFixo1

            // 1. Criar lead básico
            const { data: novoLead, error: leadError } = await supabase
              .from('leads')
              .insert({
                user_id: userId,
                nome_cliente: pessoa.DSNOME,
                cpf_cnpj: cpf,
                numero_formatado: telefoneParaLead,
                email_usuario: pessoa.DSEMAIL,
                nome_campanha: nomeArquivo,
                origem: 'Extração de Leads - CPF',
                ativo: true
              })
              .select()
              .single()

            if (leadError) {
              console.error('Erro ao criar lead CPF:', leadError)
              totalErros++
              continue
            }

            // 2. Salvar dados completos da pessoa
            const { error: pfError } = await supabase
              .from('extracao_dados_pf')
              .insert({
                lead_id: novoLead.id,
                user_id: userId,
                cpf,
                ds_nome: pessoa.DSNOME,
                ds_nome_mae: pessoa.DSNOMEMAE,
                ds_nasc: parseDataBrasileira(pessoa.DSNASC),
                idade: pessoa.IDADE ? parseInt(pessoa.IDADE) : null,
                ds_estado_civil: pessoa.DSESTADOCIVIL,
                nr_dependentes: pessoa.NRDEPENDENTES ? parseInt(pessoa.NRDEPENDENTES) : null,
                cd_cbo: pessoa.CDCBO,
                ds_sexo: pessoa.DSSEXO,
                ds_classe_social: pessoa.DSCLASSESOCIAL,
                vl_renda: pessoa.VLRENDA ? parseFloat(pessoa.VLRENDA) : null,
                score: pessoa.SCORE ? parseInt(pessoa.SCORE) : null,
                score_descr: pessoa.SCORE_DESCR,
                ds_endereco: pessoa.DSENDERECO,
                ds_tipo: pessoa.DSTIPO,
                ds_titulo: pessoa.DSTITULO,
                ds_logradouro: pessoa.DSLOGRADOURO,
                ds_numero: pessoa.DSNUMERO,
                ds_complemento: pessoa.DSCOMPLEMENTO,
                ds_bairro: pessoa.DSBAIRRO,
                ds_cidade: pessoa.DSCIDADE,
                ds_uf: pessoa.DSUF,
                ds_cep: pessoa.DSCEP,
                descricao_cbo: pessoa.DESCRICAO_CBO,
                cel1_ddd: pessoa.CEL1_DDD,
                cel1_numero: pessoa.CEL1_NUMERO,
                cel1_operadora: pessoa.CEL1_DSOPERADORA,
                cel2_ddd: pessoa.CEL2_DDD,
                cel2_numero: pessoa.CEL2_NUMERO,
                cel2_operadora: pessoa.CEL2_DSOPERADORA,
                fixo1_ddd: pessoa.FIXO1_DDD,
                fixo1_numero: pessoa.FIXO1_NUMERO,
                fixo2_ddd: pessoa.FIXO2_DDD,
                fixo2_numero: pessoa.FIXO2_NUMERO,
                ds_email: pessoa.DSEMAIL
              })

            if (pfError) {
              console.error('Erro ao salvar dados PF:', pfError)
              // Lead criado mas dados completos não - ainda conta como sucesso
            }

            totalSalvos++
          } catch (error) {
            console.error('Erro ao processar pessoa:', error)
            totalErros++
          }
        }
      }
    }

    return NextResponse.json({
      sucesso: true,
      totalSalvos,
      totalDuplicados,
      totalErros
    })

  } catch (error) {
    console.error('Erro ao salvar extração no CRM:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro ao salvar no CRM'
    }, { status: 500 })
  }
}