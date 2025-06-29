import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  BarChart2,
  Settings as SettingsIcon,
  Menu,
  ChevronLeft,
  BookMarked,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, value: 'dashboard' },
  { label: 'Calendar', icon: <Calendar size={20} />, value: 'calendar' },
  { label: 'Journal', icon: <BookOpen size={20} />, value: 'journal' },
  { label: 'Rules', icon: <BookMarked size={20} />, value: 'rules' },
  { label: 'Analytics', icon: <BarChart2 size={20} />, value: 'analytics' },
  { label: 'Settings', icon: <SettingsIcon size={20} />, value: 'settings' },
];

interface SidebarProps {
  active: string;
  onChange: (value: string) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-full min-h-0 min-w-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 flex flex-col ${collapsed ? 'w-16' : 'w-56'} shadow-sm relative z-10`}
    >
      <div className={`flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 ${collapsed ? 'px-0 justify-center' : 'px-4'}`}>
        {!collapsed && <span className="font-bold text-lg text-gray-900 dark:text-white">TradeTales</span>}
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center w-full' : ''}`}>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <button
            key={item.value}
            className={`flex items-center gap-3 w-full px-4 py-2 my-1 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              active === item.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : ''
            } ${collapsed ? 'justify-center px-2' : ''}`}
            onClick={() => onChange(item.value)}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
} 