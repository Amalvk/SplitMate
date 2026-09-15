import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { Member } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Enter a name.'),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
})
type FormValues = z.infer<typeof schema>

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: Member | null
  onSubmit: (values: FormValues) => void
}

export function MemberFormDialog({ open, onOpenChange, member, onSubmit }: MemberFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: member?.name ?? '', email: member?.email ?? '', phone: member?.phone ?? '' })
    }
  }, [open, member, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? 'Edit member' : 'Add a member'}</DialogTitle>
          <DialogDescription>
            {member ? 'Update their details.' : 'Save them once, reuse them across any group.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => {
            onSubmit(values)
            onOpenChange(false)
          })}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Name</Label>
            <Input id="member-name" autoFocus placeholder="e.g. Rahul" {...form.register('name')} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email">Email (optional)</Label>
            <Input id="member-email" placeholder="rahul@example.com" {...form.register('email')} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-phone">Phone (optional)</Label>
            <Input id="member-phone" placeholder="+91 98765 43210" {...form.register('phone')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{member ? 'Save changes' : 'Add member'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
