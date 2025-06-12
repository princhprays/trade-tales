import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTradeStore } from '../store/tradeStore'
import { Moon, Sun, Download, Upload, Trash2, Info } from 'lucide-react'
import { format } from 'date-fns'
import localforage from 'localforage'
import { ThemeToggle } from './ui/ThemeToggle'
import { Button } from './ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from './ui/alert-dialog'
import { toast } from './ui/use-toast'

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
  const [importProgress, setImportProgress] = useState(0)
  const [exportProgress, setExportProgress] = useState(0)

  // Constants for data management
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const CURRENT_VERSION = '1.0.0'

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
          if (item && typeof item === 'object' && 'lastSaved' in item) {
            const date = new Date((item as any).lastSaved)
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
    setExportProgress(0)
    try {
      // Get all unique coins and setups from entries
      const uniqueCoins = new Set<string>()
      const uniqueSetups = new Set<string>()

      entries.forEach(entry => {
        if (entry.coin) uniqueCoins.add(entry.coin.toUpperCase())
        if (entry.setup) {
          if (Array.isArray(entry.setup)) {
            entry.setup.forEach((setup: string) => uniqueSetups.add(setup.trim()))
          } else if (typeof entry.setup === 'string') {
            uniqueSetups.add(entry.setup.trim())
          }
        }
      })

      // Merge with existing custom coins and setups
      const mergedCustomCoins = [...new Set([
        ...(settings.customCoins || []),
        ...Array.from(uniqueCoins)
      ])]

      const mergedCustomSetups = [...new Set([
        ...(settings.customSetups || []),
        ...Array.from(uniqueSetups)
      ])]

      const data = {
        entries,
        settings: {
          ...settings,
          customCoins: mergedCustomCoins,
          customSetups: mergedCustomSetups
        },
        exportDate: new Date().toISOString(),
        version: CURRENT_VERSION
      }

      // Simulate progress for large datasets
      const totalSteps = 3
      setExportProgress(20) // Start progress

      // Prepare data
      const jsonString = JSON.stringify(data, null, 2)
      setExportProgress(60) // Data prepared

      // Create and download file
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trade-data-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setExportProgress(100) // Complete
      setTimeout(() => setExportProgress(0), 1000) // Reset progress after 1 second
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Import data
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    try {
      setImportProgress(20) // Start progress

      const text = await file.text()
      const data = JSON.parse(text)
      
      // Validate data structure
      if (!data.entries) {
        throw new Error('Invalid data format: Missing entries')
      }

      // Check version compatibility
      if (data.version) {
        const [major] = data.version.split('.')
        const [currentMajor] = CURRENT_VERSION.split('.')
        if (parseInt(major) > parseInt(currentMajor)) {
          throw new Error(`Incompatible data version. Please update the application.`)
        }
      }

      setImportProgress(40) // Data validated

      // Handle older data format
      const processedEntries = data.entries.map((entry: any) => {
        // Normalize date format if needed
        let date = entry.date
        if (date) {
          try {
            // Try to parse the date to ensure it's in ISO format
            const parsedDate = new Date(date)
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
            }
          } catch (e) {
            console.warn('Invalid date format:', date)
          }
        }

        // Normalize PnL to ensure it's a number
        let pnl = entry.pnl
        if (typeof pnl === 'string') {
          pnl = parseFloat(pnl)
        }
        if (isNaN(pnl)) {
          pnl = 0
        }

        // Normalize outcome
        let outcome = entry.outcome
        if (typeof outcome === 'string') {
          outcome = outcome.toLowerCase()
          if (outcome !== 'win' && outcome !== 'loss') {
            outcome = pnl >= 0 ? 'win' : 'loss'
          }
        } else {
          outcome = pnl >= 0 ? 'win' : 'loss'
        }

        // Ensure all required fields exist with defaults
        return {
          id: entry.id || crypto.randomUUID(),
          date: date || new Date().toISOString().split('T')[0],
          lessons: entry.lessons || '',
          setup: entry.setup || '',
          coin: entry.coin || '',
          pnl: pnl,
          outcome: outcome,
          tags: Array.isArray(entry.tags) ? entry.tags : [],
          mood: entry.mood || 'neutral',
          notes: entry.notes || '',
          images: Array.isArray(entry.images) ? entry.images : [],
          lastSaved: entry.lastSaved || new Date().toISOString(),
          positionSize: typeof entry.positionSize === 'number' ? entry.positionSize : undefined,
          leverage: typeof entry.leverage === 'number' ? entry.leverage : undefined,
          link: entry.link || ''
        }
      })

      setImportProgress(60) // Entries processed

      // Extract unique coins and setups from imported entries
      const uniqueCoins = new Set<string>()
      const uniqueSetups = new Set<string>()

      processedEntries.forEach((entry: any) => {
        if (entry.coin) uniqueCoins.add(entry.coin.toUpperCase())
        if (entry.setup) {
          if (Array.isArray(entry.setup)) {
            entry.setup.forEach((setup: string) => uniqueSetups.add(setup.trim()))
          } else if (typeof entry.setup === 'string') {
            uniqueSetups.add(entry.setup.trim())
          }
        }
      })

      setImportProgress(80) // Data extracted

      // Handle older settings format
      const defaultSettings = {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light',
        initialCapital: 0,
        customCoins: [],
        customSetups: []
      }

      const importedSettings = data.settings || defaultSettings

      // Merge custom coins and setups from imported data
      const mergedCustomCoins = [...new Set([
        ...(importedSettings.customCoins || []),
        ...Array.from(uniqueCoins)
      ])]

      const mergedCustomSetups = [...new Set([
        ...(importedSettings.customSetups || []),
        ...Array.from(uniqueSetups)
      ])]

      // Update store with imported data and merged custom coins/setups
      useTradeStore.setState((state) => ({
        entries: processedEntries,
        settings: {
          ...defaultSettings,
          ...importedSettings,
          customCoins: mergedCustomCoins,
          customSetups: mergedCustomSetups
        }
      }))

      setImportProgress(100) // Complete
      setTimeout(() => setImportProgress(0), 1000) // Reset progress after 1 second

      alert('Data imported successfully!')
    } catch (error) {
      console.error('Error importing data:', error)
      alert(error instanceof Error ? error.message : 'Error importing data. Please check the file format.')
    } finally {
      setIsImporting(false)
    }
  }

  // Clear all data with confirmation
  const handleClearData = () => {
    if (showConfirmClear) {
      clearAllData()
      setShowConfirmClear(false)
      toast({
        title: "Data Cleared",
        description: "All trading data has been permanently deleted.",
        variant: "destructive"
      })
    } else {
      setShowConfirmClear(true)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            App Version: 1.0.0
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preferences Card */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* Theme Toggle */}
                <div>
                  <div className="mb-2 font-medium text-gray-800 dark:text-gray-200">Theme</div>
                  <ThemeToggle />
                </div>
                {/* Currency Select */}
                <div>
                  <div className="mb-2 font-medium text-gray-800 dark:text-gray-200">Currency</div>
                  <select
                    value={settings.currency}
                    onChange={(e) => updateSettings({ currency: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                {/* Date Format Select */}
                <div>
                  <div className="mb-2 font-medium text-gray-800 dark:text-gray-200">Date Format</div>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {DATE_FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Download your trading data as JSON</p>
                </div>
                <div className="flex items-center gap-2">
                  {exportProgress > 0 && (
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Import Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Import trading data from JSON file (max 10MB)</p>
                </div>
                <div className="flex items-center gap-2">
                  {importProgress > 0 && (
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  )}
                  <label className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-50">
                    <Upload size={20} />
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                      disabled={isImporting}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Clear All Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete all trading data</p>
                </div>
                <div className="flex items-center gap-2">
                  {showConfirmClear && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearData}
                        className="h-9 px-3"
                      >
                        Confirm Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConfirmClear(false)}
                        className="h-9 px-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {!showConfirmClear && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearData}
                      className="h-9 px-3"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Data
                    </Button>
                  )}
                </div>
              </div>

              {storageInfo && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Storage Info</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Size: {storageInfo.size} | Last Modified: {storageInfo.lastModified}
                      </p>
                    </div>
                    <button
                      onClick={calculateStorageInfo}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Info size={20} />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Alert Dialog for Clear Data Confirmation */}
      <AlertDialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>Are you absolutely sure you want to clear all trading data? This action cannot be undone.</p>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-red-600 dark:text-red-400">
                    <li>All trade entries</li>
                    <li>Custom coins and setups</li>
                    <li>All settings and preferences</li>
                    <li>All images and attachments</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmClear(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Yes, Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 