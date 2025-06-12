import { useState, useRef, useEffect } from 'react'
import { useTradeStore } from '@/store/tradeStore'
import { X as XIcon } from 'lucide-react'
import type { JSX } from 'react'

interface CoinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const DEFAULT_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC']

export function CoinInput({ value, onChange, disabled, className = '' }: CoinInputProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>(value || '')
  const [isCustom, setIsCustom] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { settings, addCustomCoin, removeCustomCoin } = useTradeStore()

  const customCoins = Array.isArray(settings.customCoins) ? settings.customCoins : [];
  const allCoins = [...DEFAULT_COINS, ...customCoins];
  const lowerCaseSearchTerm = String(searchTerm || '').toLowerCase();

  const exactMatchExists = allCoins.some(coin => coin.toLowerCase() === lowerCaseSearchTerm);

  const filteredCoins = allCoins.filter(coin =>
    coin.toLowerCase().includes(lowerCaseSearchTerm)
  );

  let options: string[];
  if (exactMatchExists) {
    options = [...filteredCoins];
  } else if (filteredCoins.length > 0 || !searchTerm) {
    options = filteredCoins;
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

  // Initialize searchTerm with value when component mounts
  useEffect(() => {
    setSearchTerm(value || '')
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = (e.target.value || '').toUpperCase()
    setSearchTerm(newValue)
    setIsOpen(true)
    setIsCustom(!allCoins.includes(newValue))
    setSelectedIndex(-1)
  }

  const handleCoinSelect = (coin: string) => {
    const finalValue = coin.startsWith('Custom: ') ? coin.slice(8) : coin
    console.log('CoinInput: handleCoinSelect - finalValue:', finalValue)
    onChange(finalValue)
    setSearchTerm(finalValue)
    setIsOpen(false)
    setIsCustom(false)
    setSelectedIndex(-1)
  }

  const handleCustomCoinAdd = (coinToAdd: string) => {
    console.log('CoinInput: handleCustomCoinAdd - coinToAdd:', coinToAdd)
    if (coinToAdd && !allCoins.includes(coinToAdd.toUpperCase())) {
      const customCoin = coinToAdd.toUpperCase()
      addCustomCoin(customCoin)
      handleCoinSelect(customCoin)
      setIsOpen(false)
    }
  }

  const handleRemoveCustomCoin = (e: React.MouseEvent<HTMLButtonElement>, coin: string) => {
    e.stopPropagation()
    removeCustomCoin(coin)
    if (value === coin) {
      onChange('')
      setSearchTerm('')
    }
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
            handleCustomCoinAdd(selectedOption.slice(8))
          } else {
            handleCoinSelect(selectedOption)
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
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
        className={`w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${className}`}
        placeholder="Enter coin"
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length > 0 && (
            <div className="py-1">
              {options.map((coin, index) => (
                <div
                  key={coin}
                  className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => {
                    if (coin.startsWith('Custom: ')) {
                      const customValue = coin.slice(8)
                      setSearchTerm(customValue)
                      handleCustomCoinAdd(customValue)
                    } else {
                      handleCoinSelect(coin)
                    }
                  }}
                >
                  <span>{coin}</span>
                  {Array.isArray(settings.customCoins) && settings.customCoins.includes(coin) && (
                    <button
                      onClick={(e) => handleRemoveCustomCoin(e, coin)}
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