import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils/cn'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'info'
  hint?: string
  delay?: number
}

const TONE_CLASSES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
}

export function StatCard({ label, value, icon: Icon, tone = 'default', hint, delay = 0 }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay }}>
      <Card className="h-full">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 text-xs leading-snug text-muted-foreground sm:text-sm">{label}</span>
            <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', TONE_CLASSES[tone])}>
              <Icon className="size-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight num-tabular truncate">{value}</div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}
