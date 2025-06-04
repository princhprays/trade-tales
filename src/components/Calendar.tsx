import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { useTradeStore } from '../store/tradeStore'

interface TradeEntryForm {
  lessons: string
  setup: string
  pnl: number
  outcome: 'win' | 'loss'
  tags: string[]
  mood: string
  images?: string[]
}

export function Calendar() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<TradeEntryForm>({
    lessons: '',
    setup: '',
    pnl: 0,
    outcome: 'win',
    tags: [],
    mood: 'neutral',
  })

  const { entries, addEntry } = useTradeStore()

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  const handleSaveEntry = () => {
    if (selectedDate) {
      addEntry({
        date: selectedDate,
        ...formData,
      })
      setIsDialogOpen(false)
      setFormData({
        lessons: '',
        setup: '',
        pnl: 0,
        outcome: 'win',
        tags: [],
        mood: 'neutral',
      })
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Trade Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-medium">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date(2024, 0, i + 1)
              const dateString = date.toISOString().split('T')[0]
              const hasEntry = entries.some((entry) => entry.date === dateString)
              
              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(dateString)}
                  className={`p-2 text-center rounded hover:bg-accent ${
                    hasEntry ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade Entry - {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Setup</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2"
                value={formData.setup}
                onChange={(e) =>
                  setFormData({ ...formData, setup: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PnL</label>
              <input
                type="number"
                className="w-full rounded-md border px-3 py-2"
                value={formData.pnl}
                onChange={(e) =>
                  setFormData({ ...formData, pnl: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Outcome</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={formData.outcome}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    outcome: e.target.value as 'win' | 'loss',
                  })
                }
              >
                <option value="win">Win</option>
                <option value="loss">Loss</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lessons Learned</label>
              <textarea
                className="w-full rounded-md border px-3 py-2"
                value={formData.lessons}
                onChange={(e) =>
                  setFormData({ ...formData, lessons: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mood</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={formData.mood}
                onChange={(e) =>
                  setFormData({ ...formData, mood: e.target.value })
                }
              >
                <option value="confident">Confident</option>
                <option value="neutral">Neutral</option>
                <option value="anxious">Anxious</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={handleSaveEntry}
            >
              Save Entry
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 