import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { getFirebaseDb } from '@/services/firebase/client'
import type {
  ActivityRepository,
  ExpensesRepository,
  GroupsRepository,
  MembersRepository,
  NotificationsRepository,
  SettlementsRepository,
} from '@/services/repositories/types'
import type { ActivityEntry, AppNotification, Expense, Group, Member, MemberProfileLite, Settlement } from '@/types'

export const firebaseMembersRepository: MembersRepository = {
  async listSavedMembers(userId) {
    const snap = await getDocs(collection(getFirebaseDb(), 'users', userId, 'savedMembers'))
    return snap.docs.map((d) => d.data() as Member)
  },
  async saveMember(userId, member) {
    await setDoc(doc(getFirebaseDb(), 'users', userId, 'savedMembers', member.id), member)
  },
  async updateMember(userId, member) {
    await updateDoc(doc(getFirebaseDb(), 'users', userId, 'savedMembers', member.id), { ...member })
  },
  async removeMember(userId, memberId) {
    await deleteDoc(doc(getFirebaseDb(), 'users', userId, 'savedMembers', memberId))
  },
}

export const firebaseGroupsRepository: GroupsRepository = {
  async listGroups(userId) {
    const snap = await getDocs(query(collection(getFirebaseDb(), 'groups'), where('memberIds', 'array-contains', userId)))
    return snap.docs.map((d) => d.data() as Group)
  },
  async getGroup(groupId) {
    const snap = await getDoc(doc(getFirebaseDb(), 'groups', groupId))
    return snap.exists() ? (snap.data() as Group) : null
  },
  async createGroup(group) {
    await setDoc(doc(getFirebaseDb(), 'groups', group.id), group)
  },
  async updateGroup(group) {
    await setDoc(doc(getFirebaseDb(), 'groups', group.id), group)
  },
  async deleteGroup(groupId) {
    await deleteDoc(doc(getFirebaseDb(), 'groups', groupId))
  },
  async syncMemberProfile(memberId, profile: MemberProfileLite) {
    const snap = await getDocs(query(collection(getFirebaseDb(), 'groups'), where('memberIds', 'array-contains', memberId)))
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { [`memberProfiles.${memberId}`]: profile })))
  },
}

export const firebaseExpensesRepository: ExpensesRepository = {
  async listExpenses(groupId) {
    const snap = await getDocs(collection(getFirebaseDb(), 'groups', groupId, 'expenses'))
    return snap.docs.map((d) => d.data() as Expense)
  },
  async createExpense(expense) {
    await setDoc(doc(getFirebaseDb(), 'groups', expense.groupId, 'expenses', expense.id), expense)
  },
  async updateExpense(expense) {
    await setDoc(doc(getFirebaseDb(), 'groups', expense.groupId, 'expenses', expense.id), expense)
  },
  async deleteExpense(groupId, expenseId) {
    await deleteDoc(doc(getFirebaseDb(), 'groups', groupId, 'expenses', expenseId))
  },
}

export const firebaseSettlementsRepository: SettlementsRepository = {
  async listSettlements(groupId) {
    const snap = await getDocs(collection(getFirebaseDb(), 'groups', groupId, 'settlements'))
    return snap.docs.map((d) => d.data() as Settlement)
  },
  async createSettlement(settlement) {
    await setDoc(doc(getFirebaseDb(), 'groups', settlement.groupId, 'settlements', settlement.id), settlement)
  },
  async updateSettlement(settlement) {
    await setDoc(doc(getFirebaseDb(), 'groups', settlement.groupId, 'settlements', settlement.id), settlement)
  },
}

export const firebaseActivityRepository: ActivityRepository = {
  async listActivity(groupId) {
    const snap = await getDocs(collection(getFirebaseDb(), 'groups', groupId, 'activity'))
    return snap.docs.map((d) => d.data() as ActivityEntry)
  },
  async pushActivity(entry) {
    await setDoc(doc(getFirebaseDb(), 'groups', entry.groupId, 'activity', entry.id), entry)
  },
}

export const firebaseNotificationsRepository: NotificationsRepository = {
  async listNotifications(userId) {
    const snap = await getDocs(collection(getFirebaseDb(), 'users', userId, 'notifications'))
    return snap.docs.map((d) => d.data() as AppNotification)
  },
  async pushNotification(userId, notification) {
    await setDoc(doc(getFirebaseDb(), 'users', userId, 'notifications', notification.id), notification)
  },
  async markRead(userId, notificationId) {
    await updateDoc(doc(getFirebaseDb(), 'users', userId, 'notifications', notificationId), { read: true })
  },
  async markAllRead(userId) {
    const snap = await getDocs(collection(getFirebaseDb(), 'users', userId, 'notifications'))
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })))
  },
}
