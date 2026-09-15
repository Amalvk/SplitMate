import type { GroupContextMember } from './ExpenseParser'

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** Finds the best matching group member for a free-text name, tolerating minor typos/transcription noise. */
export function matchMember(name: string, members: GroupContextMember[]): GroupContextMember | null {
  const clean = name.trim().toLowerCase().replace(/[.,!]/g, '')
  if (!clean) return null

  const exact = members.find((m) => m.name.toLowerCase() === clean)
  if (exact) return exact

  const startsWith = members.find((m) => m.name.toLowerCase().startsWith(clean) || clean.startsWith(m.name.toLowerCase()))
  if (startsWith) return startsWith

  let best: { member: GroupContextMember; distance: number } | null = null
  for (const member of members) {
    const distance = levenshtein(clean, member.name.toLowerCase())
    const threshold = member.name.length <= 4 ? 1 : 2
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = { member, distance }
    }
  }
  return best?.member ?? null
}

/** Splits a name-list phrase like "Aman, Binu and Chetan" into individual name tokens. */
export function splitNameList(phrase: string): string[] {
  return phrase
    .replace(/\band\b/gi, ',')
    .split(',')
    .map((s) => s.trim().replace(/[.!?]+$/, ''))
    .filter(Boolean)
}
