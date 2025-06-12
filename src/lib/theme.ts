export const colorSystem = {
  // Backgrounds
  primary: 'bg-white dark:bg-gray-900',
  secondary: 'bg-gray-50 dark:bg-gray-800',
  tertiary: 'bg-gray-100 dark:bg-gray-700',
  
  // Text Colors
  textPrimary: 'text-gray-900 dark:text-white',
  textSecondary: 'text-gray-600 dark:text-gray-300',
  textTertiary: 'text-gray-500 dark:text-gray-400',
  
  // Borders
  border: 'border-gray-200 dark:border-gray-700',
  borderLight: 'border-gray-100 dark:border-gray-800',
  
  // Interactive States
  hover: 'hover:bg-gray-50 dark:hover:bg-gray-800',
  focus: 'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
  
  // Semantic Colors
  success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  info: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
} as const;

export const componentClasses = {
  // Cards & Containers
  card: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow",
  section: "bg-gray-50 dark:bg-gray-900 min-h-screen",
  
  // Form Elements
  input: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent rounded-lg",
  select: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg",
  buttonPrimary: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg",
  buttonSecondary: "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg",
  
  // Navigation & Menus
  navItem: "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg",
  navActive: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
  
  // Data Display
  tableHeader: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  tableRow: "bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
  metricCard: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg",
  metricValue: "text-gray-900 dark:text-white",
  metricLabel: "text-gray-600 dark:text-gray-400"
} as const; 