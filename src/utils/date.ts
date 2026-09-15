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
