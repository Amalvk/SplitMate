import type { ExpensePayer } from '@/types'
import { distributeByWeight, distributeEqually } from '@/utils/currency'

export interface SplitResult {
  valid: boolean
  shares: Record<string, number>
  error?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

const PERCENTAGE_TOLERANCE = 0.05

/** Equal split: totalMinor divided evenly across participantIds; leftover paise go to the first participants. */
export function calculateEqualSplit(amountMinor: number, participantIds: string[]): SplitResult {
  if (participantIds.length === 0) {
    return { valid: false, shares: {}, error: 'Select at least one participant.' }
  }
  if (amountMinor <= 0) {
    return { valid: false, shares: {}, error: 'Amount must be greater than zero.' }
  }
  return { valid: true, shares: distributeEqually(amountMinor, participantIds) }
}

/** Unequal / exact-amount split: amounts (minor units) entered per member must sum to amountMinor. */
export function calculateCustomSplit(amountMinor: number, amounts: Record<string, number>): SplitResult {
  const ids = Object.keys(amounts)
  if (ids.length === 0) {
    return { valid: false, shares: {}, error: 'Select at least one participant.' }
  }
  if (ids.some((id) => amounts[id] < 0)) {
    return { valid: false, shares: {}, error: 'Amounts cannot be negative.' }
  }
  const sum = ids.reduce((total, id) => total + amounts[id], 0)
  if (sum !== amountMinor) {
    return {
      valid: false,
      shares: amounts,
      error: `Split amounts must add up to the total. Currently off by ${Math.abs(sum - amountMinor)} paise.`,
    }
  }
  return { valid: true, shares: { ...amounts } }
}

/** Percentage split: percentages per member must sum to 100 (within a small tolerance); shares are rounded to sum exactly to amountMinor. */
export function calculatePercentageSplit(amountMinor: number, percentages: Record<string, number>): SplitResult {
  const ids = Object.keys(percentages)
  if (ids.length === 0) {
    return { valid: false, shares: {}, error: 'Select at least one participant.' }
  }
  if (ids.some((id) => percentages[id] < 0)) {
    return { valid: false, shares: {}, error: 'Percentages cannot be negative.' }
  }
  const total = ids.reduce((sum, id) => sum + percentages[id], 0)
  if (Math.abs(total - 100) > PERCENTAGE_TOLERANCE) {
    return { valid: false, shares: {}, error: `Percentages must add up to 100%. Currently ${total.toFixed(2)}%.` }
  }
  return { valid: true, shares: distributeByWeight(amountMinor, percentages) }
}

/** Share-based split: positive share counts per member; amount is distributed proportionally to shares. */
export function calculateShareSplit(amountMinor: number, shares: Record<string, number>): SplitResult {
  const ids = Object.keys(shares)
  if (ids.length === 0) {
    return { valid: false, shares: {}, error: 'Select at least one participant.' }
  }
  if (ids.some((id) => shares[id] <= 0)) {
    return { valid: false, shares: {}, error: 'Shares must be positive numbers.' }
  }
  return { valid: true, shares: distributeByWeight(amountMinor, shares) }
}

/** Validates that multiple payers' contributions add up to the expense total. */
export function calculateMultiplePayerExpense(payers: ExpensePayer[], totalMinor: number): ValidationResult {
  if (payers.length === 0) {
    return { valid: false, error: 'At least one payer is required.' }
  }
  if (payers.some((p) => p.amountMinor <= 0)) {
    return { valid: false, error: 'Each payer amount must be greater than zero.' }
  }
  const sum = payers.reduce((total, p) => total + p.amountMinor, 0)
  if (sum !== totalMinor) {
    return {
      valid: false,
      error: `Payer amounts (${sum}) must add up to the expense total (${totalMinor}).`,
    }
  }
  return { valid: true }
}
