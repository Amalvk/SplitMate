import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { MemberMultiSelect } from '@/components/members/MemberMultiSelect'
import { GROUP_CATEGORY_LIST, GROUP_COLOR_THEMES } from '@/constants/categories'
import { ROUTES } from '@/constants/routes'
import { createGroupAction } from '@/services/actions/groupActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { generateId } from '@/utils/id'
import { nowIso } from '@/utils/date'
import { cn } from '@/utils/cn'
import type { Group, GroupCategory, Member } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Give your group a name.'),
  category: z.string(),
  customCategoryLabel: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function NewGroupPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const userId = currentUser?.id
  const members = useDataStore((s) => s.members)
  const [memberIds, setMemberIds] = useState<string[]>(userId ? [userId] : [])
  const [color, setColor] = useState(GROUP_COLOR_THEMES[0])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', category: 'travel', description: '', startDate: '', endDate: '' },
  })
  const category = form.watch('category')

  async function onSubmit(values: FormValues) {
    if (!userId || !currentUser) return
    if (memberIds.length === 0) {
      toast.error('Add at least one member to your group.')
      return
    }
    const group: Group = {
      id: generateId('grp'),
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      category: values.category as GroupCategory,
      customCategoryLabel: values.category === 'custom' ? values.customCategoryLabel?.trim() : undefined,
      colorTheme: color,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      memberIds: Array.from(new Set([userId, ...memberIds])),
      createdBy: userId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    // Ensure the creator resolves to a member profile even before they've been saved as a
    // "member" anywhere (e.g. their very first group) by appending themselves last so this
    // overrides any stale entry with the same id.
    const self: Member = {
      id: currentUser.id,
      name: currentUser.name,
      avatarColor: currentUser.avatarColor,
      email: currentUser.email,
      phone: currentUser.phone,
      createdAt: currentUser.createdAt,
      isSelf: true,
    }
    try {
      await createGroupAction(group, [...members, self])
      toast.success('Group created', { description: `${group.name} is ready for expenses.` })
      navigate(ROUTES.group(group.id))
    } catch (err) {
      toast.error('Couldn’t create the group', { description: err instanceof Error ? err.message : 'Please try again.' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.groups)}>
        <ArrowLeft className="size-4" /> Back to groups
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a group</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Set it up once, split expenses forever.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Group name</Label>
              <Input id="group-name" autoFocus placeholder="e.g. Goa Trip 2026" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Expense type</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {GROUP_CATEGORY_LIST.map((cat) => (
                      <button
                        type="button"
                        key={cat.value}
                        onClick={() => field.onChange(cat.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors',
                          field.value === cat.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-secondary',
                        )}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {category === 'custom' && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-category">Custom category name</Label>
                <Input id="custom-category" placeholder="e.g. Book Club" {...form.register('customCategoryLabel')} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="What's this group for?" {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start-date">Start date</Label>
                <Input id="start-date" type="date" {...form.register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-date">End date</Label>
                <Input id="end-date" type="date" {...form.register('endDate')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Theme color</Label>
              <div className="flex gap-2">
                {GROUP_COLOR_THEMES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn('size-8 rounded-full border-2 transition-transform', color === c ? 'scale-110 border-foreground' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    aria-label={`Choose color ${c}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <Label>Members</Label>
            <p className="text-xs text-muted-foreground -mt-1">You're always included. Pick from your saved members or add new ones.</p>
            <MemberMultiSelect selectedIds={memberIds} onChange={setMemberIds} className="mt-2" />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
          Create group
        </Button>
      </form>
    </div>
  )
}
