import { subDays, subHours } from 'date-fns'
import type { ActivityEntry, AppNotification, Expense, Group, Member, Settlement } from '@/types'
import {
  calculateCustomSplit,
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateShareSplit,
} from '@/utils/calculations'
import { getAvatarColor } from '@/utils/avatar'
import { generateId } from '@/utils/id'

const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number) => iso(subDays(new Date(), n))
const hoursAgo = (n: number) => iso(subHours(new Date(), n))

export const DEMO_SELF_ID = 'amal'

function member(id: string, name: string, opts: { email?: string; phone?: string; isSelf?: boolean }): Member {
  return {
    id,
    name,
    email: opts.email,
    phone: opts.phone,
    avatarColor: getAvatarColor(name),
    isSelf: opts.isSelf,
    createdAt: daysAgo(90),
  }
}

export const seedMembers: Member[] = [
  member('amal', 'Amal', { email: 'amal@example.com', isSelf: true }),
  member('rahul', 'Rahul', { email: 'rahul@example.com' }),
  member('arun', 'Arun', { phone: '+91 98765 43210' }),
  member('binu', 'Binu', { email: 'binu@example.com' }),
  member('akhil', 'Akhil', { email: 'akhil@example.com' }),
  member('chetan', 'Chetan', { phone: '+91 91234 56789' }),
]

const GOA_MEMBERS = ['amal', 'rahul', 'arun', 'binu', 'akhil', 'chetan']
const OFFICE_MEMBERS = ['amal', 'rahul', 'arun']
const ROOM_MEMBERS = ['amal', 'binu', 'akhil']
const TREK_MEMBERS = ['amal', 'arun', 'chetan', 'akhil']

export const seedGroups: Group[] = [
  {
    id: 'grp_goa',
    name: 'Goa Trip 2026',
    description: 'New year beach trip with the gang',
    category: 'travel',
    colorTheme: '#0d9488',
    startDate: daysAgo(20),
    endDate: daysAgo(15),
    memberIds: GOA_MEMBERS,
    createdBy: DEMO_SELF_ID,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(2),
  },
  {
    id: 'grp_office',
    name: 'Office Lunch Squad',
    description: 'Team lunches and coffee runs',
    category: 'office',
    colorTheme: '#2563eb',
    memberIds: OFFICE_MEMBERS,
    createdBy: DEMO_SELF_ID,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
  },
  {
    id: 'grp_room',
    name: 'Room 204 Expenses',
    description: 'Shared hostel room costs',
    category: 'hostel',
    colorTheme: '#a855f7',
    memberIds: ROOM_MEMBERS,
    createdBy: DEMO_SELF_ID,
    createdAt: daysAgo(75),
    updatedAt: daysAgo(4),
  },
  {
    id: 'grp_trek',
    name: 'Weekend Trek',
    description: 'Western Ghats monsoon trek',
    category: 'travel',
    colorTheme: '#d97706',
    startDate: daysAgo(6),
    endDate: daysAgo(5),
    memberIds: TREK_MEMBERS,
    createdBy: DEMO_SELF_ID,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
  },
]

function expense(input: {
  id: string
  groupId: string
  title: string
  amountMinor: number
  category: Expense['category']
  date: string
  payers: Expense['payers']
  participantIds: string[]
  splitType: Expense['split']['type']
  splitInputs?: Record<string, number>
  createdBy: string
  source?: Expense['source']
  notes?: string
}): Expense {
  const result =
    input.splitType === 'equal'
      ? calculateEqualSplit(input.amountMinor, input.participantIds)
      : input.splitType === 'unequal'
        ? calculateCustomSplit(input.amountMinor, input.splitInputs ?? {})
        : input.splitType === 'percentage'
          ? calculatePercentageSplit(input.amountMinor, input.splitInputs ?? {})
          : calculateShareSplit(input.amountMinor, input.splitInputs ?? {})

  return {
    id: input.id,
    groupId: input.groupId,
    title: input.title,
    amountMinor: input.amountMinor,
    category: input.category,
    date: input.date,
    notes: input.notes,
    payers: input.payers,
    split: {
      type: input.splitType,
      participantIds: input.participantIds,
      inputs: input.splitInputs,
      shares: result.shares,
    },
    createdBy: input.createdBy,
    createdAt: input.date,
    updatedAt: input.date,
    source: input.source ?? 'manual',
  }
}

export const seedExpenses: Expense[] = [
  expense({
    id: 'exp_goa_hotel',
    groupId: 'grp_goa',
    title: 'Beach Resort Hotel',
    amountMinor: 840000,
    category: 'hotel',
    date: daysAgo(19),
    payers: [{ memberId: 'rahul', amountMinor: 840000 }],
    participantIds: GOA_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_goa_dinner',
    groupId: 'grp_goa',
    title: 'Dinner at Zoca',
    amountMinor: 275000,
    category: 'food',
    date: daysAgo(18),
    payers: [{ memberId: 'amal', amountMinor: 275000 }],
    participantIds: ['amal', 'rahul', 'arun', 'binu', 'akhil'],
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_goa_cab',
    groupId: 'grp_goa',
    title: 'Airport Cab',
    amountMinor: 85000,
    category: 'transport',
    date: daysAgo(20),
    payers: [{ memberId: 'arun', amountMinor: 85000 }],
    participantIds: ['amal', 'rahul', 'arun', 'binu'],
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_goa_tickets',
    groupId: 'grp_goa',
    title: 'Beach Shack Tickets',
    amountMinor: 120000,
    category: 'entertainment',
    date: daysAgo(17),
    payers: [{ memberId: 'binu', amountMinor: 120000 }],
    participantIds: GOA_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_goa_villa',
    groupId: 'grp_goa',
    title: 'Villa Deposit',
    amountMinor: 600000,
    category: 'hotel',
    date: daysAgo(21),
    payers: [
      { memberId: 'amal', amountMinor: 400000 },
      { memberId: 'rahul', amountMinor: 200000 },
    ],
    participantIds: ['amal', 'rahul', 'arun', 'binu'],
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
    notes: 'Split evenly, paid together upfront to lock the booking.',
  }),
  expense({
    id: 'exp_goa_shopping',
    groupId: 'grp_goa',
    title: 'Souvenir Shopping',
    amountMinor: 300000,
    category: 'shopping',
    date: daysAgo(16),
    payers: [{ memberId: 'akhil', amountMinor: 300000 }],
    participantIds: ['amal', 'rahul', 'arun', 'binu'],
    splitType: 'percentage',
    splitInputs: { amal: 40, rahul: 30, arun: 20, binu: 10 },
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_goa_scooter',
    groupId: 'grp_goa',
    title: 'Scooter Rental',
    amountMinor: 180000,
    category: 'transport',
    date: daysAgo(18),
    payers: [{ memberId: 'amal', amountMinor: 180000 }],
    participantIds: ['amal', 'rahul', 'arun'],
    splitType: 'shares',
    splitInputs: { amal: 2, rahul: 1, arun: 1 },
    createdBy: DEMO_SELF_ID,
    notes: 'Amal used it twice as long, so 2 shares.',
  }),
  expense({
    id: 'exp_goa_groceries',
    groupId: 'grp_goa',
    title: 'Groceries for the villa',
    amountMinor: 150000,
    category: 'groceries',
    date: daysAgo(20),
    payers: [{ memberId: 'rahul', amountMinor: 150000 }],
    participantIds: ['amal', 'rahul', 'arun'],
    splitType: 'unequal',
    splitInputs: { amal: 70000, rahul: 50000, arun: 30000 },
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_goa_icecream',
    groupId: 'grp_goa',
    title: 'Ice cream run',
    amountMinor: 50000,
    category: 'food',
    date: daysAgo(15),
    payers: [{ memberId: 'amal', amountMinor: 50000 }],
    participantIds: ['amal', 'rahul', 'arun', 'akhil', 'chetan'],
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
    source: 'voice',
    notes: 'Added by voice: "Amal paid 500 for everyone except Binu."',
  }),

  expense({
    id: 'exp_office_lunch1',
    groupId: 'grp_office',
    title: 'Team Lunch — Truffles',
    amountMinor: 168000,
    category: 'food',
    date: daysAgo(3),
    payers: [{ memberId: 'amal', amountMinor: 168000 }],
    participantIds: OFFICE_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_office_coffee',
    groupId: 'grp_office',
    title: 'Coffee run',
    amountMinor: 42000,
    category: 'food',
    date: daysAgo(1),
    payers: [{ memberId: 'rahul', amountMinor: 42000 }],
    participantIds: OFFICE_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
    source: 'text',
  }),
  expense({
    id: 'exp_office_lunch2',
    groupId: 'grp_office',
    title: 'Friday Biryani',
    amountMinor: 96000,
    category: 'food',
    date: hoursAgo(5),
    payers: [{ memberId: 'arun', amountMinor: 96000 }],
    participantIds: OFFICE_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),

  expense({
    id: 'exp_room_rent',
    groupId: 'grp_room',
    title: 'Monthly Rent',
    amountMinor: 1500000,
    category: 'utilities',
    date: daysAgo(4),
    payers: [{ memberId: 'akhil', amountMinor: 1500000 }],
    participantIds: ROOM_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_room_wifi',
    groupId: 'grp_room',
    title: 'Wifi Bill',
    amountMinor: 120000,
    category: 'utilities',
    date: daysAgo(4),
    payers: [{ memberId: 'amal', amountMinor: 120000 }],
    participantIds: ROOM_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_room_groceries',
    groupId: 'grp_room',
    title: 'Groceries',
    amountMinor: 84000,
    category: 'groceries',
    date: daysAgo(2),
    payers: [{ memberId: 'binu', amountMinor: 84000 }],
    participantIds: ROOM_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),

  expense({
    id: 'exp_trek_permits',
    groupId: 'grp_trek',
    title: 'Trek Permits',
    amountMinor: 80000,
    category: 'entertainment',
    date: daysAgo(6),
    payers: [{ memberId: 'arun', amountMinor: 80000 }],
    participantIds: TREK_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
  expense({
    id: 'exp_trek_food',
    groupId: 'grp_trek',
    title: 'Trail Food & Snacks',
    amountMinor: 64000,
    category: 'food',
    date: daysAgo(5),
    payers: [{ memberId: 'amal', amountMinor: 64000 }],
    participantIds: TREK_MEMBERS,
    splitType: 'equal',
    createdBy: DEMO_SELF_ID,
  }),
]

export const seedSettlements: Settlement[] = [
  {
    id: 'stl_goa_chetan',
    groupId: 'grp_goa',
    fromMemberId: 'chetan',
    toMemberId: 'amal',
    amountMinor: 50000,
    status: 'paid',
    note: 'Paid via UPI',
    createdAt: daysAgo(14),
    settledAt: daysAgo(13),
    history: [
      { id: generateId('hist'), status: 'pending', amountMinor: 50000, at: daysAgo(14) },
      { id: generateId('hist'), status: 'paid', amountMinor: 50000, note: 'Paid via UPI', at: daysAgo(13) },
    ],
  },
  {
    id: 'stl_office_arun',
    groupId: 'grp_office',
    fromMemberId: 'arun',
    toMemberId: 'amal',
    amountMinor: 56000,
    status: 'pending',
    createdAt: daysAgo(2),
    history: [{ id: generateId('hist'), status: 'pending', amountMinor: 56000, at: daysAgo(2) }],
  },
]

export const seedNotifications: AppNotification[] = [
  {
    id: generateId('notif'),
    type: 'expense_added',
    title: 'New expense added',
    body: 'Rahul added "Friday Biryani" — ₹960 to Office Lunch Squad.',
    groupId: 'grp_office',
    read: false,
    createdAt: hoursAgo(5),
  },
  {
    id: generateId('notif'),
    type: 'reminder',
    title: 'You owe ₹850',
    body: 'Your share of the Weekend Trek permits is still pending.',
    groupId: 'grp_trek',
    read: false,
    createdAt: daysAgo(1),
  },
  {
    id: generateId('notif'),
    type: 'settlement_recorded',
    title: 'Settlement recorded',
    body: 'Chetan settled ₹500 with you on Goa Trip 2026.',
    groupId: 'grp_goa',
    read: true,
    createdAt: daysAgo(13),
  },
  {
    id: generateId('notif'),
    type: 'group_milestone',
    title: 'Group milestone',
    body: 'Goa Trip 2026 has crossed ₹28,000 in total spending.',
    groupId: 'grp_goa',
    read: true,
    createdAt: daysAgo(16),
  },
  {
    id: generateId('notif'),
    type: 'member_joined',
    title: 'New member joined',
    body: 'Chetan joined Weekend Trek.',
    groupId: 'grp_trek',
    read: true,
    createdAt: daysAgo(7),
  },
]

export const seedActivity: ActivityEntry[] = [
  { id: generateId('act'), groupId: 'grp_office', actorMemberId: 'arun', verb: 'added', subject: 'Friday Biryani', meta: { amountMinor: 96000 }, createdAt: hoursAgo(5) },
  { id: generateId('act'), groupId: 'grp_office', actorMemberId: 'rahul', verb: 'added', subject: 'Coffee run', meta: { amountMinor: 42000 }, createdAt: daysAgo(1) },
  { id: generateId('act'), groupId: 'grp_goa', actorMemberId: 'chetan', verb: 'settled', subject: '', meta: { amountMinor: 50000 }, createdAt: daysAgo(13) },
  { id: generateId('act'), groupId: 'grp_goa', actorMemberId: 'amal', verb: 'added', subject: 'Ice cream run', meta: { amountMinor: 50000 }, createdAt: daysAgo(15) },
  { id: generateId('act'), groupId: 'grp_trek', actorMemberId: 'chetan', verb: 'joined the group', subject: '', createdAt: daysAgo(7) },
]

export function buildSeedData() {
  return {
    members: seedMembers,
    groups: seedGroups,
    expenses: seedExpenses,
    settlements: seedSettlements,
    notifications: seedNotifications,
    activity: seedActivity,
  }
}
