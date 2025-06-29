import { useState, useMemo, useRef, useEffect } from 'react'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { useTradeStore } from '@/store/tradeStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Search, Filter, Download, ChevronUp, ChevronDown, Edit2, Trash2, Check, Calendar, Target, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { Dialog as PreviewDialog, DialogContent as PreviewDialogContent } from '@/components/ui/dialog'
import { SetupInput } from '@/components/ui/setup-input'
import { CoinInput } from '@/components/ui/coin-input'
import { RulesSelector } from '@/components/RulesSelector'

interface TradeEntry {
  id: string
  date: string
  lessons: string
  setup: string[]
  coin: string
  pnl: number
  outcome: 'win' | 'loss'
  tags: string[]
  mood: string
  images?: string[]
  notes?: string
  link?: string
  selectedRules?: string[]
}

interface SortConfig {
  key: keyof TradeEntry
  direction: 'asc' | 'desc'
}

interface FilterState {
  search: string
  outcome: 'all' | 'win' | 'loss'
  dateRange: {
    start: Date | null
    end: Date | null
  }
  tags: string[]
}

interface JournalProps {
  onNavigate?: (page: string, fromComponent?: string) => void
}

const ITEMS_PER_PAGE = 10

export function Journal({ onNavigate }: JournalProps) {
  const { entries, deleteEntry, updateEntry, settings } = useTradeStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TradeEntry | null>(null)
  const [isViewMode, setIsViewMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [imageViewer, setImageViewer] = useState<{ open: boolean, index: number }>({ open: false, index: 0 })
  const setupInputRef = useRef<HTMLInputElement>(null)
  const dummyRef = useRef<HTMLButtonElement>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ preview: string; name: string } | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [isDraggingUpload, setIsDraggingUpload] = useState(false)
  const [exportOption, setExportOption] = useState<'all' | 'page'>('all')

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    entries.forEach(entry => entry.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags)
  }, [entries])

  const filterEntries = (entries: TradeEntry[]) => {
    return entries.filter(entry => {
      const matchesSearch = searchQuery === '' || 
        entry.setup.some(setup => setup.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.coin && entry.coin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.mood && entry.mood.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.outcome.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesDateRange = !dateRange?.from || !dateRange?.to || 
        isWithinInterval(parseISO(entry.date), {
          start: dateRange.from,
          end: dateRange.to
        })

      return matchesSearch && matchesDateRange
    })
  }

  const sortEntries = (entries: TradeEntry[]) => {
    return [...entries].sort((a, b) => {
      if (sortConfig.key === 'date') {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
      }

      if (sortConfig.key === 'pnl') {
        return sortConfig.direction === 'asc' ? a.pnl - b.pnl : b.pnl - a.pnl
      }

      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })
  }

  const handleSort = (key: keyof TradeEntry) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRowSelect = (id: string) => {
    setSelectedRows(current => {
      const newSet = new Set(current)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return

    selectedRows.forEach(id => {
      deleteEntry(id)
    })

    toast({
      title: 'Success',
      description: `Deleted ${selectedRows.size} trade${selectedRows.size > 1 ? 's' : ''}`,
    })

    setSelectedRows(new Set())
  }

  const handleDelete = (id: string) => {
    setEntryToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete)
      toast({
        title: 'Success',
        description: 'Trade entry deleted',
      })
    }
    setIsDeleteDialogOpen(false)
    setEntryToDelete(null)
  }

  const handleEdit = (entry: TradeEntry) => {
    setEditingEntry(entry)
    setIsViewMode(true)
    setIsEditing(false)
  }

  const handleStartEdit = () => {
    setIsViewMode(false)
    setIsEditing(true)
  }

  const handleFormChange = (updatedEntry: Partial<TradeEntry>) => {
    if (editingEntry) {
      const entryToUpdate = {
        ...editingEntry,
        ...updatedEntry,
        setup: Array.isArray(updatedEntry.setup) ? updatedEntry.setup : typeof updatedEntry.setup === 'string' ? [updatedEntry.setup] : []
      }
      setEditingEntry(entryToUpdate)
    }
  }

  const handleSaveEdit = () => {
    if (editingEntry) {
      updateEntry(editingEntry.id, editingEntry)
      toast({
        title: 'Success',
        description: 'Trade entry updated',
      })
      setIsEditing(false)
      setIsViewMode(false)
      setEditingEntry(null)
    }
  }

  const paginatedEntries = useMemo(() => {
    const filtered = filterEntries(entries)
    const sorted = sortEntries(filtered)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [entries, searchQuery, dateRange, sortConfig, currentPage])

  const totalPages = Math.ceil(filterEntries(entries).length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const filteredEntries = filterEntries(entries)
    const totalTrades = filteredEntries.length
    const winningTrades = filteredEntries.filter(entry => entry.outcome === 'win').length
    const totalPnL = filteredEntries.reduce((sum, entry) => sum + entry.pnl, 0)
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    return {
      totalTrades,
      winRate,
      totalPnL
    }
  }, [entries, searchQuery, dateRange])

  const handleImageClick = (index: number) => {
    setImageViewer({ open: true, index })
  }

  // Handlers for pan/zoom overlay
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault()
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }
  const handleMouseUp = () => setIsDragging(false)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(scale * delta, 0.5), 3)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newPosition = {
      x: position.x - (x - position.x) * (delta - 1),
      y: position.y - (y - position.y) * (delta - 1)
    }
    setScale(newScale)
    setPosition(newPosition)
  }

  // Keyboard navigation for overlay
  useEffect(() => {
    if (!isPreviewOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPreviewOpen) return
      if (e.key === 'ArrowLeft') {
        if (editingEntry?.images && currentImageIndex > 0) {
          const prevImage = editingEntry.images[currentImageIndex - 1]
          if (prevImage) {
            setSelectedImage({ preview: prevImage, name: `Trade Image ${currentImageIndex}` })
            setCurrentImageIndex(currentImageIndex - 1)
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }
        }
      } else if (e.key === 'ArrowRight') {
        if (editingEntry?.images && currentImageIndex < editingEntry.images.length - 1) {
          const nextImage = editingEntry.images[currentImageIndex + 1]
          if (nextImage) {
            setSelectedImage({ preview: nextImage, name: `Trade Image ${currentImageIndex + 2}` })
            setCurrentImageIndex(currentImageIndex + 1)
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }
        }
      } else if (e.key === 'Escape') {
        setIsPreviewOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPreviewOpen, currentImageIndex, editingEntry])

  // Drag & drop upload (optional, if you want to support it in Journal)
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingUpload(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingUpload(false)
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingUpload(false)
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (!editingEntry || files.length === 0) return
    // You may want to add file size validation here
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })
      })
    )
    handleFormChange({ ...editingEntry, images: [...(editingEntry.images || []), ...processedFiles] })
  }
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingEntry || !e.target.files) return
    const files = Array.from(e.target.files)
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })
      })
    )
    handleFormChange({ ...editingEntry, images: [...(editingEntry.images || []), ...processedFiles] })
  }
  const handleRemoveImage = (index: number) => {
    if (!editingEntry) return
    handleFormChange({ ...editingEntry, images: editingEntry.images?.filter((_, i) => i !== index) })
  }

  // CSV Export functions
  const generateCSV = (entries: TradeEntry[]) => {
    const headers = ['Date', 'Coin', 'Setup', 'PnL', 'Outcome', 'Mood', 'Lessons', 'Notes']
    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        format(parseISO(entry.date), 'yyyy-MM-dd'),
        entry.coin || '',
        `"${entry.setup.join('; ')}"`,
        entry.pnl,
        entry.outcome,
        entry.mood,
        `"${entry.lessons.replace(/"/g, '""')}"`,
        `"${(entry.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')
    return csvContent
  }

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Journal</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <select
                value={exportOption}
                onChange={e => setExportOption(e.target.value as 'all' | 'page')}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: '36px' }}
                aria-label="Export option"
                disabled={entries.length === 0}
              >
                <option value="all">Export all</option>
                <option value="page">Export current page</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={() => {
                  const filtered = filterEntries(entries)
                  const toExport = exportOption === 'all' ? filtered : paginatedEntries
                  const csv = generateCSV(toExport)
                  downloadCSV(csv, 'trading-journal.csv')
                }}
                disabled={entries.length === 0}
                title={entries.length === 0 ? "No trade entries to export" : "Export trade data to CSV"}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {entries.length === 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  No data to export
                </span>
              )}
            </div>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Total Trades */}
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col justify-between h-full border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <div className="rounded-full p-2 bg-blue-50 dark:bg-blue-900/20">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-bold text-blue-600 mb-0.5">{stats.totalTrades}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Trades</div>
            </div>
          </Card>
          {/* Win Rate */}
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col justify-between h-full border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <div className="rounded-full p-2 bg-green-50 dark:bg-green-900/20">
                <Target className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-bold text-green-600 mb-0.5">{stats.winRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Win Rate</div>
            </div>
          </Card>
          {/* Total PnL */}
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col justify-between h-full border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <div className="rounded-full p-2 bg-emerald-50 dark:bg-emerald-900/20">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-1">
              <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'} mb-0.5`}>{stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total PnL</div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search coins, setups, mood or outcome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3"
            onClick={handleBulkDelete}
            disabled={selectedRows.size === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>

        {/* Journal Entries Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {paginatedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filterEntries(entries).length === 0 ? 'No trade entries yet' : 'No entries match your filters'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                {filterEntries(entries).length === 0 
                  ? 'Start tracking your trades by adding your first entry. This will help you analyze your performance and improve your trading strategy.'
                  : 'Try adjusting your search terms or date range to see more results.'
                }
              </p>
              {filterEntries(entries).length === 0 && (
                <Button 
                  className="mt-4"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('calendar', 'journal')
                    }
                  }}
                >
                  Add Your First Trade
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === paginatedEntries.length}
                        onChange={() => {
                          if (selectedRows.size === paginatedEntries.length) {
                            setSelectedRows(new Set())
                          } else {
                            setSelectedRows(new Set(paginatedEntries.map(entry => entry.id)))
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Setup
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PnL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Outcome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mood
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(entry.id)}
                          onChange={() => handleRowSelect(entry.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {format(parseISO(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300">
                          {entry.coin || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {entry.setup.map((setup, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
                            >
                              {setup}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${entry.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          entry.outcome === 'win' 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        }`}>
                          {entry.outcome.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300">
                          {entry.mood || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination - Only show if there are entries */}
        {paginatedEntries.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filterEntries(entries).length)} of {filterEntries(entries).length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isViewMode || isEditing} onOpenChange={(open) => {
          if (!open) {
            setIsViewMode(false)
            setIsEditing(false)
            setEditingEntry(null)
          }
        }}>
          <DialogContent
            className="sm:max-w-[95vw] md:max-w-[800px] p-4 w-full max-h-[90vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle id="edit-dialog-title" className="text-lg sm:text-xl font-semibold">
                {isViewMode ? 'Trade Entry Details' : 'Edit Trade Entry'}
              </DialogTitle>
              <DialogDescription id="edit-dialog-description" className="sr-only">
                {isViewMode ? 'View the details of your trade entry.' : 'Edit the details of your trade entry.'}
              </DialogDescription>
            </DialogHeader>
            {editingEntry && (
              <>
                {isViewMode ? (
                  // View Mode Content
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Setup</label>
                          <div className="w-full px-3 py-2 text-base text-gray-900 bg-gray-100 rounded-lg">
                            {editingEntry.setup.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {editingEntry.setup.map((setup, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {setup}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No setup specified</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Coin</label>
                          <div className="w-full px-3 py-2 text-base text-gray-900 bg-gray-100 rounded-lg">
                            {editingEntry.coin ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {editingEntry.coin}
                              </span>
                            ) : (
                              <span className="text-gray-400">No coin specified</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">P&L ($)</label>
                          <div className="w-full px-3 py-2 text-base text-gray-900 bg-gray-100 rounded-lg">
                            <span className={`font-medium ${editingEntry.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {editingEntry.pnl >= 0 ? '+' : ''}{editingEntry.pnl.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                          <div className="w-full px-3 py-2 text-base text-gray-900 bg-gray-100 rounded-lg">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              editingEntry.outcome === 'win' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {editingEntry.outcome.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                          <div className="w-full px-3 py-2 text-base text-gray-900 bg-gray-100 rounded-lg">
                            {editingEntry.mood ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                {editingEntry.mood}
                              </span>
                            ) : (
                              <span className="text-gray-400">No mood specified</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Trade Link</label>
                          <div className="w-full px-3 py-2 text-base text-gray-900 bg-gray-100 rounded-lg">
                            {editingEntry.link ? (
                              <a
                                href={editingEntry.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 hover:underline truncate block"
                              >
                                {editingEntry.link}
                              </a>
                            ) : (
                              <span className="text-gray-400">No link provided</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lessons Learned</label>
                          <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-100 rounded-lg overflow-y-auto" style={{ maxHeight: '96px', minHeight: '32px', wordBreak: 'break-word' }}>
                            {editingEntry.lessons || <span className="text-gray-400">No lessons recorded</span>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <div className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-100 rounded-lg overflow-y-auto" style={{ maxHeight: '96px', minHeight: '32px', wordBreak: 'break-word' }}>
                            {editingEntry.notes || <span className="text-gray-400">No notes recorded</span>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Trade Images</label>
                          <div className="flex space-x-5 overflow-x-auto py-2">
                            {editingEntry?.images?.length === 0 && (
                              <span className="text-gray-400 text-base flex items-center">No images uploaded</span>
                            )}
                            {editingEntry?.images?.map((img, idx) => (
                              <div key={idx} className="relative w-[160px] h-[110px] rounded-lg shadow border overflow-hidden group flex-shrink-0">
                                <img
                                  src={img}
                                  alt={`Trade Image ${idx + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    setSelectedImage({ preview: img, name: `Trade Image ${idx + 1}` })
                                    setCurrentImageIndex(idx)
                                    setScale(1)
                                    setPosition({ x: 0, y: 0 })
                                    setIsPreviewOpen(true)
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rules Section */}
                    <div className="mt-6">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white border-b pb-0.5 mb-3">Trading Rules Followed</h3>
                      <RulesSelector
                        selectedRules={editingEntry.selectedRules || []}
                        onRulesChange={(ruleIds) => handleFormChange({ ...editingEntry, selectedRules: ruleIds })}
                        className="mt-2"
                      />
                    </div>
                    
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsViewMode(false)
                          setIsEditing(false)
                          setEditingEntry(null)
                        }}
                        className="w-full sm:w-auto"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={handleStartEdit}
                        className="w-full sm:w-auto"
                      >
                        Edit Trade Entry
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  // Edit Mode Content
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Setup
                          </label>
                          <SetupInput
                            value={editingEntry.setup}
                            onChange={(value) => handleFormChange({ ...editingEntry, setup: value })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coin
                          </label>
                          <CoinInput
                            value={editingEntry.coin}
                            onChange={(value) => handleFormChange({ ...editingEntry, coin: value })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            P&L ($)
                          </label>
                          <input
                            type="number"
                            value={editingEntry.pnl}
                            onChange={(e) => handleFormChange({ ...editingEntry, pnl: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outcome
                          </label>
                          <select
                            value={editingEntry.outcome}
                            onChange={(e) => handleFormChange({ ...editingEntry, outcome: e.target.value as 'win' | 'loss' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="win">Win</option>
                            <option value="loss">Loss</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mood
                          </label>
                          <select
                            value={editingEntry.mood || ''}
                            onChange={(e) => handleFormChange({ ...editingEntry, mood: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="great">Great</option>
                            <option value="good">Good</option>
                            <option value="neutral">Neutral</option>
                            <option value="bad">Bad</option>
                            <option value="terrible">Terrible</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trade Link <span className="text-gray-400">(optional)</span>
                          </label>
                          <input
                            type="url"
                            value={editingEntry.link || ''}
                            onChange={(e) => handleFormChange({ ...editingEntry, link: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter trade link (e.g. chart, analysis, etc.)"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lessons Learned
                          </label>
                          <textarea
                            value={editingEntry.lessons || ''}
                            onChange={(e) => handleFormChange({ ...editingEntry, lessons: e.target.value })}
                            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <textarea
                            value={editingEntry.notes || ''}
                            onChange={(e) => handleFormChange({ ...editingEntry, notes: e.target.value })}
                            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trade Images
                          </label>
                          <div className="flex space-x-5 overflow-x-auto py-2">
                            {editingEntry?.images?.length === 0 && (
                              <span className="text-gray-400 text-base flex items-center">No photo uploaded</span>
                            )}
                            {editingEntry?.images?.map((img, idx) => (
                              <div key={idx} className="relative w-[160px] h-[110px] rounded-lg shadow border overflow-hidden group flex-shrink-0">
                                <img
                                  src={img}
                                  alt={`Trade Image ${idx + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    setSelectedImage({ preview: img, name: `Trade Image ${idx + 1}` })
                                    setCurrentImageIndex(idx)
                                    setScale(1)
                                    setPosition({ x: 0, y: 0 })
                                    setIsPreviewOpen(true)
                                  }}
                                />
                                <button
                                  onClick={e => { e.stopPropagation(); handleRemoveImage(idx); }}
                                  className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1.5 hover:bg-red-500 hover:text-white transition text-xl shadow"
                                  title="Delete"
                                >×</button>
                              </div>
                            ))}
                            <label
                              className={
                                `flex items-center justify-center w-[160px] h-[110px] border-2 border-dashed rounded-lg cursor-pointer transition-colors flex-shrink-0 ` +
                                (isDraggingUpload
                                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500')
                              }
                              onDragEnter={handleDragEnter}
                              onDragLeave={handleDragLeave}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                              />
                              <span className="text-lg text-gray-500 dark:text-gray-400 text-center">
                                +<br />Upload or drag & drop images
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setIsViewMode(false)
                          setEditingEntry(null)
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveEdit}
                        className="w-full sm:w-auto"
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trade Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this trade entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Move the fullscreen overlay here, outside the modal */}
      {isPreviewOpen && selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 pointer-events-auto">
          {/* Controls overlayed at top-right */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              onClick={() => { const newScale = Math.min(scale * 1.1, 3); setScale(newScale); }}
              className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              title="Zoom in"
            >+
            </button>
            <button
              onClick={() => { const newScale = Math.max(scale / 1.1, 0.5); setScale(newScale); }}
              className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              title="Zoom out"
            >-
            </button>
            <button
              onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
              className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              title="Reset zoom"
            >Reset
            </button>
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
              title="Close"
            >×
            </button>
          </div>
          {/* Image with pan/zoom */}
          <div
            ref={imageContainerRef}
            className="relative flex items-center justify-center w-full h-full cursor-pointer select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
          >
            <img
              src={selectedImage.preview}
              alt={selectedImage.name}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                willChange: 'transform',
                transformOrigin: 'center center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'all',
              }}
              draggable="false"
            />
            {/* Navigation controls at bottom center if multiple images */}
            {editingEntry?.images && editingEntry.images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                <button
                  onClick={() => {
                    if (currentImageIndex > 0 && editingEntry?.images?.[currentImageIndex - 1]) {
                      const prevImage = editingEntry.images[currentImageIndex - 1]
                      setSelectedImage({ preview: prevImage, name: `Trade Image ${currentImageIndex}` })
                      setCurrentImageIndex(currentImageIndex - 1)
                      setScale(1)
                      setPosition({ x: 0, y: 0 })
                    }
                  }}
                  disabled={currentImageIndex === 0 || !(editingEntry?.images?.length > 1)}
                  className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous image"
                >←
                </button>
                <span className="px-3 py-2 bg-black/60 text-white rounded-full">
                  {currentImageIndex + 1} / {editingEntry?.images?.length || 0}
                </span>
                <button
                  onClick={() => {
                    if (
                      editingEntry?.images &&
                      currentImageIndex < editingEntry.images.length - 1 &&
                      editingEntry.images[currentImageIndex + 1]
                    ) {
                      const nextImage = editingEntry.images[currentImageIndex + 1]
                      setSelectedImage({ preview: nextImage, name: `Trade Image ${currentImageIndex + 2}` })
                      setCurrentImageIndex(currentImageIndex + 1)
                      setScale(1)
                      setPosition({ x: 0, y: 0 })
                    }
                  }}
                  disabled={
                    !editingEntry?.images ||
                    currentImageIndex === (editingEntry.images?.length || 0) - 1
                  }
                  className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next image"
                >→
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 