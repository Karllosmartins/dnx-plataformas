'use client'

import { 
  CheckCircle, 
  BarChart as BarChartIcon, 
  Download,
  Users,
  MapPin,
  Star,
  Heart,
  DollarSign
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface QuantidadeDetalhe {
  descricao: string
  total: number
  quantidadesDetalhes?: QuantidadeDetalhe[] | null
}

interface ContagemRetornoVM {
  sucesso: boolean
  msg: string
  idContagem: number
  quantidades: QuantidadeDetalhe[]
}

interface ResultadosContagemProps {
  resultado: ContagemRetornoVM
  nomeContagem: string
  tipoPessoa: 'pf' | 'pj'
  onCriarExtracao: () => void
  onNovaContagem: () => void
}

// Cores para os gráficos
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
]

export default function ResultadosContagem({
  resultado,
  nomeContagem,
  tipoPessoa,
  onCriarExtracao,
  onNovaContagem
}: ResultadosContagemProps) {
  
  // Encontrar dados específicos
  const totalGeral = resultado.quantidades.find(q => q.descricao === 'Total')?.total || 0
  const dadosScore = resultado.quantidades.find(q => q.descricao === 'Total por score')
  const dadosSexoIdade = resultado.quantidades.find(q => q.descricao === 'Total de sexo/faixa etaria')
  const dadosEstadoCivilRenda = resultado.quantidades.find(q => q.descricao === 'Total de estado civil/renda')
  const dadosCidadeUF = resultado.quantidades.find(q => q.descricao === 'Total por cidade/UF')

  // Preparar dados para gráficos
  const dadosScoreChart = dadosScore?.quantidadesDetalhes?.map(item => ({
    name: item.descricao,
    value: item.total,
    porcentagem: ((item.total / totalGeral) * 100).toFixed(1)
  })) || []

  const dadosSexoIdadeChart = dadosSexoIdade?.quantidadesDetalhes?.map(item => ({
    name: item.descricao,
    total: item.total,
    porcentagem: ((item.total / totalGeral) * 100).toFixed(1)
  })) || []

  const dadosEstadoCivilRendaChart = dadosEstadoCivilRenda?.quantidadesDetalhes?.map(item => ({
    name: item.descricao,
    total: item.total,
    porcentagem: ((item.total / totalGeral) * 100).toFixed(1)
  })) || []

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Sucesso */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-green-800">Contagem Criada com Sucesso!</h2>
            <p className="text-green-700">ID da Contagem: <span className="font-mono">{resultado.idContagem}</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Resumo da Contagem</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-800">{totalGeral.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-blue-600">Total de Registros</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <BarChartIcon className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-800">{nomeContagem}</div>
              <div className="text-sm text-purple-600">Nome da Contagem</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <Star className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-800">{tipoPessoa === 'pf' ? 'PF' : 'PJ'}</div>
              <div className="text-sm text-green-600">Tipo de Pessoa</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <MapPin className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-orange-800">{dadosCidadeUF?.quantidadesDetalhes?.length || 0}</div>
              <div className="text-sm text-orange-600">Cidades</div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onCriarExtracao}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            Criar Extração dos Leads
          </button>
          
          <button
            onClick={onNovaContagem}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
          >
            <Users className="h-5 w-5" />
            Nova Contagem
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Scores */}
        {dadosScoreChart.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Distribuição por Score
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosScoreChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, porcentagem }) => `${name}: ${porcentagem}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosScoreChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Registros']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Sexo/Idade */}
        {dadosSexoIdadeChart.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Sexo / Faixa Etária
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosSexoIdadeChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Registros']} />
                <Bar dataKey="total" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de Estado Civil/Renda */}
        {dadosEstadoCivilRendaChart.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Estado Civil / Renda
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosEstadoCivilRendaChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Registros']} />
                <Bar dataKey="total" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabela Detalhada */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento Completo</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {resultado.quantidades.map((categoria, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{categoria.descricao}</h4>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {categoria.total.toLocaleString('pt-BR')} registros
                </div>
                
                {categoria.quantidadesDetalhes && categoria.quantidadesDetalhes.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {categoria.quantidadesDetalhes.map((detalhe, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{detalhe.descricao}</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">{detalhe.total.toLocaleString('pt-BR')}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({((detalhe.total / categoria.total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}