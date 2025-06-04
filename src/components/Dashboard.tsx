import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTradeStore } from '../store/tradeStore'

export function Dashboard() {
  const { entries } = useTradeStore()

  // Calculate total PnL
  const totalPnL = entries.reduce((sum, entry) => sum + entry.pnl, 0)

  // Calculate win rate
  const winCount = entries.filter((entry) => entry.outcome === 'win').length
  const winRate = entries.length > 0 ? (winCount / entries.length) * 100 : 0

  // Calculate best trade
  const bestTrade = entries.reduce((best, entry) => 
    entry.pnl > best.pnl ? entry : best
  , { pnl: 0, setup: '' })

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

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPnL.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {entries.length} trades total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {winCount} wins out of {entries.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">
              {entries.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bestTrade.pnl.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{bestTrade.setup}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PnL Over Time</CardTitle>
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
    </div>
  )
} 