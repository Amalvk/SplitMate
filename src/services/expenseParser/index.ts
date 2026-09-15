import { ruleBasedParser } from './ruleBasedParser'
import type { ExpenseParser } from './ExpenseParser'

/** The active parser. Swap this for an LLM-backed implementation of ExpenseParser later. */
export const expenseParser: ExpenseParser = ruleBasedParser

export * from './ExpenseParser'
