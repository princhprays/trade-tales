import { useState, useMemo } from 'react'
import { format, parseISO, isWithinInterval } from 'date-fns'
import { useTradeStore } from '@/store/tradeStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Search, Filter, Download, ChevronUp, ChevronDown, Edit2, Trash2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'
import { Dialog as PreviewDialog, DialogContent as PreviewDialogContent } from '@/components/ui/dialog'

interface TradeEntry {
  id: string
  date: string
  lessons: string
  setup: string
  pnl: number
  outcome: 'win' | 'loss'
  tags: string[]
  mood: string
  images?: string[]
  notes?: string
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

const ITEMS_PER_PAGE = 10

export function Journal() {
  const { entries, deleteEntry, updateEntry, settings } = useTradeStore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TradeEntry | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    entries.forEach(entry => entry.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags)
  }, [entries])

  const filterEntries = (entries: TradeEntry[]) => {
    return entries.filter(entry => {
      const matchesSearch = searchQuery === '' || 
        entry.setup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase())

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
    setIsEditing(true)
  }

  const handleSaveEdit = (updatedEntry: Partial<TradeEntry>) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, updatedEntry)
      toast({
        title: 'Success',
        description: 'Trade entry updated',
      })
      setIsEditing(false)
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

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Journal</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-500">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalTrades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-500">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.winRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-500">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl sm:text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white text-gray-900 border border-gray-300 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full sm:w-auto"
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setDateRange(undefined)
              }}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Trade Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Date
                        {sortConfig.key === 'date' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">
                      <button
                        onClick={() => handleSort('setup')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Setup
                        {sortConfig.key === 'setup' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">
                      <button
                        onClick={() => handleSort('pnl')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        P&L
                        {sortConfig.key === 'pnl' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">
                      <button
                        onClick={() => handleSort('outcome')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Outcome
                        {sortConfig.key === 'outcome' && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(entry.id)}
                          onChange={() => handleRowSelect(entry.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(parseISO(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.setup}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={entry.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entry.outcome === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBulkDelete}
              disabled={selectedRows.size === 0}
              className="text-sm"
            >
              Delete Selected ({selectedRows.size})
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-sm"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-sm"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-semibold">
                Edit Trade Entry
              </DialogTitle>
            </DialogHeader>
            {editingEntry && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Setup
                      </label>
                      <input
                        type="text"
                        value={editingEntry.setup}
                        onChange={(e) => handleSaveEdit({ ...editingEntry, setup: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        P&L (%)
                      </label>
                      <input
                        type="number"
                        value={editingEntry.pnl}
                        onChange={(e) => handleSaveEdit({ ...editingEntry, pnl: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Outcome
                      </label>
                      <select
                        value={editingEntry.outcome}
                        onChange={(e) => handleSaveEdit({ ...editingEntry, outcome: e.target.value as 'win' | 'loss' })}
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
                        onChange={(e) => handleSaveEdit({ ...editingEntry, mood: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="great">Great</option>
                        <option value="good">Good</option>
                        <option value="neutral">Neutral</option>
                        <option value="bad">Bad</option>
                        <option value="terrible">Terrible</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lessons Learned
                      </label>
                      <textarea
                        value={editingEntry.lessons || ''}
                        onChange={(e) => handleSaveEdit({ ...editingEntry, lessons: e.target.value })}
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={editingEntry.notes || ''}
                        onChange={(e) => handleSaveEdit({ ...editingEntry, notes: e.target.value })}
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trade Images
                      </label>
                      <div className="grid grid-cols-2 xs:grid-cols-3 gap-1 xs:gap-2">
                        {editingEntry.images && editingEntry.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Trade Image ${idx + 1}`}
                              className="w-full h-16 xs:h-20 sm:h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setPreviewImage(img)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </>
            )}
            {/* Image Preview Dialog (always rendered, controlled by previewImage state) */}
            <PreviewDialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
              <PreviewDialogContent className="w-[95vw] xs:w-[90vw] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] p-0 dark:bg-gray-800">
                {previewImage && (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                    />
                  </div>
                )}
              </PreviewDialogContent>
            </PreviewDialog>
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
    </div>
  )
} 