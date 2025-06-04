import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTradeStore } from '../store/tradeStore'

export function Settings() {
  const { settings, updateSettings } = useTradeStore()

  const handleExport = () => {
    const data = localStorage.getItem('trade-store')
    if (data) {
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'trade-data.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        if (typeof data === 'string') {
          localStorage.setItem('trade-store', data)
          // Reload the app to reflect changes
          window.location.reload()
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={settings.currency}
                onChange={(e) =>
                  updateSettings({ currency: e.target.value })
                }
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Format</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={settings.dateFormat}
                onChange={(e) =>
                  updateSettings({ dateFormat: e.target.value })
                }
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={settings.theme}
                onChange={(e) =>
                  updateSettings({
                    theme: e.target.value as 'light' | 'dark',
                  })
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
                onClick={handleExport}
              >
                Export Data
              </button>
              <label className="rounded-md bg-primary px-4 py-2 text-primary-foreground cursor-pointer">
                Import Data
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 