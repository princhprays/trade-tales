import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { useTradeStore } from '../store/tradeStore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface TradeEntryForm {
  lessons: string
  setup: string
  pnl: number | string
  outcome: 'win' | 'loss'
  tags: string[]
  mood: string
  notes?: string
  images?: Array<{
    name: string
    preview: string
    data: string
  }>
  lastSaved?: string
}

export function Calendar() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<TradeEntryForm>({
    lessons: '',
    setup: '',
    pnl: 0,
    outcome: 'win',
    tags: [],
    mood: 'neutral',
    notes: '',
    images: [],
  })
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0)
  const [previewImage, setPreviewImage] = useState<null | { preview: string; name: string }>(null)

  const { entries, addEntry, deleteEntry, updateEntry } = useTradeStore()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay()) // Start from Sunday

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: monthEnd
  })

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    const dayEntries = entries.filter(entry => entry.date === date)
    if (dayEntries.length > 0) {
      setSelectedTradeIndex(0) // Start with the first trade
      setFormData({
        lessons: dayEntries[0].lessons || '',
        setup: dayEntries[0].setup || '',
        pnl: dayEntries[0].pnl || 0,
        outcome: dayEntries[0].outcome || 'win',
        tags: dayEntries[0].tags || [],
        mood: dayEntries[0].mood || 'neutral',
        notes: dayEntries[0].notes || '',
        images: dayEntries[0].images?.map(img => ({
          name: img,
          preview: img,
          data: img
        })) || [],
        lastSaved: dayEntries[0].lastSaved || new Date().toISOString(),
      })
      setIsEditing(true)
    } else {
      setFormData({
        lessons: '',
        setup: '',
        pnl: 0,
        outcome: 'win',
        tags: [],
        mood: 'neutral',
        notes: '',
        images: [],
      })
      setIsEditing(false)
    }
    setIsDialogOpen(true)
  }

  const handleTradeSelect = (index: number) => {
    if (!selectedDate) return
    const dayEntries = entries.filter(entry => entry.date === selectedDate)
    if (dayEntries[index]) {
      setSelectedTradeIndex(index)
      setFormData({
        lessons: dayEntries[index].lessons || '',
        setup: dayEntries[index].setup || '',
        pnl: dayEntries[index].pnl || 0,
        outcome: dayEntries[index].outcome || 'win',
        tags: dayEntries[index].tags || [],
        mood: dayEntries[index].mood || 'neutral',
        notes: dayEntries[index].notes || '',
        images: dayEntries[index].images?.map(img => ({
          name: img,
          preview: img,
          data: img
        })) || [],
        lastSaved: dayEntries[index].lastSaved || new Date().toISOString(),
      })
    }
  }

  const handleAddNewTrade = () => {
    // Reset form for new trade while keeping the same date
    setFormData({
      lessons: '',
      setup: '',
      pnl: 0,
      outcome: 'win',
      tags: [],
      mood: 'neutral',
      notes: '',
      images: [],
    })
    setIsEditing(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const imagePreviews = await Promise.all(
        files.map(async (file) => {
          return new Promise<{ name: string; preview: string; data: string }>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64String = reader.result as string
              resolve({
                name: file.name,
                preview: base64String,
                data: base64String
              })
            }
            reader.readAsDataURL(file)
          })
        })
      )
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...imagePreviews]
      }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSaveEntry = () => {
    if (selectedDate) {
      const entryData = {
        date: selectedDate,
        ...formData,
        pnl: Number(formData.pnl),
        lastSaved: new Date().toISOString(),
        images: formData.images?.map(img => img.data) || []
      }

      if (isEditing) {
        // Find the existing entry and update it
        const dayEntries = entries.filter(entry => entry.date === selectedDate)
        if (dayEntries[selectedTradeIndex]) {
          updateEntry(dayEntries[selectedTradeIndex].id, entryData)
        }
      } else {
        // Add new entry
        addEntry(entryData)
      }

      setIsDialogOpen(false)
      setFormData({
        lessons: '',
        setup: '',
        pnl: 0,
        outcome: 'win',
        tags: [],
        mood: 'neutral',
        notes: '',
        images: [],
      })
      setIsEditing(false)
      setSelectedTradeIndex(0)
    }
  }

  const handleDeleteEntry = () => {
    if (selectedDate) {
      const dayEntries = entries.filter(entry => entry.date === selectedDate)
      if (dayEntries[selectedTradeIndex]) {
        deleteEntry(dayEntries[selectedTradeIndex].id)
        // If there are more trades, show the next one
        if (dayEntries.length > 1) {
          const nextIndex = Math.min(selectedTradeIndex, dayEntries.length - 2)
          handleTradeSelect(nextIndex)
        } else {
          setIsDialogOpen(false)
          setFormData({
            lessons: '',
            setup: '',
            pnl: 0,
            outcome: 'win',
            tags: [],
            mood: 'neutral',
            notes: '',
            images: [],
          })
          setIsEditing(false)
          setSelectedTradeIndex(0)
        }
      }
    }
  }

  const monthEntries = entries.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
  })
  const monthPnl = monthEntries.reduce((sum, entry) => sum + entry.pnl, 0)
  const monthTradeCount = monthEntries.length
  const monthWinCount = monthEntries.filter(e => e.outcome === 'win').length
  const monthWinRate = monthTradeCount > 0 ? (monthWinCount / monthTradeCount) * 100 : 0

  // Calculate average win and loss for risk/reward ratio
  const winningTrades = monthEntries.filter(e => e.outcome === 'win')
  const losingTrades = monthEntries.filter(e => e.outcome === 'loss')
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, e) => sum + e.pnl, 0) / winningTrades.length : 0
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, e) => sum + e.pnl, 0) / losingTrades.length) : 0
  const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '0.00'

  // Find best and worst trades with dates
  const bestTrade = monthEntries.length > 0 ? monthEntries.reduce((best, current) => 
    current.pnl > best.pnl ? current : best
  ) : null
  const worstTrade = monthEntries.length > 0 ? monthEntries.reduce((worst, current) => 
    current.pnl < worst.pnl ? current : worst
  ) : null

  return (
    <div className="w-full h-full flex min-h-0 min-w-0">
      {/* Calendar Card */}
      <Card className="bg-white text-black border-gray-200 shadow-md flex-1 mr-8">
        <CardHeader>
          <CardTitle>Trade Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <button onClick={handlePrevMonth} className="p-2 text-lg hover:bg-gray-100">&#8592;</button>
              <button onClick={handleNextMonth} className="p-2 text-lg hover:bg-gray-100">&#8594;</button>
            </div>
            <span className="font-semibold text-lg">{format(currentDate, 'MMMM yyyy')}</span>
            <div className="w-[88px]"></div>
          </div>
          
          <div className="w-full">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center py-3 text-base font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-x border-b">
              {calendarDays.map((day: Date, i: number) => {
                const dateString = format(day, 'yyyy-MM-dd')
                const dayEntries = entries.filter((entry) => entry.date === dateString)
                const dayPnl = dayEntries.reduce((sum, entry) => sum + entry.pnl, 0)
                const tradeCount = dayEntries.length
                const isCurrentMonth = isSameMonth(day, currentDate)
                // Calculate win/loss count for the day
                const winCount = dayEntries.filter(e => e.outcome === 'win').length
                const lossCount = dayEntries.filter(e => e.outcome === 'loss').length
                let dayColor = 'text-gray-600'
                if (tradeCount > 0) {
                  if (lossCount > winCount) {
                    dayColor = 'text-red-600'
                  } else if (winCount > lossCount) {
                    dayColor = 'text-green-600'
                  }
                }
                // Professional terms and calculations
                const totalVolume = dayEntries.reduce((sum, entry) => sum + Math.abs(Number(entry.pnl)), 0)
                const totalEarned = dayEntries.filter(e => e.outcome === 'win').reduce((sum, e) => sum + Math.abs(Number(e.pnl)), 0)
                const totalLost = dayEntries.filter(e => e.outcome === 'loss').reduce((sum, e) => sum + Math.abs(Number(e.pnl)), 0)
                
                return (
                  <div
                    key={i}
                    onClick={() => isCurrentMonth && handleDateClick(dateString)}
                    className={`
                      min-h-[120px] border-r border-b p-2
                      ${isCurrentMonth ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'}
                      ${isToday(day) ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className="text-base text-gray-500 mb-2">{format(day, 'd')}</div>
                    {isCurrentMonth && tradeCount > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">Total Volume: {totalVolume.toFixed(2)}</div>
                        <div className="text-sm font-bold">
                          <span className="text-green-600">Earned: +{totalEarned.toFixed(2)}</span>
                          {" | "}
                          <span className="text-red-600">Lost: {totalLost.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {tradeCount} trade{tradeCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-[280px] space-y-8">
        {/* Monthly Summary Card */}
        <Card className="bg-white text-black border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total PnL */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Total PnL</div>
                <div className={`text-2xl font-bold ${monthPnl > 0 ? 'text-green-600' : monthPnl < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {monthPnl > 0 ? '+' : ''}{monthPnl.toFixed(2)}
                </div>
              </div>
              {/* Win Rate */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Win Rate</div>
                <div className="text-2xl font-bold">{monthWinRate.toFixed(1)}%</div>
              </div>
              {/* Total Trades */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Total Trades</div>
                <div className="text-2xl font-bold">{monthTradeCount}</div>
              </div>
              {/* Average PnL */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Avg PnL</div>
                <div className={`text-2xl font-bold ${monthTradeCount > 0 ? (monthPnl / monthTradeCount > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-700'}`}>
                  {monthTradeCount > 0 ? (monthPnl / monthTradeCount).toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics Card */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Trade Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Risk/Reward Ratio */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Risk/Reward Ratio</div>
                <div className="text-xl font-bold">{riskRewardRatio}</div>
                <div className="text-xs text-gray-500">
                  Avg Win: {avgWin.toFixed(2)} | Avg Loss: {avgLoss.toFixed(2)}
                </div>
              </div>
              {/* Best Trade */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Best Trade</div>
                <div className="text-xl font-bold text-green-600">
                  {bestTrade ? '+' + bestTrade.pnl.toFixed(2) : '0.00'}
                </div>
                <div className="text-xs text-gray-500">
                  {bestTrade ? format(new Date(bestTrade.date), 'MMM d, yyyy') : '-'}
                </div>
              </div>
              {/* Worst Trade */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Worst Trade</div>
                <div className="text-xl font-bold text-red-600">
                  {worstTrade ? worstTrade.pnl.toFixed(2) : '0.00'}
                </div>
                <div className="text-xs text-gray-500">
                  {worstTrade ? format(new Date(worstTrade.date), 'MMM d, yyyy') : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            if (previewImage) {
              setPreviewImage(null); // Close the image preview first
            } else {
              setIsDialogOpen(false); // Then close the modal
            }
          } else {
            setIsDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-xl w-full max-h-[90vh] p-0 rounded-2xl shadow-2xl border bg-white flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Trade Entry' : 'New Trade Entry'}
            </DialogTitle>
            <div className="text-xs text-gray-500 mt-1">
              {selectedDate && format(new Date(selectedDate), 'MMMM d, yyyy')}
            </div>
            {selectedDate && entries.filter(e => e.date === selectedDate).length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">
                  Trade {selectedTradeIndex + 1} of {entries.filter(e => e.date === selectedDate).length}
                </span>
                <div className="flex gap-1">
                  {entries
                    .filter(e => e.date === selectedDate)
                    .map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleTradeSelect(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 border ${
                          index === selectedTradeIndex 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'bg-gray-300 border-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-6 py-4 flex-1">
            {/* Trade Details */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Trade Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Setup</label>
                  <input
                    type="text"
                    placeholder="Enter trade setup"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    value={formData.setup}
                    onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">PnL</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${formData.outcome === 'loss' ? 'text-red-600' : formData.outcome === 'win' ? 'text-green-600' : ''}`}
                    value={formData.pnl}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === '') {
                        setFormData({ ...formData, pnl: '' });
                        return;
                      }
                      if (/^-?\d*\.?\d*$/.test(val)) {
                        setFormData({ ...formData, pnl: val });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Outcome</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value as 'win' | 'loss' })}
                  >
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mood</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  >
                    <option value="confident">Confident</option>
                    <option value="neutral">Neutral</option>
                    <option value="anxious">Anxious</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Analysis</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Lessons Learned</label>
                <textarea
                  placeholder="What did you learn from this trade?"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
                  value={formData.lessons}
                  onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                />
              </div>
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <input
                  type="text"
                  placeholder="Enter tags separated by commas"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={formData.tags.join(', ')}
                  onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Additional Notes</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  placeholder="Any additional notes about the trade..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Screenshots & Charts */}
            <div className="mb-2">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Screenshots & Charts</h3>
              <label className="text-sm font-medium text-gray-700">Upload Files</label>
              <div className="relative mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  Choose files
                </label>
              </div>
              {formData.images && formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(image)}
                        className="block cursor-zoom-in w-full h-full"
                        tabIndex={0}
                        aria-label={`Preview ${image.name}`}
                      >
                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center transition-shadow hover:shadow-lg">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBsb2FkIGVycm9yPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        </div>
                      </button>
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-white text-gray-600 rounded-full shadow hover:bg-red-500 hover:text-white opacity-80 group-hover:opacity-100 transition"
                        aria-label="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l8 8M6 14L14 6" /></svg>
                      </button>
                      <div className="mt-2 text-xs text-gray-600 truncate px-1">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="flex flex-row gap-2 px-6 py-4 border-t bg-gray-50">
            {isEditing && (
              <button
                className="rounded-md border border-red-600 text-red-600 px-4 py-2 font-semibold hover:bg-red-50 transition"
                onClick={handleDeleteEntry}
              >
                Delete Entry
              </button>
            )}
            {isEditing && (
              <button
                className="rounded-md border border-gray-400 text-gray-700 px-4 py-2 font-semibold hover:bg-gray-100 transition"
                onClick={handleAddNewTrade}
              >
                Add Another Trade
              </button>
            )}
            <button
              className={`ml-auto rounded-md px-4 py-2 font-semibold text-white shadow-sm focus:outline-none focus:ring-2 transition ${
                isEditing 
                  ? 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500/20' 
                  : 'bg-green-600 hover:bg-green-500 focus:ring-green-500/20'
              }`}
              onClick={handleSaveEntry}
            >
              {isEditing ? 'Update Trade' : 'Add Trade'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal for Image Preview (now outside Dialog) */}
      {previewImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 animate-fade-in">
          <div className="relative max-w-2xl w-full mx-4">
            <button
              className="absolute top-2 right-2 p-2 rounded-full bg-white text-gray-700 shadow hover:bg-red-500 hover:text-white transition"
              onClick={() => setPreviewImage(null)}
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img
              src={previewImage.preview}
              alt={previewImage.name}
              className="w-full max-h-[80vh] object-contain rounded-lg bg-white"
            />
            <div className="mt-2 text-center text-xs text-white">{previewImage.name}</div>
          </div>
        </div>
      )}
    </div>
  )
} 