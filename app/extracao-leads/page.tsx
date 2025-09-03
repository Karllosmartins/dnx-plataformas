'use client'

import { Target, Search, Users, Globe, Database, Wrench } from 'lucide-react'
import PlanProtection from '../../components/PlanProtection'

export default function ExtracaoLeadsPage() {
  return (
    <PlanProtection feature="extracaoLeads">
      <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Target className="h-8 w-8 mr-3 text-blue-600" />
          Extração de Leads
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Ferramentas para extrair e capturar leads de diversas fontes
        </p>
      </div>

      {/* Em Desenvolvimento */}
      <div className="text-center py-20">
        <div className="mx-auto max-w-md">
          <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">
            Funcionalidade em Desenvolvimento
          </h3>
          <p className="text-gray-600 mb-8">
            Estamos desenvolvendo ferramentas avançadas para extração automática de leads. 
            Em breve você poderá:
          </p>
          
          <div className="text-left space-y-4 mb-8">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-sm text-gray-700">Extração de leads de redes sociais</span>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <Search className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm text-gray-700">Busca de contatos em diretórios online</span>
            </div>
            <div className="flex items-center p-3 bg-purple-50 rounded-lg">
              <Database className="h-5 w-5 text-purple-600 mr-3" />
              <span className="text-sm text-gray-700">Importação de bases de dados externas</span>
            </div>
            <div className="flex items-center p-3 bg-orange-50 rounded-lg">
              <Users className="h-5 w-5 text-orange-600 mr-3" />
              <span className="text-sm text-gray-700">Validação e enriquecimento de dados</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Entre em contato conosco para saber mais sobre o cronograma de lançamento
          </div>
        </div>
      </div>
      </div>
    </PlanProtection>
  )
}