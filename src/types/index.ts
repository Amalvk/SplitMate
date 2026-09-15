// All monetary amounts in this app are integer minor units (paise). 1 rupee = 100 paise.
// Convert to/from rupees only at the UI boundary via utils/currency.

export type SplitType = 'equal' | 'unequal' | 'percentage' | 'shares'

export type GroupCategory = 'travel' | 'hostel' | 'office' | 'food' | 'event' | 'wedding' | 'custom'

export type ExpenseCategory =
  | 'food'
  | 'travel'
  | 'hotel'
  | 'shopping'
  | 'utilities'
  | 'entertainment'
  | 'groceries'
  | 'transport'
  | 'medical'
  | 'other'

export type SettlementStatus = 'pending' | 'partial' | 'paid'

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly'

export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  avatarColor: string
  createdAt: string
}

export interface Member {
  id: string
  name: string
  email?: string
  phone?: string
  avatarColor: string
  /** true for the member record that represents the logged-in user */
  isSelf?: boolean
  createdAt: string
}

export interface GroupMember {
  memberId: string
  joinedAt: string
  role: 'admin' | 'member'
}

export interface Group {
  id: string
  name: string
  description?: string
  category: GroupCategory
  customCategoryLabel?: string
  colorTheme: string
  startDate?: string
  endDate?: string
  memberIds: string[]
  /**
   * Shared roster snapshot, keyed by memberId — travels with the group doc itself so any group
   * member can resolve names/avatars for everyone else without a separate subcollection/listener.
   * Only present for Firestore-backed groups; local/demo mode resolves names from the flat
   * `members` array in the data store instead.
   */
  memberProfiles?: Record<string, MemberProfileLite>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MemberProfileLite {
  id: string
  name: string
  avatarColor: string
  email?: string
  phone?: string
}

export interface ExpensePayer {
  memberId: string
  amountMinor: number
}

export interface ExpenseSplit {
  type: SplitType
  participantIds: string[]
  /** raw user-entered inputs keyed by memberId — amounts (unequal), percentages, or share counts */
  inputs?: Record<string, number>
  /** computed final share per member in minor units, always sums to expense amountMinor */
  shares: Record<string, number>
}

export interface Expense {
  id: string
  groupId: string
  title: string
  amountMinor: number
  category: ExpenseCategory
  date: string
  notes?: string
  receiptUrl?: string
  payers: ExpensePayer[]
  split: ExpenseSplit
  createdBy: string
  createdAt: string
  updatedAt: string
  source: 'manual' | 'voice' | 'text'
  isRecurringInstance?: boolean
  recurringExpenseId?: string
}

export interface RecurringExpense {
  id: string
  groupId: string
  title: string
  amountMinor: number
  category: ExpenseCategory
  frequency: RecurringFrequency
  startDate: string
  endDate?: string
  participantIds: string[]
  payers: ExpensePayer[]
  splitType: SplitType
  splitInputs?: Record<string, number>
  createdBy: string
  createdAt: string
  active: boolean
}

export interface Settlement {
  id: string
  groupId: string
  fromMemberId: string
  toMemberId: string
  amountMinor: number
  status: SettlementStatus
  note?: string
  createdAt: string
  settledAt?: string
  history: SettlementHistoryEntry[]
}

export interface SettlementHistoryEntry {
  id: string
  status: SettlementStatus
  amountMinor: number
  note?: string
  at: string
}

export interface MemberBalance {
  memberId: string
  paidMinor: number
  owedMinor: number
  netMinor: number
}

export interface SettlementSuggestion {
  fromMemberId: string
  toMemberId: string
  amountMinor: number
}

export type NotificationType =
  | 'expense_added'
  | 'expense_edited'
  | 'expense_deleted'
  | 'settlement_recorded'
  | 'member_joined'
  | 'group_milestone'
  | 'reminder'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  groupId?: string
  read: boolean
  createdAt: string
}

export interface ActivityEntry {
  id: string
  groupId: string
  actorMemberId: string
  verb: string
  subject: string
  meta?: Record<string, string | number>
  createdAt: string
}
