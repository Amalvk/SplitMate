export const ROUTES = {
  landing: '/',
  login: '/login',

  dashboard: '/dashboard',

  groups: '/groups',
  newGroup: '/groups/new',
  group: (id: string) => `/groups/${id}`,
  groupExpenses: (id: string) => `/groups/${id}/expenses`,
  groupBalances: (id: string) => `/groups/${id}/balances`,
  groupMembers: (id: string) => `/groups/${id}/members`,
  groupAnalytics: (id: string) => `/groups/${id}/analytics`,
  groupSettings: (id: string) => `/groups/${id}/settings`,

  newExpense: '/expenses/new',
  expense: (id: string) => `/expenses/${id}`,

  settlements: '/settlements',
  settlement: (id: string) => `/settlements/${id}`,

  members: '/members',
  notifications: '/notifications',
  profile: '/profile',
  settings: '/settings',
} as const
