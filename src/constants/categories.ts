import type { ExpenseCategory, GroupCategory } from '@/types'

export interface CategoryMeta {
  value: string
  label: string
  emoji: string
}

export const GROUP_CATEGORIES: Record<GroupCategory, CategoryMeta> = {
  travel: { value: 'travel', label: 'Travel / Trip', emoji: '🧳' },
  hostel: { value: 'hostel', label: 'Hostel / Room Sharing', emoji: '🏠' },
  office: { value: 'office', label: 'Office', emoji: '🏢' },
  food: { value: 'food', label: 'Food & Dining', emoji: '🍔' },
  event: { value: 'event', label: 'Event', emoji: '🎉' },
  wedding: { value: 'wedding', label: 'Wedding', emoji: '💍' },
  custom: { value: 'custom', label: 'Custom', emoji: '✨' },
}

export const GROUP_CATEGORY_LIST = Object.values(GROUP_CATEGORIES)

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  food: { value: 'food', label: 'Food', emoji: '🍕' },
  travel: { value: 'travel', label: 'Travel', emoji: '🚕' },
  hotel: { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  shopping: { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  utilities: { value: 'utilities', label: 'Utilities', emoji: '💡' },
  entertainment: { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  groceries: { value: 'groceries', label: 'Groceries', emoji: '🛒' },
  transport: { value: 'transport', label: 'Transport', emoji: '🚌' },
  medical: { value: 'medical', label: 'Medical', emoji: '💊' },
  other: { value: 'other', label: 'Other', emoji: '🧾' },
}

export const EXPENSE_CATEGORY_LIST = Object.values(EXPENSE_CATEGORIES)

export const GROUP_COLOR_THEMES = [
  '#0d9488',
  '#2563eb',
  '#a855f7',
  '#eb6834',
  '#d97706',
  '#dc2626',
  '#16a34a',
  '#e11d8f',
]
