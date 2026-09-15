import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import type { DataRepository } from '@/services/repositories/types'

/**
 * Local (demo mode) repository: a thin, promise-returning wrapper around the Zustand stores so
 * non-reactive callers can go through the same `DataRepository` interface the Firebase
 * implementation uses. Inside React components, prefer the store hooks directly
 * (`useDataStore`, `useAuthStore`) for reactive reads — this wrapper exists for the interface
 * seam, not to replace idiomatic Zustand usage.
 */
export const localRepository: DataRepository = {
  auth: {
    async getCurrentUser() {
      return useAuthStore.getState().currentUser
    },
    async enterWithEmail(email) {
      return useAuthStore.getState().enterWithEmail(email)
    },
    async signOut() {
      await useAuthStore.getState().logout()
    },
  },

  members: {
    async listSavedMembers() {
      return useDataStore.getState().members
    },
    async saveMember(_userId, member) {
      useDataStore.getState().saveMember(member)
    },
    async updateMember(_userId, member) {
      useDataStore.getState().updateMember(member)
    },
    async removeMember(_userId, memberId) {
      useDataStore.getState().removeMember(memberId)
    },
  },

  groups: {
    async listGroups(userId) {
      return useDataStore.getState().groups.filter((g) => g.memberIds.includes(userId))
    },
    async getGroup(groupId) {
      return useDataStore.getState().groups.find((g) => g.id === groupId) ?? null
    },
    async createGroup(group) {
      useDataStore.getState().createGroup(group)
    },
    async updateGroup(group) {
      useDataStore.getState().updateGroup(group)
    },
    async deleteGroup(groupId) {
      useDataStore.getState().deleteGroup(groupId)
    },
    async syncMemberProfile() {
      // No-op: demo mode has no memberProfiles snapshot — group rosters already read live from
      // the single shared `members` array in the store.
    },
  },

  expenses: {
    async listExpenses(groupId) {
      return useDataStore.getState().expenses.filter((e) => e.groupId === groupId)
    },
    async createExpense(expense) {
      const actorId = useAuthStore.getState().currentUser?.id ?? expense.createdBy
      useDataStore.getState().addExpense(expense, actorId)
    },
    async updateExpense(expense) {
      const actorId = useAuthStore.getState().currentUser?.id ?? expense.createdBy
      useDataStore.getState().updateExpense(expense, actorId)
    },
    async deleteExpense(_groupId, expenseId) {
      const actorId = useAuthStore.getState().currentUser?.id ?? ''
      useDataStore.getState().deleteExpense(expenseId, actorId)
    },
  },

  settlements: {
    async listSettlements(groupId) {
      return useDataStore.getState().settlements.filter((s) => s.groupId === groupId)
    },
    async createSettlement(settlement) {
      const actorId = useAuthStore.getState().currentUser?.id ?? ''
      useDataStore.getState().recordSettlement(settlement, actorId)
    },
    async updateSettlement(settlement) {
      const actorId = useAuthStore.getState().currentUser?.id ?? ''
      useDataStore.getState().updateSettlementStatus(settlement.id, settlement.status, settlement.note, actorId)
    },
  },

  notifications: {
    async listNotifications() {
      return useDataStore.getState().notifications
    },
    async pushNotification(_userId, notification) {
      useDataStore.getState().pushNotification(notification)
    },
    async markRead(_userId, notificationId) {
      useDataStore.getState().markNotificationRead(notificationId)
    },
    async markAllRead() {
      useDataStore.getState().markAllNotificationsRead()
    },
  },

  activity: {
    async listActivity(groupId) {
      return useDataStore.getState().activity.filter((a) => a.groupId === groupId)
    },
    async pushActivity(entry) {
      useDataStore.getState().pushActivity(entry)
    },
  },
}
