import { rupeesToMinor, distributeEqually } from '@/utils/currency'
import { matchMember, splitNameList } from './nameMatch'
import type { ExpenseParser, GroupContext, ParsedExpenseResult } from './ExpenseParser'
import type { ExpenseCategory } from '@/types'

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food: ['dinner', 'lunch', 'breakfast', 'food', 'meal', 'restaurant', 'pizza', 'snack', 'ice cream'],
  travel: ['cab', 'taxi', 'uber', 'ola', 'flight', 'train', 'bus', 'auto', 'fuel', 'petrol'],
  hotel: ['hotel', 'room', 'stay', 'resort', 'villa', 'hostel', 'rent'],
  shopping: ['shopping', 'souvenir', 'clothes', 'store'],
  utilities: ['wifi', 'electricity', 'water bill', 'internet', 'bill'],
  entertainment: ['movie', 'tickets', 'entry', 'party', 'club', 'game'],
  groceries: ['groceries', 'grocery', 'supermarket', 'vegetables'],
  transport: ['transport', 'parking', 'toll'],
  medical: ['medicine', 'pharmacy', 'doctor', 'hospital'],
  other: [],
}

function inferCategory(text: string): ExpenseCategory {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ExpenseCategory, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category
  }
  return 'other'
}

function parseAmount(text: string): number | null {
  const match = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i)
  if (!match) return null
  const value = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(value) && value > 0 ? value : null
}

function titleCase(text: string): string {
  return text
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}

export const ruleBasedParser: ExpenseParser = {
  parseExpense(input: string, context: GroupContext): ParsedExpenseResult {
    const warnings: string[] = []
    const unmatchedNames: string[] = []
    const rawText = input.trim()

    const sentences = rawText
      .split(/(?<=[.!?])\s+|\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    const mainSentence = sentences[0] ?? rawText
    const followUpSentences = sentences.slice(1)

    const mainMatch = mainSentence.match(/^(.+?)\s+paid\s+(.+?)\s+for\s+(.+)$/i)

    if (!mainMatch) {
      return {
        success: false,
        confidence: 0,
        title: 'New expense',
        amountMinor: 0,
        payers: [],
        participantIds: context.members.map((m) => m.id),
        splitType: 'equal',
        category: 'other',
        rawText,
        warnings: ['Could not understand that sentence. Try: "Amal paid 500 for everyone".'],
        unmatchedNames: [],
      }
    }

    const [, payerPhrase, amountPhrase, remainder] = mainMatch

    const amountRupees = parseAmount(amountPhrase)
    const amountMinor = amountRupees ? rupeesToMinor(amountRupees) : 0
    if (!amountRupees) warnings.push('Couldn’t find a valid amount — please enter it manually.')

    const payerMember = matchMember(payerPhrase, context.members)
    if (!payerMember) unmatchedNames.push(payerPhrase.trim())

    let title = ''
    let namesPhrase = remainder.trim()
    const secondForMatch = remainder.match(/^(.+?)\s+for\s+(.+)$/i)
    if (secondForMatch) {
      title = titleCase(secondForMatch[1].trim())
      namesPhrase = secondForMatch[2].trim()
    }

    let participantIds: string[] = []
    const exceptMatch = namesPhrase.match(/^everyone\s+except\s+(.+)$/i)
    if (/^everyone$/i.test(namesPhrase.trim())) {
      participantIds = context.members.map((m) => m.id)
    } else if (exceptMatch) {
      const excludedNames = splitNameList(exceptMatch[1])
      const excludedIds = new Set<string>()
      for (const name of excludedNames) {
        const m = matchMember(name, context.members)
        if (m) excludedIds.add(m.id)
        else unmatchedNames.push(name)
      }
      participantIds = context.members.filter((m) => !excludedIds.has(m.id)).map((m) => m.id)
    } else {
      const names = splitNameList(namesPhrase)
      for (const name of names) {
        const m = matchMember(name, context.members)
        if (m) participantIds.push(m.id)
        else unmatchedNames.push(name)
      }
    }

    if (participantIds.length === 0) {
      warnings.push('Couldn’t match any participants — defaulting to everyone in the group.')
      participantIds = context.members.map((m) => m.id)
    }

    // Follow-up clauses like "Amal owes 700" set explicit amounts (unequal split).
    const explicitAmounts: Record<string, number> = {}
    for (const sentence of followUpSentences) {
      const owesMatch = sentence.match(/^(.+?)\s+owes\s+(.+)$/i)
      if (!owesMatch) continue
      const member = matchMember(owesMatch[1], context.members)
      const amt = parseAmount(owesMatch[2])
      if (member && amt) {
        explicitAmounts[member.id] = rupeesToMinor(amt)
        if (!participantIds.includes(member.id)) participantIds.push(member.id)
      } else if (!member) {
        unmatchedNames.push(owesMatch[1].trim())
      }
    }

    const hasExplicit = Object.keys(explicitAmounts).length > 0
    let splitType: ParsedExpenseResult['splitType'] = 'equal'
    let splitInputs: Record<string, number> | undefined

    if (hasExplicit && amountMinor > 0) {
      splitType = 'unequal'
      const explicitTotal = Object.values(explicitAmounts).reduce((s, v) => s + v, 0)
      const remainingParticipants = participantIds.filter((id) => !(id in explicitAmounts))
      const remainingAmount = Math.max(amountMinor - explicitTotal, 0)
      const evenShares = remainingParticipants.length > 0 ? distributeEqually(remainingAmount, remainingParticipants) : {}
      splitInputs = { ...explicitAmounts, ...evenShares }
    }

    const category = inferCategory(`${title} ${rawText}`)

    const confidence =
      (amountMinor > 0 ? 0.4 : 0) +
      (payerMember ? 0.3 : 0) +
      (participantIds.length > 0 ? 0.2 : 0) +
      (unmatchedNames.length === 0 ? 0.1 : 0)

    return {
      success: amountMinor > 0 && !!payerMember && participantIds.length > 0,
      confidence: Math.min(confidence, 1),
      title: title || (category !== 'other' ? titleCase(category) : 'Expense'),
      amountMinor,
      payers: payerMember ? [{ memberId: payerMember.id, amountMinor }] : [],
      participantIds,
      splitType,
      splitInputs,
      category,
      rawText,
      warnings,
      unmatchedNames: [...new Set(unmatchedNames)],
    }
  },
}
