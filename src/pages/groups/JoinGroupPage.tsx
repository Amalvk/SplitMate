import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/pages/auth/AuthShell'
import { PageLoader } from '@/components/common/PageLoader'
import { ROUTES } from '@/constants/routes'
import { fetchGroupForInvite, joinGroupAction } from '@/services/actions/groupActions'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import type { Group } from '@/types'

type Status = 'loading' | 'ready' | 'missing'

export default function JoinGroupPage() {
  const { groupId = '' } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const enterWithEmail = useAuthStore((s) => s.enterWithEmail)
  const localGroup = useDataStore((s) => s.groups.find((g) => g.id === groupId))

  const [group, setGroup] = useState<Group | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const found = isFirebaseConfigured() ? await fetchGroupForInvite(groupId) : (localGroup ?? null)
        if (cancelled) return
        setGroup(found)
        setStatus(found ? 'ready' : 'missing')
      } catch {
        if (!cancelled) setStatus('missing')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
    // localGroup is only a demo-mode fallback; re-running on its identity would re-fetch on every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  async function join(user = currentUser) {
    if (!user || !group) return
    setBusy(true)
    try {
      if (!group.memberIds.includes(user.id)) {
        await joinGroupAction(group.id, {
          id: user.id,
          name: user.name,
          avatarColor: user.avatarColor,
          email: user.email,
          phone: user.phone,
        })
        toast.success(`You joined ${group.name}`)
      }
      navigate(ROUTES.group(group.id), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t join the group — please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleEmailJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await enterWithEmail(email)
      setBusy(false)
      await join(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t sign you in.')
      setBusy(false)
    }
  }

  if (status === 'loading') return <PageLoader />

  if (status === 'missing' || !group) {
    return (
      <AuthShell step="Invite">
        <h2 className="text-2xl font-bold tracking-tight">Group not found</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This invite link is invalid or the group was deleted.
          {!isFirebaseConfigured() && ' Demo mode keeps groups only in the browser that created them, so invite links need a Firebase-backed setup.'}
        </p>
        <Button asChild className="mt-6 w-full" variant="outline">
          <Link to={ROUTES.landing}>Go to SplitMate</Link>
        </Button>
      </AuthShell>
    )
  }

  const alreadyMember = !!currentUser && group.memberIds.includes(currentUser.id)

  return (
    <AuthShell step="You're invited">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Users className="size-6" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Join {group.name}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {group.description || 'Add your expenses and split costs with everyone in this group.'} {group.memberIds.length} member
        {group.memberIds.length === 1 ? '' : 's'} so far.
      </p>

      {currentUser ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm">
            Joining as <span className="font-semibold">{currentUser.name}</span>
            {currentUser.email && <span className="text-muted-foreground"> ({currentUser.email})</span>}
          </p>
          <Button className="w-full" size="lg" loading={busy} onClick={() => join()}>
            {alreadyMember ? 'Open group' : 'Join group'} <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleEmailJoin} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Your email address</Label>
            <Input
              id="email"
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            Continue &amp; join <ArrowRight className="size-4" />
          </Button>
        </form>
      )}
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </AuthShell>
  )
}
