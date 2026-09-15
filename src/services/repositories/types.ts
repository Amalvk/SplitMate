import type {
  ActivityEntry,
  AppNotification,
  Expense,
  Group,
  Member,
  MemberProfileLite,
  Settlement,
  User,
} from '@/types'

/**
 * Backend-agnostic contracts for every persistence operation SplitMate needs. Two
 * implementations exist:
 *  - `local` (src/services/repositories/local) — thin wrappers around the Zustand stores in
 *    src/store, which are themselves persisted to localStorage. This is what the app actually
 *    runs on today (demo mode) and needs zero configuration.
 *  - `firebase` (src/services/repositories/firebase) — real Firestore/Auth reads & writes
 *    following the data model in firestore.rules. It activates automatically once
 *    isFirebaseConfigured() is true (see src/services/firebase/client.ts) — nothing in the UI
 *    layer needs to change to switch over.
 *
 * UI code should prefer the reactive Zustand store hooks for reads; this interface exists for
 * non-reactive call sites and as the seam a real backend plugs into.
 */
export interface AuthRepository {
  getCurrentUser(): Promise<User | null>
  /** No password, no OTP — resolves (and auto-creates, on first use) the account for this email. */
  enterWithEmail(email: string): Promise<User>
  signOut(): Promise<void>
}

export interface MembersRepository {
  listSavedMembers(userId: string): Promise<Member[]>
  saveMember(userId: string, member: Member): Promise<void>
  updateMember(userId: string, member: Member): Promise<void>
  removeMember(userId: string, memberId: string): Promise<void>
}

export interface GroupsRepository {
  listGroups(userId: string): Promise<Group[]>
  getGroup(groupId: string): Promise<Group | null>
  createGroup(group: Group): Promise<void>
  updateGroup(group: Group): Promise<void>
  deleteGroup(groupId: string): Promise<void>
  /** Patches `memberProfiles[memberId]` on every group that already includes this member — used
   * to fan out a saved-member edit so the change reflects wherever that member has been added. */
  syncMemberProfile(memberId: string, profile: MemberProfileLite): Promise<void>
}

export interface ExpensesRepository {
  listExpenses(groupId: string): Promise<Expense[]>
  createExpense(expense: Expense): Promise<void>
  updateExpense(expense: Expense): Promise<void>
  deleteExpense(groupId: string, expenseId: string): Promise<void>
}

export interface SettlementsRepository {
  listSettlements(groupId: string): Promise<Settlement[]>
  createSettlement(settlement: Settlement): Promise<void>
  updateSettlement(settlement: Settlement): Promise<void>
}

export interface NotificationsRepository {
  listNotifications(userId: string): Promise<AppNotification[]>
  /** Writes a notification into `userId`'s inbox — used both for self-notifications and to fan
   * out a group action to every other member (see the `create` rule in firestore.rules). */
  pushNotification(userId: string, notification: AppNotification): Promise<void>
  markRead(userId: string, notificationId: string): Promise<void>
  markAllRead(userId: string): Promise<void>
}

export interface ActivityRepository {
  listActivity(groupId: string): Promise<ActivityEntry[]>
  pushActivity(entry: ActivityEntry): Promise<void>
}

export interface DataRepository {
  auth: AuthRepository
  members: MembersRepository
  groups: GroupsRepository
  expenses: ExpensesRepository
  settlements: SettlementsRepository
  notifications: NotificationsRepository
  activity: ActivityRepository
}
