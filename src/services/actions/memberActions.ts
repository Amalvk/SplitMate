import { isFirebaseConfigured } from '@/services/firebase/config'
import { toProfile } from '@/services/actions/groupActions'
import { useDataStore } from '@/store/dataStore'
import type { Member } from '@/types'

export async function saveMemberAction(userId: string, member: Member) {
  if (isFirebaseConfigured()) {
    const { firebaseMembersRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseMembersRepository.saveMember(userId, member)
    return
  }
  useDataStore.getState().saveMember(member)
}

export async function updateMemberAction(userId: string, member: Member) {
  if (isFirebaseConfigured()) {
    const { firebaseMembersRepository, firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseMembersRepository.updateMember(userId, member)
    // Fan out to every group this member has already been added to, so the edit doesn't stay
    // stuck in the stale memberProfiles snapshot each group keeps.
    await firebaseGroupsRepository.syncMemberProfile(member.id, toProfile(member))
    return
  }
  useDataStore.getState().updateMember(member)
}

export async function removeMemberAction(userId: string, memberId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseMembersRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseMembersRepository.removeMember(userId, memberId)
    return
  }
  useDataStore.getState().removeMember(memberId)
}
