import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Mail, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { generateReminderMessage } from '@/utils/reminder'
import type { Member } from '@/types'

interface ReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member
  amountMinor: number
  context?: string
}

export function ReminderDialog({ open, onOpenChange, member, amountMinor, context }: ReminderDialogProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) setMessage(generateReminderMessage(member.name, amountMinor, context))
  }, [open, member, amountMinor, context])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remind {member.name}</DialogTitle>
          <DialogDescription>Nothing sends automatically — review and choose how to share it.</DialogDescription>
        </DialogHeader>

        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(message)
              toast.success('Reminder copied')
            }}
          >
            <Copy className="size-4" /> Copy
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`https://wa.me/${member.phone?.replace(/\D/g, '') ?? ''}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`mailto:${member.email ?? ''}?subject=${encodeURIComponent('Quick reminder')}&body=${encodeURIComponent(message)}`}>
              <Mail className="size-4" /> Email
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (navigator.share) {
                await navigator.share({ text: message }).catch(() => {})
              } else {
                navigator.clipboard.writeText(message)
                toast.success('Reminder copied (sharing not supported here)')
              }
            }}
          >
            <Share2 className="size-4" /> Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
