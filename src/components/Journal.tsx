import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTradeStore } from '../store/tradeStore'

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
}

export function Journal() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'pnl'>('date')
  const { entries } = useTradeStore()

  const filteredEntries = entries
    .filter((entry) => {
      const matchesSearch = entry.lessons.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.setup.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every((tag) => entry.tags.includes(tag))
      return matchesSearch && matchesTags
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return b.pnl - a.pnl
    })

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Trade Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search entries..."
                className="flex-1 rounded-md border px-3 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="rounded-md border px-3 py-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'pnl')}
              >
                <option value="date">Sort by Date</option>
                <option value="pnl">Sort by PnL</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {new Date(entry.date).toLocaleDateString()}
                      </CardTitle>
                      <span
                        className={`rounded-full px-2 py-1 text-sm ${
                          entry.outcome === 'win'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {entry.outcome === 'win' ? 'Win' : 'Loss'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Setup: {entry.setup}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        PnL: ${entry.pnl}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Lessons: {entry.lessons}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-secondary px-2 py-1 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 