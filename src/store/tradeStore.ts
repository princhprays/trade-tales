import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import localforage from 'localforage'

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

interface Settings {
  currency: string
  dateFormat: string
  theme: 'light' | 'dark'
}

interface TradeStore {
  entries: TradeEntry[]
  settings: Settings
  addEntry: (entry: Omit<TradeEntry, 'id'>) => void
  updateEntry: (id: string, entry: Partial<TradeEntry>) => void
  deleteEntry: (id: string) => void
  updateSettings: (settings: Partial<Settings>) => void
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set) => ({
      entries: [],
      settings: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        theme: 'light',
      },
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
    }),
    {
      name: 'trade-store',
      storage: createJSONStorage(() => localforage),
    }
  )
)

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