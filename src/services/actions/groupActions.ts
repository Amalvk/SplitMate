import { isFirebaseConfigured } from '@/services/firebase/config'
import { useDataStore } from '@/store/dataStore'
import { nowIso } from '@/utils/date'
import type { Group, Member, MemberProfileLite } from '@/types'

export function toProfile(member: Member): MemberProfileLite {
  return { id: member.id, name: member.name, avatarColor: member.avatarColor, email: member.email, phone: member.phone }
}

function buildMemberProfiles(memberIds: string[], allMembers: Member[]): Record<string, MemberProfileLite> {
  const byId = new Map(allMembers.map((m) => [m.id, m]))
  const profiles: Record<string, MemberProfileLite> = {}
  for (const id of memberIds) {
    const member = byId.get(id)
    if (member) profiles[id] = toProfile(member)
  }
  return profiles
}

/** Pushes the signed-in user's latest name/contact details into every group they belong to. */
export async function syncOwnProfileToGroupsAction(user: { id: string; name: string; avatarColor: string; email?: string; phone?: string }) {
  if (!isFirebaseConfigured()) {
    const store = useDataStore.getState()
    const self = store.members.find((m) => m.id === user.id || m.isSelf)
    if (self) store.updateMember({ ...self, name: user.name, phone: user.phone })
    return
  }
  const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
  await firebaseGroupsRepository.syncMemberProfile(user.id, {
    id: user.id,
    name: user.name,
    avatarColor: user.avatarColor,
    email: user.email,
    phone: user.phone,
  })
}

export async function createGroupAction(group: Group, allMembers: Member[]) {
  if (isFirebaseConfigured()) {
    const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseGroupsRepository.createGroup({ ...group, memberProfiles: buildMemberProfiles(group.memberIds, allMembers) })
    return
  }
  useDataStore.getState().createGroup(group)
}

export async function updateGroupAction(group: Group, allMembers: Member[]) {
  if (isFirebaseConfigured()) {
    const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseGroupsRepository.updateGroup({
      ...group,
      // Fresh profiles win over the existing snapshot so a group settings save also picks up any
      // saved-member edits that haven't otherwise been fanned out yet.
      memberProfiles: { ...group.memberProfiles, ...buildMemberProfiles(group.memberIds, allMembers) },
    })
    return
  }
  useDataStore.getState().updateGroup(group)
}

export async function deleteGroupAction(groupId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
    // Note: this removes the group doc only. Its expenses/settlements/activity subcollections are
    // orphaned rather than recursively deleted (no admin SDK available client-side) — an accepted
    // trade-off at this app's scale.
    await firebaseGroupsRepository.deleteGroup(groupId)
    return
  }
  useDataStore.getState().deleteGroup(groupId)
}

export async function addMemberToGroupAction(group: Group, memberId: string, member: Member) {
  if (isFirebaseConfigured()) {
    const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
    if (group.memberIds.includes(memberId)) return
    await firebaseGroupsRepository.updateGroup({
      ...group,
      memberIds: [...group.memberIds, memberId],
      memberProfiles: { ...group.memberProfiles, [memberId]: toProfile(member) },
      updatedAt: nowIso(),
    })
    return
  }
  useDataStore.getState().addMemberToGroup(group.id, memberId)
}

export async function removeMemberFromGroupAction(group: Group, memberId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseGroupsRepository.updateGroup({
      ...group,
      memberIds: group.memberIds.filter((id) => id !== memberId),
      updatedAt: nowIso(),
    })
    return
  }
  useDataStore.getState().removeMemberFromGroup(group.id, memberId)
}

/** Fetches a group by id straight from Firestore (the viewer may not be a member yet). Firebase mode only. */
export async function fetchGroupForInvite(groupId: string): Promise<Group | null> {
  const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
  return firebaseGroupsRepository.getGroup(groupId)
}

/** Adds the signed-in user to a group they opened an invite link for. */
export async function joinGroupAction(groupId: string, profile: MemberProfileLite) {
  if (isFirebaseConfigured()) {
    const { firebaseGroupsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseGroupsRepository.joinGroup(groupId, profile)
    return
  }
  const store = useDataStore.getState()
  if (!store.members.some((m) => m.id === profile.id)) {
    store.saveMember({ ...profile, createdAt: nowIso() })
  }
  store.addMemberToGroup(groupId, profile.id)
}
