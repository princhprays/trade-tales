import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useTradeStore } from '../store/tradeStore'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { useToast } from './ui/use-toast'
import { Dialog as TradesDialog, DialogContent as TradesDialogContent, DialogHeader as TradesDialogHeader, DialogTitle as TradesDialogTitle } from './ui/dialog'

const WINLOSS_COLORS = ['#10B981', '#EF4444'] // Modern green and red
const CHART_COLORS = {
  primary: '#3B82F6', // Modern blue
  grid: '#E5E7EB',
  text: '#6B7280',
  tooltip: '#1F2937'
}

// Add setup alias map at the top level
const SETUP_ALIASES: Record<string, string> = {
  // Add your setup aliases here
  'baby - 1h bp trades': 'baby',
  'baby - shesh setup': 'baby',
  // Add more aliases as needed
};

// Helper function to normalize setup names
function normalizeSetupName(setup: string): string {
  if (!setup) return '';
  
  // First normalize the input
  const normalized = setup.toLowerCase().trim();
  
  // Check if this normalized name has an alias
  return SETUP_ALIASES[normalized] || normalized;
}

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(match.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    match.addEventListener('change', handler);
    return () => match.removeEventListener('change', handler);
  }, []);
  return isDark;
}

// Add this custom tooltip component above the Dashboard export
function WinLossCustomTooltip({ active, payload, label, isDarkMode, winLossData }: { active?: boolean; payload?: any[]; label?: any; isDarkMode: boolean; winLossData: any[] }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const name = entry.name;
  const value = entry.value;
  const total = winLossData.reduce((sum, d) => sum + (d.value || 0), 0);
  const percent = total > 0 ? (value / total) * 100 : null;
  const color = name === 'Win' ? (isDarkMode ? '#10B981' : '#059669') : (isDarkMode ? '#EF4444' : '#DC2626');
  return (
    <div
      style={{
        background: isDarkMode ? '#1F2937' : '#fff',
        color: isDarkMode ? '#fff' : '#1F2937',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: isDarkMode ? '0 2px 8px #0004' : '0 2px 8px #0001',
        minWidth: 80,
      }}
    >
      <div style={{ fontWeight: 600, color }}>{value} {name}</div>
      {percent !== null && (
        <div style={{ fontSize: 13, color: isDarkMode ? '#fff' : '#1F2937' }}>{percent.toFixed(0)}%</div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { entries, settings, updateSettings } = useTradeStore()
  const [isEditingCapital, setIsEditingCapital] = useState(false)
  const [newCapital, setNewCapital] = useState(settings?.initialCapital?.toString() || '0')
  const { toast } = useToast()

  // Modal state for Most Traded Setup trades list
  const [showTradesModal, setShowTradesModal] = useState(false)
  const [modalTrades, setModalTrades] = useState<any[]>([])
  const [modalSetup, setModalSetup] = useState('')

  // Calculate total PnL
  const totalPnL = entries.reduce((sum, entry) => sum + entry.pnl, 0)

  // Calculate total assets with safe fallback
  const initialCapital = settings?.initialCapital || 0
  const totalAssets = initialCapital + totalPnL

  // Handle initial capital update
  const handleUpdateCapital = () => {
    const capital = parseFloat(newCapital)
    if (isNaN(capital) || capital < 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number',
        variant: 'destructive'
      })
      return
    }
    updateSettings({ initialCapital: capital })
    setIsEditingCapital(false)
    toast({
      title: 'Success',
      description: 'Initial capital updated successfully'
    })
  }

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

  const isDarkMode = useIsDarkMode();

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
                <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Total Assets</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] xs:text-xs sm:text-sm h-6 xs:h-7 sm:h-8 px-2"
                  onClick={() => setIsEditingCapital(true)}
                >
                  Edit
                </Button>
              </div>
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ${totalAssets.toFixed(2)}
              </div>
              <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Initial: ${initialCapital.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700 hover:shadow-md transition-shadow">
            <CardContent className="p-3 xs:p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1 xs:mb-2">
                <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Total PnL</h3>
                <span className={`text-[10px] xs:text-xs sm:text-sm font-medium ${totalPnL >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{totalPnL >= 0 ? '↑' : '↓'} {Math.abs(totalPnL).toFixed(2)}%</span>
              </div>
              <div className={`text-lg xs:text-xl sm:text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} dark:text-white`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}%
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
                      content={(props) => (
                        <WinLossCustomTooltip
                          {...props}
                          isDarkMode={isDarkMode}
                          winLossData={winLossData}
                        />
                      )}
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
                <PerformanceMetrics
                  entries={entries}
                  period="week"
                  showTradesModal={showTradesModal}
                  setShowTradesModal={setShowTradesModal}
                  modalTrades={modalTrades}
                  setModalTrades={setModalTrades}
                  modalSetup={modalSetup}
                  setModalSetup={setModalSetup}
                />
              </TabsContent>
              <TabsContent value="monthly">
                <PerformanceMetrics
                  entries={entries}
                  period="month"
                  showTradesModal={showTradesModal}
                  setShowTradesModal={setShowTradesModal}
                  modalTrades={modalTrades}
                  setModalTrades={setModalTrades}
                  modalSetup={modalSetup}
                  setModalSetup={setModalSetup}
                />
              </TabsContent>
              <TabsContent value="yearly">
                <PerformanceMetrics
                  entries={entries}
                  period="year"
                  showTradesModal={showTradesModal}
                  setShowTradesModal={setShowTradesModal}
                  modalTrades={modalTrades}
                  setModalTrades={setModalTrades}
                  modalSetup={modalSetup}
                  setModalSetup={setModalSetup}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Initial Capital Dialog */}
        <Dialog open={isEditingCapital} onOpenChange={setIsEditingCapital}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Initial Capital</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Input
                  id="capital"
                  type="number"
                  value={newCapital}
                  onChange={(e) => setNewCapital(e.target.value)}
                  className="col-span-4"
                  placeholder="Enter initial capital"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingCapital(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCapital}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {/* Trades Modal for Most Traded Setup */}
      <TradesDialog open={showTradesModal} onOpenChange={setShowTradesModal}>
        <TradesDialogContent className="w-[95vw] xs:w-[90vw] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[900px] p-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 [&>button]:hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-100 dark:border-gray-700">
            <TradesDialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Trades for setup: <span className="text-blue-600 dark:text-blue-400 font-semibold">{modalSetup}</span>
            </TradesDialogTitle>
            <button
              onClick={() => setShowTradesModal(false)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close"
              type="button"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            {modalTrades.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm">No trades found.</div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <table className="w-full text-xs xs:text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/60">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">PnL ($)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">% PnL</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Position Size</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Leverage</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Outcome</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Mood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalTrades.map((trade, idx) => {
                      const hasPositionSize = trade.positionSize && Number(trade.positionSize) > 0;
                      const percentPnl = hasPositionSize ? (trade.pnl / trade.positionSize) * 100 : null;
                      return (
                        <tr
                          key={idx}
                          className={
                            `transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/40'} ` +
                            'hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          }
                        >
                          <td className="px-4 py-3 whitespace-nowrap font-medium">{format(parseISO(trade.date), 'MMM d, yyyy')}</td>
                          <td className={`px-4 py-3 whitespace-nowrap font-semibold ${trade.outcome === 'win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{hasPositionSize && percentPnl !== null && percentPnl !== undefined ? `${percentPnl.toFixed(2)}%` : <span className="text-gray-400">-</span>}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{hasPositionSize ? `$${Number(trade.positionSize).toLocaleString()}` : <span className="text-gray-400">-</span>}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{trade.leverage ? `${trade.leverage}x` : <span className="text-gray-400">-</span>}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${trade.outcome === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{trade.outcome}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {trade.mood ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                trade.mood === 'happy' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                trade.mood === 'neutral' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                                trade.mood === 'sad' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300'
                              }`}>
                                {trade.mood.charAt(0).toUpperCase() + trade.mood.slice(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TradesDialogContent>
      </TradesDialog>
    </div>
  )
}

// Helper function to calculate equity curve
function getEquityCurve(trades: any[], initialCapital: number): { equity: number; peak: number }[] {
  const curve: { equity: number; peak: number }[] = [];
  let equity = initialCapital;
  let peak = initialCapital;

  // Sort trades by date to ensure correct sequence
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const trade of sortedTrades) {
    equity += trade.pnl;
    peak = Math.max(peak, equity);
    curve.push({ equity, peak });
  }

  return curve;
}

// Helper function to calculate max drawdown
function getMaxDrawdownFromCurve(curve: { equity: number; peak: number }[]): { 
  maxDrawdown: number; 
  maxDrawdownPercent: number;
  peakEquity: number;
} {
  if (curve.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0, peakEquity: 0 };

  let maxDrawdown = 0;
  let peakEquity = 0;

  for (const point of curve) {
    peakEquity = Math.max(peakEquity, point.equity);
    const drawdown = point.equity - peakEquity;
    maxDrawdown = Math.min(maxDrawdown, drawdown);
  }

  // Calculate max drawdown as percentage of peak equity
  const maxDrawdownPercent = peakEquity !== 0 ? (Math.abs(maxDrawdown) / peakEquity) * 100 : 0;

  return {
    maxDrawdown,
    maxDrawdownPercent,
    peakEquity
  };
}

function getMostTradedSetupInfo(filtered: any[]): { setup: string; count: number; pnl: number; normalized: string; trades: any[] } | null {
  if (filtered.length === 0) return null;

  // Create a map to store setup statistics
  const setupStats: Record<string, {
    count: number;
    pnl: number;
    lastDate: string;
    display: string;
    trades: any[];
    normalized: string;
  }> = {};

  // Process each trade
  filtered.forEach(e => {
    if (!e.setup) return;

    // Normalize the setup name using our helper function
    const normalized = normalizeSetupName(e.setup);
    const displaySetup = e.setup.trim(); // Keep original case for display
    
    // If this is the first occurrence of this normalized setup
    if (!setupStats[normalized]) {
      setupStats[normalized] = {
        count: 0,
        pnl: 0,
        lastDate: e.date,
        display: displaySetup,
        trades: [],
        normalized: normalized
      };
    }

    // Update statistics
    setupStats[normalized].count++;
    setupStats[normalized].pnl += e.pnl;
    setupStats[normalized].trades.push(e);

    // Update display name if this is a more recent trade
    if (new Date(e.date) > new Date(setupStats[normalized].lastDate)) {
      setupStats[normalized].lastDate = e.date;
      setupStats[normalized].display = displaySetup;
    }
  });

  // Convert to array for sorting
  const setups = Object.entries(setupStats);

  if (setups.length === 0) return null;

  // Check if any setup has more than 1 trade
  const dominant = setups.filter(([_, stat]) => stat.count > 1);
  
  if (dominant.length > 0) {
    // Sort by count (descending), then by PnL (descending), then by most recent
    dominant.sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      if (b[1].pnl !== a[1].pnl) return b[1].pnl - a[1].pnl;
      return new Date(b[1].lastDate).getTime() - new Date(a[1].lastDate).getTime();
    });

    const [normalized, stat] = dominant[0];
    return {
      setup: stat.display,
      count: stat.count,
      pnl: stat.pnl,
      normalized: normalized,
      trades: stat.trades
    };
  }

  // If all setups have only 1 trade, sort by PnL then by most recent
  setups.sort((a, b) => {
    if (b[1].pnl !== a[1].pnl) return b[1].pnl - a[1].pnl;
    return new Date(b[1].lastDate).getTime() - new Date(a[1].lastDate).getTime();
  });

  const [normalized, stat] = setups[0];
  return {
    setup: stat.display,
    count: stat.count,
    pnl: stat.pnl,
    normalized: normalized,
    trades: stat.trades
  };
}

function PerformanceMetrics({ entries, period, showTradesModal, setShowTradesModal, modalTrades, setModalTrades, modalSetup, setModalSetup }: {
  entries: any[];
  period: 'week' | 'month' | 'year';
  showTradesModal: boolean;
  setShowTradesModal: (open: boolean) => void;
  modalTrades: any[];
  setModalTrades: (trades: any[]) => void;
  modalSetup: string;
  setModalSetup: (setup: string) => void;
}) {
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
  
  // Helper function to safely format dates
  const formatDate = (dateStr: string) => {
    try {
      return dateStr ? format(parseISO(dateStr), 'MMM d, yyyy') : 'No date'
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Get initial capital from store
  const { settings } = useTradeStore();
  const initialCapital = settings?.initialCapital || 0;

  // Calculate equity curve for filtered trades (sorted by date for correct curve)
  const filteredSorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const equityCurve = getEquityCurve(filteredSorted, initialCapital);
  const { maxDrawdown, maxDrawdownPercent } = getMaxDrawdownFromCurve(equityCurve);
  const mostTradedSetupInfo = getMostTradedSetupInfo(filtered);

  return (
    <>
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4">
        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <CardContent className="p-3 xs:p-4">
            <div className="flex items-center justify-between mb-1 xs:mb-2">
              <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Total P&L</h3>
              <span className={`text-[10px] xs:text-xs sm:text-sm font-medium ${totalPnL >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{totalPnL >= 0 ? '↑' : '↓'} {Math.abs(totalPnL).toFixed(2)}%</span>
            </div>
            <div className={`text-lg xs:text-xl sm:text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} dark:text-white`}>{totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <CardContent className="p-3 xs:p-4">
            <div className="flex items-center justify-between mb-1 xs:mb-2">
              <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Win Rate</h3>
              <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Period</span>
            </div>
            <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">{winRate.toFixed(1)}%</div>
            <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">{winCount} wins / {numTrades} trades</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <CardContent className="p-3 xs:p-4">
            <div className="flex items-center justify-between mb-1 xs:mb-2">
              <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Avg Trade</h3>
              <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Period</span>
            </div>
            <div className={`text-lg xs:text-xl sm:text-2xl font-bold ${avgPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{avgPnL.toFixed(2)}</div>
            <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">{numTrades} trades in period</div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <CardContent className="p-3 xs:p-4">
            <div className="flex items-center justify-between mb-1 xs:mb-2">
              <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Risk/Reward</h3>
              <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Ratio</span>
            </div>
            <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">{rr.toFixed(2)}</div>
            <div className="mt-1 xs:mt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500">Avg Win: ${avgWin.toFixed(2)} / Avg Loss: ${avgLoss.toFixed(2)}</div>
          </CardContent>
        </Card>

        {/* Most Traded Setup */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <CardContent className="p-3 xs:p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-1 xs:mb-2">
              <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Most Traded Setup</h3>
              <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Period</span>
            </div>
            <div className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">
              {mostTradedSetupInfo ? mostTradedSetupInfo.setup : 'No trades yet'}
            </div>
            {mostTradedSetupInfo && (
              <button
                className="text-[10px] xs:text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1 underline underline-offset-2 text-left w-fit"
                onClick={() => {
                  setModalTrades(mostTradedSetupInfo.trades);
                  setModalSetup(mostTradedSetupInfo.setup);
                  setShowTradesModal(true);
                }}
                type="button"
              >
                {mostTradedSetupInfo.count} trade{mostTradedSetupInfo.count > 1 ? 's' : ''}, ${mostTradedSetupInfo.pnl.toFixed(2)}
              </button>
            )}
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700">
          <CardContent className="p-3 xs:p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-1 xs:mb-2">
              <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Max Drawdown</h3>
              <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-red-500">Period</span>
            </div>
            <div className="flex flex-col">
              <div className={`text-lg xs:text-xl sm:text-2xl font-bold ${maxDrawdown === 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                {maxDrawdown === 0
                  ? '$0.00'
                  : `-$${Math.abs(maxDrawdown).toFixed(2)}`}
              </div>
              {maxDrawdown !== 0 && (
                <div className="text-xs xs:text-sm text-red-600 dark:text-red-400 mt-1">
                  {maxDrawdownPercent.toFixed(1)}% of peak
                </div>
              )}
            </div>
            <div className="mt-auto pt-2 text-[10px] xs:text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Calculated from equity curve
            </div>
          </CardContent>
        </Card>

        {/* Equity Curve Chart */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-md dark:border dark:border-gray-700 col-span-1 xs:col-span-2 lg:col-span-3">
          <CardContent className="p-3 xs:p-4">
            <div className="flex items-center justify-between mb-1 xs:mb-2">
              <h3 className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-100">Equity Curve</h3>
              <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-blue-500">Period</span>
            </div>
            <div className="h-[200px] xs:h-[250px] sm:h-[300px]">
              {equityCurve.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs xs:text-sm">
                  No trading data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityCurve.map((point, index) => ({
                    date: index,
                    equity: point.equity,
                    peak: point.peak
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: CHART_COLORS.text, fontSize: 10 }}
                      tickFormatter={(value) => value + 1}
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
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                      labelFormatter={(label) => `Trade ${Number(label) + 1}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: CHART_COLORS.primary }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="peak" 
                      stroke="#10B981" 
                      strokeWidth={1}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span>Equity</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-green-500 border-dashed border border-green-500"></div>
                <span>Peak</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 