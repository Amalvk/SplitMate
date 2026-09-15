import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Mic, Plus, ReceiptText, UserPlus, Users, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'

const ACTIONS = [
  { label: 'Add Expense', icon: ReceiptText, to: ROUTES.newExpense },
  { label: 'Voice Expense', icon: Mic, to: `${ROUTES.newExpense}?mode=voice` },
  { label: 'New Group', icon: Users, to: ROUTES.newGroup },
  { label: 'Add Member', icon: UserPlus, to: `${ROUTES.members}?add=1` },
  { label: 'Settle Up', icon: Wallet, to: ROUTES.settlements },
]

export function Fab() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <div className="fixed z-40 right-4 bottom-20 lg:right-8 lg:bottom-8 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-col items-end gap-2"
          >
            {ACTIONS.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => go(action.to)}
                className="flex items-center gap-2.5 rounded-full bg-card border border-border pl-4 pr-1.5 py-1.5 shadow-lg hover:bg-secondary transition-colors"
              >
                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <action.icon className="size-4.5" />
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close quick actions' : 'Quick actions'}
        className={cn(
          'flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95',
        )}
      >
        <motion.span animate={{ rotate: open ? 135 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="size-6" />
        </motion.span>
      </button>
      {open && <span className="sr-only">Quick actions open</span>}
    </div>
  )
}
