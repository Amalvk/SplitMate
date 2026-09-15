import { isFirebaseConfigured } from '@/services/firebase/config'
import { fanOutNotification, writeActivity } from '@/services/actions/notify'
import { useDataStore } from '@/store/dataStore'
import type { Expense, Group } from '@/types'

export async function addExpenseAction(expense: Expense, actorId: string, group: Group) {
  if (isFirebaseConfigured()) {
    const { firebaseExpensesRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseExpensesRepository.createExpense(expense)
    await writeActivity({ groupId: expense.groupId, actorMemberId: actorId, verb: 'added', subject: expense.title, meta: { amountMinor: expense.amountMinor } })
    await fanOutNotification(group, actorId, {
      type: 'expense_added',
      title: 'New expense added',
      body: `${expense.title} was added to ${group.name}.`,
    })
    return
  }
  useDataStore.getState().addExpense(expense, actorId)
}

export async function updateExpenseAction(expense: Expense, actorId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseExpensesRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseExpensesRepository.updateExpense(expense)
    await writeActivity({ groupId: expense.groupId, actorMemberId: actorId, verb: 'edited', subject: expense.title })
    return
  }
  useDataStore.getState().updateExpense(expense, actorId)
}

export async function deleteExpenseAction(expense: Expense, actorId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseExpensesRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseExpensesRepository.deleteExpense(expense.groupId, expense.id)
    await writeActivity({ groupId: expense.groupId, actorMemberId: actorId, verb: 'deleted', subject: expense.title })
    return
  }
  useDataStore.getState().deleteExpense(expense.id, actorId)
}
