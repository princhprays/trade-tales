import { useState } from 'react'
import { useTradeStore, type TradingRule } from '@/store/tradeStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Edit2, Trash2, Pin, PinOff, BookOpen } from 'lucide-react'

export function Rules() {
  const { rules, addRule, updateRule, deleteRule, toggleRulePin } = useTradeStore()
  const { toast } = useToast()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TradingRule | null>(null)
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null)
  
  const [newRule, setNewRule] = useState({
    title: '',
    description: '',
    pinned: false
  })

  // Sort rules: pinned first, then by creation date
  const sortedRules = [...rules].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleAddRule = () => {
    if (!newRule.title.trim()) {
      toast({
        title: 'Error',
        description: 'Rule title is required',
        variant: 'destructive'
      })
      return
    }

    addRule({
      title: newRule.title.trim(),
      description: newRule.description.trim() || undefined,
      pinned: newRule.pinned
    })

    toast({
      title: 'Success',
      description: 'Rule added successfully'
    })

    setNewRule({ title: '', description: '', pinned: false })
    setIsAddDialogOpen(false)
  }

  const handleEditRule = () => {
    if (!editingRule || !editingRule.title.trim()) {
      toast({
        title: 'Error',
        description: 'Rule title is required',
        variant: 'destructive'
      })
      return
    }

    updateRule(editingRule.id, {
      title: editingRule.title.trim(),
      description: editingRule.description?.trim() || undefined,
      updatedAt: new Date().toISOString()
    })

    toast({
      title: 'Success',
      description: 'Rule updated successfully'
    })

    setEditingRule(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteRule = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete)
      toast({
        title: 'Success',
        description: 'Rule deleted successfully'
      })
    }
    setIsDeleteDialogOpen(false)
    setRuleToDelete(null)
  }

  const handleTogglePin = (id: string) => {
    toggleRulePin(id)
    toast({
      title: 'Success',
      description: 'Rule pin status updated'
    })
  }

  const openEditDialog = (rule: TradingRule) => {
    setEditingRule({ ...rule })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (id: string) => {
    setRuleToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trading Rules</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your personal playbook - write, review, and follow your trading discipline
          </p>
        </div>
        {sortedRules.length > 0 && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Add Rule
          </Button>
        )}
      </div>

      {sortedRules.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No rules yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start building your trading discipline by adding your first rule
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add Your First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedRules.map((rule) => (
            <Card key={rule.id} className={`transition-all duration-200 ${rule.pinned ? 'ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {rule.title}
                      </h3>
                      {rule.pinned && (
                        <Pin size={16} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {rule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                      {rule.updatedAt !== rule.createdAt && (
                        <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePin(rule.id)}
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      {rule.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(rule)}
                      className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(rule.id)}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Rule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rule Title *
              </label>
              <Input
                value={newRule.title}
                onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                placeholder="e.g., Never trade during news events"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (Optional)
              </label>
              <Textarea
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Add reasoning or details..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pin-rule"
                checked={newRule.pinned}
                onChange={(e) => setNewRule({ ...newRule, pinned: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="pin-rule" className="text-sm text-gray-700 dark:text-gray-300">
                Pin this rule (show at top)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRule}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rule Title *
                </label>
                <Input
                  value={editingRule.title}
                  onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                  placeholder="e.g., Never trade during news events"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description (Optional)
                </label>
                <Textarea
                  value={editingRule.description || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="Add reasoning or details..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRule}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRule} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 