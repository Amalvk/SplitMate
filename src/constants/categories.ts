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
  drinks: { value: 'drinks', label: 'Drinks', emoji: '🍹' },
  travel: { value: 'travel', label: 'Travel', emoji: '🚕' },
  other: { value: 'other', label: 'Other', emoji: '🧾' },
}

/**
 * Safe lookup: expenses saved before a category was retired (hotel, medical, utilities, …) still
 * exist in storage, so unknown values fall back to "Other" instead of crashing the UI.
 */
export function getExpenseCategory(category: string): CategoryMeta {
  return EXPENSE_CATEGORIES[category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
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
