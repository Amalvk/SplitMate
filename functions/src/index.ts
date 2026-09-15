import { createHash } from 'node:crypto'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

initializeApp()

/** Must stay byte-for-byte identical to src/utils/identity.ts's emailToUid on the client. */
function emailToUid(email: string): string {
  const normalized = email.trim().toLowerCase()
  return `u_${createHash('sha256').update(normalized).digest('hex')}`
}

/**
 * No password, no OTP — the client sends whatever email the person typed, and this mints a
 * Firebase custom token for the uid that email deterministically maps to. Firebase Auth
 * auto-creates that uid's account on first sign-in with the token, so nothing else is needed
 * server-side. This is intentionally unverified: anyone who types an email gets in as that
 * email's account. Doesn't need the Blaze plan (no outbound network calls, unlike the previous
 * OTP-email version of this function).
 */
export const signInWithEmail = onCall(async (request) => {
  const email = String(request.data?.email ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) throw new HttpsError('invalid-argument', 'Enter a valid email address.')

  const uid = emailToUid(email)
  const token = await getAuth().createCustomToken(uid, { email })
  return { token, uid }
})
