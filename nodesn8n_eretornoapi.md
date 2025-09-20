{
  "nodes": [
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.datecode.com.br/v2/dados/consulta",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpBasicAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "tipoPessoa",
              "value": "PJ"
            },
            {
              "name": "document",
              "value": "=60489014000142"
            }
          ]
        },
        "options": {
          "redirect": {
            "redirect": {}
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        208,
        0
      ],
      "id": "3a927875-982e-472e-a3f3-23367b075da3",
      "name": "API  de busca Datacode",
      "credentials": {
        "httpBasicAuth": {
          "id": "pV3i4TUDzIuf3aYm",
          "name": "Unnamed credential"
        }
      }
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "17dd9bba-ea96-45da-8bf8-e6e4859742f4",
              "name": "telefones",
              "value": "={{ $json.telefones }}",
              "type": "array"
            },
            {
              "id": "b916fed2-64f8-469f-b533-8a5f77514e01",
              "name": "emails",
              "value": "={{ $json.emails }}",
              "type": "array"
            },
            {
              "id": "6984679e-7c41-473f-ad94-932badc02859",
              "name": "socios",
              "value": "={{ $json.receitaFederal.socios }}",
              "type": "array"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        400,
        0
      ],
      "id": "e10e1e4a-a3be-4fb4-b211-a9a2d0290cdf",
      "name": "Separa da socios e dados"
    },
    {
      "parameters": {
        "fieldToSplitOut": "socios",
        "options": {}
      },
      "type": "n8n-nodes-base.splitOut",
      "typeVersion": 1,
      "position": [
        576,
        0
      ],
      "id": "319debbc-3058-49ef-88f1-d59d4f9de186",
      "name": "Split Out"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.datecode.com.br/v2/dados/consulta",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpBasicAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "tipoPessoa",
              "value": "PF"
            },
            {
              "name": "document",
              "value": "={{ $json.cpfCnpj }}"
            }
          ]
        },
        "options": {
          "redirect": {
            "redirect": {}
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        768,
        0
      ],
      "id": "94ddec0b-fb83-479b-a17e-d041e51f5ee4",
      "name": "API  de busca Datacode1",
      "credentials": {
        "httpBasicAuth": {
          "id": "pV3i4TUDzIuf3aYm",
          "name": "Unnamed credential"
        }
      }
    }
  ],
  "connections": {
    "API  de busca Datacode": {
      "main": [
        [
          {
            "node": "Separa da socios e dados",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Separa da socios e dados": {
      "main": [
        [
          {
            "node": "Split Out",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split Out": {
      "main": [
        [
          {
            "node": "API  de busca Datacode1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "8a05fc78259df59f189257d963aa524f06c5b41879917b1259975ab664fbb533"
  }
}


retorno do cnpj: 
[
  {
    "msg": "Consulta realizada com sucesso.",
    "empresa": {
      "cnpj": "60489014000142",
      "cnpjFormatado": "60.489.014/0001-42",
      "razaoSocial": "MY SELLERS IA EM VENDAS LTDA",
      "nomefantasia": null,
      "dataAbertura": "22/04/2025",
      "cnae": "6202300 - Desenvolvimento e licenciamento de programas de computador customizáveis",
      "porte": "DEMAIS",
      "codIbge": null,
      "nJur": "2062 - Sociedade Empresária Limitada ",
      "faturamentoPresumidoAnual": "110000",
      "score": "300",
      "risco": "ALTO RISCO"
    },
    "telefones": [
      {
        "ddd": "51",
        "telefone": "999022949",
        "telefoneFormatado": "(51) 99902-2949",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 1
      }
    ],
    "enderecos": [],
    "emails": [],
    "receitaFederal": {
      "cnpj": "60489014000142",
      "cnpjFormatado": "60.489.014/0001-42",
      "dataAbertura": "22/04/2025",
      "razaoSocial": "MY SELLERS IA EM VENDAS LTDA",
      "nomeFantasia": null,
      "descricaoMatriz": "MATRIZ",
      "porte": "DEMAIS",
      "nJurCod": "2062",
      "nJurDesc": "Sociedade Empresária Limitada ",
      "capitalSocial": "10000",
      "situacaoCadastral": "ATIVA",
      "digitoVerificador": null,
      "dataHora": null,
      "codControle": null,
      "situacaoCadastralMotivo": null,
      "situacaoEspecial": null,
      "situacaoEspecialData": null,
      "enteFederativoResponsavel": null,
      "cnaeCod": "6202300",
      "cnaeDesc": "Desenvolvimento e licenciamento de programas de computador customizáveis",
      "cnaesSecundarios": [
        {
          "cnaeCod": "6311900",
          "cnaeDesc": "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet"
        },
        {
          "cnaeCod": "6201502",
          "cnaeDesc": "Web design"
        },
        {
          "cnaeCod": "6203100",
          "cnaeDesc": "Desenvolvimento e licenciamento de programas de computador não-customizáveis"
        },
        {
          "cnaeCod": "6201501",
          "cnaeDesc": "Desenvolvimento de programas de computador sob encomenda"
        }
      ],
      "socios": [
        {
          "cpfCnpj": "02382957026",
          "nomeRazaoSocial": "MARCELO FULBER",
          "nomeFantasia": null,
          "dataNascimentoAbertura": "24/06/1992",
          "participacao": "33.33",
          "dataEntrada": "22/04/2025",
          "qualificacaoCod": "49",
          "qualificacaoDesc": "Sócio-Administrador",
          "paisOrigemCod": null,
          "paisOrigemDesc": null,
          "representanteLegal": null
        },
        {
          "cpfCnpj": "75184583149",
          "nomeRazaoSocial": "DYANDERSON KARLLOS MARTINS DE ALMEIDA",
          "nomeFantasia": null,
          "dataNascimentoAbertura": "04/03/1994",
          "participacao": "33.33",
          "dataEntrada": "22/04/2025",
          "qualificacaoCod": "49",
          "qualificacaoDesc": "Sócio-Administrador",
          "paisOrigemCod": null,
          "paisOrigemDesc": null,
          "representanteLegal": null
        },
        {
          "cpfCnpj": "99061759072",
          "nomeRazaoSocial": "ALBER MARTINS GUEDES",
          "nomeFantasia": null,
          "dataNascimentoAbertura": "27/05/1981",
          "participacao": "0.0",
          "dataEntrada": "22/04/2025",
          "qualificacaoCod": "05",
          "qualificacaoDesc": "Administrador",
          "paisOrigemCod": null,
          "paisOrigemDesc": null,
          "representanteLegal": null
        },
        {
          "cpfCnpj": "52104265000133",
          "nomeRazaoSocial": "GUEDES PARTICIPACOES LTDA",
          "nomeFantasia": null,
          "dataNascimentoAbertura": "06/09/2023",
          "participacao": "33.33",
          "dataEntrada": "22/04/2025",
          "qualificacaoCod": "22",
          "qualificacaoDesc": "Sócio",
          "paisOrigemCod": null,
          "paisOrigemDesc": null,
          "representanteLegal": {
            "cpf": "99061759072",
            "nome": "ALBER MARTINS GUEDES",
            "qualificacaoCod": "05",
            "qualificacaoDesc": "Administrador"
          }
        }
      ]
    },
    "funcionarios": [],
    "veiculos": []
  }
]

retorno do cpj dos socios: 
[
  {
    "msg": "Consulta realizada com sucesso.",
    "pessoa": {
      "cpfFormatado": "023.829.570-26",
      "sexo": "MASCULINO",
      "nome": "MARCELO FULBER",
      "dataNascimento": "24/06/1992 - Quarta-feira",
      "idade": 33,
      "signo": "CANCER",
      "nomeMae": "MARCIA FULBER"
    },
    "restricoes": {
      "isPep": false,
      "isPepRelacionado": false,
      "isMenorIdade": false,
      "isPossivelAposentado": false,
      "isProfissionalNotorio": false,
      "isFamoso": false,
      "hasOutraRestricao": false
    },
    "telefones": [
      {
        "ddd": "64",
        "telefone": "30521611",
        "telefoneFormatado": "(64) 3052-1611",
        "tipoTelefone": "TELEFONE RESIDENCIAL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 2
      },
      {
        "ddd": "51",
        "telefone": "30531111",
        "telefoneFormatado": "(51) 3053-1111",
        "tipoTelefone": "TELEFONE RESIDENCIAL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 3
      },
      {
        "ddd": "51",
        "telefone": "39902294",
        "telefoneFormatado": "(51) 3990-2294",
        "tipoTelefone": "TELEFONE RESIDENCIAL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 4
      },
      {
        "ddd": "51",
        "telefone": "37133206",
        "telefoneFormatado": "(51) 3713-3206",
        "tipoTelefone": "TELEFONE RESIDENCIAL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 5
      }
    ],
    "enderecos": [
      {
        "endereco": "R DONA FLORA 435 AP 403",
        "tipoLogradouro": "R",
        "tituloLogradouro": "DONA",
        "logradouro": "FLORA",
        "numero": "435",
        "complemento": "AP 403",
        "bairro": "UNIVERSITARIO",
        "cidade": "SANTA CRUZ DO SUL",
        "uf": "RS",
        "cep": "96815640",
        "cepFormatado": "96815-640",
        "qualificacao": 1
      },
      {
        "endereco": "R ROBERTO A HARTUNGS 21 C",
        "tipoLogradouro": "R",
        "tituloLogradouro": "",
        "logradouro": "ROBERTO A HARTUNGS",
        "numero": "21",
        "complemento": "C",
        "bairro": "SENAI",
        "cidade": "SANTA CRUZ DO SUL",
        "uf": "RS",
        "cep": "96845852",
        "cepFormatado": "96845-852",
        "qualificacao": 2
      },
      {
        "endereco": "R ROBERTO A HARTUNGS 21",
        "tipoLogradouro": "R",
        "tituloLogradouro": "",
        "logradouro": "ROBERTO A HARTUNGS",
        "numero": "21",
        "complemento": "",
        "bairro": "SENAI",
        "cidade": "SANTA CRUZ DO SUL",
        "uf": "RS",
        "cep": "96845852",
        "cepFormatado": "96845-852",
        "qualificacao": 3
      }
    ],
    "emails": [
      {
        "email": "MARCELO_7FULBER@HOTMAIL.COM",
        "qualificacao": 1
      },
      {
        "email": "MARCELO.FULBER@AIESEC.NET",
        "qualificacao": 2
      },
      {
        "email": "MARCELO.FULBER2@GMAIL.COM",
        "qualificacao": 3
      }
    ],
    "situacaoCadastral": {
      "cpf": "02382957026",
      "cpfFormatado": "023.829.570-26",
      "situacaoCadastral": "REGULAR",
      "digitoVerificador": "",
      "dataHora": "04/11/2024",
      "codControle": "7ECE.B7A6.9B08.AA89"
    },
    "pessoasLigadas": [
      {
        "cpf": "02382953039",
        "cpfFormatado": "023.829.530-39",
        "nome": "PAULA FULBER",
        "idade": 29,
        "grauParentesco": "IRMA(O)"
      },
      {
        "cpf": "46570063049",
        "cpfFormatado": "465.700.630-49",
        "nome": "MARCIA FULBER",
        "idade": 59,
        "grauParentesco": "MAE"
      }
    ],
    "participacaoEmpresarial": [
      {
        "cnpj": "28245750000223",
        "cnpjFormatado": "28.245.750/0002-23",
        "razaoSocial": "SANTA FIT LTDA",
        "nomeFantasia": "SANTA FIT",
        "participacao": "33.33"
      },
      {
        "cnpj": "24294582000124",
        "cnpjFormatado": "24.294.582/0001-24",
        "razaoSocial": "EM OBRA ADMINISTRACAO DE OBRAS LTDA",
        "nomeFantasia": "EM OBRA",
        "participacao": "33.33"
      },
      {
        "cnpj": "28245750000142",
        "cnpjFormatado": "28.245.750/0001-42",
        "razaoSocial": "SANTA FIT LTDA",
        "nomeFantasia": "SANTA FIT",
        "participacao": "33.33"
      },
      {
        "cnpj": "31288641000117",
        "cnpjFormatado": "31.288.641/0001-17",
        "razaoSocial": "ADM E PRECISO TREINAMENTO EM DESENVOLVIMENTO PROFISSIONAL LTDA",
        "nomeFantasia": null,
        "participacao": "33.33"
      },
      {
        "cnpj": "60489014000142",
        "cnpjFormatado": "60.489.014/0001-42",
        "razaoSocial": "MY SELLERS IA EM VENDAS LTDA",
        "nomeFantasia": null,
        "participacao": "33.33"
      },
      {
        "cnpj": "35094360000184",
        "cnpjFormatado": "35.094.360/0001-84",
        "razaoSocial": "QIRON SERVICOS EM TECNOLOGIA DA INFORMACAO LTDA",
        "nomeFantasia": "QIRON ROBOTICS",
        "participacao": "25.00"
      }
    ],
    "perfilConsumo": {
      "cartaoCredito": "SIM",
      "turismo": "SIM",
      "luxo": "SIM",
      "celular": "SIM",
      "tvCabo": "NÃO",
      "bandaLarga": "SIM",
      "creditoImobiliario": "SIM",
      "ecommerce": "SIM",
      "consignado": "NÃO",
      "celularPosPago": "NÃO",
      "possuiVeiculo": "SIM",
      "compraInternet": "SIM",
      "propensaoCartaoCarrefour": "SIM",
      "propensaoCartaoMarisa": "NÃO",
      "seguroSaude": "SIM",
      "cartaoSupermercado": "NÃO",
      "videoGame": "NÃO",
      "transportePublico": "NÃO",
      "tomadorCredito": "SIM",
      "seguroVida": "SIM",
      "seguroResidencial": "SIM",
      "seguroAuto": "SIM",
      "resgateMilhas": "SIM",
      "previdenciaPrivada": "SIM",
      "perfilTomador": "NÃO",
      "perfilMobile": "SIM",
      "multiplosCartoes": "SIM",
      "investidor": "SIM",
      "internetHighUser": "NÃO",
      "internetBanking": "NÃO",
      "gamesOnline": "NÃO",
      "fitness": "NÃO",
      "creditoScoreFaixa": "BAIXISSIMO RISCO",
      "creditoScore": "952",
      "creditoPessoal": "SIM",
      "clientePremium": "NÃO",
      "celularPrePago": "NÃO",
      "casaPropria": "SIM",
      "cartaoPriventLabel": "SIM",
      "cartaoPrime": "NÃO",
      "cartaoCreditoBv": "NÃO",
      "cacadorDescontos": "NÃO"
    },
    "perfilSociodemografico": {
      "scoreRisco": "BAIXISSIMO RISCO",
      "classe": null,
      "segmento": null,
      "descricao": null,
      "idade": null,
      "estadoCivil": null,
      "regiao": null,
      "escolaridade": null,
      "ocupacao": null,
      "atividadeFinanceira": null,
      "renda": null,
      "rendaPresumida": "8.750,00",
      "cbo": 121005,
      "cboDesc": "Diretor de planejamento estratégico"
    },
    "obito": null,
    "historicoProfissional": [],
    "veiculos": []
  },
  {
    "msg": "Consulta realizada com sucesso.",
    "pessoa": {
      "cpfFormatado": "751.845.831-49",
      "sexo": "MASCULINO",
      "nome": "DYANDERSON KARLLOS MARTINS DE ALMEIDA",
      "dataNascimento": "04/03/1994 - Sexta-feira",
      "idade": 31,
      "signo": "PEIXES",
      "nomeMae": "LUZIENE MARTINS DOS SANTOS ALMEIDA"
    },
    "restricoes": {
      "isPep": false,
      "isPepRelacionado": false,
      "isMenorIdade": false,
      "isPossivelAposentado": false,
      "isProfissionalNotorio": false,
      "isFamoso": false,
      "hasOutraRestricao": false
    },
    "telefones": [
      {
        "ddd": "62",
        "telefone": "996224092",
        "telefoneFormatado": "(62) 99622-4092",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 1
      },
      {
        "ddd": "62",
        "telefone": "991236686",
        "telefoneFormatado": "(62) 99123-6686",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 2
      },
      {
        "ddd": "62",
        "telefone": "39248853",
        "telefoneFormatado": "(62) 3924-8853",
        "tipoTelefone": "TELEFONE RESIDENCIAL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 3
      }
    ],
    "enderecos": [
      {
        "endereco": "R C 119",
        "tipoLogradouro": "R",
        "tituloLogradouro": "",
        "logradouro": "C 119",
        "numero": "",
        "complemento": "",
        "bairro": "JD AMERICA",
        "cidade": "GOIANIA",
        "uf": "GO",
        "cep": "74255370",
        "cepFormatado": "74255-370",
        "qualificacao": 1
      },
      {
        "endereco": "R C 188 459",
        "tipoLogradouro": "R",
        "tituloLogradouro": "",
        "logradouro": "C 188",
        "numero": "459",
        "complemento": "",
        "bairro": "JD AMERICA",
        "cidade": "GOIANIA",
        "uf": "GO",
        "cep": "74265310",
        "cepFormatado": "74265-310",
        "qualificacao": 2
      }
    ],
    "emails": [
      {
        "email": "KARLLOS_DKMA@HOTMAIL.COM",
        "qualificacao": 1
      },
      {
        "email": "DKMA_KABULOSO@HOTMAIL.COM",
        "qualificacao": 2
      }
    ],
    "situacaoCadastral": {
      "cpf": "75184583149",
      "cpfFormatado": "751.845.831-49",
      "situacaoCadastral": "REGULAR",
      "digitoVerificador": "",
      "dataHora": "28/11/2024",
      "codControle": "2860.60A4.1512.85BF"
    },
    "pessoasLigadas": [],
    "participacaoEmpresarial": [
      {
        "cnpj": "60489014000142",
        "cnpjFormatado": "60.489.014/0001-42",
        "razaoSocial": "MY SELLERS IA EM VENDAS LTDA",
        "nomeFantasia": null,
        "participacao": "33.33"
      },
      {
        "cnpj": "43699451000171",
        "cnpjFormatado": "43.699.451/0001-71",
        "razaoSocial": "DYANDERSON KARLLOS MARTINS DE ALMEIDA",
        "nomeFantasia": "DN MARKETING",
        "participacao": "100.00"
      }
    ],
    "perfilConsumo": {
      "cartaoCredito": "SIM",
      "turismo": "NÃO",
      "luxo": "NÃO",
      "celular": "SIM",
      "tvCabo": "NÃO",
      "bandaLarga": "NÃO",
      "creditoImobiliario": "NÃO",
      "ecommerce": "SIM",
      "consignado": "NÃO",
      "celularPosPago": "NÃO",
      "possuiVeiculo": "NÃO",
      "compraInternet": "SIM",
      "propensaoCartaoCarrefour": "NÃO",
      "propensaoCartaoMarisa": "SIM",
      "seguroSaude": "SIM",
      "cartaoSupermercado": "NÃO",
      "videoGame": "NÃO",
      "transportePublico": "SIM",
      "tomadorCredito": "SIM",
      "seguroVida": "SIM",
      "seguroResidencial": "NÃO",
      "seguroAuto": "NÃO",
      "resgateMilhas": "NÃO",
      "previdenciaPrivada": "NÃO",
      "perfilTomador": "NÃO",
      "perfilMobile": "SIM",
      "multiplosCartoes": "SIM",
      "investidor": "SIM",
      "internetHighUser": "NÃO",
      "internetBanking": "NÃO",
      "gamesOnline": "NÃO",
      "fitness": "NÃO",
      "creditoScoreFaixa": "MEDIO RISCO",
      "creditoScore": "291",
      "creditoPessoal": "NÃO",
      "clientePremium": "NÃO",
      "celularPrePago": "SIM",
      "casaPropria": "NÃO",
      "cartaoPriventLabel": "SIM",
      "cartaoPrime": "NÃO",
      "cartaoCreditoBv": "NÃO",
      "cacadorDescontos": "NÃO"
    },
    "perfilSociodemografico": {
      "scoreRisco": "MEDIO RISCO",
      "classe": null,
      "segmento": null,
      "descricao": null,
      "idade": null,
      "estadoCivil": null,
      "regiao": null,
      "escolaridade": null,
      "ocupacao": null,
      "atividadeFinanceira": null,
      "renda": null,
      "rendaPresumida": "8.750,00",
      "cbo": 521110,
      "cboDesc": "Vendedor de comércio varejista"
    },
    "obito": null,
    "historicoProfissional": [
      {
        "cnpj": "45543915027896",
        "cnpjFormatado": "45.543.915/0278-96",
        "razaoSocial": "CARREFOUR COMERCIO E INDUSTRIA LTDA",
        "nomeFantasia": "CARREFOUR",
        "codigoCbo": "411010",
        "descricaoCbo": "Assistente administrativo",
        "mediaSalario": "1.499,01"
      },
      {
        "cnpj": "45543915027896",
        "cnpjFormatado": "45.543.915/0278-96",
        "razaoSocial": "CARREFOUR COMERCIO E INDUSTRIA LTDA",
        "nomeFantasia": "CARREFOUR",
        "codigoCbo": "411010",
        "descricaoCbo": "Assistente administrativo",
        "mediaSalario": "1.400,94"
      },
      {
        "cnpj": "45543915027896",
        "cnpjFormatado": "45.543.915/0278-96",
        "razaoSocial": "CARREFOUR COMERCIO E INDUSTRIA LTDA",
        "nomeFantasia": "CARREFOUR",
        "codigoCbo": "411010",
        "descricaoCbo": "Assistente administrativo",
        "mediaSalario": "1.214,63"
      }
    ],
    "veiculos": []
  },
  {
    "msg": "Consulta realizada com sucesso.",
    "pessoa": {
      "cpfFormatado": "990.617.590-72",
      "sexo": "MASCULINO",
      "nome": "ALBER MARTINS GUEDES",
      "dataNascimento": "27/05/1981 - Quarta-feira",
      "idade": 44,
      "signo": "GEMEOS",
      "nomeMae": "REJANE ANTONIETA M GUEDES"
    },
    "restricoes": {
      "isPep": false,
      "isPepRelacionado": false,
      "isMenorIdade": false,
      "isPossivelAposentado": false,
      "isProfissionalNotorio": false,
      "isFamoso": false,
      "hasOutraRestricao": false
    },
    "telefones": [
      {
        "ddd": "55",
        "telefone": "991539521",
        "telefoneFormatado": "(55) 99153-9521",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 1
      },
      {
        "ddd": "55",
        "telefone": "997185765",
        "telefoneFormatado": "(55) 99718-5765",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 2
      },
      {
        "ddd": "55",
        "telefone": "997173474",
        "telefoneFormatado": "(55) 99717-3474",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 3
      },
      {
        "ddd": "55",
        "telefone": "996504850",
        "telefoneFormatado": "(55) 99650-4850",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 4
      }
    ],
    "enderecos": [
      {
        "endereco": "R GASPAR MARTINS 693",
        "tipoLogradouro": "R",
        "tituloLogradouro": "",
        "logradouro": "GASPAR MARTINS",
        "numero": "693",
        "complemento": "",
        "bairro": "FLORESTA",
        "cidade": "PORTO ALEGRE",
        "uf": "RS",
        "cep": "90220160",
        "cepFormatado": "90220-160",
        "qualificacao": 1
      },
      {
        "endereco": "R QUINZE DE NOVEMBRO 784",
        "tipoLogradouro": "R",
        "tituloLogradouro": "",
        "logradouro": "QUINZE DE NOVEMBRO",
        "numero": "784",
        "complemento": "",
        "bairro": "STA CATARINA",
        "cidade": "CAXIAS DO SUL",
        "uf": "RS",
        "cep": "95032430",
        "cepFormatado": "95032-430",
        "qualificacao": 2
      },
      {
        "endereco": "R GASPAR SILVEIRA MARTINS 693",
        "tipoLogradouro": "R",
        "tituloLogradouro": "",
        "logradouro": "GASPAR SILVEIRA MARTINS",
        "numero": "693",
        "complemento": "",
        "bairro": "MAL RONDON",
        "cidade": "CANOAS",
        "uf": "RS",
        "cep": "92020050",
        "cepFormatado": "92020-050",
        "qualificacao": 3
      }
    ],
    "emails": [
      {
        "email": "ALBERGUEDES@YAHOO.COM.BR",
        "qualificacao": 1
      },
      {
        "email": "ALBERGUEDES@YAHOO.COM",
        "qualificacao": 2
      },
      {
        "email": "ALBER@AGROPLAN-RS.COM",
        "qualificacao": 3
      }
    ],
    "situacaoCadastral": {
      "cpf": "99061759072",
      "cpfFormatado": "990.617.590-72",
      "situacaoCadastral": "REGULAR",
      "digitoVerificador": "",
      "dataHora": "30/11/2024",
      "codControle": "4EE6.5C07.E7A8.7365"
    },
    "pessoasLigadas": [
      {
        "cpf": "56206135004",
        "cpfFormatado": "562.061.350-04",
        "nome": "REJANE ANTONIETA MARTINS GUEDES",
        "idade": 73,
        "grauParentesco": "MAE"
      },
      {
        "cpf": "65275047053",
        "cpfFormatado": "652.750.470-53",
        "nome": "CARLOS ZANINER MARTINS GUEDES",
        "idade": 54,
        "grauParentesco": "IRMA(O)"
      }
    ],
    "participacaoEmpresarial": [
      {
        "cnpj": "52104265000133",
        "cnpjFormatado": "52.104.265/0001-33",
        "razaoSocial": "GUEDES PARTICIPACOES LTDA",
        "nomeFantasia": null,
        "participacao": "50.00"
      },
      {
        "cnpj": "06351479000197",
        "cnpjFormatado": "06.351.479/0001-97",
        "razaoSocial": "GUEDES & MEDINO LTDA",
        "nomeFantasia": null,
        "participacao": "50.00"
      },
      {
        "cnpj": "51320706000171",
        "cnpjFormatado": "51.320.706/0001-71",
        "razaoSocial": "SBBIO HOLDING LTDA.",
        "nomeFantasia": null,
        "participacao": "50.00"
      },
      {
        "cnpj": "13185816000189",
        "cnpjFormatado": "13.185.816/0001-89",
        "razaoSocial": "VITTA PLENA ALIMENTOS LTDA",
        "nomeFantasia": "VITTA PLENA",
        "participacao": "25.00"
      },
      {
        "cnpj": "52041010000179",
        "cnpjFormatado": "52.041.010/0001-79",
        "razaoSocial": "AMG OPERACOES LTDA",
        "nomeFantasia": null,
        "participacao": "100.00"
      },
      {
        "cnpj": "04707330000172",
        "cnpjFormatado": "04.707.330/0001-72",
        "razaoSocial": "ALBER MARTINS GUEDES",
        "nomeFantasia": "RANCHO COLONIAL",
        "participacao": "100.00"
      },
      {
        "cnpj": "53527328000127",
        "cnpjFormatado": "53.527.328/0001-27",
        "razaoSocial": "MG PATRIMONIAL LTDA",
        "nomeFantasia": null,
        "participacao": "100.00"
      },
      {
        "cnpj": "53521119000176",
        "cnpjFormatado": "53.521.119/0001-76",
        "razaoSocial": "FMG BUSINESS LTDA",
        "nomeFantasia": null,
        "participacao": "100.00"
      },
      {
        "cnpj": "15396551000193",
        "cnpjFormatado": "15.396.551/0001-93",
        "razaoSocial": "A ASSOCIACAO A VOZ DO CAMPO",
        "nomeFantasia": "A VOZ DO CAMPO",
        "participacao": "0.0"
      },
      {
        "cnpj": "60489014000142",
        "cnpjFormatado": "60.489.014/0001-42",
        "razaoSocial": "MY SELLERS IA EM VENDAS LTDA",
        "nomeFantasia": null,
        "participacao": "0.0"
      },
      {
        "cnpj": "43874355000112",
        "cnpjFormatado": "43.874.355/0001-12",
        "razaoSocial": "CIA. BRASILEIRA DE BIOTECNOLOGIA E BIOINSUMOS PARTICIPACOES S.A.",
        "nomeFantasia": null,
        "participacao": "0.0"
      }
    ],
    "perfilConsumo": {
      "cartaoCredito": "SIM",
      "turismo": "SIM",
      "luxo": "SIM",
      "celular": "SIM",
      "tvCabo": "NÃO",
      "bandaLarga": "NÃO",
      "creditoImobiliario": "SIM",
      "ecommerce": "SIM",
      "consignado": "NÃO",
      "celularPosPago": "NÃO",
      "possuiVeiculo": "SIM",
      "compraInternet": "SIM",
      "propensaoCartaoCarrefour": "SIM",
      "propensaoCartaoMarisa": "SIM",
      "seguroSaude": "SIM",
      "cartaoSupermercado": "NÃO",
      "videoGame": "NÃO",
      "transportePublico": "NÃO",
      "tomadorCredito": "SIM",
      "seguroVida": "SIM",
      "seguroResidencial": "SIM",
      "seguroAuto": "SIM",
      "resgateMilhas": "SIM",
      "previdenciaPrivada": "SIM",
      "perfilTomador": "SIM",
      "perfilMobile": "SIM",
      "multiplosCartoes": "SIM",
      "investidor": "NÃO",
      "internetHighUser": "SIM",
      "internetBanking": "SIM",
      "gamesOnline": "NÃO",
      "fitness": "NÃO",
      "creditoScoreFaixa": "BAIXO RISCO",
      "creditoScore": "544",
      "creditoPessoal": "SIM",
      "clientePremium": "NÃO",
      "celularPrePago": "NÃO",
      "casaPropria": "SIM",
      "cartaoPriventLabel": "SIM",
      "cartaoPrime": "NÃO",
      "cartaoCreditoBv": "SIM",
      "cacadorDescontos": "NÃO"
    },
    "perfilSociodemografico": {
      "scoreRisco": "BAIXO RISCO",
      "classe": "A2",
      "segmento": "Empresário Promissor",
      "descricao": "Empreendedores de diversas atividades, com boa escolaridade e boa renda, desfrutam de um alto padrão de vida, comodidade e lazer.",
      "idade": "MADURO",
      "estadoCivil": null,
      "regiao": "CAPITAL",
      "escolaridade": "ALTA",
      "ocupacao": "EMPRESARIO",
      "atividadeFinanceira": "ALTA",
      "renda": "ALTA",
      "rendaPresumida": "7.200,00",
      "cbo": 321105,
      "cboDesc": "Técnico agrícola"
    },
    "obito": null,
    "historicoProfissional": [],
    "veiculos": [
      {
        "documento": "99061759072",
        "documentoFormatado": "990.617.590-72",
        "proprietario": "ALBER MARTINS GUEDES",
        "marcaModelo": "PEUGEOT/207PASSION XR S       ",
        "placa": "IQT4595",
        "anoFabricacao": "2010",
        "anoModelo": "2011",
        "chassi": "9362NKFWXBB001464",
        "renavam": "601444809",
        "dataLicenciamento": null,
        "qualificacao": null
      }
    ]
  },
  {
    "msg": "Consulta realizada com sucesso.",
    "empresa": {
      "cnpj": "52104265000133",
      "cnpjFormatado": "52.104.265/0001-33",
      "razaoSocial": "GUEDES PARTICIPACOES LTDA",
      "nomefantasia": null,
      "dataAbertura": "06/09/2023",
      "cnae": "6462000 - Holdings de instituições não-financeiras",
      "porte": "PEQUENA",
      "codIbge": null,
      "nJur": "2062 - Sociedade Empresária Limitada ",
      "faturamentoPresumidoAnual": "110000",
      "score": "300",
      "risco": "ALTO RISCO"
    },
    "telefones": [
      {
        "ddd": "62",
        "telefone": "998558261",
        "telefoneFormatado": "(62) 99855-8261",
        "tipoTelefone": "TELEFONE MÓVEL",
        "operadora": "",
        "restricao": "",
        "qualificacao": 1
      }
    ],
    "enderecos": [
      {
        "endereco": "R T34 SN QUADRA95 LOTE 15 16 APT 25",
        "tipoLogradouro": "R",
        "tituloLogradouro": null,
        "logradouro": "T34",
        "numero": "SN",
        "complemento": "QUADRA95 LOTE 15 16 APT 25",
        "bairro": "SET BUENO",
        "cidade": "GOIANIA",
        "uf": "GO",
        "cep": "74223220",
        "cepFormatado": "74223-220",
        "qualificacao": 1
      },
      {
        "endereco": "R T34 SN QUADRA95 LOTE 15 16 APT 25",
        "tipoLogradouro": "R",
        "tituloLogradouro": null,
        "logradouro": "T34",
        "numero": "SN",
        "complemento": "QUADRA95 LOTE 15 16 APT 25",
        "bairro": "SET BUENO",
        "cidade": "GOIANIA",
        "uf": "GO",
        "cep": "74223220",
        "cepFormatado": "74223-220",
        "qualificacao": 1
      }
    ],
    "emails": [
      {
        "email": "MBO.OUTSOURCING@GMAIL.COM",
        "qualificacao": 1
      }
    ],
    "receitaFederal": {
      "cnpj": "52104265000133",
      "cnpjFormatado": "52.104.265/0001-33",
      "dataAbertura": "06/09/2023",
      "razaoSocial": "GUEDES PARTICIPACOES LTDA",
      "nomeFantasia": null,
      "descricaoMatriz": "MATRIZ",
      "porte": "PEQUENO PORTE",
      "nJurCod": "2062",
      "nJurDesc": "Sociedade Empresária Limitada ",
      "capitalSocial": "10000",
      "situacaoCadastral": "ATIVA",
      "digitoVerificador": null,
      "dataHora": null,
      "codControle": null,
      "situacaoCadastralMotivo": null,
      "situacaoEspecial": null,
      "situacaoEspecialData": null,
      "enteFederativoResponsavel": null,
      "cnaeCod": "6462000",
      "cnaeDesc": "Holdings de instituições não-financeiras",
      "cnaesSecundarios": [
        {
          "cnaeCod": "6810202",
          "cnaeDesc": "Aluguel de imóveis próprios"
        }
      ],
      "socios": [
        {
          "cpfCnpj": "02923188047",
          "nomeRazaoSocial": "CARLOS EDUARDO MEDINO GUEDES",
          "nomeFantasia": null,
          "dataNascimentoAbertura": "17/07/2004",
          "participacao": "50.00",
          "dataEntrada": "06/09/2023",
          "qualificacaoCod": "22",
          "qualificacaoDesc": "Sócio",
          "paisOrigemCod": null,
          "paisOrigemDesc": null,
          "representanteLegal": null
        },
        {
          "cpfCnpj": "99061759072",
          "nomeRazaoSocial": "ALBER MARTINS GUEDES",
          "nomeFantasia": null,
          "dataNascimentoAbertura": "27/05/1981",
          "participacao": "50.00",
          "dataEntrada": "06/09/2023",
          "qualificacaoCod": "49",
          "qualificacaoDesc": "Sócio-Administrador",
          "paisOrigemCod": null,
          "paisOrigemDesc": null,
          "representanteLegal": null
        }
      ]
    },
    "funcionarios": [],
    "veiculos": []
  }
]
