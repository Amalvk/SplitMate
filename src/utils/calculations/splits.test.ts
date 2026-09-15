import { describe, expect, it } from 'vitest'
import {
  calculateCustomSplit,
  calculateEqualSplit,
  calculateMultiplePayerExpense,
  calculatePercentageSplit,
  calculateShareSplit,
} from './splits'

describe('calculateEqualSplit', () => {
  it('splits ₹1000 (100000 paise) across 3 people with remainder going to the first participants', () => {
    const result = calculateEqualSplit(100000, ['a', 'b', 'c'])
    expect(result.valid).toBe(true)
    // 100000 / 3 = 33333.33... -> 33334, 33333, 33333
    expect(result.shares).toEqual({ a: 33334, b: 33333, c: 33333 })
    expect(Object.values(result.shares).reduce((s, v) => s + v, 0)).toBe(100000)
  })

  it('splits evenly with no remainder', () => {
    const result = calculateEqualSplit(20000, ['a', 'b', 'c', 'd'])
    expect(result.shares).toEqual({ a: 5000, b: 5000, c: 5000, d: 5000 })
  })

  it('rejects zero participants', () => {
    const result = calculateEqualSplit(1000, [])
    expect(result.valid).toBe(false)
  })

  it('rejects a non-positive amount', () => {
    const result = calculateEqualSplit(0, ['a'])
    expect(result.valid).toBe(false)
  })
})

describe('calculateCustomSplit (unequal)', () => {
  it('accepts amounts that sum to the total: ₹1000 as 400/350/250', () => {
    const result = calculateCustomSplit(100000, { a: 40000, b: 35000, c: 25000 })
    expect(result.valid).toBe(true)
    expect(result.shares).toEqual({ a: 40000, b: 35000, c: 25000 })
  })

  it('rejects amounts that do not sum to the total', () => {
    const result = calculateCustomSplit(100000, { a: 40000, b: 35000, c: 20000 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/add up/i)
  })

  it('rejects negative amounts', () => {
    const result = calculateCustomSplit(100000, { a: -100, b: 100100 })
    expect(result.valid).toBe(false)
  })
})

describe('calculatePercentageSplit', () => {
  it('splits by percentage: 40/30/20/10 of ₹2000', () => {
    const result = calculatePercentageSplit(200000, { a: 40, b: 30, c: 20, d: 10 })
    expect(result.valid).toBe(true)
    expect(result.shares).toEqual({ a: 80000, b: 60000, c: 40000, d: 20000 })
  })

  it('handles repeating-decimal percentages (33.33/33.33/33.34) without losing paise', () => {
    const result = calculatePercentageSplit(100000, { a: 33.33, b: 33.33, c: 33.34 })
    expect(result.valid).toBe(true)
    const total = Object.values(result.shares).reduce((s, v) => s + v, 0)
    expect(total).toBe(100000)
  })

  it('rejects percentages that do not add up to 100', () => {
    const result = calculatePercentageSplit(100000, { a: 50, b: 40 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/100/)
  })
})

describe('calculateShareSplit', () => {
  it('splits ₹4000 as 2 shares / 1 share / 1 share', () => {
    const result = calculateShareSplit(400000, { a: 2, b: 1, c: 1 })
    expect(result.valid).toBe(true)
    expect(result.shares).toEqual({ a: 200000, b: 100000, c: 100000 })
  })

  it('distributes remainder paise deterministically for shares that do not divide evenly', () => {
    const result = calculateShareSplit(100000, { a: 1, b: 1, c: 1 })
    expect(result.valid).toBe(true)
    const total = Object.values(result.shares).reduce((s, v) => s + v, 0)
    expect(total).toBe(100000)
  })

  it('rejects zero or negative shares', () => {
    expect(calculateShareSplit(1000, { a: 0, b: 1 }).valid).toBe(false)
    expect(calculateShareSplit(1000, { a: -1, b: 2 }).valid).toBe(false)
  })
})

describe('calculateMultiplePayerExpense', () => {
  it('accepts payer amounts that sum to the total: ₹6000 as 4000 + 2000', () => {
    const result = calculateMultiplePayerExpense(
      [
        { memberId: 'a', amountMinor: 400000 },
        { memberId: 'b', amountMinor: 200000 },
      ],
      600000,
    )
    expect(result.valid).toBe(true)
  })

  it('rejects payer amounts that do not sum to the total', () => {
    const result = calculateMultiplePayerExpense(
      [
        { memberId: 'a', amountMinor: 400000 },
        { memberId: 'b', amountMinor: 100000 },
      ],
      600000,
    )
    expect(result.valid).toBe(false)
  })

  it('rejects an empty payer list', () => {
    expect(calculateMultiplePayerExpense([], 1000).valid).toBe(false)
  })
})
