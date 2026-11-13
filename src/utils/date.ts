import { format, formatDistanceToNow, isThisYear, isToday, isYesterday, parseISO } from 'date-fns'

export function nowIso(): string {
  return new Date().toISOString()
}

export function formatFriendlyDate(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, isThisYear(date) ? 'd MMM' : 'd MMM yyyy')
}

export function formatDateLong(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy')
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

export function formatDateInput(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd')
}

/** Value for an <input type="datetime-local"> — local date and time, to the minute. */
export function formatDateTimeInput(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm")
}

export function formatDateTimeLong(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy, h:mm a')
}

/** Newest-first by the expense's own date/time; createdAt breaks ties so same-minute entries keep entry order. */
export function compareNewestFirst(a: { date: string; createdAt: string }, b: { date: string; createdAt: string }): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}
