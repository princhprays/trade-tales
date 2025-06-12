import React from 'react'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  ReferenceLine
} from 'recharts'
import { useTradeStore } from '../store/tradeStore'
import { 
  parseISO, 
  format, 
  eachMonthOfInterval, 
  eachWeekOfInterval,
  eachDayOfInterval,
  subMonths, 
  startOfMonth, 
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  isWithinInterval 
} from 'date-fns'
import { TrendingUp, TrendingDown, Calendar, Tag, Smile, Clock, DollarSign, Target, BarChart2, ArrowUpRight, ArrowDownRight, Star, AlertTriangle, Award, Brain, Search, ChevronDown } from 'lucide-react'
import { normalizeTradeName } from '../store/tradeStore'
import {
  calculateSharpeRatio,
  calculateExpectancy,
  calculateAvgHoldingTime,
  calculateVolatility,
  getBestTradeByReturn
} from './Dashboard'
import { DateRangePicker } from './ui/date-range-picker'
import type { DateRange } from 'react-day-picker'
import type { TradeEntry } from '../store/tradeStore'

// Update COLORS object to use theme-aware colors
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
  chart: {
    grid: 'rgb(229, 231, 235)',
    profit: '#10B981',
    loss: '#EF4444',
    accent: '#3B82F6',
    tooltip: 'rgb(31, 41, 55)'
  }
}

// Summary Cards Component
function SummaryCards({ entries }: { entries: TradeEntry[] }) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total P&L</p>
              <p className={`text-2xl font-bold ${summaryMetrics.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summaryMetrics.totalPnL >= 0 ? '+' : ''}{summaryMetrics.totalPnL.toFixed(2)}%
              </p>
            </div>
            <div className={`p-2 rounded-full ${summaryMetrics.pnlChange >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
              {summaryMetrics.pnlChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {summaryMetrics.pnlChange >= 0 ? '+' : ''}{summaryMetrics.pnlChange.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summaryMetrics.winRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {summaryMetrics.totalTrades} total trades
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Trade</p>
              <p className={`text-2xl font-bold ${summaryMetrics.avgTrade >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summaryMetrics.avgTrade >= 0 ? '+' : ''}{summaryMetrics.avgTrade.toFixed(2)}%
              </p>
            </div>
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Average return per trade
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Trades</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryMetrics.totalTrades}
              </p>
            </div>
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            All time trades
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Setup Performance Table Component
function SetupPerformanceTable({ entries }: { entries: TradeEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  // Calculate setup stats
  const setupStats = entries.reduce((acc, entry) => {
    const setup = typeof entry.setup === 'string' ? entry.setup : (Array.isArray(entry.setup) ? entry.setup.join(', ') : String(entry.setup));
    if (!acc[setup]) {
      acc[setup] = { wins: 0, total: 0, pnl: 0 };
    }
    acc[setup].total++;
    if (entry.outcome === 'win') acc[setup].wins++;
    acc[setup].pnl += entry.pnl;
    return acc;
  }, {} as Record<string, { wins: number; total: number; pnl: number }>);

  let setups = Object.entries(setupStats)
    .map(([setup, stats]) => ({
      setup,
      trades: stats.total,
      winRate: (stats.wins / stats.total) * 100,
      avgPnL: stats.pnl / stats.total,
      totalPnL: stats.pnl
    }))
    .sort((a, b) => b.trades - a.trades);

  if (searchTerm) {
    setups = setups.filter(s => s.setup.toLowerCase().includes(searchTerm.toLowerCase()));
  }
  const displayedSetups = showAll ? setups : setups.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-xl text-gray-900 dark:text-white">Setup Performance</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search setups..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            style={{ minWidth: 180 }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Setup</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Trades</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Win Rate</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Avg P&L</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Total P&L</th>
            </tr>
          </thead>
          <tbody>
            {displayedSetups.map((s, i) => (
              <tr key={s.setup} className={i !== displayedSetups.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
                <td className="py-3 px-4 text-left font-medium text-gray-900 dark:text-white">{s.setup}</td>
                <td className="py-3 px-4 text-center text-gray-900 dark:text-white">{s.trades}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${s.winRate >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{Math.round(s.winRate)}%</span>
                </td>
                <td className="py-3 px-4 text-center text-gray-900 dark:text-white">${Math.round(s.avgPnL).toLocaleString()}</td>
                <td className="py-3 px-4 text-center font-semibold text-green-600">${Math.round(s.totalPnL).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {setups.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20"
          >
            {showAll ? 'Show Less' : `Show All (${setups.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

// Advanced Metrics Cards
function AdvancedMetricsCards({ entries }: { entries: TradeEntry[] }) {
  const sharpeRatio = calculateSharpeRatio(entries) || 0;
  const expectancy = calculateExpectancy(entries) || 0;
  const avgHoldingTime = calculateAvgHoldingTime(entries) || 0;
  const volatility = calculateVolatility(entries) || 0;
  const bestTrade = getBestTradeByReturn(entries) || { return: 0, coin: 'N/A', setup: 'N/A' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Sharpe Ratio */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Sharpe Ratio</CardTitle>
          <BarChart2 className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {sharpeRatio.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Risk-adjusted returns
          </p>
          <CardDescription>
            Higher is better. Above 1.0 is good, above 2.0 is excellent.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Expectancy */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Expectancy</CardTitle>
          <Target className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {expectancy.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Expected return per trade
          </p>
          <CardDescription>
            Average expected profit/loss per trade.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Average Holding Time */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Avg Holding Time</CardTitle>
          <Clock className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgHoldingTime.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            Average trade duration
          </p>
          <CardDescription>
            Average time trades are held open.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Volatility */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Volatility</CardTitle>
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {volatility.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Return variability
          </p>
          <CardDescription>
            Standard deviation of returns. Lower is more consistent.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Best Trade by Return */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Best Trade</CardTitle>
          <Award className="w-4 h-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{(bestTrade?.return || 0).toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {bestTrade?.coin || 'N/A'} - {bestTrade?.setup || 'N/A'}
          </p>
          <CardDescription>
            Your highest returning trade.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Risk Metrics */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Risk Metrics</CardTitle>
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Max Drawdown:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {entries.length > 0 ? Math.abs(Math.min(...entries.map(e => e.pnl))).toFixed(2) : '0.00'}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Risk/Reward:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {entries.length > 0 ? (Math.abs(Math.max(...entries.map(e => e.pnl))) / Math.abs(Math.min(...entries.map(e => e.pnl)))).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
          <CardDescription>
            Key risk indicators for your trading.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Trade Quality */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Trade Quality</CardTitle>
          <Star className="w-4 h-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Win:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {entries.filter(e => e.outcome === 'win').length > 0 
                  ? (entries.filter(e => e.outcome === 'win').reduce((sum, e) => sum + e.pnl, 0) / entries.filter(e => e.outcome === 'win').length).toFixed(2)
                  : '0.00'}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Loss:</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {entries.filter(e => e.outcome === 'loss').length > 0 
                  ? (entries.filter(e => e.outcome === 'loss').reduce((sum, e) => sum + e.pnl, 0) / entries.filter(e => e.outcome === 'loss').length).toFixed(2)
                  : '0.00'}%
              </span>
            </div>
          </div>
          <CardDescription>
            Average win and loss sizes.
          </CardDescription>
        </CardContent>
      </Card>

      {/* Performance Score */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">Performance Score</CardTitle>
          <Brain className="w-4 h-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round((sharpeRatio * 20 + expectancy * 2 + (entries.filter(e => e.outcome === 'win').length / entries.length) * 100) / 3)}/100
          </div>
          <p className="text-xs text-muted-foreground">
            Overall performance rating
          </p>
          <CardDescription>
            Composite score based on multiple metrics.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

// StreaksCard component
function StreaksCard({ filteredEntries }: { filteredEntries: TradeEntry[] }) {
  // Calculate streaks
  let currentWinStreak = 0, currentLossStreak = 0, longestWinStreak = 0, tempWinStreak = 0;
  filteredEntries.forEach(entry => {
    if (entry.outcome === 'win') {
      tempWinStreak++;
      if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
      currentLossStreak = 0;
    } else {
      tempWinStreak = 0;
      currentLossStreak++;
    }
  });
  // Calculate current win streak (from end)
  for (let i = filteredEntries.length - 1; i >= 0; i--) {
    if (filteredEntries[i].outcome === 'win') currentWinStreak++;
    else break;
  }
  // Calculate current loss streak (from end)
  for (let i = filteredEntries.length - 1; i >= 0; i--) {
    if (filteredEntries[i].outcome === 'loss') currentLossStreak++;
    else break;
  }
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">Streak Analysis</CardTitle>
        <span className="text-xs font-medium text-blue-500">Period</span>
      </CardHeader>
      <CardContent className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Current Win Streak */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
          <div className="rounded-full bg-blue-200 dark:bg-blue-800 p-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-medium text-muted-foreground">Current Win Streak</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{currentWinStreak}</div>
            <div className="text-xs text-muted-foreground">
              {currentWinStreak > 0 ? 'Keep it up!' : 'Start a new streak!'}
            </div>
            <CardDescription>Number of consecutive winning trades.</CardDescription>
          </div>
        </div>
        {/* Longest Win Streak */}
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/40 rounded-lg">
          <div className="rounded-full bg-green-200 dark:bg-green-800 p-2">
            <Smile className="w-5 h-5 text-green-600 dark:text-green-300" />
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-medium text-muted-foreground">Longest Win Streak</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{longestWinStreak}</div>
            <div className="text-xs text-muted-foreground">Your best performance</div>
            <CardDescription>The highest number of wins in a row.</CardDescription>
          </div>
        </div>
        {/* Current Loss Streak */}
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/40 rounded-lg">
          <div className="rounded-full bg-red-200 dark:bg-red-800 p-2">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-300" />
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-medium text-muted-foreground">Current Loss Streak</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{currentLossStreak}</div>
            <div className="text-xs text-muted-foreground">
              {currentLossStreak > 0 ? 'Stay strong!' : 'No current losses'}
            </div>
            <CardDescription>Number of consecutive losing trades.</CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- NEW: Professional Analytics Summary Cards ---
function calculateProfitFactor(entries: TradeEntry[]) {
  const grossProfit = entries.filter(e => e.pnl > 0).reduce((sum, e) => sum + e.pnl, 0)
  const grossLoss = Math.abs(entries.filter(e => e.pnl < 0).reduce((sum, e) => sum + e.pnl, 0))
  return grossLoss === 0 ? grossProfit > 0 ? Infinity : 0 : grossProfit / grossLoss
}

function getMetricChange(current: number, previous: number) {
  if (previous === 0) return 0
  return ((current - previous) / Math.abs(previous)) * 100
}

function AnalyticsSummaryCards({ entries }: { entries: TradeEntry[] }) {
  // Calculate current and previous month entries
  const now = new Date()
  const currentMonthEntries = entries.filter(entry => {
    const date = parseISO(entry.date)
    return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) })
  })
  const lastMonth = subMonths(now, 1)
  const lastMonthEntries = entries.filter(entry => {
    const date = parseISO(entry.date)
    return isWithinInterval(date, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) })
  })

  // Metrics for current and previous month
  const metrics = [
    {
      key: 'totalTrades',
      label: 'Total Trades',
      icon: <BarChart2 className="w-6 h-6 text-blue-500" />, // blue
      value: entries.length,
      prev: lastMonthEntries.length,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      isCurrency: false,
      isPercent: false,
    },
    {
      key: 'winRate',
      label: 'Win Rate',
      icon: <Target className="w-6 h-6 text-green-500" />, // green
      value: entries.length > 0 ? (entries.filter(e => e.outcome === 'win').length / entries.length) * 100 : 0,
      prev: lastMonthEntries.length > 0 ? (lastMonthEntries.filter(e => e.outcome === 'win').length / lastMonthEntries.length) * 100 : 0,
      color: 'text-green-600',
      bg: 'bg-green-50',
      isCurrency: false,
      isPercent: true,
    },
    {
      key: 'totalPnL',
      label: 'Total P&L',
      icon: <DollarSign className="w-6 h-6 text-emerald-500" />, // emerald
      value: entries.reduce((sum, e) => sum + e.pnl, 0),
      prev: lastMonthEntries.reduce((sum, e) => sum + e.pnl, 0),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      isCurrency: true,
      isPercent: false,
    },
    {
      key: 'avgTrade',
      label: 'Avg Trade',
      icon: <TrendingUp className="w-6 h-6 text-purple-500" />, // purple
      value: entries.length > 0 ? entries.reduce((sum, e) => sum + e.pnl, 0) / entries.length : 0,
      prev: lastMonthEntries.length > 0 ? lastMonthEntries.reduce((sum, e) => sum + e.pnl, 0) / lastMonthEntries.length : 0,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      isCurrency: true,
      isPercent: false,
    },
    {
      key: 'profitFactor',
      label: 'Profit Factor',
      icon: <Award className="w-6 h-6 text-yellow-500" />, // yellow
      value: calculateProfitFactor(entries),
      prev: calculateProfitFactor(lastMonthEntries),
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      isCurrency: false,
      isPercent: false,
    },
    {
      key: 'sharpeRatio',
      label: 'Sharpe Ratio',
      icon: <Brain className="w-6 h-6 text-indigo-500" />, // indigo
      value: calculateSharpeRatio(entries) || 0,
      prev: calculateSharpeRatio(lastMonthEntries) || 0,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      isCurrency: false,
      isPercent: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
      {metrics.map((metric) => {
        const change = getMetricChange(metric.value, metric.prev)
        const isUp = change >= 0
        return (
          <div key={metric.key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col justify-between h-full border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <div className={`rounded-full p-2 ${metric.bg}`}>{
                // Shrink icon size
                React.cloneElement(metric.icon, { className: (metric.icon.props.className || '') + ' w-5 h-5' })
              }</div>
              <div className="flex items-center gap-1">
                {isUp ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-semibold ${isUp ? 'text-green-600' : 'text-red-600'}`}>{isNaN(change) ? '0.0' : change.toFixed(1)}%</span>
              </div>
            </div>
            <div className="mt-1">
              <div className={`text-2xl font-bold ${metric.color} mb-0.5`}>
                {metric.isCurrency
                  ? `$${Math.abs(metric.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : metric.isPercent
                  ? `${metric.value.toFixed(1)}%`
                  : metric.value.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{metric.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
// --- END NEW ---

// --- NEW: Bottom Metrics Cards ---
function BottomMetricsCards({ entries }: { entries: TradeEntry[] }) {
  // Risk Metrics
  const maxDrawdown = entries.length > 0 ? Math.min(...entries.map(e => e.pnl)) : 0;
  const maxWin = entries.length > 0 ? Math.max(...entries.map(e => e.pnl)) : 0;
  const riskReward = Math.abs(maxWin) / Math.abs(maxDrawdown || 1);
  // Consecutive Wins
  let consecutiveWins = 0, tempWins = 0;
  entries.forEach(e => {
    if (e.outcome === 'win') {
      tempWins++;
      if (tempWins > consecutiveWins) consecutiveWins = tempWins;
    } else {
      tempWins = 0;
    }
  });
  // Trade Quality
  const wins = entries.filter(e => e.outcome === 'win');
  const losses = entries.filter(e => e.outcome === 'loss');
  const avgWin = wins.length > 0 ? wins.reduce((sum, e) => sum + e.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((sum, e) => sum + e.pnl, 0) / losses.length : 0;
  const profitFactor = calculateProfitFactor(entries);
  // Performance Score
  const sharpeRatio = calculateSharpeRatio(entries) || 0;
  const expectancy = calculateExpectancy(entries) || 0;
  const winRate = entries.length > 0 ? (wins.length / entries.length) * 100 : 0;
  const perfScore = Math.round((sharpeRatio * 20 + expectancy * 2 + winRate) / 3);

  return (
    <div className="grid grid-cols-1 gap-4 mt-8">
      {/* Risk Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col mb-2 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-lg text-gray-900 dark:text-white">Risk Metrics</span>
          <span className="text-xl"><span className="inline-block align-middle"><AlertTriangle className="w-5 h-5 text-yellow-500" /></span></span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Max Drawdown</span>
            <span className="font-semibold text-red-500">${maxDrawdown < 0 ? '-' : ''}${Math.abs(maxDrawdown).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Risk/Reward</span>
            <span className="font-semibold text-gray-900 dark:text-white">{riskReward.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Consecutive Wins</span>
            <span className="font-semibold text-green-600">{consecutiveWins}</span>
          </div>
        </div>
      </div>
      {/* Trade Quality */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col mb-2 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-lg text-gray-900 dark:text-white">Trade Quality</span>
          <span className="text-xl"><span className="inline-block align-middle"><Award className="w-5 h-5 text-blue-400" /></span></span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Avg Winner</span>
            <span className="font-semibold text-green-600">${avgWin >= 0 ? '' : '-'}{Math.abs(avgWin).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Avg Loser</span>
            <span className="font-semibold text-red-500">${avgLoss < 0 ? '-' : ''}{Math.abs(avgLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Profit Factor</span>
            <span className="font-semibold text-gray-900 dark:text-white">{profitFactor.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {/* Performance Score */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-lg text-gray-900 dark:text-white">Performance Score</span>
          <span className="text-xl"><span className="inline-block align-middle"><Brain className="w-5 h-5 text-purple-500" /></span></span>
        </div>
        <div className="flex flex-col items-center justify-center py-2">
          <span className="text-4xl font-bold text-purple-600 mb-1">{perfScore}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm mb-2">Overall Score</span>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-2 bg-purple-400 rounded-full" style={{ width: `${Math.min(perfScore, 100)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END NEW ---

// --- NEW: Coin Performance Table ---
function CoinPerformanceTable({ entries }: { entries: TradeEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  // Only include entries with a valid coin (not empty, null, or undefined)
  const validEntries = entries.filter(entry => entry.coin && String(entry.coin).trim() !== '');
  // Calculate coin stats
  const coinStats = validEntries.reduce((acc, entry) => {
    const coin = String(entry.coin);
    if (!acc[coin]) {
      acc[coin] = { wins: 0, total: 0, pnl: 0 };
    }
    acc[coin].total++;
    if (entry.outcome === 'win') acc[coin].wins++;
    acc[coin].pnl += entry.pnl;
    return acc;
  }, {} as Record<string, { wins: number; total: number; pnl: number }>);

  let coins = Object.entries(coinStats)
    .map(([coin, stats]) => ({
      coin,
      trades: stats.total,
      winRate: (stats.wins / stats.total) * 100,
      avgPnL: stats.pnl / stats.total,
      totalPnL: stats.pnl
    }))
    .sort((a, b) => b.trades - a.trades);

  if (searchTerm) {
    coins = coins.filter(c => c.coin.toLowerCase().includes(searchTerm.toLowerCase()));
  }
  const displayedCoins = showAll ? coins : coins.slice(0, 5);

  // Only show the message if there are valid coins but the filter yields no results
  const showNoCoinsMessage = validEntries.length > 0 && displayedCoins.length === 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-xl text-gray-900 dark:text-white">Coin Performance</div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            style={{ minWidth: 180 }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Coin</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Trades</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Win Rate</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Avg P&L</th>
              <th className="text-center py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">Total P&L</th>
            </tr>
          </thead>
          <tbody>
            {showNoCoinsMessage ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">No coins displayed</td>
              </tr>
            ) : (
              displayedCoins.map((c, i) => (
                <tr key={c.coin} className={i !== displayedCoins.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}>
                  <td className="py-3 px-4 text-left font-medium text-gray-900 dark:text-white">{c.coin}</td>
                  <td className="py-3 px-4 text-center text-gray-900 dark:text-white">{c.trades}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${c.winRate >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{Math.round(c.winRate)}%</span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-900 dark:text-white">${Math.round(c.avgPnL).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center font-semibold text-green-600">${Math.round(c.totalPnL).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {coins.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20"
          >
            {showAll ? 'Show Less' : `Show All (${coins.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
// --- END NEW ---

export function Analytics() {
  const { entries } = useTradeStore()

  // Add granularity state
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

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

  // Calculate P&L trend data with selected aggregation
  const pnlData = useMemo(() => {
    if (entries.length === 0) return [];
    let intervals: Date[] = [];
    let getLabel = (date: Date) => '';
    let getStart = (date: Date) => date;
    let getEnd = (date: Date) => date;
    const now = new Date();
    if (granularity === 'monthly') {
      intervals = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
      getLabel = (date) => format(date, 'MMM yyyy');
      getStart = startOfMonth;
      getEnd = endOfMonth;
    } else if (granularity === 'weekly') {
      const start = subMonths(now, 1);
      const allDays = eachDayOfInterval({ start, end: now });
      intervals = allDays.slice(-7); // Only last 7 days
      getLabel = (date) => format(date, 'dd MMM');
      getStart = startOfDay;
      getEnd = endOfDay;
    } else if (granularity === 'daily') {
      const start = subMonths(now, 1);
      const allDays = eachDayOfInterval({ start, end: now });
      intervals = allDays.slice(-5); // Only last 5 days
      getLabel = (date) => format(date, 'dd MMM');
      getStart = startOfDay;
      getEnd = endOfDay;
    }
    return intervals.map(date => {
      const start = getStart(date);
      const end = getEnd(date);
      const periodEntries = entries.filter(entry => {
        const d = parseISO(entry.date);
        return d >= start && d <= end;
      });
      const totalPnL = periodEntries.reduce((sum, entry) => sum + entry.pnl, 0);
      const winCount = periodEntries.filter(e => e.outcome === 'win').length;
      const totalTrades = periodEntries.length;
      const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
      return {
        period: getLabel(date),
        pnl: totalPnL,
        winRate,
        trades: totalTrades
      };
    });
  }, [entries, granularity]);

  // Calculate setup performance
  const setupPerformance = useMemo(() => {
    const setupStats = entries.reduce((acc, entry) => {
      const setup = typeof entry.setup === 'string' ? entry.setup : (Array.isArray(entry.setup) ? entry.setup.join(', ') : String(entry.setup));
      if (!acc[setup]) {
        acc[setup] = { wins: 0, total: 0, pnl: 0 };
      }
      acc[setup].total++;
      if (entry.outcome === 'win') acc[setup].wins++;
      acc[setup].pnl += entry.pnl;
      return acc;
    }, {} as Record<string, { wins: number; total: number; pnl: number }>);

    return Object.entries(setupStats)
      .map(([setup, stats]) => ({
        setup,
        trades: stats.total,
        winRate: (stats.wins / stats.total) * 100,
        avgPnL: stats.pnl / stats.total,
        totalPnL: stats.pnl
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 5);
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

  // Filtered entries for streaks (use all or filtered by date if you have a filter)
  const filteredEntries = entries;

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
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Analytics</h1>
        {/* Professional Summary Cards */}
        <AnalyticsSummaryCards entries={entries} />
        {/* Streaks Card (stretched full width) */}
        <div className="mb-4">
          <StreaksCard filteredEntries={entries} />
        </div>
        {/* Granularity Selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
          <button onClick={() => setGranularity('daily')} className={`px-3 py-1 rounded-lg text-sm font-semibold border ${granularity === 'daily' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>Daily</button>
          <button onClick={() => setGranularity('weekly')} className={`px-3 py-1 rounded-lg text-sm font-semibold border ${granularity === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>Weekly</button>
          <button onClick={() => setGranularity('monthly')} className={`px-3 py-1 rounded-lg text-sm font-semibold border ${granularity === 'monthly' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>Monthly</button>
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* P&L Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">P&L Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                  <XAxis 
                    dataKey="period"
                    interval={0}
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (granularity === 'monthly') return value;
                      return value;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  {/* Area under the line */}
                  <Area 
                    type="monotone"
                    dataKey="pnl"
                    stroke={COLORS.chart.accent}
                    fill={COLORS.chart.accent}
                    fillOpacity={0.1}
                    isAnimationActive={true}
                  />
                  {/* Average reference line */}
                  <ReferenceLine 
                    y={pnlData.length > 0 ? pnlData.reduce((a, b) => a + b.pnl, 0) / pnlData.length : 0}
                    label="Avg"
                    stroke="#8884d8"
                    strokeDasharray="3 3"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.chart.tooltip,
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '13px'
                    }}
                    formatter={(value: any, name: any) => {
                      let val = value;
                      if (Array.isArray(val)) val = val[0];
                      return [typeof val === 'number' ? `${val.toFixed(2)}%` : String(val), 'P&L'] as [React.ReactNode, string];
                    }}
                    labelFormatter={(label: string) => `Period: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke={COLORS.chart.accent} 
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS.chart.accent }}
                    activeDot={{ r: 7, fill: COLORS.chart.accent }}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Win Rate Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Win Rate Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} />
                  <XAxis 
                    dataKey="period"
                    interval={0}
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (granularity === 'monthly') return value;
                      return value;
                    }}
                  />
                  <YAxis 
                    tick={{ fill: COLORS.text.secondary, fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  {/* Area under the line */}
                  <Area 
                    type="monotone"
                    dataKey="winRate"
                    stroke={COLORS.chart.profit}
                    fill={COLORS.chart.profit}
                    fillOpacity={0.1}
                    isAnimationActive={true}
                  />
                  {/* Average reference line */}
                  <ReferenceLine 
                    y={pnlData.length > 0 ? pnlData.reduce((a, b) => a + b.winRate, 0) / pnlData.length : 0}
                    label="Avg"
                    stroke="#10B981"
                    strokeDasharray="3 3"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.chart.tooltip,
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '13px'
                    }}
                    formatter={(value: any, name: any) => {
                      let val = value;
                      if (Array.isArray(val)) val = val[0];
                      return [typeof val === 'number' ? `${val.toFixed(1)}%` : String(val), 'Win Rate'] as [React.ReactNode, string];
                    }}
                    labelFormatter={(label: string) => `Period: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke={COLORS.chart.profit} 
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS.chart.profit }}
                    activeDot={{ r: 7, fill: COLORS.chart.profit }}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Setup Performance */}
          <SetupPerformanceTable entries={entries} />
          {/* Coin Performance (replaces Tag Performance) */}
          <CoinPerformanceTable entries={entries} />
        </div>

        {/* Mood Impact */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Mood Impact</CardTitle>
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

        {/* --- NEW: Bottom Metrics Cards --- */}
        <BottomMetricsCards entries={entries} />
      </div>
    </div>
  )
} 