import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTradeStore } from '../store/tradeStore'
import { Moon, Sun, Download, Upload, Trash2, Info } from 'lucide-react'
import { format } from 'date-fns'
import localforage from 'localforage'

// Currency options
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
]

// Date format options
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY' }
]

export function Settings() {
  const { settings, updateSettings, clearAllData, entries } = useTradeStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{ size: string; lastModified: string } | null>(null)

  // Calculate storage info
  const calculateStorageInfo = async () => {
    try {
      const keys = await localforage.keys()
      let totalSize = 0
      let lastModified = new Date(0)

      for (const key of keys) {
        const value = await localforage.getItem(key)
        if (value) {
          totalSize += JSON.stringify(value).length
          const item = await localforage.getItem(key)
          if (item && item.lastSaved) {
            const date = new Date(item.lastSaved)
            if (date > lastModified) lastModified = date
          }
        }
      }

      setStorageInfo({
        size: `${(totalSize / 1024).toFixed(2)} KB`,
        lastModified: format(lastModified, 'MMM d, yyyy h:mm a')
      })
    } catch (error) {
      console.error('Error calculating storage info:', error)
    }
  }

  // Export data
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = {
        entries,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trade-data-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Import data
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Validate data structure
      if (!data.entries || !data.settings) {
        throw new Error('Invalid data format')
      }

      // Update store with imported data
      useTradeStore.setState({
        entries: data.entries,
        settings: data.settings
      })

      alert('Data imported successfully!')
    } catch (error) {
      console.error('Error importing data:', error)
      alert('Error importing data. Please check the file format.')
    } finally {
      setIsImporting(false)
    }
  }

  // Clear all data with confirmation
  const handleClearData = () => {
    if (showConfirmClear) {
      clearAllData()
      setShowConfirmClear(false)
    } else {
      setShowConfirmClear(true)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="text-sm text-gray-500">
          App Version: 1.0.0
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`p-2 rounded-lg ${
                  settings.theme === 'light'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Sun size={20} />
              </button>
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`p-2 rounded-lg ${
                  settings.theme === 'dark'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Moon size={20} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Date Format Settings */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Date Format</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={settings.dateFormat}
              onChange={(e) => updateSettings({ dateFormat: e.target.value })}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DATE_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download size={16} className="mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
              <label className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer">
                <Upload size={16} className="mr-2" />
                {isImporting ? 'Importing...' : 'Import Data'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            <button
              onClick={handleClearData}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 size={16} className="mr-2" />
              {showConfirmClear ? 'Click again to confirm' : 'Clear All Data'}
            </button>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Storage Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Entries:</span>
                <span className="font-medium">{entries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Storage Size:</span>
                <span className="font-medium">{storageInfo?.size || 'Calculating...'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Modified:</span>
                <span className="font-medium">{storageInfo?.lastModified || 'Calculating...'}</span>
              </div>
              <button
                onClick={calculateStorageInfo}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <Info size={16} className="mr-2" />
                Refresh Info
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 