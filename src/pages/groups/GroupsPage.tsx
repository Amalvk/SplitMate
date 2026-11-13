import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { GroupCard } from '@/components/groups/GroupCard'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'

export default function GroupsPage() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.currentUser?.id)
  const groups = useDataStore((s) => s.groups)
  const [query, setQuery] = useState('')

  const myGroups = useMemo(() => groups.filter((g) => userId && g.memberIds.includes(userId)), [groups, userId])

  const filtered = myGroups.filter((g) => {
    const matchesQuery = g.name.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Every trip, room, office and event you're splitting with.</p>
        </div>
        <Button onClick={() => navigate(ROUTES.newGroup)}>
          <Plus className="size-4" /> New group
        </Button>
      </div>

      {myGroups.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search groups..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </div>
      )}

      {myGroups.length === 0 ? (
        <EmptyState
          emoji="🧳"
          title="No groups yet"
          description="Trips, hostels, offices, events, weddings — create a group for anything you split with others."
          action={
            <Button onClick={() => navigate(ROUTES.newGroup)}>
              <Plus className="size-4" /> Create your first group
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState emoji="🔍" title="No groups match" description="Try a different search or category." />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
