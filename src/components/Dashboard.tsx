import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTradeStore } from '../store/tradeStore'

const WINLOSS_COLORS = ['#22c55e', '#ef4444'] // green, red

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

  // Calculate current streak
  let currentStreak = 0
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].outcome === 'win') currentStreak++
    else break
  }

  // Daily P&L data (group by date)
  const dailyPnlMap: Record<string, number> = {}
  entries.forEach(entry => {
    dailyPnlMap[entry.date] = (dailyPnlMap[entry.date] || 0) + entry.pnl
  })
  const dailyPnlData = Object.entries(dailyPnlMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl }))

  // Win/Loss Ratio data
  const winLossData = [
    { name: 'Win', value: winCount },
    { name: 'Loss', value: entries.length - winCount }
  ]

  // Calculate PnL trend data (for future use)
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Top summary row */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL > 0 ? 'text-green-400' : totalPnL < 0 ? 'text-red-400' : ''}`}>${totalPnL.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak}</div>
          </CardContent>
        </Card>

        {/* Middle row: 2 main panels */}
        <Card className="w-full h-64 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            {entries.length === 0 ? (
              <span className="text-gray-400 text-center">Journal is empty, start your journey now.</span>
            ) : entries.length < 2 ? (
              <span className="text-gray-400 text-center">Not enough data collected, make more journeys and learn from your mistakes.</span>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={dailyPnlData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pnl" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="w-full h-64 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win/Loss Ratio</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            {entries.length === 0 ? (
              <span className="text-gray-400 text-center">Journal is empty, start your journey now.</span>
            ) : entries.length < 2 ? (
              <span className="text-gray-400 text-center">Not enough data collected, make more journeys and learn from your mistakes.</span>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={WINLOSS_COLORS[index % WINLOSS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bottom row: Monthly Performance */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center">
            {/* Placeholder for Monthly Performance chart/table */}
            <span className="text-muted-foreground">(Monthly stats coming soon)</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 