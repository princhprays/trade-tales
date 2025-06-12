import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useTradeStore, type TradeEntry } from '@/store/tradeStore'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { CoinInput } from '@/components/ui/coin-input'
import { SetupInput } from '@/components/ui/setup-input'
import type { JSX } from 'react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Professional color scheme
const COLORS = {
  background: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
    today: 'bg-blue-50 dark:bg-blue-900/20',
    selected: 'bg-blue-100 dark:bg-blue-800/30'
  },
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    muted: 'text-gray-500 dark:text-gray-400'
  },
  trade: {
    profit: {
      light: 'bg-green-50 dark:bg-green-900/20',
      medium: 'text-green-600 dark:text-green-400',
      dark: 'text-green-700 dark:text-green-300'
    },
    loss: {
      light: 'bg-red-50 dark:bg-red-900/20',
      medium: 'text-red-600 dark:text-red-400',
      dark: 'text-red-700 dark:text-red-300'
    }
  },
  border: {
    light: 'border-gray-200 dark:border-gray-700',
    medium: 'border-gray-300 dark:border-gray-600'
  }
}

interface FormErrors {
  setup?: string
  coin?: string
  pnl?: string
  lessons?: string
  tags?: string
}

interface TradeEntryForm {
  lessons: string
  setup: string[]
  coin: string
  pnl: number | null
  outcome: 'win' | 'loss'
  tags: string[]
  mood: string
  notes: string
  images: { name: string; preview: string; data: string }[]
  lastSaved?: string
  positionSize: string
  leverage: string
  link: string
}

export function Calendar(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isViewMode, setIsViewMode] = useState(false)
  const [formData, setFormData] = useState<TradeEntryForm>({
    lessons: '',
    setup: [],
    coin: '',
    pnl: null,
    outcome: 'win',
    tags: [],
    mood: 'neutral',
    notes: '',
    images: [],
    positionSize: '',
    leverage: '',
    link: '',
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

  const imageContainerRef = useRef<HTMLDivElement>(null)

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
        setup: Array.isArray(entry.setup) ? entry.setup : (entry.setup ? [entry.setup] : []),
        coin: entry.coin || '',
        pnl: entry.pnl || null,
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
        positionSize: entry.positionSize?.toString() || '',
        leverage: entry.leverage?.toString() || '',
        link: entry.link || '',
      })
      setIsEditing(false)
      setIsViewMode(true)
    } else {
      setFormData({
        lessons: '',
        setup: [],
        coin: '',
        pnl: null,
        outcome: 'win',
        tags: [],
        mood: 'neutral',
        notes: '',
        images: [],
        positionSize: '',
        leverage: '',
        link: '',
      })
      setIsEditing(false)
      setIsViewMode(false)
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
        setup: Array.isArray(entry.setup) ? entry.setup : (entry.setup ? [entry.setup] : []),
        coin: entry.coin || '',
        pnl: entry.pnl || null,
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
        positionSize: entry.positionSize?.toString() || '',
        leverage: entry.leverage?.toString() || '',
        link: entry.link || '',
      })
      setIsViewMode(true)
      setIsEditing(false)
    }
  }

  const handleEditClick = () => {
    setIsViewMode(false)
    setIsEditing(true)
  }

  const handleAddNewTrade = () => {
    if (!selectedDate) return
    
    // Reset form for new trade while keeping the same date
    setFormData({
      lessons: '',
      setup: [],
      coin: '',
      pnl: null,
      outcome: 'win',
      tags: [],
      mood: 'neutral',
      notes: '',
      images: [],
      positionSize: '',
      leverage: '',
      link: '',
    })
    setIsEditing(false)
    setIsViewMode(false)
  }

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    
    if (files.length === 0) {
      toast({
        title: 'Invalid files',
        description: 'Please drop only image files',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (5MB limit)
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
    
    if (validFiles.length !== files.length) {
      toast({
        title: 'File too large',
        description: 'Some files were skipped because they exceed 5MB limit',
        variant: 'destructive'
      })
    }

    // Process valid files
    const processedFiles = await Promise.all(
      validFiles.map(async (file) => {
        return new Promise<{ name: string; preview: string; data: string }>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve({
              name: file.name,
              preview: URL.createObjectURL(file),
              data: reader.result as string
            })
          }
          reader.readAsDataURL(file)
        })
      })
    )

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...processedFiles]
    }))
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

      // Process valid files
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          return new Promise<{ name: string; preview: string; data: string }>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve({
                name: file.name,
                preview: URL.createObjectURL(file),
                data: reader.result as string
              })
            }
            reader.readAsDataURL(file)
          })
        })
      )

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...processedFiles]
      }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }))
  }

  const handleImageClick = (image: { preview: string; name: string }, index: number) => {
    setSelectedImage(image)
    setCurrentImageIndex(index)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsPreviewOpen(true)
  }

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

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(scale * delta, 0.5), 3)
    
    // Calculate the mouse position relative to the image
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calculate the new position to zoom towards the mouse
    const newPosition = {
      x: position.x - (x - position.x) * (delta - 1),
      y: position.y - (y - position.y) * (delta - 1)
    }
    
    setScale(newScale)
    setPosition(newPosition)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isPreviewOpen) return

    switch (e.key) {
      case 'ArrowLeft':
        if (currentImageIndex > 0) {
          const prevImage = formData.images?.[currentImageIndex - 1]
          if (prevImage) {
            setSelectedImage(prevImage)
            setCurrentImageIndex(currentImageIndex - 1)
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }
        }
        break
      case 'ArrowRight':
        if (formData.images && currentImageIndex < formData.images.length - 1) {
          const nextImage = formData.images[currentImageIndex + 1]
          if (nextImage) {
            setSelectedImage(nextImage)
            setCurrentImageIndex(currentImageIndex + 1)
            setScale(1)
            setPosition({ x: 0, y: 0 })
          }
        }
        break
      case 'Escape':
        setIsPreviewOpen(false)
        break
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as any)
    return () => window.removeEventListener('keydown', handleKeyDown as any)
  }, [isPreviewOpen, currentImageIndex, formData.images])

  useEffect(() => {
    const imageContainer = imageContainerRef.current
    if (imageContainer) {
      imageContainer.addEventListener('wheel', handleWheel as any, { passive: false })
      return () => {
        imageContainer.removeEventListener('wheel', handleWheel as any)
      }
    }
  }, [handleWheel])

  // Add validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.setup.length) {
      newErrors.setup = 'At least one setup is required'
    }
    
    if (!formData.coin.trim()) {
      newErrors.coin = 'Coin is required'
    }

    if (formData.pnl === null) {
      newErrors.pnl = 'P&L is required'
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
    if (!selectedDate) return

    console.log('Calendar: handleSaveEntry - formData.coin:', formData.coin);
    console.log('Calendar: handleSaveEntry - formData.setup:', formData.setup);

    if (!validateForm()) {
      return // Stop if validation fails
    }

    setIsSaving(true)
    try {
      const entry = {
        date: selectedDate,
        lessons: formData.lessons,
        setup: formData.setup,
        coin: formData.coin,
        pnl: formData.pnl !== null ? formData.pnl : 0,
        outcome: formData.outcome,
        tags: formData.tags,
        mood: formData.mood,
        notes: formData.notes,
        images: formData.images.map(img => img.data),
        lastSaved: new Date().toISOString(),
        positionSize: formData.positionSize ? parseFloat(formData.positionSize) : undefined,
        leverage: formData.leverage ? parseFloat(formData.leverage) : undefined,
        link: formData.link,
      }

      if (isEditing) {
        const dayEntries = entries.filter(e => e.date === selectedDate)
        if (dayEntries[selectedTradeIndex]) {
          updateEntry(dayEntries[selectedTradeIndex].id, entry)
        }
      } else {
        addEntry(entry)
      }

      setIsDialogOpen(false)
      toast({
        title: isEditing ? 'Trade Updated' : 'Trade Saved',
        description: isEditing ? 'Your trade has been updated successfully.' : 'Your trade has been saved successfully.',
      })
    } catch (error) {
      console.error('Error saving trade:', error)
      toast({
        title: 'Error',
        description: 'There was an error saving your trade. Please try again.',
        variant: 'destructive',
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
    if (value.trim() === '') {
      setFormData(prev => ({ ...prev, pnl: null }))
      return
    }
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, pnl: numValue }))
    } else {
      setFormData(prev => ({ ...prev, pnl: null }))
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
            setup: [],
            coin: '',
            pnl: null,
            outcome: 'win',
            tags: [],
            mood: 'neutral',
            notes: '',
            images: [],
            positionSize: '',
            leverage: '',
            link: '',
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

  const setupInputRef = useRef<HTMLInputElement>(null)
  const dummyRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              ←
            </button>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {day}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEntries = entries.filter(entry => entry.date === dateStr)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)

            return (
              <button
                key={i}
                onClick={() => handleDateClick(dateStr)}
                className={`
                  relative p-2 min-h-[100px] text-left transition-colors
                  ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}
                  ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  border border-gray-200 dark:border-gray-700
                `}
              >
                <span
                  className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                    ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>
                {dayEntries.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayEntries.map((entry, index) => (
                      <div
                        key={index}
                        className={`
                          text-xs p-1 rounded truncate
                          ${entry.outcome === 'win' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}
                        `}
                      >
                        {entry.coin}: ${entry.pnl > 0 ? '+' : ''}{entry.pnl}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] xs:w-[90vw] sm:max-w-xl md:max-w-2xl p-4 sm:p-6 overflow-y-auto max-h-[90vh] bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedDate ? format(new Date(selectedDate), 'MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 sm:space-y-4">
            {/* Trade Info Section */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white border-b pb-0.5 mb-1">Trade Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coin</label>
                  {isViewMode ? (
                    <div className="w-full px-3 py-2 text-base text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {formData.coin || <span className="text-gray-400">No coin</span>}
                    </div>
                  ) : (
                    <CoinInput
                      value={formData.coin}
                      onChange={coin => setFormData({ ...formData, coin })}
                      disabled={isViewMode}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">P&L ($)</label>
                  <input
                    type="number"
                    value={formData.pnl === null ? '' : formData.pnl}
                    onChange={(e) => handlePnLChange(e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter P&L in dollars"
                    disabled={isViewMode}
                  />
                  {errors.pnl && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pnl.replace('P&L', 'P&L ($)')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome</label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value as 'win' | 'loss' })}
                    className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isViewMode}
                  >
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mood</label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isViewMode}
                  >
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="bad">Bad</option>
                    <option value="terrible">Terrible</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setup</label>
                  {isViewMode ? (
                    <div className="w-full px-3 py-2 text-base text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {formData.setup.length > 0 ? formData.setup.join(' + ') : <span className="text-gray-400">No setup</span>}
                    </div>
                  ) : (
                    <SetupInput
                      value={formData.setup}
                      onChange={(value) => setFormData({ ...formData, setup: value })}
                      disabled={isViewMode}
                    />
                  )}
                  {errors.setup && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.setup}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position Size ($) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    value={formData.positionSize === undefined ? '' : formData.positionSize}
                    onChange={e => setFormData(prev => ({ ...prev, positionSize: e.target.value }))}
                    className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter position size in $"
                    min="0"
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leverage (X) <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="number"
                    value={formData.leverage === undefined ? '' : formData.leverage}
                    onChange={e => setFormData(prev => ({ ...prev, leverage: e.target.value }))}
                    className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter leverage (e.g. 5 for 5x)"
                    min="0"
                    disabled={isViewMode}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trade Link <span className="text-gray-400">(optional)</span></label>
                  {isViewMode ? (
                    formData.link ? (
                      (() => {
                        try {
                          new URL(formData.link);
                          return (
                            <a
                              href={formData.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-3 py-2 text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline truncate block bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              {formData.link}
                            </a>
                          );
                        } catch {
                          return (
                            <span className="w-full px-3 py-2 text-base text-red-500 dark:text-red-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              Invalid link
                            </span>
                          );
                        }
                      })()
                    ) : (
                      <span className="w-full px-3 py-2 text-base text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg mt-2 block">
                        No link provided
                      </span>
                    )
                  ) : (
                    <input
                      type="url"
                      value={formData.link || ''}
                      onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter trade link (e.g. chart, analysis, etc.)"
                      disabled={isViewMode}
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Notes Section */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white border-b pb-0.5 mb-1">Notes & Lessons</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lessons Learned <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({charCount.lessons}/500)</span></label>
                  <textarea
                    value={formData.lessons}
                    onChange={(e) => handleTextChange('lessons', e.target.value)}
                    className="w-full h-24 px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="What did you learn from this trade?"
                    disabled={isViewMode}
                  />
                  {errors.lessons && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lessons}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({charCount.notes}/1000)</span></label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleTextChange('notes', e.target.value)}
                    className="w-full h-24 px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Additional notes about the trade"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </section>

            {/* Images Section */}
            <section>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white border-b pb-0.5 mb-1">Trade Images</h3>
              <div className="flex space-x-5 overflow-x-auto py-2">
                {isViewMode && (!formData.images || formData.images.length === 0) && (
                  <span className="text-gray-400 text-base flex items-center">No photo uploaded</span>
                )}
                {formData.images?.map((image, index) => (
                  <div key={index} className="relative w-[160px] h-[110px] rounded-lg shadow border overflow-hidden group flex-shrink-0">
                    <img
                      src={image.preview}
                      alt={image.name}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(image, index)}
                    />
                    {!isViewMode && (
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveImage(index); }}
                        className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1.5 hover:bg-red-500 hover:text-white transition text-xl shadow"
                        title="Delete"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {!isViewMode && (
                  <label
                    className={
                      `flex items-center justify-center w-[160px] h-[110px] border-2 border-dashed rounded-lg cursor-pointer transition-colors flex-shrink-0 ` +
                      (isDragging
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
                )}
              </div>
            </section>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {isViewMode && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="flex-1 sm:flex-none px-4 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    Edit Trade
                  </button>
                  <button
                    onClick={handleDeleteEntry}
                    className="flex-1 sm:flex-none px-4 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    Delete Trade
                  </button>
                  <button
                    onClick={handleAddNewTrade}
                    className="flex-1 sm:flex-none px-4 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    New Trade
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {!isViewMode && (
                <button
                  onClick={handleSaveEntry}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Saving...
                    </>
                  ) : (
                    isEditing ? 'Update Trade' : 'Save Trade'
                  )}
                </button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Fullscreen Overlay */}
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
            {formData.images && formData.images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                <button
                  onClick={() => {
                    if (currentImageIndex > 0) {
                      const prevImage = formData.images[currentImageIndex - 1]
                      if (prevImage) {
                        setSelectedImage(prevImage)
                        setCurrentImageIndex(currentImageIndex - 1)
                        setScale(1)
                        setPosition({ x: 0, y: 0 })
                      }
                    }
                  }}
                  disabled={currentImageIndex === 0}
                  className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous image"
                >←
                </button>
                <span className="px-3 py-2 bg-black/60 text-white rounded-full">
                  {currentImageIndex + 1} / {formData.images.length}
                </span>
                <button
                  onClick={() => {
                    if (currentImageIndex < formData.images.length - 1) {
                      const nextImage = formData.images[currentImageIndex + 1]
                      if (nextImage) {
                        setSelectedImage(nextImage)
                        setCurrentImageIndex(currentImageIndex + 1)
                        setScale(1)
                        setPosition({ x: 0, y: 0 })
                      }
                    }
                  }}
                  disabled={currentImageIndex === formData.images.length - 1}
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