import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/services/firebase/client'
import type { AuthRepository } from '@/services/repositories/types'
import type { User } from '@/types'
import { defaultNameFromEmail, emailToUid } from '@/utils/identity'
import { getAvatarColor } from '@/utils/avatar'

/**
 * POC-only "auth": there is no password, OTP, or session token — typing an email deterministically
 * resolves (and auto-creates, on first use) a Firestore user doc for it, so sharing that email is
 * the entire access-control mechanism. See firestore.rules for the trade-off this implies.
 */
export const firebaseAuthRepository: AuthRepository = {
  async getCurrentUser() {
    // No server-side session to restore from — authStore persists currentUser itself (see
    // enterWithEmail below and authStore.ts), same as demo mode.
    return null
  },

  async enterWithEmail(email) {
    const normalized = email.trim().toLowerCase()
    const id = await emailToUid(normalized)
    const userRef = doc(getFirebaseDb(), 'users', id)
    const existing = await getDoc(userRef)
    if (existing.exists()) return existing.data() as User

    const name = defaultNameFromEmail(normalized)
    const user: User = {
      id,
      name,
      email: normalized,
      avatarColor: getAvatarColor(name),
      createdAt: new Date().toISOString(),
    }
    await setDoc(userRef, { ...user, updatedAt: serverTimestamp() })
    return user
  },

  async signOut() {
    // No server-side session to sign out of — authStore.logout() clears local state directly.
  },
}
