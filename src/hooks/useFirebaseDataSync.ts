import { useEffect } from 'react'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import type { ActivityEntry, AppNotification, Expense, Group, Member, Settlement } from '@/types'

/**
 * Real Firebase mode only: keeps the Zustand data store live-synced with Firestore. Subscribes to
 * the signed-in user's saved members + notifications, and to every group they belong to — for
 * each group, in turn, to its expenses/settlements/activity subcollections, adding or tearing
 * down those nested listeners as group membership changes. Demo mode does none of this; its data
 * lives entirely in the store already (see useBootstrapDemoData).
 */
export function useFirebaseDataSync() {
  const userId = useAuthStore((s) => s.currentUser?.id)

  useEffect(() => {
    if (!isFirebaseConfigured() || !userId) return

    // Wipe any data a prior demo-mode session left in localStorage before this file's persist
    // partialize took effect — otherwise it renders until the listeners below overwrite it.
    useDataStore.getState().clearRemoteData()

    let cancelled = false
    const topLevelUnsubs: Array<() => void> = []
    const groupUnsubs = new Map<string, Array<() => void>>()

    void (async () => {
      const { getFirebaseDb } = await import('@/services/firebase/client')
      const { collection, onSnapshot, query, where } = await import('firebase/firestore')
      if (cancelled) return
      const db = getFirebaseDb()

      topLevelUnsubs.push(
        onSnapshot(collection(db, 'users', userId, 'savedMembers'), (snap) => {
          useDataStore.getState().hydrateSavedMembers(snap.docs.map((d) => d.data() as Member))
        }),
      )

      topLevelUnsubs.push(
        onSnapshot(collection(db, 'users', userId, 'notifications'), (snap) => {
          useDataStore.getState().hydrateNotifications(snap.docs.map((d) => d.data() as AppNotification))
        }),
      )

      topLevelUnsubs.push(
        onSnapshot(query(collection(db, 'groups'), where('memberIds', 'array-contains', userId)), (snap) => {
          const groups = snap.docs.map((d) => d.data() as Group)
          useDataStore.getState().hydrateGroups(groups)

          const currentIds = new Set(groups.map((g) => g.id))

          for (const [groupId, cleanups] of groupUnsubs) {
            if (!currentIds.has(groupId)) {
              cleanups.forEach((fn) => fn())
              groupUnsubs.delete(groupId)
            }
          }

          for (const groupId of currentIds) {
            if (groupUnsubs.has(groupId)) continue
            groupUnsubs.set(groupId, [
              onSnapshot(collection(db, 'groups', groupId, 'expenses'), (s) =>
                useDataStore.getState().hydrateGroupExpenses(groupId, s.docs.map((d) => d.data() as Expense)),
              ),
              onSnapshot(collection(db, 'groups', groupId, 'settlements'), (s) =>
                useDataStore.getState().hydrateGroupSettlements(groupId, s.docs.map((d) => d.data() as Settlement)),
              ),
              onSnapshot(collection(db, 'groups', groupId, 'activity'), (s) =>
                useDataStore.getState().hydrateGroupActivity(groupId, s.docs.map((d) => d.data() as ActivityEntry)),
              ),
            ])
          }
        }),
      )
    })()

    return () => {
      cancelled = true
      topLevelUnsubs.forEach((fn) => fn())
      for (const cleanups of groupUnsubs.values()) cleanups.forEach((fn) => fn())
      groupUnsubs.clear()
    }
  }, [userId])
}
