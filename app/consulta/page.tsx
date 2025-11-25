'use client'

// Forçar renderização dinâmica para evitar erro de useContext no build
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../components/shared/AuthWrapper'
import PlanProtection from '../../components/shared/PlanProtection'
import ConsultaResultados from '../../components/features/consulta/ConsultaResultados'
import { Search, User, FileText, Phone, Mail, MapPin, Car, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const [error, setError] = useState<string>('')

  const realizarConsulta = async () => {
    if (!user?.id) {
      setError('Usuário não autenticado')
      return
    }

    // Validar se pelo menos um critério de busca foi fornecido
    const hasSearchCriteria = consultaForm.document ||
                               consultaForm.numeroTelefone ||
                               consultaForm.email ||
                               consultaForm.placaVeiculo ||
                               (consultaForm.nomeRazao && (consultaForm.cidade || consultaForm.uf || consultaForm.cep))

    if (!hasSearchCriteria) {
      setError('Forneça pelo menos um critério de busca: CPF/CNPJ, telefone, email, placa de veículo, ou nome completo com localização (cidade/UF/CEP)')
      return
    }

    // tipoPessoa é sempre obrigatório pela API Datecode
    if (!consultaForm.tipoPessoa) {
      setError('Tipo de Pessoa (PF/PJ) é obrigatório')
      return
    }

    setConsultando(true)
    setConsultaResult(null)
    setError('')

    try {
      // Buscar token JWT do localStorage
      const token = localStorage.getItem('auth_token')

      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }

      // Preparar body da requisição
      const requestBody: any = {
        tipoPessoa: consultaForm.tipoPessoa,
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

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dnxplataformas.com.br/api'
      const response = await fetch(`${API_URL}/datecode/consulta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      console.log('📊 Resposta completa da API:', data)
      console.log('📊 Status da resposta:', response.status)
      console.log('📊 data.data:', data.data)
      console.log('📊 data.usage:', data.usage)

      if (!response.ok) {
        console.error('❌ Erro na resposta:', data)
        throw new Error(data.error || 'Erro na consulta')
      }

      console.log('✅ Setando resultado:', data.data)

      // A API Datecode retorna um array, pegar o primeiro elemento
      const resultado = Array.isArray(data.data) ? data.data[0] : data.data
      console.log('✅ Resultado processado:', resultado)
      setConsultaResult(resultado)

      // Atualizar limiteInfo se vier na resposta
      if (data.usage) {
        console.log('✅ Setando usage:', data.usage)
        setLimiteInfo(data.usage)
      }

    } catch (error) {
      console.error('Erro na consulta:', error)
      setError(error instanceof Error ? error.message : 'Erro ao realizar consulta')
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
    setError('')
  }

  const consultarDocumento = async (documento: string, tipoPessoa: 'PF' | 'PJ') => {
    if (!user?.id) {
      setError('Usuário não autenticado')
      return
    }

    setConsultando(true)
    setError('')

    try {
      const token = localStorage.getItem('auth_token')

      if (!token) {
        throw new Error('Token de autenticação não encontrado')
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dnxplataformas.com.br/api'
      const response = await fetch(`${API_URL}/datecode/consulta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document: documento,
          tipoPessoa: tipoPessoa
        })
      })

      const data = await response.json()

      console.log('📊 Resposta reconsulta:', data)

      if (!response.ok) {
        console.error('❌ Erro na reconsulta:', data)
        throw new Error(data.error || 'Erro na reconsulta')
      }

      // A API Datecode retorna um array, pegar o primeiro elemento
      const resultado = Array.isArray(data.data) ? data.data[0] : data.data
      console.log('✅ Resultado reconsulta processado:', resultado)

      // Atualizar o estado com os novos dados e mudar para aba geral
      setConsultaResult(resultado)
      setActiveTab('geral')

      // Atualizar formulário com novo documento consultado
      setConsultaForm(prev => ({
        ...prev,
        document: documento,
        tipoPessoa: tipoPessoa
      }))

      // Atualizar limiteInfo se vier na resposta
      if (data.usage) {
        console.log('✅ Setando usage da reconsulta:', data.usage)
        setLimiteInfo(data.usage)
      }

    } catch (error) {
      console.error('Erro na reconsulta:', error)
      setError(error instanceof Error ? error.message : 'Erro ao realizar reconsulta')
    } finally {
      setConsultando(false)
    }
  }

  // Detectar tipo de resultado
  const detectarTipoResultado = (resultado: any) => {
    if (Array.isArray(resultado)) {
      if (resultado.length > 0 && resultado[0].cpfCnpj && !resultado[0].msg) {
        return 'lista_simples'
      }
    }

    if (resultado?.empresa || resultado?.[0]?.empresa) {
      return 'pessoa_juridica'
    }

    if (resultado?.pessoa || resultado?.[0]?.pessoa) {
      return 'pessoa_fisica'
    }

    return 'desconhecido'
  }

  return (
    <PlanProtection feature="consulta">
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Search className="h-10 w-10 text-primary" />
              Consulta Individual
            </h1>
            <p className="mt-2 text-muted-foreground">
              Consulte dados por CPF, CNPJ, telefone, email, placa ou localização
            </p>
          </div>
          {limiteInfo && (
            <div className="flex gap-2">
              <Badge variant="outline" className="px-4 py-2">
                <span className="text-xs text-muted-foreground mr-1">Realizadas:</span>
                <span className="font-bold">{limiteInfo.consultasRealizadas}</span>
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                <span className="text-xs text-muted-foreground mr-1">Restantes:</span>
                <span className="font-bold text-green-600">{limiteInfo.consultasRestantes}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Formulário de Consulta */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Consulta</CardTitle>
            <CardDescription>
              Preencha ao menos um critério de busca para realizar a consulta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tipo de Pessoa */}
              <div className="space-y-2">
                <Label htmlFor="tipoPessoa" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Tipo de Pessoa *
                </Label>
                <Select
                  value={consultaForm.tipoPessoa}
                  onValueChange={(value) => setConsultaForm({...consultaForm, tipoPessoa: value as 'PF' | 'PJ'})}
                  disabled={consultando}
                >
                  <SelectTrigger id="tipoPessoa">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física (CPF)</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica (CNPJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Documento */}
              <div className="space-y-2">
                <Label htmlFor="document" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {consultaForm.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'}
                </Label>
                <Input
                  id="document"
                  type="text"
                  value={consultaForm.document}
                  onChange={(e) => setConsultaForm({...consultaForm, document: e.target.value})}
                  placeholder={consultaForm.tipoPessoa === 'PF' ? '123.456.789-00' : '12.345.678/0001-99'}
                  disabled={consultando}
                />
              </div>

              {/* Nome/Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="nomeRazao">
                  {consultaForm.tipoPessoa === 'PF' ? 'Nome Completo' : 'Razão Social'}
                </Label>
                <Input
                  id="nomeRazao"
                  type="text"
                  value={consultaForm.nomeRazao}
                  onChange={(e) => setConsultaForm({...consultaForm, nomeRazao: e.target.value})}
                  placeholder={consultaForm.tipoPessoa === 'PF' ? 'João da Silva' : 'Empresa Ltda'}
                  disabled={consultando}
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="numeroTelefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="numeroTelefone"
                  type="text"
                  value={consultaForm.numeroTelefone}
                  onChange={(e) => setConsultaForm({...consultaForm, numeroTelefone: e.target.value})}
                  placeholder="(11) 99999-9999"
                  disabled={consultando}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={consultaForm.email}
                  onChange={(e) => setConsultaForm({...consultaForm, email: e.target.value})}
                  placeholder="exemplo@email.com"
                  disabled={consultando}
                />
              </div>

              {/* Placa do Veículo */}
              <div className="space-y-2">
                <Label htmlFor="placaVeiculo" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Placa do Veículo
                </Label>
                <Input
                  id="placaVeiculo"
                  type="text"
                  value={consultaForm.placaVeiculo}
                  onChange={(e) => setConsultaForm({...consultaForm, placaVeiculo: e.target.value})}
                  placeholder="ABC1D23"
                  disabled={consultando}
                />
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <Label htmlFor="cidade" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  type="text"
                  value={consultaForm.cidade}
                  onChange={(e) => setConsultaForm({...consultaForm, cidade: e.target.value})}
                  placeholder="São Paulo"
                  disabled={consultando}
                />
              </div>

              {/* UF */}
              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  type="text"
                  value={consultaForm.uf}
                  onChange={(e) => setConsultaForm({...consultaForm, uf: e.target.value.toUpperCase()})}
                  placeholder="SP"
                  maxLength={2}
                  disabled={consultando}
                />
              </div>

              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  type="text"
                  value={consultaForm.cep}
                  onChange={(e) => setConsultaForm({...consultaForm, cep: e.target.value})}
                  placeholder="01001-000"
                  disabled={consultando}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={realizarConsulta}
                disabled={consultando}
                size="lg"
                className="flex-1"
              >
                {consultando ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Realizar Consulta
                  </>
                )}
              </Button>
              <Button
                onClick={limparConsulta}
                disabled={consultando}
                variant="outline"
                size="lg"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {consultaResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-green-600" />
                Resultados da Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
                    <TabsTrigger value="geral">Geral</TabsTrigger>
                    <TabsTrigger value="contatos">Contatos</TabsTrigger>
                    <TabsTrigger value="perfil">Perfil</TabsTrigger>
                    <TabsTrigger value="participacoes">Participações</TabsTrigger>
                    <TabsTrigger value="socios">Sócios</TabsTrigger>
                    <TabsTrigger value="veiculos">Veículos</TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-6 pb-6">
                  <TabsContent value="geral" className="mt-0">
                    <ConsultaResultados
                      resultado={consultaResult}
                      activeTab="geral"
                      consultarDocumento={consultarDocumento}
                      consultando={consultando}
                      documentoPrincipal={consultaForm.document}
                    />
                  </TabsContent>
                  <TabsContent value="contatos" className="mt-0">
                    <ConsultaResultados
                      resultado={consultaResult}
                      activeTab="contatos"
                      consultarDocumento={consultarDocumento}
                      consultando={consultando}
                      documentoPrincipal={consultaForm.document}
                    />
                  </TabsContent>
                  <TabsContent value="perfil" className="mt-0">
                    <ConsultaResultados
                      resultado={consultaResult}
                      activeTab="perfil"
                      consultarDocumento={consultarDocumento}
                      consultando={consultando}
                      documentoPrincipal={consultaForm.document}
                    />
                  </TabsContent>
                  <TabsContent value="participacoes" className="mt-0">
                    <ConsultaResultados
                      resultado={consultaResult}
                      activeTab="participacoes"
                      consultarDocumento={consultarDocumento}
                      consultando={consultando}
                      documentoPrincipal={consultaForm.document}
                    />
                  </TabsContent>
                  <TabsContent value="socios" className="mt-0">
                    <ConsultaResultados
                      resultado={consultaResult}
                      activeTab="socios"
                      consultarDocumento={consultarDocumento}
                      consultando={consultando}
                      documentoPrincipal={consultaForm.document}
                    />
                  </TabsContent>
                  <TabsContent value="veiculos" className="mt-0">
                    <ConsultaResultados
                      resultado={consultaResult}
                      activeTab="veiculos"
                      consultarDocumento={consultarDocumento}
                      consultando={consultando}
                      documentoPrincipal={consultaForm.document}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </PlanProtection>
  )
}