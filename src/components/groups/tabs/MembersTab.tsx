import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { Check, Copy, Link2, MessageCircle, QrCode, Share2, Trash2, UserPlus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { MemberMultiSelect } from '@/components/members/MemberMultiSelect'
import { addMemberToGroupAction, removeMemberFromGroupAction } from '@/services/actions/groupActions'
import { useGroupBalances } from '@/hooks/useGroupBalances'
import { formatINR } from '@/utils/currency'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import type { Group, Member } from '@/types'

export function MembersTab({ group }: { group: Group }) {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const allMembers = useDataStore((s) => s.members)

  const groupMembers = useMemo(() => allMembers.filter((m) => group.memberIds.includes(m.id)), [allMembers, group.memberIds])
  const guests = useMemo(() => allMembers.filter((m) => group.guestIds?.includes(m.id)), [allMembers, group.guestIds])
  const isMember = !!userId && group.memberIds.includes(userId)
  const { balances } = useGroupBalances(group.id, group.memberIds)
  const balanceById = useMemo(() => new Map(balances.map((b) => [b.memberId, b])), [balances])
  const [addOpen, setAddOpen] = useState(false)
  const [pendingAdd, setPendingAdd] = useState<string[]>(group.memberIds)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)

  const inviteUrl = `${window.location.origin}/join/${group.id}`

  // Short, readable label only — copy/share always use the full working link.
  const inviteLabel = `${window.location.host}/join/${group.id.replace(/^grp_/, '').slice(0, 6)}…`
  const [linkCopied, setLinkCopied] = useState(false)

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setLinkCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast.error('Couldn’t copy — long-press the link to copy it manually')
    }
  }

  const shareText = `Join "${group.name}" on SplitMate and add your expenses: ${inviteUrl}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${group.name}`, text: `Join "${group.name}" on SplitMate and add your expenses.`, url: inviteUrl })
      } catch {
        // user dismissed the share sheet
      }
    } else {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Invite link copied')
    }
  }

  async function handleAddSelected() {
    const newIds = pendingAdd.filter((id) => !group.memberIds.includes(id))
    // Accumulate locally rather than re-reading the (stale) `group` prop each iteration, so
    // adding several new members in one batch doesn't have each write clobber the previous one.
    let current = group
    for (const id of newIds) {
      const member = useDataStore.getState().members.find((m) => m.id === id)
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

  async function handleAddGuest(guest: Member) {
    await addMemberToGroupAction(group, guest.id, guest)
    toast.success(`${guest.name} added to ${group.name}`)
  }

  async function handleRemove() {
    if (!removeTarget) return
    await removeMemberFromGroupAction(group, removeTarget.id)
    toast.success(`${removeTarget.name} removed from the group`)
    setRemoveTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
              <div className="flex w-full min-w-0 flex-col items-center gap-4 py-2">
                <div className="rounded-xl border border-border p-3 bg-white sm:p-4">
                  <QRCode value={inviteUrl} size={160} className="size-40 max-w-full" />
                </div>
                <div className="flex w-full min-w-0 items-center gap-2 rounded-lg bg-secondary py-1 pl-3 pr-1">
                  <Link2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm" title={inviteUrl}>
                    {inviteLabel}
                  </span>
                  <Button size="icon" variant="ghost" aria-label="Copy invite link" className="shrink-0" onClick={copyInvite}>
                    {linkCopied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <div className="grid w-full min-w-0 grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="min-w-0">
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  </Button>
                  <Button variant="outline" className="min-w-0" onClick={handleShare}>
                    <Share2 className="size-4" /> Share…
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isMember && (
            <Button
              size="sm"
              onClick={() => {
                setPendingAdd(group.memberIds)
                setAddOpen(true)
              }}
            >
              <UserPlus className="size-4" /> Add member
            </Button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {groupMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
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
              {isMember && member.id !== userId && (
                <Button variant="ghost" size="icon-sm" onClick={() => setRemoveTarget(member)}>
                  <Trash2 className="size-4" />
                </Button>
              )}
              </div>
              <MemberMoney balance={balanceById.get(member.id)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {guests.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">Joined via link ({guests.length})</h3>
            <p className="text-xs text-muted-foreground">They can view the group and add expenses, but aren't part of splits until added.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {guests.map((guest) => (
              <Card key={guest.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar name={guest.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{guest.name}</p>
                      {guest.id === userId && (
                        <Badge variant="outline" className="text-[10px]">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{guest.email ?? guest.phone ?? 'Guest'}</p>
                  </div>
                  {isMember && (
                    <Button size="sm" variant="outline" onClick={() => handleAddGuest(guest)}>
                      <UserPlus className="size-3.5" /> Add
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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

function MemberMoney({ balance }: { balance?: { paidMinor: number; owedMinor: number; netMinor: number } }) {
  if (!balance) return null
  const { paidMinor, owedMinor, netMinor } = balance
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs">
      <div>
        <p className="text-muted-foreground">Spent</p>
        <p className="font-semibold num-tabular">{formatINR(paidMinor)}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Share</p>
        <p className="font-semibold num-tabular">{formatINR(owedMinor)}</p>
      </div>
      <div>
        <p className="text-muted-foreground">{netMinor > 0 ? 'Gets back' : netMinor < 0 ? 'Owes' : 'Balance'}</p>
        <p className={`font-semibold num-tabular ${netMinor > 0 ? 'text-success' : netMinor < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {netMinor === 0 ? 'Settled' : formatINR(Math.abs(netMinor))}
        </p>
      </div>
    </div>
  )
}
