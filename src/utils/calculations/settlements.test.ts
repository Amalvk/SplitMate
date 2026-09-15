import { describe, expect, it } from 'vitest'
import type { MemberBalance } from '@/types'
import { calculateSettlements, optimizeSettlements } from './settlements'

describe('optimizeSettlements', () => {
  it('minimizes payments: 4 raw IOUs collapse to 3 optimized payments, all flowing to the sole creditor', () => {
    // Rahul owes Amal 500, Arun owes Amal 300, Binu owes Rahul 200, Arun owes Rahul 100
    // => net: Amal +800, Rahul -200, Arun -400, Binu -200
    const balances: MemberBalance[] = [
      { memberId: 'amal', paidMinor: 0, owedMinor: 0, netMinor: 80000 },
      { memberId: 'rahul', paidMinor: 0, owedMinor: 0, netMinor: -20000 },
      { memberId: 'arun', paidMinor: 0, owedMinor: 0, netMinor: -40000 },
      { memberId: 'binu', paidMinor: 0, owedMinor: 0, netMinor: -20000 },
    ]

    const result = optimizeSettlements(balances)

    expect(result).toHaveLength(3)
    expect(result.every((s) => s.toMemberId === 'amal')).toBe(true)
    const totalToAmal = result.reduce((s, r) => s + r.amountMinor, 0)
    expect(totalToAmal).toBe(80000)

    const byFrom = Object.fromEntries(result.map((r) => [r.fromMemberId, r.amountMinor]))
    expect(byFrom.arun).toBe(40000)
    expect(byFrom.rahul).toBe(20000)
    expect(byFrom.binu).toBe(20000)
  })

  it('produces no suggestions when everyone is already settled', () => {
    const balances: MemberBalance[] = [
      { memberId: 'a', paidMinor: 0, owedMinor: 0, netMinor: 0 },
      { memberId: 'b', paidMinor: 0, owedMinor: 0, netMinor: 0 },
    ]
    expect(optimizeSettlements(balances)).toEqual([])
  })

  it('resolves a simple two-person debt in one payment', () => {
    const balances: MemberBalance[] = [
      { memberId: 'a', paidMinor: 0, owedMinor: 0, netMinor: 50000 },
      { memberId: 'b', paidMinor: 0, owedMinor: 0, netMinor: -50000 },
    ]
    const result = optimizeSettlements(balances)
    expect(result).toEqual([{ fromMemberId: 'b', toMemberId: 'a', amountMinor: 50000 }])
  })

  it('every settlement produced actually zeroes out the group when applied', () => {
    const balances: MemberBalance[] = [
      { memberId: 'a', paidMinor: 0, owedMinor: 0, netMinor: 123400 },
      { memberId: 'b', paidMinor: 0, owedMinor: 0, netMinor: -60000 },
      { memberId: 'c', paidMinor: 0, owedMinor: 0, netMinor: -63400 },
    ]
    const result = optimizeSettlements(balances)
    const net: Record<string, number> = { a: 123400, b: -60000, c: -63400 }
    for (const s of result) {
      net[s.fromMemberId] += s.amountMinor
      net[s.toMemberId] -= s.amountMinor
    }
    expect(Object.values(net).every((v) => v === 0)).toBe(true)
  })
})

describe('calculateSettlements', () => {
  it('delegates to the optimizer', () => {
    const balances: MemberBalance[] = [
      { memberId: 'a', paidMinor: 0, owedMinor: 0, netMinor: 1000 },
      { memberId: 'b', paidMinor: 0, owedMinor: 0, netMinor: -1000 },
    ]
    expect(calculateSettlements(balances)).toEqual(optimizeSettlements(balances))
  })
})
