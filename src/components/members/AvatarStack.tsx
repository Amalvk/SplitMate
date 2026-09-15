import { Avatar } from '@/components/ui/avatar'
import type { Member } from '@/types'

export function AvatarStack({ members, max = 5 }: { members: Member[]; max?: number }) {
  const visible = members.slice(0, max)
  const extra = members.length - visible.length

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m) => (
        <Avatar key={m.id} name={m.name} size="sm" ring />
      ))}
      {extra > 0 && (
        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold ring-2 ring-background">
          +{extra}
        </div>
      )}
    </div>
  )
}
