import { Link } from 'react-router-dom'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/common/EmptyState'
import { ROUTES } from '@/constants/routes'
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/services/actions/notificationActions'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useUiStore, type NotificationPrefs } from '@/store/uiStore'
import { formatRelative } from '@/utils/date'
import { cn } from '@/utils/cn'

const NOTIF_ICON: Record<string, string> = {
  expense_added: '🧾',
  expense_edited: '✏️',
  expense_deleted: '🗑️',
  settlement_recorded: '💸',
  member_joined: '👋',
  group_milestone: '🎉',
  reminder: '🔔',
}

const PREF_LABELS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'expenseAdded', label: 'New expenses' },
  { key: 'settlements', label: 'Settlements' },
  { key: 'reminders', label: 'Payment reminders' },
  { key: 'groupMilestones', label: 'Group milestones' },
]

export default function NotificationsPage() {
  const userId = useAuthStore((s) => s.currentUser?.id)
  const notifications = useDataStore((s) => s.notifications)
  const prefs = useUiStore((s) => s.notificationPrefs)
  const setNotificationPref = useUiStore((s) => s.setNotificationPref)

  const unreadCount = notifications.filter((n) => !n.read).length
  const sorted = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => userId && markAllNotificationsReadAction(userId)}>
            <Check className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<Bell className="size-8 text-muted-foreground" />} title="No notifications yet" description="Activity across your groups will show up here." />
      ) : (
        <div className="space-y-1.5">
          {sorted.map((n) => (
            <button
              key={n.id}
              onClick={() => userId && markNotificationReadAction(userId, n.id)}
              className={cn(
                'w-full text-left flex items-start gap-3 rounded-xl p-3.5 transition-colors',
                n.read ? 'hover:bg-secondary/50' : 'bg-accent/50 hover:bg-accent/70',
              )}
            >
              <span className="text-xl leading-none mt-0.5">{NOTIF_ICON[n.type] ?? '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', !n.read && 'font-semibold')}>{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{formatRelative(n.createdAt)}</p>
              </div>
              {!n.read && <span className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Notification preferences</h2>
          {PREF_LABELS.map((pref, i) => (
            <div key={pref.key}>
              <div className="flex items-center justify-between">
                <Label htmlFor={pref.key}>{pref.label}</Label>
                <Switch id={pref.key} checked={prefs[pref.key]} onCheckedChange={(v) => setNotificationPref(pref.key, v)} />
              </div>
              {i < PREF_LABELS.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Link to={ROUTES.dashboard} className="text-sm text-primary hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}
