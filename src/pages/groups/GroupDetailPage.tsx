import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Mic, Plus, Settings, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AvatarStack } from '@/components/members/AvatarStack'
import { OverviewTab } from '@/components/groups/tabs/OverviewTab'
import { ExpensesTab } from '@/components/groups/tabs/ExpensesTab'
import { MembersTab } from '@/components/groups/tabs/MembersTab'
import { BalancesTab } from '@/components/groups/tabs/BalancesTab'
import { AnalyticsTab } from '@/components/groups/tabs/AnalyticsTab'
import { GROUP_CATEGORIES } from '@/constants/categories'
import { ROUTES } from '@/constants/routes'
import { deleteGroupAction, updateGroupAction } from '@/services/actions/groupActions'
import { useDataStore } from '@/store/dataStore'

const TABS = ['overview', 'expenses', 'members', 'balances', 'analytics', 'settings'] as const
type TabKey = (typeof TABS)[number]

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const groups = useDataStore((s) => s.groups)
  const members = useDataStore((s) => s.members)

  const group = groups.find((g) => g.id === groupId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')

  if (!group) return <Navigate to={ROUTES.groups} replace />

  const last = location.pathname.split('/').pop()
  const activeTab: TabKey = (TABS as readonly string[]).includes(last ?? '') ? (last as TabKey) : 'overview'

  function goTab(tab: TabKey) {
    if (!group) return
    navigate(tab === 'overview' ? ROUTES.group(group.id) : `${ROUTES.group(group.id)}/${tab}`)
  }

  const groupMembers = members.filter((m) => group.memberIds.includes(m.id))
  const categoryMeta = GROUP_CATEGORIES[group.category]

  async function handleSaveSettings() {
    if (!group) return
    await updateGroupAction(
      { ...group, name: name.trim() || group.name, description: description.trim() || undefined, updatedAt: new Date().toISOString() },
      members,
    )
    toast.success('Group updated')
  }

  async function handleDelete() {
    if (!group) return
    await deleteGroupAction(group.id)
    toast.success(`${group.name} deleted`)
    navigate(ROUTES.groups)
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.groups)}>
        <ArrowLeft className="size-4" /> Back to groups
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${group.colorTheme}1a` }}>
            {categoryMeta.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
            {group.description && <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>}
            <div className="mt-2">
              <AvatarStack members={groupMembers} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => navigate(`${ROUTES.newExpense}?groupId=${group.id}&mode=voice`)}>
            <Mic className="size-4" /> Voice
          </Button>
          <Button onClick={() => navigate(`${ROUTES.newExpense}?groupId=${group.id}`)}>
            <Plus className="size-4" /> Add Expense
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => goTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="size-3.5" />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'overview' && <OverviewTab group={group} />}
      {activeTab === 'expenses' && <ExpensesTab group={group} />}
      {activeTab === 'members' && <MembersTab group={group} />}
      {activeTab === 'balances' && <BalancesTab group={group} />}
      {activeTab === 'analytics' && <AnalyticsTab group={group} />}
      {activeTab === 'settings' && (
        <Card>
          <CardContent className="p-5 space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Group name</Label>
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-desc">Description</Label>
              <Textarea id="settings-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button onClick={handleSaveSettings}>Save changes</Button>

            <div className="pt-4 border-t border-border">
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete group
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${group.name}?`}
        description="This permanently deletes the group and all its expenses and settlements. This can't be undone."
        confirmLabel="Delete group"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
