import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateCustomSplit, calculateEqualSplit } from '@/utils/calculations'
import { isFirebaseConfigured } from '@/services/firebase/config'
import type {
  ActivityEntry,
  AppNotification,
  Expense,
  Group,
  Member,
  NotificationType,
  RecurringExpense,
  Settlement,
  SettlementStatus,
} from '@/types'
import { generateId } from '@/utils/id'
import { nowIso } from '@/utils/date'

interface DataState {
  members: Member[]
  /**
   * Firebase mode only: ids of members that are actually in *this user's* private savedMembers
   * subcollection — as opposed to `members`, which also includes people resolved from shared
   * group rosters. MembersPage uses this to show only what the user actually saved themselves.
   */
  savedMemberIds: string[]
  groups: Group[]
  expenses: Expense[]
  settlements: Settlement[]
  recurringExpenses: RecurringExpense[]
  notifications: AppNotification[]
  activity: ActivityEntry[]
  seeded: boolean

  // members (personal saved contacts)
  saveMember: (member: Member) => void
  updateMember: (member: Member) => void
  removeMember: (memberId: string) => void

  // groups
  createGroup: (group: Group) => void
  updateGroup: (group: Group) => void
  deleteGroup: (groupId: string) => void
  addMemberToGroup: (groupId: string, memberId: string) => void
  removeMemberFromGroup: (groupId: string, memberId: string) => void

  // expenses
  addExpense: (expense: Expense, actorMemberId: string) => void
  updateExpense: (expense: Expense, actorMemberId: string) => void
  deleteExpense: (expenseId: string, actorMemberId: string) => void

  // settlements
  recordSettlement: (settlement: Settlement, actorMemberId: string) => void
  updateSettlementStatus: (settlementId: string, status: SettlementStatus, note: string | undefined, actorMemberId: string) => void

  // recurring
  addRecurring: (recurring: RecurringExpense) => void
  updateRecurring: (recurring: RecurringExpense) => void
  removeRecurring: (recurringId: string) => void
  generateRecurringInstance: (recurringId: string, actorMemberId: string) => void

  // notifications
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // activity
  pushActivity: (entry: Omit<ActivityEntry, 'id' | 'createdAt'>) => void

  // Firestore live-sync hydration — replace a slice from a snapshot rather than mutate it.
  // See useFirebaseDataSync. No-ops in demo mode (nothing calls these when Firebase isn't configured).
  hydrateGroups: (groups: Group[]) => void
  hydrateGroupExpenses: (groupId: string, expenses: Expense[]) => void
  hydrateGroupSettlements: (groupId: string, settlements: Settlement[]) => void
  hydrateGroupActivity: (groupId: string, activity: ActivityEntry[]) => void
  hydrateSavedMembers: (members: Member[]) => void
  hydrateNotifications: (notifications: AppNotification[]) => void
  clearRemoteData: () => void

  // demo / reset
  seedDemoData: (payload: {
    members: Member[]
    groups: Group[]
    expenses: Expense[]
    settlements: Settlement[]
    notifications: AppNotification[]
    activity: ActivityEntry[]
  }) => void
  resetAll: () => void
}

function addActivity(state: DataState, entry: Omit<ActivityEntry, 'id' | 'createdAt'>): ActivityEntry[] {
  const item: ActivityEntry = { ...entry, id: generateId('act'), createdAt: nowIso() }
  return [item, ...state.activity].slice(0, 500)
}

function pushNotif(state: DataState, n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification[] {
  const item: AppNotification = { ...n, id: generateId('notif'), read: false, createdAt: nowIso() }
  return [item, ...state.notifications].slice(0, 200)
}

function upsertById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) byId.set(item.id, item)
  return Array.from(byId.values())
}

function replaceForGroup<T extends { groupId: string }>(existing: T[], groupId: string, incoming: T[]): T[] {
  return [...existing.filter((item) => item.groupId !== groupId), ...incoming]
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      members: [],
      savedMemberIds: [],
      groups: [],
      expenses: [],
      settlements: [],
      recurringExpenses: [],
      notifications: [],
      activity: [],
      seeded: false,

      saveMember: (member) => set((s) => ({ members: [...s.members, member] })),
      updateMember: (member) => set((s) => ({ members: s.members.map((m) => (m.id === member.id ? member : m)) })),
      removeMember: (memberId) => set((s) => ({ members: s.members.filter((m) => m.id !== memberId) })),

      createGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),
      updateGroup: (group) => set((s) => ({ groups: s.groups.map((g) => (g.id === group.id ? group : g)) })),
      deleteGroup: (groupId) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== groupId),
          expenses: s.expenses.filter((e) => e.groupId !== groupId),
          settlements: s.settlements.filter((st) => st.groupId !== groupId),
          recurringExpenses: s.recurringExpenses.filter((r) => r.groupId !== groupId),
        })),
      addMemberToGroup: (groupId, memberId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId && !g.memberIds.includes(memberId)
              ? { ...g, memberIds: [...g.memberIds, memberId], updatedAt: nowIso() }
              : g,
          ),
        })),
      removeMemberFromGroup: (groupId, memberId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== memberId), updatedAt: nowIso() } : g,
          ),
        })),

      addExpense: (expense, actorMemberId) =>
        set((s) => ({
          expenses: [expense, ...s.expenses],
          activity: addActivity(s, {
            groupId: expense.groupId,
            actorMemberId,
            verb: 'added',
            subject: expense.title,
            meta: { amountMinor: expense.amountMinor },
          }),
          notifications: pushNotif(s, {
            type: 'expense_added' as NotificationType,
            title: 'New expense added',
            body: `${expense.title} was added to your group.`,
            groupId: expense.groupId,
          }),
        })),
      updateExpense: (expense, actorMemberId) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === expense.id ? expense : e)),
          activity: addActivity(s, { groupId: expense.groupId, actorMemberId, verb: 'edited', subject: expense.title }),
        })),
      deleteExpense: (expenseId, actorMemberId) =>
        set((s) => {
          const expense = s.expenses.find((e) => e.id === expenseId)
          return {
            expenses: s.expenses.filter((e) => e.id !== expenseId),
            activity: expense
              ? addActivity(s, { groupId: expense.groupId, actorMemberId, verb: 'deleted', subject: expense.title })
              : s.activity,
          }
        }),

      recordSettlement: (settlement, actorMemberId) =>
        set((s) => ({
          settlements: [settlement, ...s.settlements],
          activity: addActivity(s, {
            groupId: settlement.groupId,
            actorMemberId,
            verb: settlement.status === 'paid' ? 'settled' : 'recorded a settlement of',
            subject: '',
            meta: { amountMinor: settlement.amountMinor },
          }),
        })),
      updateSettlementStatus: (settlementId, status, note, actorMemberId) =>
        set((s) => {
          const settlement = s.settlements.find((st) => st.id === settlementId)
          if (!settlement) return s
          const updated: Settlement = {
            ...settlement,
            status,
            note: note ?? settlement.note,
            settledAt: status === 'paid' ? nowIso() : settlement.settledAt,
            history: [
              ...settlement.history,
              { id: generateId('hist'), status, amountMinor: settlement.amountMinor, note, at: nowIso() },
            ],
          }
          return {
            settlements: s.settlements.map((st) => (st.id === settlementId ? updated : st)),
            activity: addActivity(s, {
              groupId: settlement.groupId,
              actorMemberId,
              verb: status === 'paid' ? 'marked settled' : `marked ${status}`,
              subject: '',
              meta: { amountMinor: settlement.amountMinor },
            }),
            notifications:
              status === 'paid'
                ? pushNotif(s, {
                    type: 'settlement_recorded',
                    title: 'Settlement recorded',
                    body: `A payment of ${settlement.amountMinor / 100} was marked as paid.`,
                    groupId: settlement.groupId,
                  })
                : s.notifications,
          }
        }),

      addRecurring: (recurring) => set((s) => ({ recurringExpenses: [...s.recurringExpenses, recurring] })),
      updateRecurring: (recurring) =>
        set((s) => ({ recurringExpenses: s.recurringExpenses.map((r) => (r.id === recurring.id ? recurring : r)) })),
      removeRecurring: (recurringId) =>
        set((s) => ({ recurringExpenses: s.recurringExpenses.filter((r) => r.id !== recurringId) })),
      generateRecurringInstance: (recurringId, actorMemberId) => {
        const recurring = get().recurringExpenses.find((r) => r.id === recurringId)
        if (!recurring) return
        const splitResult =
          recurring.splitType === 'equal'
            ? calculateEqualSplit(recurring.amountMinor, recurring.participantIds)
            : calculateCustomSplit(recurring.amountMinor, recurring.splitInputs ?? {})
        const expense: Expense = {
          id: generateId('exp'),
          groupId: recurring.groupId,
          title: recurring.title,
          amountMinor: recurring.amountMinor,
          category: recurring.category,
          date: nowIso(),
          payers: recurring.payers,
          split: { type: recurring.splitType, participantIds: recurring.participantIds, shares: splitResult.shares },
          createdBy: recurring.createdBy,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          source: 'manual',
          isRecurringInstance: true,
          recurringExpenseId: recurring.id,
        }
        get().addExpense(expense, actorMemberId)
      },

      pushNotification: (n) => set((s) => ({ notifications: pushNotif(s, n) })),
      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      pushActivity: (entry) => set((s) => ({ activity: addActivity(s, entry) })),

      hydrateGroups: (groups) =>
        set((s) => {
          const profilesFromGroups = groups.flatMap((g) => Object.values(g.memberProfiles ?? {}))
          const asMembers: Member[] = profilesFromGroups.map((p) => ({
            id: p.id,
            name: p.name,
            avatarColor: p.avatarColor,
            email: p.email,
            phone: p.phone,
            createdAt: s.members.find((m) => m.id === p.id)?.createdAt ?? nowIso(),
          }))
          return { groups, members: upsertById(s.members, asMembers) }
        }),
      hydrateGroupExpenses: (groupId, expenses) => set((s) => ({ expenses: replaceForGroup(s.expenses, groupId, expenses) })),
      hydrateGroupSettlements: (groupId, settlements) =>
        set((s) => ({ settlements: replaceForGroup(s.settlements, groupId, settlements) })),
      hydrateGroupActivity: (groupId, activity) => set((s) => ({ activity: replaceForGroup(s.activity, groupId, activity) })),
      hydrateSavedMembers: (members) =>
        set((s) => ({ members: upsertById(s.members, members), savedMemberIds: members.map((m) => m.id) })),
      hydrateNotifications: (notifications) => set(() => ({ notifications })),
      clearRemoteData: () =>
        set(() => ({
          members: [],
          savedMemberIds: [],
          groups: [],
          expenses: [],
          settlements: [],
          notifications: [],
          activity: [],
        })),

      seedDemoData: (payload) =>
        set(() => ({
          members: payload.members,
          groups: payload.groups,
          expenses: payload.expenses,
          settlements: payload.settlements,
          notifications: payload.notifications,
          activity: payload.activity,
          recurringExpenses: [],
          seeded: true,
        })),
      resetAll: () =>
        set(() => ({
          members: [],
          groups: [],
          expenses: [],
          settlements: [],
          recurringExpenses: [],
          notifications: [],
          activity: [],
          seeded: false,
        })),
    }),
    {
      name: 'splitflow-data',
      // Firebase mode: Firestore is the source of truth, live-synced in on every load by
      // useFirebaseDataSync — persisting its data to localStorage too just leaves stale copies
      // that render before (or after failed) sync, hiding whether Firestore itself is empty.
      // recurringExpenses has no Firestore backing yet, so it's the one field kept either way.
      partialize: (state) =>
        isFirebaseConfigured()
          ? { recurringExpenses: state.recurringExpenses }
          : state,
    },
  ),
)
