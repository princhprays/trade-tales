import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useTradeStore } from '../store/tradeStore'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function Analytics() {
  const { entries } = useTradeStore()

  // Calculate PnL trend data
  const pnlData = entries.reduce((acc, entry) => {
    const month = entry.date.substring(0, 7) // YYYY-MM
    const existingMonth = acc.find((item) => item.date === month)
    if (existingMonth) {
      existingMonth.pnl += entry.pnl
    } else {
      acc.push({ date: month, pnl: entry.pnl })
    }
    return acc
  }, [] as { date: string; pnl: number }[]).sort((a, b) => a.date.localeCompare(b.date))

  // Calculate setup distribution
  const setupData = entries.reduce((acc, entry) => {
    const existingSetup = acc.find((item) => item.name === entry.setup)
    if (existingSetup) {
      existingSetup.value++
    } else {
      acc.push({ name: entry.setup, value: 1 })
    }
    return acc
  }, [] as { name: string; value: number }[])

  // Calculate win rate by setup
  const winRateBySetup = entries.reduce((acc, entry) => {
    if (!acc[entry.setup]) {
      acc[entry.setup] = { wins: 0, total: 0 }
    }
    acc[entry.setup].total++
    if (entry.outcome === 'win') {
      acc[entry.setup].wins++
    }
    return acc
  }, {} as Record<string, { wins: number; total: number }>)

  // Calculate average PnL by setup
  const avgPnlBySetup = entries.reduce((acc, entry) => {
    if (!acc[entry.setup]) {
      acc[entry.setup] = { total: 0, count: 0 }
    }
    acc[entry.setup].total += entry.pnl
    acc[entry.setup].count++
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  // Calculate mood impact
  const moodImpact = entries.reduce((acc, entry) => {
    if (!acc[entry.mood]) {
      acc[entry.mood] = { total: 0, count: 0 }
    }
    acc[entry.mood].total += entry.pnl
    acc[entry.mood].count++
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PnL Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={setupData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {setupData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Win Rate by Setup</h3>
              <div className="space-y-1">
                {Object.entries(winRateBySetup).map(([setup, { wins, total }]) => (
                  <div key={setup} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{setup}</span>
                    <span className="text-sm font-medium">
                      {((wins / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Average PnL by Setup</h3>
              <div className="space-y-1">
                {Object.entries(avgPnlBySetup).map(([setup, { total, count }]) => (
                  <div key={setup} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{setup}</span>
                    <span className="text-sm font-medium">
                      ${(total / count).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Mood Impact</h3>
              <div className="space-y-1">
                {Object.entries(moodImpact).map(([mood, { total, count }]) => (
                  <div key={mood} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </span>
                    <span className="text-sm font-medium">
                      ${(total / count).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 