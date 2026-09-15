import { formatINR } from '@/utils/currency'

export function generateReminderMessage(toName: string, amountMinor: number, context?: string): string {
  const amount = formatINR(amountMinor)
  const place = context ? ` from ${context}` : ''
  return `Hey ${toName}! Just a quick reminder about the ${amount}${place} 😊 Whenever you get a chance to settle up, that'd be great. Thanks!`
}
