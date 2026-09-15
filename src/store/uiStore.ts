import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

export interface NotificationPrefs {
  expenseAdded: boolean
  settlements: boolean
  reminders: boolean
  groupMilestones: boolean
}

interface UiState {
  theme: Theme
  setTheme: (theme: Theme) => void
  notificationPrefs: NotificationPrefs
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      notificationPrefs: { expenseAdded: true, settlements: true, reminders: true, groupMilestones: true },
      setNotificationPref: (key, value) =>
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: value } })),
    }),
    { name: 'splitflow-ui' },
  ),
)

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyThemeClass(theme: Theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}
