import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useTradeStore } from '@/store/tradeStore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Professional color scheme
const COLORS = {
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    hover: '#F3F4F6',
    today: '#EFF6FF',
    selected: '#DBEAFE'
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF'
  },
  trade: {
    profit: {
      light: '#D1FAE5',
      medium: '#10B981',
      dark: '#059669'
    },
    loss: {
      light: '#FEE2E2',
      medium: '#EF4444',
      dark: '#DC2626'
    }
  },
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB'
  }
}

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

// Add form validation interface
interface FormErrors {
  setup?: string
  pnl?: string
  lessons?: string
  tags?: string
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
  const [selectedImage, setSelectedImage] = useState<{ preview: string; name: string } | null>(null)

  const { entries, addEntry, deleteEntry, updateEntry, settings } = useTradeStore()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [charCount, setCharCount] = useState({ lessons: 0, notes: 0 })

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
      const entry = dayEntries[0]
      setFormData({
        lessons: entry.lessons || '',
        setup: entry.setup || '',
        pnl: entry.pnl || 0,
        outcome: entry.outcome || 'win',
        tags: entry.tags || [],
        mood: entry.mood || 'neutral',
        notes: entry.notes || '',
        images: entry.images?.map(img => ({
          name: 'Trade Image',
          preview: img,
          data: img
        })) || [],
        lastSaved: entry.lastSaved || new Date().toISOString(),
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
      const entry = dayEntries[index]
      setSelectedTradeIndex(index)
      setFormData({
        lessons: entry.lessons || '',
        setup: entry.setup || '',
        pnl: entry.pnl || 0,
        outcome: entry.outcome || 'win',
        tags: entry.tags || [],
        mood: entry.mood || 'neutral',
        notes: entry.notes || '',
        images: entry.images?.map(img => ({
          name: 'Trade Image',
          preview: img,
          data: img
        })) || [],
        lastSaved: entry.lastSaved || new Date().toISOString(),
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
      
      // Validate file size (5MB limit)
      const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
      
      if (validFiles.length !== files.length) {
        toast({
          title: 'File too large',
          description: 'Some files were skipped because they exceed 5MB limit',
          variant: 'destructive'
        })
      }

      try {
        const imagePreviews = await Promise.all(
          validFiles.map(async (file) => {
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
              reader.onerror = () => {
                toast({
                  title: 'Error',
                  description: `Failed to read file: ${file.name}`,
                  variant: 'destructive'
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

        toast({
          title: 'Success',
          description: `Added ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}`,
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to process images',
          variant: 'destructive'
        })
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }))
  }

  // Add validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.setup.trim()) {
      newErrors.setup = 'Setup is required'
    }
    
    if (formData.pnl === '' || isNaN(Number(formData.pnl))) {
      newErrors.pnl = 'Valid P&L amount is required'
    }
    
    if (formData.lessons.length > 500) {
      newErrors.lessons = 'Lessons must be less than 500 characters'
    }
    
    if (formData.tags.some(tag => tag.length > 20)) {
      newErrors.tags = 'Tags must be less than 20 characters each'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enhanced save handler with validation and loading state
  const handleSaveEntry = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      if (selectedDate) {
        // Convert images to the format expected by the store
        const images = formData.images?.map(img => img.data) || []

        const entryData = {
          date: selectedDate,
          lessons: formData.lessons,
          setup: formData.setup,
          pnl: Number(formData.pnl),
          outcome: formData.outcome,
          tags: formData.tags,
          mood: formData.mood,
          notes: formData.notes || '',
          images: images,
          lastSaved: new Date().toISOString()
        }

        if (isEditing) {
          const dayEntries = entries.filter(entry => entry.date === selectedDate)
          if (dayEntries[selectedTradeIndex]) {
            updateEntry(dayEntries[selectedTradeIndex].id, entryData)
          }
        } else {
          addEntry(entryData)
        }

        toast({
          title: isEditing ? 'Trade Updated' : 'Trade Added',
          description: `Successfully ${isEditing ? 'updated' : 'added'} trade entry`,
        })

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
    } catch (error) {
      console.error('Error saving entry:', error)
      toast({
        title: 'Error',
        description: 'Failed to save trade entry',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Update character count
  const handleTextChange = (field: 'lessons' | 'notes', value: string) => {
    setCharCount(prev => ({ ...prev, [field]: value.length }))
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Format P&L input
  const handlePnLChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.-]/g, '')
    setFormData(prev => ({ ...prev, pnl: numericValue }))
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

  // Add this new function
  const handleImageClick = (image: { preview: string; name: string }) => {
    setSelectedImage(image)
  }

  return (
    <div className="p-2 xs:p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-[95vw] xs:max-w-[90vw] sm:max-w-[85vw] md:max-w-7xl mx-auto">
        {/* Monthly Summary */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 xs:pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium text-gray-500">Month P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl xs:text-2xl sm:text-3xl font-bold ${monthPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthPnl >= 0 ? '+' : ''}{monthPnl.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 xs:pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium text-gray-500">Month Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">{monthTradeCount}</div>
              <div className="text-xs xs:text-sm text-gray-500 mt-1">
                {monthWinCount} wins / {monthTradeCount - monthWinCount} losses
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 xs:pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium text-gray-500">Month Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">{monthWinRate.toFixed(1)}%</div>
              <div className="text-xs xs:text-sm text-gray-500 mt-1">
                Risk/Reward: {riskRewardRatio}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 xs:pb-2">
              <CardTitle className="text-xs xs:text-sm sm:text-base font-medium text-gray-500">Best/Worst Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 xs:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs xs:text-sm text-gray-500">Best:</span>
                  <span className="text-base xs:text-lg font-bold text-green-600">
                    {bestTrade ? `${bestTrade.pnl >= 0 ? '+' : ''}${bestTrade.pnl.toFixed(2)}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs xs:text-sm text-gray-500">Worst:</span>
                  <span className="text-base xs:text-lg font-bold text-red-600">
                    {worstTrade ? `${worstTrade.pnl >= 0 ? '+' : ''}${worstTrade.pnl.toFixed(2)}%` : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-1 xs:pb-2">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-4">
              <CardTitle className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-1 xs:gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 xs:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentDate(today)}
                  className="px-2 xs:px-3 py-1 text-xs xs:text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 xs:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {WEEKDAYS.map(day => (
                <div
                  key={day}
                  className="bg-gray-50 p-1 xs:p-2 text-center text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayEntries = entries.filter(entry => entry.date === dateStr)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)
                const hasEntries = dayEntries.length > 0

                return (
                  <div
                    key={i}
                    onClick={() => handleDateClick(dateStr)}
                    className={`
                      relative min-h-[60px] xs:min-h-[70px] sm:min-h-[80px] md:min-h-[100px] p-0.5 xs:p-1 sm:p-2
                      ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                      ${isCurrentDay ? 'bg-blue-50' : ''}
                      hover:bg-gray-50 cursor-pointer transition-colors
                    `}
                  >
                    <div className="flex items-center justify-between mb-0.5 xs:mb-1">
                      <span className={`
                        text-[10px] xs:text-xs sm:text-sm font-medium
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isCurrentDay ? 'text-blue-600' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      {hasEntries && (
                        <span className="text-[8px] xs:text-xs text-gray-500">
                          {dayEntries.length} trade{dayEntries.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {dayEntries.map((entry, index) => (
                      <div
                        key={index}
                        className={`
                          text-[8px] xs:text-xs p-0.5 xs:p-1 rounded mb-0.5 xs:mb-1 truncate
                          ${entry.outcome === 'win' 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                          }
                        `}
                      >
                        {entry.setup || 'Trade'}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] xs:w-[90vw] sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px]">
            <DialogHeader>
              <DialogTitle className="text-base xs:text-lg sm:text-xl font-semibold">
                {selectedDate ? format(new Date(selectedDate), 'MMMM d, yyyy') : ''}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
              <div className="space-y-3 xs:space-y-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                    Setup
                  </label>
                  <input
                    type="text"
                    value={formData.setup}
                    onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                    className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter trade setup"
                  />
                  {errors.setup && (
                    <p className="mt-1 text-xs xs:text-sm text-red-600">{errors.setup}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                    P&L (%)
                  </label>
                  <input
                    type="number"
                    value={formData.pnl}
                    onChange={(e) => handlePnLChange(e.target.value)}
                    className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter P&L percentage"
                  />
                  {errors.pnl && (
                    <p className="mt-1 text-xs xs:text-sm text-red-600">{errors.pnl}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                    Outcome
                  </label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value as 'win' | 'loss' })}
                    className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                    Mood
                  </label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="bad">Bad</option>
                    <option value="terrible">Terrible</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 xs:space-y-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                    Lessons Learned
                    <span className="text-[10px] xs:text-xs text-gray-500 ml-1">
                      ({charCount.lessons}/500)
                    </span>
                  </label>
                  <textarea
                    value={formData.lessons}
                    onChange={(e) => handleTextChange('lessons', e.target.value)}
                    className="w-full h-24 xs:h-32 px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="What did you learn from this trade?"
                  />
                  {errors.lessons && (
                    <p className="mt-1 text-xs xs:text-sm text-red-600">{errors.lessons}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                    Notes
                    <span className="text-[10px] xs:text-xs text-gray-500 ml-1">
                      ({charCount.notes}/1000)
                    </span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleTextChange('notes', e.target.value)}
                    className="w-full h-24 xs:h-32 px-2 xs:px-3 py-1.5 xs:py-2 text-sm xs:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Additional notes about the trade"
                  />
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">
                    Trade Images
                  </label>
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-1 xs:gap-2">
                    {formData.images?.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-16 xs:h-20 sm:h-24 object-cover rounded-lg cursor-pointer"
                          onClick={() => handleImageClick(image)}
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-0.5 xs:top-1 right-0.5 xs:right-1 p-0.5 xs:p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label className="flex items-center justify-center h-16 xs:h-20 sm:h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <span className="text-xs xs:text-sm text-gray-500">Add Images</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col xs:flex-row gap-2 xs:gap-4">
              {isEditing && (
                <button
                  onClick={handleDeleteEntry}
                  className="w-full xs:w-auto px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Delete Trade
                </button>
              )}
              <div className="flex gap-2 w-full xs:w-auto">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 xs:flex-none px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  disabled={isSaving}
                  className="flex-1 xs:flex-none px-3 xs:px-4 py-1.5 xs:py-2 text-xs xs:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2 animate-spin inline" />
                      Saving...
                    </>
                  ) : (
                    'Save Trade'
                  )}
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 