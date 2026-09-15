import { describe, expect, it } from 'vitest'
import { ruleBasedParser } from './ruleBasedParser'
import type { GroupContext } from './ExpenseParser'

const context: GroupContext = {
  members: [
    { id: 'aman', name: 'Aman' },
    { id: 'rahul', name: 'Rahul' },
    { id: 'binu', name: 'Binu' },
    { id: 'chetan', name: 'Chetan' },
    { id: 'arun', name: 'Arun' },
  ],
}

describe('ruleBasedParser', () => {
  it('parses "Aman paid 1000 for everyone."', () => {
    const result = ruleBasedParser.parseExpense('Aman paid 1000 for everyone.', context)
    expect(result.success).toBe(true)
    expect(result.amountMinor).toBe(100000)
    expect(result.payers).toEqual([{ memberId: 'aman', amountMinor: 100000 }])
    expect(result.participantIds.sort()).toEqual(['aman', 'arun', 'binu', 'chetan', 'rahul'])
    expect(result.splitType).toBe('equal')
  })

  it('parses "Aman paid 1500 for dinner for Aman, Binu and Chetan."', () => {
    const result = ruleBasedParser.parseExpense('Aman paid 1500 for dinner for Aman, Binu and Chetan.', context)
    expect(result.success).toBe(true)
    expect(result.title).toBe('Dinner')
    expect(result.amountMinor).toBe(150000)
    expect(result.participantIds.sort()).toEqual(['aman', 'binu', 'chetan'])
  })

  it('parses "Rahul paid 300 for Rahul and Arun."', () => {
    const result = ruleBasedParser.parseExpense('Rahul paid 300 for Rahul and Arun.', context)
    expect(result.success).toBe(true)
    expect(result.payers).toEqual([{ memberId: 'rahul', amountMinor: 30000 }])
    expect(result.participantIds.sort()).toEqual(['arun', 'rahul'])
  })

  it('parses "Aman paid 500 for everyone except Binu."', () => {
    const result = ruleBasedParser.parseExpense('Aman paid 500 for everyone except Binu.', context)
    expect(result.success).toBe(true)
    expect(result.participantIds.sort()).toEqual(['aman', 'arun', 'chetan', 'rahul'])
    expect(result.participantIds).not.toContain('binu')
  })

  it('parses a custom split with a trailing "owes" clause', () => {
    const localContext: GroupContext = {
      members: [
        { id: 'rahul', name: 'Rahul' },
        { id: 'amal', name: 'Amal' },
        { id: 'arun', name: 'Arun' },
      ],
    }
    const result = ruleBasedParser.parseExpense(
      'Rahul paid 1500 for dinner for Rahul, Amal and Arun. Amal owes 700.',
      localContext,
    )
    expect(result.success).toBe(true)
    expect(result.amountMinor).toBe(150000)
    expect(result.splitType).toBe('unequal')
    expect(result.splitInputs?.amal).toBe(70000)
    const remainderTotal = (result.splitInputs?.rahul ?? 0) + (result.splitInputs?.arun ?? 0)
    expect(remainderTotal).toBe(80000)
    expect(result.splitInputs?.rahul).toBe(40000)
    expect(result.splitInputs?.arun).toBe(40000)
  })

  it('flags unmatched names instead of silently dropping them', () => {
    const result = ruleBasedParser.parseExpense('Aman paid 500 for Aman and Zoe.', context)
    expect(result.unmatchedNames).toContain('Zoe')
  })

  it('returns success:false for an unparseable sentence', () => {
    const result = ruleBasedParser.parseExpense('asdkjasjd', context)
    expect(result.success).toBe(false)
  })
})
