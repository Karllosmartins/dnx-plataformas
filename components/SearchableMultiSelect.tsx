'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X, Check } from 'lucide-react'

interface Option {
  value: string | number
  label: string
}

interface SearchableMultiSelectProps {
  options: Option[]
  value: (string | number)[]
  onChange: (value: (string | number)[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  maxHeight?: string
}

export default function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Pesquisar...",
  disabled = false,
  maxHeight = "200px"
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filtrar opções baseado no termo de pesquisa
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focar no input de pesquisa quando abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) setSearchTerm('')
  }

  const handleOptionClick = (optionValue: string | number) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const handleRemoveItem = (itemValue: string | number) => {
    onChange(value.filter(v => v !== itemValue))
  }

  const getSelectedLabels = () => {
    return value
      .map(v => options.find(opt => opt.value === v)?.label)
      .filter(Boolean)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campo principal */}
      <div
        onClick={handleToggle}
        className={`
          w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md cursor-pointer
          flex items-center justify-between gap-2
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent
        `}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {value.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <>
              {getSelectedLabels().slice(0, 3).map((label, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveItem(value[index])
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {value.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                  +{value.length - 3} mais
                </span>
              )}
            </>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Campo de pesquisa */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lista de opções */}
          <div className={`overflow-y-auto`} style={{ maxHeight }}>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-gray-500 text-center text-sm">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <div
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className={`
                      px-3 py-2 cursor-pointer flex items-center justify-between
                      hover:bg-gray-50 text-sm
                      ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    `}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                )
              })
            )}
          </div>

          {/* Rodapé com informações */}
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{value.length} item{value.length !== 1 ? 's' : ''} selecionado{value.length !== 1 ? 's' : ''}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange([])
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Limpar tudo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}