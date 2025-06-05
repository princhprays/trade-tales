import { useState } from 'react'
import { Sidebar } from './components/ui/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Calendar } from './components/Calendar'
import { Journal } from './components/Journal'
import { Analytics } from './components/Analytics'
import { Settings } from './components/Settings'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from './components/ThemeProvider'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <ThemeProvider>
      <div className="w-screen h-screen min-h-0 min-w-0 flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar active={activePage} onChange={setActivePage} />
        <main className="flex-1 h-full min-h-0 min-w-0 overflow-y-auto flex flex-col">
          {activePage === 'dashboard' && <Dashboard />}
          {activePage === 'calendar' && <Calendar />}
          {activePage === 'journal' && <Journal />}
          {activePage === 'analytics' && <Analytics />}
          {activePage === 'settings' && <Settings />}
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App
