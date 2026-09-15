import { useMemo, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MemberFormDialog } from '@/components/members/MemberFormDialog'
import { saveMemberAction } from '@/services/actions/memberActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { getAvatarColor } from '@/utils/avatar'
import { generateId } from '@/utils/id'
import { emailToUid } from '@/utils/identity'
import { nowIso } from '@/utils/date'
import type { Member } from '@/types'

interface MemberMultiSelectProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  className?: string
}

export function MemberMultiSelect({ selectedIds, onChange, className }: MemberMultiSelectProps) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const members = useDataStore((s) => s.members)
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
    [members, query],
  )

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  async function handleCreate(values: { name: string; email?: string; phone?: string }) {
    if (!userId) return
    // If they have an email, key the member by the same deterministic id their own future login
    // would resolve to — so adding "priya@example.com" to a group works even before Priya has
    // ever opened the app; she'll land on this exact account the first time she signs in.
    const id = values.email ? await emailToUid(values.email) : generateId('mem')
    const member: Member = {
      id,
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      avatarColor: getAvatarColor(values.name),
      createdAt: nowIso(),
    }
    await saveMemberAction(userId, member)
    onChange([...selectedIds, member.id])
  }

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search saved members..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      <div className="mt-2 max-h-64 overflow-y-auto scrollbar-thin rounded-lg border border-border divide-y divide-border">
        {filtered.map((member) => (
          <label key={member.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-secondary/60 transition-colors">
            <Checkbox checked={selectedIds.includes(member.id)} onCheckedChange={() => toggle(member.id)} />
            <Avatar name={member.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{member.name}</p>
              {(member.email || member.phone) && <p className="text-xs text-muted-foreground truncate">{member.email ?? member.phone}</p>}
            </div>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">No members found.</p>
        )}
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => setCreateOpen(true)}>
        <UserPlus className="size-4" /> Add a new member
      </Button>

      <MemberFormDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
    </div>
  )
}
