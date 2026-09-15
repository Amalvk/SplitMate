/**
 * Deterministic email -> id mapping, computed identically here and in functions/src/index.ts
 * (Node's crypto vs the browser's SubtleCrypto produce the same SHA-256 digest for the same
 * bytes). This is what makes "just type your email" work: the same email always resolves to the
 * same account id on any device, with no password or verification step — and it's what lets one
 * person add a friend to a group by email before that friend has ever opened the app, since the
 * id their future login will resolve to can be computed right now.
 */
export async function emailToUid(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase()
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `u_${hex}`
}

/** First-run display name guess from an email's local part — e.g. "priya.sharma" -> "Priya Sharma". */
export function defaultNameFromEmail(email: string): string {
  const local = email.trim().split('@')[0] ?? email
  const words = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
  return words.length ? words.join(' ') : email
}
