import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import localforage from 'localforage'

export interface TradeEntry {
  id: string
  date: string
  lessons: string
  setup: string[]
  coin: string
  pnl: number
  outcome: 'win' | 'loss'
  tags: string[]
  mood: string
  images?: string[]
  notes?: string
  lastSaved?: string
  positionSize?: number
  leverage?: number
  link?: string
  selectedRules?: string[]
}

interface Settings {
  currency: string
  dateFormat: string
  theme: 'light' | 'dark'
  initialCapital: number
  customCoins: string[] // Array of user-added coins
  customSetups: string[] // Array of user-added setups
}

// Default coins that cannot be deleted
const DEFAULT_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC']

// Add CapitalEvent type for deposits/withdrawals
export interface CapitalEvent {
  id: string;
  date: string;
  amount: number; // Positive for deposit, negative for withdrawal
  type: 'deposit' | 'withdrawal';
  note?: string;
}

export interface TradingRule {
  id: string;
  title: string;
  description?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TradeStore {
  entries: TradeEntry[]
  settings: Settings
  capitalEvents: CapitalEvent[]
  rules: TradingRule[]
  addEntry: (entry: Omit<TradeEntry, 'id'>) => void
  updateEntry: (id: string, entry: Partial<TradeEntry>) => void
  deleteEntry: (id: string) => void
  updateSettings: (settings: Partial<Settings>) => void
  clearAllData: () => void
  addCustomCoin: (coin: string) => void
  removeCustomCoin: (coin: string) => void
  addCustomSetup: (setup: string) => void
  removeCustomSetup: (setup: string) => void
  addCapitalEvent: (event: Omit<CapitalEvent, 'id'>) => void
  updateCapitalEvent: (id: string, event: Partial<CapitalEvent>) => void
  deleteCapitalEvent: (id: string) => void
  addRule: (rule: Omit<TradingRule, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateRule: (id: string, rule: Partial<TradingRule>) => void
  deleteRule: (id: string) => void
  toggleRulePin: (id: string) => void
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set) => ({
      entries: [],
      settings: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light',
        initialCapital: 0,
        customCoins: [],
        customSetups: [],
      },
      capitalEvents: [],
      rules: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            { ...entry, id: crypto.randomUUID() },
          ],
        })),
      updateEntry: (id, entry) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...entry } : e
          ),
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      clearAllData: () =>
        set(() => ({
          entries: [],
          settings: {
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY',
            theme: 'light',
            initialCapital: 0,
            customCoins: [],
            customSetups: [],
          },
          capitalEvents: [],
          rules: [],
        })),
      addCustomCoin: (coin) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customCoins: [...new Set([...(state.settings.customCoins || []), coin.toUpperCase()])],
          },
        })),
      removeCustomCoin: (coin) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customCoins: state.settings.customCoins.filter((c) => c !== coin),
          },
        })),
      addCustomSetup: (setup) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customSetups: [...new Set([...(state.settings.customSetups || []), setup.trim()])],
          },
        })),
      removeCustomSetup: (setup) =>
        set((state) => ({
          settings: {
            ...state.settings,
            customSetups: state.settings.customSetups.filter((s) => s !== setup),
          },
        })),
      addCapitalEvent: (event) =>
        set((state) => ({
          capitalEvents: [
            ...state.capitalEvents,
            { ...event, id: crypto.randomUUID() },
          ],
        })),
      updateCapitalEvent: (id, event) =>
        set((state) => ({
          capitalEvents: state.capitalEvents.map((e) =>
            e.id === id ? { ...e, ...event } : e
          ),
        })),
      deleteCapitalEvent: (id) =>
        set((state) => ({
          capitalEvents: state.capitalEvents.filter((e) => e.id !== id),
        })),
      addRule: (rule) =>
        set((state) => ({
          rules: [
            ...state.rules,
            { ...rule, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        })),
      updateRule: (id, rule) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...rule } : r
          ),
        })),
      deleteRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        })),
      toggleRulePin: (id) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, pinned: !r.pinned } : r
          ),
        })),
    }),
    {
      name: 'trade-store',
      storage: createJSONStorage(() => localforage),
    }
  )
)

// Add setup alias map for consistent normalization across the app
const SETUP_ALIASES: Record<string, string> = {
  // Timeframe variations for 1H BP
  '1h bp': '1H BP',
  '1h break and pullback': '1H BP',
  '1h break & pullback': '1H BP',
  '1h break and pull': '1H BP',
  '1h break & pull': '1H BP',
  '1h breakpull': '1H BP',
  '1h breakpullback': '1H BP',
  '1h bp setup': '1H BP',
  '1h break and pullback setup': '1H BP',
  '1h break & pullback setup': '1H BP',
  '1h break and pull setup': '1H BP',
  '1h break & pull setup': '1H BP',
  '1h breakpull setup': '1H BP',
  '1h breakpullback setup': '1H BP',
  
  // Add more aliases as needed, e.g., for other setups like 'Baby':
  'baby - 1h bp trades': 'Baby',
  'baby - shesh setup': 'Baby',
  'baby setup': 'Baby',
  'babytrades': 'Baby',
  'baby strategy': 'Baby',
  'baby': 'Baby',
  
  // Coin aliases
  'btc': 'BTC',
  'ethereum': 'ETH',
  'solana': 'SOL',
  'bnb': 'BNB',
  // Add more coin aliases as needed
};

// Helper function to normalize setup or coin names
export function normalizeTradeName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  // First normalize the input - convert to lowercase and trim
  const normalized = name.toLowerCase().trim();
  
  // Check if this normalized name has an alias
  const alias = SETUP_ALIASES[normalized];
  if (alias) return alias;
  
  // If no direct alias, try to find a partial match
  for (const [key, value] of Object.entries(SETUP_ALIASES)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return value;
    }
  }
  
  // If no match found, return the original name with proper capitalization
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to create a storage object for Zustand
function createJSONStorage(storage: () => any) {
  return {
    getItem: async (name: string) => {
      const value = await storage().getItem(name)
      return value ? JSON.parse(value) : null
    },
    setItem: async (name: string, value: any) => {
      await storage().setItem(name, JSON.stringify(value))
    },
    removeItem: async (name: string) => {
      await storage().removeItem(name)
    },
  }
} 