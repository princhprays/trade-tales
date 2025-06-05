import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTradeStore } from '../store/tradeStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns'

const WINLOSS_COLORS = ['#10B981', '#EF4444'] // Modern green and red
const CHART_COLORS = {
  primary: '#3B82F6', // Modern blue
  grid: '#E5E7EB',
  text: '#6B7280',
  tooltip: '#1F2937'
}

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

  return (
    <div className="p-2 xs:p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-[95vw] xs:max-w-[90vw] sm:max-w-[85vw] md:max-w-7xl mx-auto">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-4 mb-4 xs:mb-6 sm:mb-8">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Trading Analytics</h1>
          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6 sm:mb-8">
          <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700 hover:shadow-md transition-shadow">
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1 xs:mb-2">
                <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Total PnL</h3>
                <span className={`text-[10px] xs:text-xs sm:text-sm font-medium ${totalPnL >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {totalPnL >= 0 ? '↑' : '↓'} {Math.abs(totalPnL).toFixed(2)}%
                </span>
              </div>
              <div className={`text-lg xs:text-xl sm:text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} dark:text-white`}>
                ${totalPnL.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1 xs:mb-2">
                <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</h3>
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Last 30d</span>
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{winRate.toFixed(1)}%</div>
              <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {winCount} wins / {entries.length} trades
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1 xs:mb-2">
                <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</h3>
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Active</span>
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{currentStreak}</div>
              <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {currentStreak > 0 ? 'Winning streak' : 'No active streak'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1 xs:mb-2">
                <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Best Trade</h3>
                <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-green-500">All time</span>
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-600 dark:text-white">${bestTrade.pnl.toFixed(2)}</div>
              <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {bestTrade.setup || 'No setup recorded'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6 sm:mb-8">
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="pb-1 xs:pb-2">
              <CardTitle className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Daily P&L</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] xs:h-[300px] sm:h-[400px]">
              {entries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs xs:text-sm sm:text-base">
                  No trading data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyPnlData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                      tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                    />
                    <YAxis 
                      tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: CHART_COLORS.tooltip,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                      labelFormatter={(label) => format(parseISO(label), 'MMM d, yyyy')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pnl" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: CHART_COLORS.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="pb-1 xs:pb-2">
              <CardTitle className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Win/Loss Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] xs:h-[300px] sm:h-[400px]">
              {entries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs xs:text-sm sm:text-base">
                  No trading data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {winLossData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={WINLOSS_COLORS[index % WINLOSS_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: CHART_COLORS.tooltip,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <CardHeader className="pb-1 xs:pb-2">
            <CardTitle className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 xs:mb-6">
                <TabsTrigger value="weekly" className="text-xs xs:text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs xs:text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs xs:text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                  Yearly
                </TabsTrigger>
              </TabsList>
              <TabsContent value="weekly">
                <PerformanceMetrics entries={entries} period="week" />
              </TabsContent>
              <TabsContent value="monthly">
                <PerformanceMetrics entries={entries} period="month" />
              </TabsContent>
              <TabsContent value="yearly">
                <PerformanceMetrics entries={entries} period="year" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper component for performance metrics
function PerformanceMetrics({ entries, period }: { entries: any[]; period: 'week' | 'month' | 'year' }) {
  // Get current date
  const now = new Date()
  let start: Date, end: Date
  if (period === 'week') {
    start = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    end = endOfWeek(now, { weekStartsOn: 1 })
  } else if (period === 'month') {
    start = startOfMonth(now)
    end = endOfMonth(now)
  } else {
    start = startOfYear(now)
    end = endOfYear(now)
  }

  // Filter entries in range
  const filtered = entries.filter(e => {
    try {
      const d = parseISO(e.date)
      return isWithinInterval(d, { start, end })
    } catch (error) {
      return false
    }
  })

  // Metrics
  const totalPnL = filtered.reduce((sum, e) => sum + e.pnl, 0)
  const numTrades = filtered.length
  const winCount = filtered.filter(e => e.outcome === 'win').length
  const winRate = numTrades > 0 ? (winCount / numTrades) * 100 : 0
  const avgPnL = numTrades > 0 ? totalPnL / numTrades : 0
  const wins = filtered.filter(e => e.pnl > 0)
  const losses = filtered.filter(e => e.pnl < 0)
  const avgWin = wins.length > 0 ? wins.reduce((sum, e) => sum + e.pnl, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((sum, e) => sum + Math.abs(e.pnl), 0) / losses.length : 0
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0
  
  // Find best and worst trades with proper initialization
  const bestTrade = filtered.length > 0 
    ? filtered.reduce((best, e) => (e.pnl > best.pnl ? e : best), { pnl: -Infinity, date: '' })
    : { pnl: 0, date: '' }
  
  const worstTrade = filtered.length > 0
    ? filtered.reduce((worst, e) => (e.pnl < worst.pnl ? e : worst), { pnl: Infinity, date: '' })
    : { pnl: 0, date: '' }

  // Helper function to safely format dates
  const formatDate = (dateStr: string) => {
    try {
      return dateStr ? format(parseISO(dateStr), 'MMM d, yyyy') : 'No date'
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4">
      <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
        <CardContent className="p-3 xs:p-4">
          <div className="flex items-center justify-between mb-1 xs:mb-2">
            <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Total P&L</h3>
            <span className={`text-[10px] xs:text-xs sm:text-sm font-medium ${totalPnL >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {totalPnL >= 0 ? '↑' : '↓'} {Math.abs(totalPnL).toFixed(2)}%
            </span>
          </div>
          <div className={`text-lg xs:text-xl sm:text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} dark:text-white`}>
            ${totalPnL.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
        <CardContent className="p-3 xs:p-4">
          <div className="flex items-center justify-between mb-1 xs:mb-2">
            <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Win Rate</h3>
            <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Period</span>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">{winRate.toFixed(1)}%</div>
          <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">
            {winCount} wins / {numTrades} trades
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
        <CardContent className="p-3 xs:p-4">
          <div className="flex items-center justify-between mb-1 xs:mb-2">
            <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Risk/Reward</h3>
            <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Ratio</span>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">{rr.toFixed(2)}</div>
          <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">
            Avg Win: ${avgWin.toFixed(2)} / Avg Loss: ${avgLoss.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
        <CardContent className="p-3 xs:p-4">
          <div className="flex items-center justify-between mb-1 xs:mb-2">
            <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Best Trade</h3>
            <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-green-500">Period</span>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-600">${bestTrade.pnl.toFixed(2)}</div>
          <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">
            {formatDate(bestTrade.date)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
        <CardContent className="p-3 xs:p-4">
          <div className="flex items-center justify-between mb-1 xs:mb-2">
            <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Worst Trade</h3>
            <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-red-500">Period</span>
          </div>
          <div className="text-lg xs:text-xl sm:text-2xl font-bold text-red-600">${worstTrade.pnl.toFixed(2)}</div>
          <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">
            {formatDate(worstTrade.date)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
        <CardContent className="p-3 xs:p-4">
          <div className="flex items-center justify-between mb-1 xs:mb-2">
            <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Avg Trade</h3>
            <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Period</span>
          </div>
          <div className={`text-lg xs:text-xl sm:text-2xl font-bold ${avgPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ${avgPnL.toFixed(2)}
          </div>
          <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">
            {numTrades} trades in period
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 