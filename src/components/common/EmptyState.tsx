import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  emoji?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, emoji, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-14 px-6 text-center', className)}>
      {emoji && <div className="text-4xl">{emoji}</div>}
      {icon}
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {action && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  )
}
