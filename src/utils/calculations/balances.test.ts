import { describe, expect, it } from 'vitest'
import type { Expense, Settlement } from '@/types'
import { calculateMemberBalances } from './balances'

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'payers' | 'split'>): Expense {
  return {
    id: 'e1',
    groupId: 'g1',
    title: 'Test expense',
    amountMinor: overrides.payers.reduce((s, p) => s + p.amountMinor, 0),
    category: 'other',
    date: '2026-01-01',
    createdBy: 'a',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    source: 'manual',
    ...overrides,
  }
}

function makeSettlement(overrides: Partial<Settlement> & Pick<Settlement, 'fromMemberId' | 'toMemberId' | 'amountMinor'>): Settlement {
  return {
    id: 's1',
    groupId: 'g1',
    status: 'paid',
    createdAt: '2026-01-01T00:00:00.000Z',
    history: [],
    ...overrides,
  }
}

describe('calculateMemberBalances', () => {
  it('computes paid/owed/net for a single equal-split expense', () => {
    const expense = makeExpense({
      payers: [{ memberId: 'amal', amountMinor: 240000 }],
      split: { type: 'equal', participantIds: ['amal', 'rahul', 'arun', 'binu'], shares: { amal: 60000, rahul: 60000, arun: 60000, binu: 60000 } },
    })

    const balances = calculateMemberBalances(['amal', 'rahul', 'arun', 'binu'], [expense])

    const byId = Object.fromEntries(balances.map((b) => [b.memberId, b]))
    expect(byId.amal).toEqual({ memberId: 'amal', paidMinor: 240000, owedMinor: 60000, netMinor: 180000 })
    expect(byId.rahul).toEqual({ memberId: 'rahul', paidMinor: 0, owedMinor: 60000, netMinor: -60000 })

    const totalNet = balances.reduce((s, b) => s + b.netMinor, 0)
    expect(totalNet).toBe(0)
  })

  it('handles multiple payers on one expense', () => {
    const expense = makeExpense({
      payers: [
        { memberId: 'amal', amountMinor: 400000 },
        { memberId: 'rahul', amountMinor: 200000 },
      ],
      split: {
        type: 'equal',
        participantIds: ['amal', 'rahul', 'arun', 'binu'],
        shares: { amal: 150000, rahul: 150000, arun: 150000, binu: 150000 },
      },
    })

    const balances = calculateMemberBalances(['amal', 'rahul', 'arun', 'binu'], [expense])
    const byId = Object.fromEntries(balances.map((b) => [b.memberId, b]))
    expect(byId.amal.netMinor).toBe(250000)
    expect(byId.rahul.netMinor).toBe(50000)
    expect(byId.arun.netMinor).toBe(-150000)
    expect(byId.binu.netMinor).toBe(-150000)
  })

  it('applies paid settlements to net balances but leaves paid/owed untouched', () => {
    const expense = makeExpense({
      payers: [{ memberId: 'amal', amountMinor: 100000 }],
      split: { type: 'equal', participantIds: ['amal', 'rahul'], shares: { amal: 50000, rahul: 50000 } },
    })
    const settlement = makeSettlement({ fromMemberId: 'rahul', toMemberId: 'amal', amountMinor: 50000, status: 'paid' })

    const balances = calculateMemberBalances(['amal', 'rahul'], [expense], [settlement])
    const byId = Object.fromEntries(balances.map((b) => [b.memberId, b]))

    expect(byId.amal.netMinor).toBe(0)
    expect(byId.rahul.netMinor).toBe(0)
    expect(byId.amal.paidMinor).toBe(100000)
    expect(byId.rahul.owedMinor).toBe(50000)
  })

  it('ignores pending settlements', () => {
    const expense = makeExpense({
      payers: [{ memberId: 'amal', amountMinor: 100000 }],
      split: { type: 'equal', participantIds: ['amal', 'rahul'], shares: { amal: 50000, rahul: 50000 } },
    })
    const settlement = makeSettlement({ fromMemberId: 'rahul', toMemberId: 'amal', amountMinor: 50000, status: 'pending' })

    const balances = calculateMemberBalances(['amal', 'rahul'], [expense], [settlement])
    const byId = Object.fromEntries(balances.map((b) => [b.memberId, b]))
    expect(byId.rahul.netMinor).toBe(-50000)
  })
})
