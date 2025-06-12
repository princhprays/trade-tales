import { useState } from 'react'
import { Sidebar } from './components/ui/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Calendar } from './components/Calendar'
import { Journal } from './components/Journal'
import { Analytics } from './components/Analytics'
import { Settings } from './components/Settings'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from './contexts/ThemeContext'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [autoOpenCalendar, setAutoOpenCalendar] = useState(false)

  const handlePageChange = (page: string, fromComponent?: string) => {
    // Only set autoOpenCalendar to true when navigating from Dashboard or Journal to Calendar
    if ((fromComponent === 'dashboard' || fromComponent === 'journal') && page === 'calendar') {
      setAutoOpenCalendar(true)
    } else {
      setAutoOpenCalendar(false)
    }
    setActivePage(page)
  }

  const handleSidebarNavigation = (page: string) => {
    // Sidebar navigation should never auto-open calendar
    setAutoOpenCalendar(false)
    setActivePage(page)
  }

  return (
    <ThemeProvider>
      <div className="w-screen h-screen min-h-0 min-w-0 flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar active={activePage} onChange={handleSidebarNavigation} />
        <main className="flex-1 h-full min-h-0 min-w-0 overflow-y-auto flex flex-col p-6">
          {activePage === 'dashboard' && <Dashboard onNavigate={handlePageChange} />}
          {activePage === 'calendar' && <Calendar autoOpen={autoOpenCalendar} />}
          {activePage === 'journal' && <Journal onNavigate={handlePageChange} />}
          {activePage === 'analytics' && <Analytics />}
          {activePage === 'settings' && <Settings />}
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App
