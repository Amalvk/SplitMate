import { useEffect } from 'react'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { syncOwnProfileToGroupsAction } from '@/services/actions/groupActions'
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
  const userName = useAuthStore((s) => s.currentUser?.name)
  const userPhone = useAuthStore((s) => s.currentUser?.phone)

  // The signed-in user's own account is the source of truth for their name: whatever a group
  // snapshot or saved-member entry says, show the name they currently have.
  useEffect(() => {
    if (!isFirebaseConfigured() || !userId || !userName) return
    const apply = () => {
      const store = useDataStore.getState()
      const me = store.members.find((m) => m.id === userId)
      if (me && (me.name !== userName || me.phone !== userPhone)) store.updateMember({ ...me, name: userName, phone: userPhone })
    }
    apply()
    return useDataStore.subscribe(apply)
  }, [userId, userName, userPhone])

  useEffect(() => {
    if (!isFirebaseConfigured() || !userId) return

    // Wipe any data a prior demo-mode session left in localStorage before this file's persist
    // partialize took effect — otherwise it renders until the listeners below overwrite it.
    useDataStore.getState().clearRemoteData()

    let cancelled = false
    let healedName: string | undefined
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

          // Self-heal: if any group still carries an older copy of this user's name (e.g. they
          // renamed before profile syncing existed), push the current profile into those groups.
          const me = useAuthStore.getState().currentUser
          if (me && healedName !== me.name && groups.some((g) => g.memberProfiles?.[me.id] && g.memberProfiles[me.id].name !== me.name)) {
            healedName = me.name
            void syncOwnProfileToGroupsAction(me).catch(() => {
              healedName = undefined
            })
          }

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
