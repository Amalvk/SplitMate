import { generateId } from '@/utils/id'
import { nowIso } from '@/utils/date'
import type { ActivityEntry, AppNotification, Group, NotificationType } from '@/types'

/** Firebase-mode helper: writes an activity entry into a group's shared activity subcollection. */
export async function writeActivity(entry: Omit<ActivityEntry, 'id' | 'createdAt'>) {
  const { firebaseActivityRepository } = await import('@/services/repositories/firebase/data.repository')
  const item: ActivityEntry = { ...entry, id: generateId('act'), createdAt: nowIso() }
  await firebaseActivityRepository.pushActivity(item)
}

/**
 * Firebase-mode helper: fans a notification out to every member of `group` except `excludeMemberId`
 * (typically the actor) by writing a separate copy into each recipient's own notifications
 * subcollection — allowed by the `create` rule in firestore.rules without needing a Cloud Function.
 */
export async function fanOutNotification(
  group: Group,
  excludeMemberId: string,
  notification: { type: NotificationType; title: string; body: string },
) {
  const { firebaseNotificationsRepository } = await import('@/services/repositories/firebase/data.repository')
  const recipients = group.memberIds.filter((id) => id !== excludeMemberId)
  await Promise.all(
    recipients.map((memberId) => {
      const item: AppNotification = {
        id: generateId('notif'),
        ...notification,
        groupId: group.id,
        read: false,
        createdAt: nowIso(),
      }
      return firebaseNotificationsRepository.pushNotification(memberId, item)
    }),
  )
}
