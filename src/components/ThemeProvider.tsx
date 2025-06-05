import { useEffect } from 'react'
import { useTradeStore } from '../store/tradeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useTradeStore()

  useEffect(() => {
    const root = window.document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [settings.theme])

  return <>{children}</>
} 