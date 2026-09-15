import { describe, expect, it } from 'vitest'
import { distributeByWeight, distributeEqually, formatINR, minorToRupees, parseRupeesInput, rupeesToMinor } from './currency'

describe('rupeesToMinor / minorToRupees', () => {
  it('converts ₹100.50 to 10050 paise and back', () => {
    expect(rupeesToMinor(100.5)).toBe(10050)
    expect(minorToRupees(10050)).toBe(100.5)
  })

  it('avoids classic floating point drift for repeating decimals', () => {
    // 0.1 + 0.2 !== 0.3 in raw float math; paise conversion must not leak that in.
    expect(rupeesToMinor(0.1) + rupeesToMinor(0.2)).toBe(rupeesToMinor(0.3))
  })
})

describe('formatINR', () => {
  it('formats paise as a rupee string', () => {
    expect(formatINR(240000)).toBe('₹2,400.00')
  })

  it('formats whole rupees without decimals when requested', () => {
    expect(formatINR(4258000, { whole: true })).toBe('₹42,580')
  })
})

describe('parseRupeesInput', () => {
  it('parses plain and comma/symbol-formatted input', () => {
    expect(parseRupeesInput('1200.50')).toBe(120050)
    expect(parseRupeesInput('₹1,200.50')).toBe(120050)
  })

  it('rejects invalid or negative input', () => {
    expect(parseRupeesInput('abc')).toBeNull()
    expect(parseRupeesInput('-50')).toBeNull()
    expect(parseRupeesInput('')).toBeNull()
  })
})

describe('distributeEqually', () => {
  it('gives every participant the same share when it divides evenly', () => {
    expect(distributeEqually(20000, ['a', 'b', 'c', 'd'])).toEqual({ a: 5000, b: 5000, c: 5000, d: 5000 })
  })

  it('assigns leftover paise to the first participants, summing exactly to the total', () => {
    const result = distributeEqually(100000, ['a', 'b', 'c'])
    expect(result).toEqual({ a: 33334, b: 33333, c: 33333 })
    expect(result.a + result.b + result.c).toBe(100000)
  })
})

describe('distributeByWeight', () => {
  it('distributes proportionally to weights with no drift', () => {
    const result = distributeByWeight(100000, { a: 1, b: 1, c: 1 })
    expect(Object.values(result).reduce((s, v) => s + v, 0)).toBe(100000)
  })

  it('handles a zero total weight without throwing', () => {
    expect(distributeByWeight(1000, { a: 0, b: 0 })).toEqual({ a: 0, b: 0 })
  })
})
