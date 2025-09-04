{
  "openapi": "3.0.1",
  "info": {
    "title": "API Profile",
    "description": "API para gerar contagens e extrações do Profile",
    "version": "v1"
  },
  "paths": {
    "/api/Auth": {
      "post": {
        "tags": [
          "Autenticação"
        ],
        "summary": "Método de autentição para obter um token Bearer",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginApiModel"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginApiModel"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/LoginApiModel"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ResumirContagem": {
      "post": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Resumir contagem",
        "description": "Método usado para resumo da contagem.",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPfVM"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPfVM"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPfVM"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/CriarContagem": {
      "post": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Criar contagem",
        "description": "Método usado para criar uma nova contagem.",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPfVM"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPfVM"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPfVM"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarContagens": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar contagens",
        "description": "Método usado para obter todas contagens realizadas.",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/BuscarContagem": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Buscar contagem",
        "description": "Método usado para buscar o resultado da contagem.",
        "parameters": [
          {
            "name": "idContagem",
            "in": "query",
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarUfs": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar estados",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Uf"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Uf"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Uf"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarMunicipios": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar municípios passando uma lista de idsUfs",
        "parameters": [
          {
            "name": "idsUfs",
            "in": "query",
            "schema": {
              "type": "array",
              "items": {
                "type": "integer",
                "format": "int64"
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Cidade"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Cidade"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Cidade"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarSexos": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar tipos de sexos",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Sexo"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Sexo"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Sexo"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarClassesSociais": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar tipos de classes sociais",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ClasseSocialVM"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ClasseSocialVM"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ClasseSocialVM"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarEstadosCivis": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar tipos de estados civis",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbEstadoCivil"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbEstadoCivil"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbEstadoCivil"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarProfissoes": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar tipos de profissões",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbCbo"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbCbo"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbCbo"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarScores": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar tipos de scores",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarOperadoras": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar tipos de operadoras",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbOperadorasNew"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbOperadorasNew"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbOperadorasNew"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPf/ListarDds": {
      "get": {
        "tags": [
          "Contagem de pessoa física"
        ],
        "summary": "Listar tipos de DDDs",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/DddRegioesVM"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/DddRegioesVM"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/DddRegioesVM"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ResumirContagem": {
      "post": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Resumir contagem",
        "description": "Método usado para resumo da contagem.",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPjVM"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPjVM"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPjVM"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResumoContagemVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/CriarContagem": {
      "post": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Criar contagem",
        "description": "Método usado para criar uma nova contagem.",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPjVM"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPjVM"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/NovaContagemApiPjVM"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarContagens": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar contagens",
        "description": "Método usado para obter todas contagens realizadas.",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaContagensVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/BuscarContagem": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Buscar contagem",
        "description": "Método usado para buscar o resultado da contagem.",
        "parameters": [
          {
            "name": "idContagem",
            "in": "query",
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ContagemRetornoVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarUfs": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar estados",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Uf"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Uf"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Uf"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarMunicipios": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar municípios passando uma lista de idsUfs",
        "parameters": [
          {
            "name": "idsUfs",
            "in": "query",
            "schema": {
              "type": "array",
              "items": {
                "type": "integer",
                "format": "int64"
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Cidade"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Cidade"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Cidade"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarCNAEs": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar tipos de CNAE",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Tbcnae"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Tbcnae"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Tbcnae"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarPortes": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar tipos de porte empresarial",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarTiposEmpresa": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar tipos de empresa",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarScores": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar tipos de scores",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarOperadoras": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar tipos de operadoras",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbOperadorasNew"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbOperadorasNew"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/TbOperadorasNew"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/ContagemPj/ListarDds": {
      "get": {
        "tags": [
          "Contagem de pessoa jurídica"
        ],
        "summary": "Listar tipos de DDDs",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/DddRegioesVM"
                  }
                }
              },
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/DddRegioesVM"
                  }
                }
              },
              "text/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/DddRegioesVM"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/Extracao/CriarExtracao": {
      "post": {
        "tags": [
          "Extrações de contagens"
        ],
        "summary": "Criar extração",
        "description": "Método usado para criar uma nova extração.",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CriarExtracaoVM"
              }
            },
            "text/json": {
              "schema": {
                "$ref": "#/components/schemas/CriarExtracaoVM"
              }
            },
            "application/*+json": {
              "schema": {
                "$ref": "#/components/schemas/CriarExtracaoVM"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/CriarExtracaoRetornoVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/Extracao/ListarExtracoes": {
      "get": {
        "tags": [
          "Extrações de contagens"
        ],
        "summary": "Listar extrações",
        "description": "Método usado para obter todas extrações realizadas.",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaExtracoesVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/Extracao/BuscarDetalhesExtracao": {
      "get": {
        "tags": [
          "Extrações de contagens"
        ],
        "summary": "Buscar detalhes da extração",
        "description": "Método usado para buscar detalhes da extração.",
        "parameters": [
          {
            "name": "idExtracao",
            "in": "query",
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/Extracao/DownloadExtracao": {
      "get": {
        "tags": [
          "Extrações de contagens"
        ],
        "summary": "Download da extração",
        "description": "Método usado para efetuar download da extração.",
        "parameters": [
          {
            "name": "idExtracao",
            "in": "query",
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              },
              "application/json": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              },
              "text/json": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProblemDetails"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/DetalhesExtracaoVM"
                }
              }
            }
          }
        }
      }
    },
    "/api/Extracao/ListarTiposExtracoes": {
      "get": {
        "tags": [
          "Extrações de contagens"
        ],
        "summary": "Listar tipos de extrações",
        "description": "Método usado para obter tipos de extrações disponíveis.",
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "text/plain": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              },
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              },
              "text/json": {
                "schema": {
                  "$ref": "#/components/schemas/ListaTiposExtracoesVM"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Cidade": {
        "type": "object",
        "properties": {
          "uf": {
            "type": "string",
            "nullable": true
          },
          "cidade1": {
            "type": "string",
            "nullable": true
          },
          "idUf": {
            "type": "integer",
            "format": "int64",
            "nullable": true
          },
          "idcidade": {
            "type": "integer",
            "format": "int64"
          }
        },
        "additionalProperties": false
      },
      "ClasseSocialVM": {
        "type": "object",
        "properties": {
          "codigo": {
            "type": "string",
            "nullable": true
          },
          "descricao": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ContagemPf": {
        "type": "object",
        "properties": {
          "idadeMinima": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "idadeMaxima": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "rendaMinimo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "rendaMaximo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "possuiMae": {
            "type": "boolean",
            "nullable": true
          },
          "possuiEndereco": {
            "type": "boolean",
            "nullable": true
          },
          "possuiEmail": {
            "type": "boolean",
            "nullable": true
          },
          "possuiTelefone": {
            "type": "boolean",
            "nullable": true
          },
          "possuiCelular": {
            "type": "boolean",
            "nullable": true
          },
          "sexos": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "classesSociais": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "classesSociaisSiglas": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "estadosCivis": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "profissoes": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "scores": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "operadorasCelular": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "dddsCelular": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ContagemPj": {
        "type": "object",
        "properties": {
          "dataAberturaMinima": {
            "type": "string",
            "format": "date",
            "nullable": true
          },
          "dataAberturaMaxima": {
            "type": "string",
            "format": "date",
            "nullable": true
          },
          "numeroFuncionariosMinimo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "numeroFuncionariosMaximo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "numeroSociosMinimo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "numeroSociosMaximo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "faturamentoMinimo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "faturamentoMaximo": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "somenteMatriz": {
            "type": "boolean",
            "nullable": true
          },
          "possuiEndereco": {
            "type": "boolean",
            "nullable": true
          },
          "possuiEmail": {
            "type": "boolean",
            "nullable": true
          },
          "possuiTelefone": {
            "type": "boolean",
            "nullable": true
          },
          "possuiCelular": {
            "type": "boolean",
            "nullable": true
          },
          "cnaes": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "portes": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "tiposEmpresa": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "scores": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "operadorasCelular": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          },
          "dddsCelular": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ContagemRetornoQuantidadesVM": {
        "type": "object",
        "properties": {
          "descricao": {
            "type": "string",
            "nullable": true
          },
          "total": {
            "type": "integer",
            "format": "int64"
          },
          "quantidadesDetalhes": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContagemRetornoQuantidadesVM"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ContagemRetornoVM": {
        "type": "object",
        "properties": {
          "sucesso": {
            "type": "boolean"
          },
          "msg": {
            "type": "string",
            "nullable": true
          },
          "idContagem": {
            "type": "integer",
            "format": "int64"
          },
          "quantidades": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ContagemRetornoQuantidadesVM"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "CriarExtracaoRetornoVM": {
        "type": "object",
        "properties": {
          "sucesso": {
            "type": "boolean"
          },
          "msg": {
            "type": "string",
            "nullable": true
          },
          "idExtracao": {
            "type": "integer",
            "format": "int64"
          }
        },
        "additionalProperties": false
      },
      "CriarExtracaoVM": {
        "type": "object",
        "properties": {
          "idContagem": {
            "type": "integer",
            "format": "int64"
          },
          "idTipoAcesso": {
            "type": "integer",
            "format": "int32"
          },
          "qtdeSolicitada": {
            "type": "integer",
            "format": "int32"
          },
          "removerRegistrosExtraidos": {
            "type": "boolean"
          }
        },
        "additionalProperties": false
      },
      "DddRegioesVM": {
        "type": "object",
        "properties": {
          "estados": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/DddRegioesVMEstado"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "DddRegioesVMDdd": {
        "type": "object",
        "properties": {
          "prefixo": {
            "type": "integer",
            "format": "int32"
          },
          "nome": {
            "type": "string",
            "nullable": true
          },
          "alternativo": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "DddRegioesVMEstado": {
        "type": "object",
        "properties": {
          "siglaUf": {
            "type": "string",
            "nullable": true
          },
          "nome": {
            "type": "string",
            "nullable": true
          },
          "ddds": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/DddRegioesVMDdd"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "DetalhesExtracaoVM": {
        "type": "object",
        "properties": {
          "sucesso": {
            "type": "boolean"
          },
          "msg": {
            "type": "string",
            "nullable": true
          },
          "idExtracao": {
            "type": "integer",
            "format": "int64"
          },
          "idContagem": {
            "type": "integer",
            "format": "int64"
          },
          "status": {
            "type": "string",
            "nullable": true
          },
          "nomeContagem": {
            "type": "string",
            "nullable": true
          },
          "tipoPessoa": {
            "type": "string",
            "nullable": true
          },
          "qtdeSolicitada": {
            "type": "integer",
            "format": "int64"
          },
          "removerRegistrosExtraidos": {
            "type": "boolean",
            "nullable": true
          },
          "dataCriacao": {
            "type": "string",
            "nullable": true
          },
          "dataFinalizacao": {
            "type": "string",
            "nullable": true
          },
          "usuario": {
            "type": "string",
            "nullable": true
          },
          "tipoExtracao": {
            "type": "string",
            "nullable": true
          },
          "qtdeRetorno": {
            "type": "integer",
            "format": "int64",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "EstadoMunicipiosVM": {
        "type": "object",
        "properties": {
          "idsUfs": {
            "type": "array",
            "items": {
              "type": "integer",
              "format": "int64"
            },
            "nullable": true
          },
          "idsMunicipios": {
            "type": "array",
            "items": {
              "type": "integer",
              "format": "int64"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ListaContagensVM": {
        "type": "object",
        "properties": {
          "sucesso": {
            "type": "boolean"
          },
          "msg": {
            "type": "string",
            "nullable": true
          },
          "contagens": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ResultadoContagemVM"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ListaExtracoesVM": {
        "type": "object",
        "properties": {
          "sucesso": {
            "type": "boolean"
          },
          "msg": {
            "type": "string",
            "nullable": true
          },
          "extracoes": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ResultadoExtracaoVM"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ListaTiposExtracoesVM": {
        "type": "object",
        "properties": {
          "sucesso": {
            "type": "boolean"
          },
          "msg": {
            "type": "string",
            "nullable": true
          },
          "limiteGeralExtracoes": {
            "type": "integer",
            "format": "int64",
            "nullable": true
          },
          "tiposExtracoes": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ResultadoTipoAcessoVM"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "LoginApiModel": {
        "type": "object",
        "properties": {
          "apiKey": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "LoginResponse": {
        "type": "object",
        "properties": {
          "msg": {
            "type": "string",
            "nullable": true
          },
          "token": {
            "type": "string",
            "nullable": true
          },
          "expiraEm": {
            "type": "number",
            "format": "double"
          }
        },
        "additionalProperties": false
      },
      "NovaContagemApiPfVM": {
        "type": "object",
        "properties": {
          "nomeContagem": {
            "type": "string",
            "nullable": true
          },
          "estadosMunicipios": {
            "$ref": "#/components/schemas/EstadoMunicipiosVM"
          },
          "arquivoCepsBase64": {
            "type": "string",
            "nullable": true
          },
          "arquivoCepsComNumero": {
            "type": "boolean",
            "nullable": true
          },
          "contagemPf": {
            "$ref": "#/components/schemas/ContagemPf"
          }
        },
        "additionalProperties": false
      },
      "NovaContagemApiPjVM": {
        "type": "object",
        "properties": {
          "nomeContagem": {
            "type": "string",
            "nullable": true
          },
          "estadosMunicipios": {
            "$ref": "#/components/schemas/EstadoMunicipiosVM"
          },
          "arquivoCepsBase64": {
            "type": "string",
            "nullable": true
          },
          "arquivoCepsComNumero": {
            "type": "boolean",
            "nullable": true
          },
          "contagemPj": {
            "$ref": "#/components/schemas/ContagemPj"
          }
        },
        "additionalProperties": false
      },
      "ProblemDetails": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "nullable": true
          },
          "title": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "integer",
            "format": "int32",
            "nullable": true
          },
          "detail": {
            "type": "string",
            "nullable": true
          },
          "instance": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": {

        }
      },
      "ResultadoContagemVM": {
        "type": "object",
        "properties": {
          "idContagem": {
            "type": "integer",
            "format": "int64"
          },
          "nome": {
            "type": "string",
            "nullable": true
          },
          "tipo": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "string",
            "nullable": true
          },
          "usuario": {
            "type": "string",
            "nullable": true
          },
          "qtde": {
            "type": "integer",
            "format": "int64",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ResultadoExtracaoVM": {
        "type": "object",
        "properties": {
          "idExtracao": {
            "type": "integer",
            "format": "int64"
          },
          "tipoExtracao": {
            "type": "string",
            "nullable": true
          },
          "tipoPessoa": {
            "type": "string",
            "nullable": true
          },
          "data": {
            "type": "string",
            "nullable": true
          },
          "status": {
            "type": "string",
            "nullable": true
          },
          "usuario": {
            "type": "string",
            "nullable": true
          },
          "qtdeSolicitada": {
            "type": "integer",
            "format": "int64"
          }
        },
        "additionalProperties": false
      },
      "ResultadoTipoAcessoVM": {
        "type": "object",
        "properties": {
          "idTipoAcesso": {
            "type": "integer",
            "format": "int32"
          },
          "descricao": {
            "type": "string",
            "nullable": true
          },
          "limiteUtilizacao": {
            "type": "integer",
            "format": "int64",
            "nullable": true
          },
          "totalUtilizado": {
            "type": "integer",
            "format": "int64",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "ResumoContagemVM": {
        "type": "object",
        "properties": {
          "sucesso": {
            "type": "boolean"
          },
          "msg": {
            "type": "string",
            "nullable": true
          },
          "limiteContagem": {
            "type": "string",
            "nullable": true
          },
          "total": {
            "type": "string",
            "nullable": true
          },
          "permitido": {
            "type": "boolean"
          }
        },
        "additionalProperties": false
      },
      "Sexo": {
        "type": "object",
        "properties": {
          "tipo": {
            "type": "string",
            "nullable": true
          },
          "sexo1": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "TbCbo": {
        "type": "object",
        "properties": {
          "cdCbo": {
            "type": "string",
            "nullable": true
          },
          "dsCbo": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "TbEstadoCivil": {
        "type": "object",
        "properties": {
          "cdEstadoCivil": {
            "type": "string",
            "nullable": true
          },
          "dsEstadoCivil": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "TbOperadorasNew": {
        "type": "object",
        "properties": {
          "nomeOperadora": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Tbcnae": {
        "type": "object",
        "properties": {
          "cnae": {
            "type": "string",
            "nullable": true
          },
          "descricaoCnae": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "Uf": {
        "type": "object",
        "properties": {
          "idUf": {
            "type": "integer",
            "format": "int64",
            "nullable": true
          },
          "uf1": {
            "type": "string",
            "nullable": true
          },
          "ufDescricao": {
            "type": "string",
            "nullable": true
          }
        },
        "additionalProperties": false
      }
    },
    "securitySchemes": {
      "Bearer": {
        "type": "apiKey",
        "description": "JWT Authorization header using the Bearer scheme. \\r\\n\\r\\n \r\n                      Enter 'Bearer' [space] and then your token in the text input below.\r\n                      \\r\\n\\r\\nExample: 'Bearer 12345abcdef'",
        "name": "Authorization",
        "in": "header"
      }
    }
  },
  "security": [
    {
      "Bearer": []
    }
  ]
} 