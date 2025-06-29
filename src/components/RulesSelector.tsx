import { useState } from 'react'
import { useTradeStore, type TradingRule } from '@/store/tradeStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pin, BookMarked, Check } from 'lucide-react'

interface RulesSelectorProps {
  selectedRules: string[]
  onRulesChange: (ruleIds: string[]) => void
  className?: string
}

export function RulesSelector({ selectedRules, onRulesChange, className }: RulesSelectorProps) {
  const { rules } = useTradeStore()
  const [isExpanded, setIsExpanded] = useState(false)

  // Sort rules: pinned first, then by creation date
  const sortedRules = [...rules].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleRuleToggle = (ruleId: string) => {
    const newSelectedRules = selectedRules.includes(ruleId)
      ? selectedRules.filter(id => id !== ruleId)
      : [...selectedRules, ruleId]
    onRulesChange(newSelectedRules)
  }

  if (rules.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookMarked size={20} />
            Trading Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No rules defined yet. Add rules in the Rules tab to track your discipline.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookMarked size={20} />
          Trading Rules
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Which rules did you follow in this trade?
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedRules.slice(0, isExpanded ? undefined : 3).map((rule) => {
          const isSelected = selectedRules.includes(rule.id)
          return (
            <div key={rule.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleRuleToggle(rule.id)}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                {isSelected && <Check size={12} />}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {rule.title}
                  </span>
                  {rule.pinned && (
                    <Pin size={14} className="text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                {rule.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {rule.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
        
        {rules.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? 'Show Less' : `Show ${rules.length - 3} More Rules`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 