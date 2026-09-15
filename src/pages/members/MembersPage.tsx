import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MoreVertical, Plus, Search, Trash2, UserPen, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MemberFormDialog } from '@/components/members/MemberFormDialog'
import { removeMemberAction, saveMemberAction, updateMemberAction } from '@/services/actions/memberActions'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { getAvatarColor } from '@/utils/avatar'
import { generateId } from '@/utils/id'
import { emailToUid } from '@/utils/identity'
import { nowIso } from '@/utils/date'
import type { Member } from '@/types'

export default function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = useAuthStore((s) => s.currentUser?.id)
  const members = useDataStore((s) => s.members)
  const savedMemberIds = useDataStore((s) => s.savedMemberIds)
  const groups = useDataStore((s) => s.groups)

  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(searchParams.get('add') === '1')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)

  const savedOnly = useMemo(() => {
    if (!isFirebaseConfigured()) return members.filter((m) => !m.isSelf)
    const savedIds = new Set(savedMemberIds)
    return members.filter((m) => savedIds.has(m.id) && m.id !== userId)
  }, [members, savedMemberIds, userId])

  const filtered = useMemo(
    () => savedOnly.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.email?.toLowerCase().includes(query.toLowerCase())),
    [savedOnly, query],
  )

  function groupCountFor(memberId: string) {
    return groups.filter((g) => g.memberIds.includes(memberId)).length
  }

  async function handleAddOrEdit(values: { name: string; email?: string; phone?: string }) {
    if (!userId) return
    if (editingMember) {
      await updateMemberAction(userId, { ...editingMember, name: values.name, email: values.email || undefined, phone: values.phone || undefined })
      toast.success('Member updated')
    } else {
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
      toast.success('Member saved', { description: `${values.name} is ready to add to any group.` })
    }
    setEditingMember(null)
  }

  async function handleDelete() {
    if (!deletingMember || !userId) return
    await removeMemberAction(userId, deletingMember.id)
    toast.success('Member removed from your saved list')
    setDeletingMember(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Members</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Save people once, reuse them across every group.</p>
        </div>
        <Button
          onClick={() => {
            setEditingMember(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" /> Add member
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search members..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="👥"
          title={query ? 'No members match your search' : 'No saved members yet'}
          description={query ? 'Try a different name or email.' : 'Add people once and reuse them whenever you create a group.'}
          action={
            !query && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-4" /> Add your first member
              </Button>
            )
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar name={member.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email ?? member.phone ?? 'No contact info'}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Users className="size-3" /> {groupCountFor(member.id)} group{groupCountFor(member.id) === 1 ? '' : 's'}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingMember(member)
                        setFormOpen(true)
                      }}
                    >
                      <UserPen className="size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem destructive onClick={() => setDeletingMember(member)}>
                      <Trash2 className="size-4" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MemberFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingMember(null)
            searchParams.delete('add')
            setSearchParams(searchParams, { replace: true })
          }
        }}
        member={editingMember}
        onSubmit={handleAddOrEdit}
      />

      <ConfirmDialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
        title={`Remove ${deletingMember?.name}?`}
        description="This removes them from your saved members list. Groups they already belong to are unaffected."
        confirmLabel="Remove"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
