import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTradeStore } from '../store/tradeStore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { toast } from './ui/use-toast'
import { Loader2, Trash2 } from 'lucide-react'

export function Settings() {
  const { settings, updateSettings, clearAllData } = useTradeStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExport = () => {
    try {
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
        toast({
          title: "Success",
          description: "Data exported successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          if (typeof data === 'string') {
            localStorage.setItem('trade-store', data)
            toast({
              title: "Success",
              description: "Data imported successfully",
            })
            // Reload the app to reflect changes
            window.location.reload()
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to import data",
            variant: "destructive",
          })
        }
      }
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the file",
          variant: "destructive",
        })
      }
      reader.readAsText(file)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await clearAllData()
      toast({
        title: "Success",
        description: "All data has been deleted",
      })
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete data",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 min-w-0 space-y-8">
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
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={handleExport}
              >
                Export Data
              </button>
              <label className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                Import Data
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete All Data
                    </>
                  )}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your trade data,
                    including entries, settings, and statistics.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  >
                    Delete All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 