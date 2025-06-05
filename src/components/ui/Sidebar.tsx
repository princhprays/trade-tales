import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  BarChart2,
  Settings as SettingsIcon,
  Menu,
  ChevronLeft,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, value: 'dashboard' },
  { label: 'Calendar', icon: <Calendar size={20} />, value: 'calendar' },
  { label: 'Journal', icon: <BookOpen size={20} />, value: 'journal' },
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
      className={`h-full min-h-0 min-w-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-all duration-200 flex flex-col ${collapsed ? 'w-16' : 'w-56'} shadow-sm`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
        {!collapsed && <span className="font-bold text-lg dark:text-white">TradeTales</span>}
        <button
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <button
            key={item.value}
            className={`flex items-center gap-3 w-full px-4 py-2 my-1 rounded transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              active === item.value ? 'bg-gray-100 dark:bg-gray-700 font-semibold' : ''
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