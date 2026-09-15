import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { Copy, QrCode, Trash2, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MemberMultiSelect } from '@/components/members/MemberMultiSelect'
import { addMemberToGroupAction, removeMemberFromGroupAction } from '@/services/actions/groupActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import type { Group, Member } from '@/types'

export function MembersTab({ group }: { group: Group }) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const allMembers = useDataStore((s) => s.members)

  const groupMembers = useMemo(() => allMembers.filter((m) => group.memberIds.includes(m.id)), [allMembers, group.memberIds])
  const [addOpen, setAddOpen] = useState(false)
  const [pendingAdd, setPendingAdd] = useState<string[]>(group.memberIds)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)

  const inviteUrl = `${window.location.origin}/join/${group.id}`

  async function handleAddSelected() {
    const newIds = pendingAdd.filter((id) => !group.memberIds.includes(id))
    // Accumulate locally rather than re-reading the (stale) `group` prop each iteration, so
    // adding several new members in one batch doesn't have each write clobber the previous one.
    let current = group
    for (const id of newIds) {
      const member = allMembers.find((m) => m.id === id)
      if (!member) continue
      await addMemberToGroupAction(current, id, member)
      current = {
        ...current,
        memberIds: [...current.memberIds, id],
        memberProfiles: { ...current.memberProfiles, [id]: member },
      }
    }
    if (newIds.length > 0) toast.success(`Added ${newIds.length} member${newIds.length > 1 ? 's' : ''} to ${group.name}`)
    setAddOpen(false)
  }

  async function handleRemove() {
    if (!removeTarget) return
    await removeMemberFromGroupAction(group, removeTarget.id)
    toast.success(`${removeTarget.name} removed from the group`)
    setRemoveTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{groupMembers.length} members</h3>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <QrCode className="size-4" /> Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join {group.name}</DialogTitle>
                <DialogDescription>Share this link or QR code with anyone you want to add.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="rounded-xl border border-border p-4 bg-white">
                  <QRCode value={inviteUrl} size={160} />
                </div>
                <div className="flex w-full items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-secondary px-3 py-2 text-xs">{inviteUrl}</code>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl)
                      toast.success('Invite link copied')
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            onClick={() => {
              setPendingAdd(group.memberIds)
              setAddOpen(true)
            }}
          >
            <UserPlus className="size-4" /> Add member
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {groupMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <Avatar name={member.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{member.name}</p>
                  {member.id === group.createdBy && (
                    <Badge variant="secondary" className="text-[10px]">
                      Admin
                    </Badge>
                  )}
                  {member.id === userId && (
                    <Badge variant="outline" className="text-[10px]">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{member.email ?? member.phone ?? ''}</p>
              </div>
              {member.id !== userId && (
                <Button variant="ghost" size="icon-sm" onClick={() => setRemoveTarget(member)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add members</DialogTitle>
            <DialogDescription>Pick from your saved members or add someone new.</DialogDescription>
          </DialogHeader>
          <MemberMultiSelect selectedIds={pendingAdd} onChange={setPendingAdd} />
          <Button className="w-full" onClick={handleAddSelected}>
            Add to group
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.name} from ${group.name}?`}
        description="Past expenses involving them stay unchanged, but they won't be included in future splits."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
      />
    </div>
  )
}
