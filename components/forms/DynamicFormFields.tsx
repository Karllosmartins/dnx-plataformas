'use client'

import { useState } from 'react'

interface CampoPersonalizado {
  nome: string
  label: string
  tipo: 'text' | 'select' | 'multiselect' | 'number' | 'date' | 'textarea' | 'email' | 'tel' | 'cpf' | 'cnpj'
  opcoes?: string[]
  obrigatorio?: boolean
  ajuda?: string
  placeholder?: string
}

interface DynamicFormFieldsProps {
  campos: CampoPersonalizado[]
  valores: Record<string, any>
  onChange: (nome: string, valor: any) => void
  className?: string
}

export default function DynamicFormFields({ campos, valores, onChange, className = '' }: DynamicFormFieldsProps) {
  if (!campos || campos.length === 0) {
    return null
  }

  const renderField = (campo: CampoPersonalizado) => {
    const valor = valores[campo.nome] || ''

    switch (campo.tipo) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={campo.tipo}
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            placeholder={campo.placeholder || campo.label}
            required={campo.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'cpf':
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => {
              // Aplicar máscara de CPF: 000.000.000-00
              let v = e.target.value.replace(/\D/g, '')
              v = v.replace(/(\d{3})(\d)/, '$1.$2')
              v = v.replace(/(\d{3})(\d)/, '$1.$2')
              v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
              onChange(campo.nome, v)
            }}
            placeholder={campo.placeholder || '000.000.000-00'}
            maxLength={14}
            required={campo.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'cnpj':
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => {
              // Aplicar máscara de CNPJ: 00.000.000/0000-00
              let v = e.target.value.replace(/\D/g, '')
              v = v.replace(/(\d{2})(\d)/, '$1.$2')
              v = v.replace(/(\d{3})(\d)/, '$1.$2')
              v = v.replace(/(\d{3})(\d)/, '$1/$2')
              v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2')
              onChange(campo.nome, v)
            }}
            placeholder={campo.placeholder || '00.000.000/0000-00'}
            maxLength={18}
            required={campo.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            placeholder={campo.placeholder || campo.label}
            required={campo.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'date':
        return (
          <input
            type="date"
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            required={campo.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )

      case 'textarea':
        return (
          <textarea
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            placeholder={campo.placeholder || campo.label}
            required={campo.obrigatorio}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        )

      case 'select':
        return (
          <select
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            required={campo.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            {campo.opcoes?.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const valoresArray = Array.isArray(valor) ? valor : (valor ? [valor] : [])

        return (
          <div className="space-y-2">
            {campo.opcoes?.map((opcao) => (
              <label key={opcao} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={valoresArray.includes(opcao)}
                  onChange={(e) => {
                    let novosValores = [...valoresArray]
                    if (e.target.checked) {
                      novosValores.push(opcao)
                    } else {
                      novosValores = novosValores.filter(v => v !== opcao)
                    }
                    onChange(campo.nome, novosValores)
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {opcao.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            placeholder={campo.placeholder || campo.label}
            required={campo.obrigatorio}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {campos.map((campo) => (
        <div key={campo.nome} className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            {campo.label}
            {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(campo)}
          {campo.ajuda && (
            <p className="text-xs text-gray-500 mt-1">{campo.ajuda}</p>
          )}
        </div>
      ))}
    </div>
  )
}
