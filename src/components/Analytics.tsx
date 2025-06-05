import { useMemo } from 'react'
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
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { useTradeStore } from '../store/tradeStore'
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  subMonths,
  isWithinInterval 
} from 'date-fns'
import { TrendingUp, TrendingDown, Calendar, Tag, Smile, Clock, DollarSign, Target, BarChart2 } from 'lucide-react'

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
  chart: {
    profit: '#10B981',
    loss: '#EF4444',
    neutral: '#6B7280',
    grid: '#E5E7EB',
    tooltip: '#1F2937',
    accent: '#3B82F6'
  }
}

export function Analytics() {
  const { entries } = useTradeStore()

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalPnL = entries.reduce((sum, entry) => sum + entry.pnl, 0)
    const winCount = entries.filter(entry => entry.outcome === 'win').length
    const totalTrades = entries.length
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0
    const avgTrade = totalTrades > 0 ? totalPnL / totalTrades : 0

    // Calculate month-over-month change
    const currentMonth = entries.filter(entry => {
      const date = parseISO(entry.date)
      return isWithinInterval(date, { 
        start: startOfMonth(new Date()), 
        end: endOfMonth(new Date()) 
      })
    })
    const lastMonth = entries.filter(entry => {
      const date = parseISO(entry.date)
      return isWithinInterval(date, { 
        start: startOfMonth(subMonths(new Date(), 1)), 
        end: endOfMonth(subMonths(new Date(), 1)) 
      })
    })

    const currentMonthPnL = currentMonth.reduce((sum, entry) => sum + entry.pnl, 0)
    const lastMonthPnL = lastMonth.reduce((sum, entry) => sum + entry.pnl, 0)
    const pnlChange = lastMonthPnL !== 0 ? ((currentMonthPnL - lastMonthPnL) / Math.abs(lastMonthPnL)) * 100 : 0

    return {
      totalPnL,
      pnlChange,
      winRate,
      totalTrades,
      avgTrade
    }
  }, [entries])

  // Calculate P&L trend data with monthly aggregation
  const pnlData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    })

    return months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const monthEntries = entries.filter(entry => {
        const date = parseISO(entry.date)
        return date >= monthStart && date <= monthEnd
      })

      const totalPnL = monthEntries.reduce((sum, entry) => sum + entry.pnl, 0)
      const winCount = monthEntries.filter(e => e.outcome === 'win').length
      const totalTrades = monthEntries.length
      const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0

      return {
        month: format(month, 'MMM yyyy'),
        pnl: totalPnL,
        winRate,
        trades: totalTrades
      }
    })
  }, [entries])

  // Calculate setup performance
  const setupPerformance = useMemo(() => {
    const setupStats = entries.reduce((acc, entry) => {
    if (!acc[entry.setup]) {
        acc[entry.setup] = {
          wins: 0,
          total: 0,
          pnl: 0
        }
    }
    acc[entry.setup].total++
      if (entry.outcome === 'win') acc[entry.setup].wins++
      acc[entry.setup].pnl += entry.pnl
    return acc
    }, {} as Record<string, { wins: number; total: number; pnl: number }>)

    return Object.entries(setupStats)
      .map(([setup, stats]) => ({
        setup,
        winRate: (stats.wins / stats.total) * 100,
        avgPnL: stats.pnl / stats.total,
        totalTrades: stats.total
      }))
      .sort((a, b) => b.totalTrades - a.totalTrades)
  }, [entries])

  // Calculate tag performance
  const tagPerformance = useMemo(() => {
    const tagStats = entries.reduce((acc, entry) => {
      entry.tags.forEach(tag => {
        if (!acc[tag]) {
          acc[tag] = {
            wins: 0,
            total: 0,
            pnl: 0
          }
        }
        acc[tag].total++
        if (entry.outcome === 'win') acc[tag].wins++
        acc[tag].pnl += entry.pnl
      })
    return acc
    }, {} as Record<string, { wins: number; total: number; pnl: number }>)

    return Object.entries(tagStats)
      .map(([tag, stats]) => ({
        tag,
        winRate: (stats.wins / stats.total) * 100,
        avgPnL: stats.pnl / stats.total,
        totalTrades: stats.total
      }))
      .sort((a, b) => b.totalTrades - a.totalTrades)
  }, [entries])

  // Calculate mood impact
  const moodImpact = useMemo(() => {
    const moodStats = entries.reduce((acc, entry) => {
    if (!acc[entry.mood]) {
        acc[entry.mood] = {
          wins: 0,
          total: 0,
          pnl: 0
        }
      }
      acc[entry.mood].total++
      if (entry.outcome === 'win') acc[entry.mood].wins++
      acc[entry.mood].pnl += entry.pnl
      return acc
    }, {} as Record<string, { wins: number; total: number; pnl: number }>)

    return Object.entries(moodStats)
      .map(([mood, stats]) => ({
        mood,
        winRate: (stats.wins / stats.total) * 100,
        avgPnL: stats.pnl / stats.total,
        totalTrades: stats.total
      }))
      .sort((a, b) => b.totalTrades - a.totalTrades)
  }, [entries])

  // Calculate trade frequency patterns
  const tradeFrequency = useMemo(() => {
    const frequency = entries.reduce((acc, entry) => {
      const hour = format(parseISO(entry.date), 'HH:00')
      if (!acc[hour]) {
        acc[hour] = {
          count: 0,
          wins: 0,
          pnl: 0
        }
      }
      acc[hour].count++
      if (entry.outcome === 'win') acc[hour].wins++
      acc[hour].pnl += entry.pnl
    return acc
    }, {} as Record<string, { count: number; wins: number; pnl: number }>)

    return Object.entries(frequency)
      .map(([hour, stats]) => ({
        hour,
        trades: stats.count,
        winRate: (stats.wins / stats.count) * 100,
        avgPnL: stats.pnl / stats.count
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
  }, [entries])

  // Loading state
  if (!entries) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          {/* Summary Cards Loading State */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
          {/* Charts Loading State */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[400px] bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-500">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-2xl sm:text-3xl font-bold ${summaryMetrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryMetrics.totalPnL >= 0 ? '+' : ''}{summaryMetrics.totalPnL.toFixed(2)}%
                </div>
                <div className={`flex items-center text-sm ${summaryMetrics.pnlChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryMetrics.pnlChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(summaryMetrics.pnlChange).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-500">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{summaryMetrics.winRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-500">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{summaryMetrics.totalTrades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-500">Avg Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl sm:text-3xl font-bold ${summaryMetrics.avgTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summaryMetrics.avgTrade >= 0 ? '+' : ''}{summaryMetrics.avgTrade.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* P&L Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">P&L Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.chart.tooltip,
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'P&L']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke={COLORS.chart.accent} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: COLORS.chart.accent }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Win Rate Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Win Rate Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.chart.tooltip,
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke={COLORS.chart.profit} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: COLORS.chart.profit }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Setup Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Setup Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupPerformance.slice(0, 5)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                  <XAxis 
                    dataKey="setup" 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.chart.tooltip,
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" fill={COLORS.chart.profit} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tag Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Tag Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagPerformance.slice(0, 5)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                  <XAxis 
                    dataKey="tag" 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.chart.tooltip,
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                  />
                  <Bar dataKey="winRate" fill={COLORS.chart.accent} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Mood Impact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Mood Impact</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodImpact} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                <XAxis 
                  dataKey="mood" 
                  tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: COLORS.chart.tooltip,
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                />
                <Bar dataKey="winRate" fill={COLORS.chart.accent} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 