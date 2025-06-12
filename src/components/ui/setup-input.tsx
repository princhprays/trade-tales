import { useState, useRef, useEffect } from 'react'
import { useTradeStore } from '@/store/tradeStore'
import { X as XIcon } from 'lucide-react'
import type { JSX } from 'react'

interface SetupInputProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  className?: string
}

// Default setups that are commonly used
const DEFAULT_SETUPS = [
  'Breakout',
  'Breakdown',
  'Support Bounce',
  'Resistance Rejection',
  'Trend Following',
  'Counter Trend',
  'Range Trading',
  'Scalping',
  'Swing Trading',
  'Position Trading'
]

export function SetupInput({ value = [], onChange, disabled, className = '' }: SetupInputProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { settings, addCustomSetup, removeCustomSetup } = useTradeStore()

  const customSetups = Array.isArray(settings.customSetups) ? settings.customSetups : [];
  const allSetups = [...DEFAULT_SETUPS, ...customSetups];
  const lowerCaseSearchTerm = String(searchTerm || '').toLowerCase();

  const exactMatchExists = allSetups.some(setup => setup.toLowerCase() === lowerCaseSearchTerm);

  const filteredSetups = allSetups.filter(setup =>
    setup.toLowerCase().includes(lowerCaseSearchTerm)
  );

  let options: string[];
  if (exactMatchExists) {
    options = [...filteredSetups];
  } else if (filteredSetups.length > 0 || !searchTerm) {
    options = filteredSetups;
  } else {
    options = ['Custom: ' + searchTerm];
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value || ''
    setSearchTerm(newValue)
    setIsOpen(true)
    setIsCustom(!allSetups.includes(newValue))
    setSelectedIndex(-1)
  }

  const handleSetupSelect = (setup: string) => {
    const finalValue = setup.startsWith('Custom: ') ? setup.slice(8) : setup
    if (!value.includes(finalValue)) {
      onChange([...value, finalValue])
    }
    setSearchTerm('')
    setIsOpen(false)
    setIsCustom(false)
    setSelectedIndex(-1)
  }

  const handleCustomSetupAdd = (setupToAdd: string) => {
    if (setupToAdd && !allSetups.includes(setupToAdd)) {
      addCustomSetup(setupToAdd)
      handleSetupSelect(setupToAdd)
    }
  }

  const handleRemoveSetup = (setupToRemove: string) => {
    onChange(value.filter(setup => setup !== setupToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setSelectedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + options.length) % options.length)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          const selectedOption = options[selectedIndex]
          if (selectedOption.startsWith('Custom: ')) {
            handleCustomSetupAdd(selectedOption.slice(8))
          } else {
            handleSetupSelect(selectedOption)
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus-within:ring-2 focus-within:ring-blue-500 dark:bg-gray-700">
        {Array.isArray(value) && value.map((setup) => (
          <div
            key={setup}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full"
          >
            <span>{setup}</span>
            {!disabled && (
              <button
                onClick={() => handleRemoveSetup(setup)}
                className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
              >
                <XIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className={`flex-1 min-w-[120px] bg-transparent border-none focus:outline-none text-sm xs:text-base dark:text-white ${className}`}
          placeholder={value.length === 0 ? "Enter trade setup" : ""}
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length > 0 && (
            <div className="py-1">
              {options.map((setup, index) => (
                <div
                  key={setup}
                  className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => {
                    if (setup.startsWith('Custom: ')) {
                      const customValue = setup.slice(8)
                      setSearchTerm(customValue)
                      handleCustomSetupAdd(customValue)
                    } else {
                      handleSetupSelect(setup)
                    }
                  }}
                >
                  <span>{setup}</span>
                  {Array.isArray(settings.customSetups) && settings.customSetups.includes(setup) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCustomSetup(setup)
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!searchTerm && (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
              Start typing to search
            </div>
          )}
        </div>
      )}
    </div>
  )
} 