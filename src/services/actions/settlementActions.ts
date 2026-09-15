import { isFirebaseConfigured } from '@/services/firebase/config'
import { writeActivity } from '@/services/actions/notify'
import { useDataStore } from '@/store/dataStore'
import { generateId } from '@/utils/id'
import { nowIso } from '@/utils/date'
import type { Settlement, SettlementStatus } from '@/types'

export async function recordSettlementAction(settlement: Settlement, actorId: string) {
  if (isFirebaseConfigured()) {
    const { firebaseSettlementsRepository } = await import('@/services/repositories/firebase/data.repository')
    await firebaseSettlementsRepository.createSettlement(settlement)
    await writeActivity({
      groupId: settlement.groupId,
      actorMemberId: actorId,
      verb: settlement.status === 'paid' ? 'settled' : 'recorded a settlement of',
      subject: '',
      meta: { amountMinor: settlement.amountMinor },
    })
    return
  }
  useDataStore.getState().recordSettlement(settlement, actorId)
}

export async function updateSettlementStatusAction(
  settlement: Settlement,
  status: SettlementStatus,
  note: string | undefined,
  actorId: string,
) {
  if (isFirebaseConfigured()) {
    const { firebaseSettlementsRepository, firebaseNotificationsRepository } = await import(
      '@/services/repositories/firebase/data.repository'
    )
    const updated: Settlement = {
      ...settlement,
      status,
      note: note ?? settlement.note,
      settledAt: status === 'paid' ? nowIso() : settlement.settledAt,
      history: [...settlement.history, { id: generateId('hist'), status, amountMinor: settlement.amountMinor, note, at: nowIso() }],
    }
    await firebaseSettlementsRepository.updateSettlement(updated)
    await writeActivity({
      groupId: settlement.groupId,
      actorMemberId: actorId,
      verb: status === 'paid' ? 'marked settled' : `marked ${status}`,
      subject: '',
      meta: { amountMinor: settlement.amountMinor },
    })
    if (status === 'paid') {
      const otherParty = actorId === settlement.fromMemberId ? settlement.toMemberId : settlement.fromMemberId
      await firebaseNotificationsRepository.pushNotification(otherParty, {
        id: generateId('notif'),
        type: 'settlement_recorded',
        title: 'Settlement recorded',
        body: `A payment of ${(settlement.amountMinor / 100).toFixed(2)} was marked as paid.`,
        groupId: settlement.groupId,
        read: false,
        createdAt: nowIso(),
      })
    }
    return
  }
  useDataStore.getState().updateSettlementStatus(settlement.id, status, note, actorId)
}
