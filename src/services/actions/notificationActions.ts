import { isFirebaseConfigured } from '@/services/firebase/config'
import { useDataStore } from '@/store/dataStore'

export async function markNotificationReadAction(userId: string, notificationId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseNotificationsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseNotificationsRepository.markRead(userId, notificationId)
    return
  }
  useDataStore.getState().markNotificationRead(notificationId)
}

export async function markAllNotificationsReadAction(userId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseNotificationsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseNotificationsRepository.markAllRead(userId)
    return
  }
  useDataStore.getState().markAllNotificationsRead()
}
