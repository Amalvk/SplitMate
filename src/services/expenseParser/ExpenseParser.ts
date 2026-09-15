import type { ExpenseCategory, ExpensePayer, SplitType } from '@/types'

export interface GroupContextMember {
  id: string
  name: string
}

export interface GroupContext {
  members: GroupContextMember[]
  currentUserId?: string
}

export interface ParsedExpenseResult {
  /** true if we resolved an amount, a payer, and at least one participant */
  success: boolean
  /** 0-1 confidence; the UI should always show a confirmation screen regardless */
  confidence: number
  title: string
  amountMinor: number
  payers: ExpensePayer[]
  participantIds: string[]
  splitType: SplitType
  splitInputs?: Record<string, number>
  category: ExpenseCategory
  rawText: string
  warnings: string[]
  unmatchedNames: string[]
}

/**
 * Backend-agnostic natural-language expense parser. `ruleBasedParser` (the default, deterministic
 * implementation) requires no network access, so voice/text expense entry keeps working with zero
 * configuration. A future LLM-backed implementation (OpenAI/Gemini/Claude) can implement this same
 * interface and be swapped in without touching the voice/text UI, which never trusts a parse result
 * without routing it through the confirmation screen first.
 */
export interface ExpenseParser {
  parseExpense(input: string, context: GroupContext): ParsedExpenseResult
}
