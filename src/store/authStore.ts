import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_SELF_ID } from '@/data/seed'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { useDataStore } from '@/store/dataStore'
import type { User } from '@/types'
import { getAvatarColor } from '@/utils/avatar'
import { defaultNameFromEmail, emailToUid } from '@/utils/identity'
import { nowIso } from '@/utils/date'

interface AuthState {
  currentUser: User | null
  /** Demo mode only: email -> profile, persisted locally, so re-entering the same email on this browser returns the same account. */
  demoUsersByEmail: Record<string, User>

  /** No password, no OTP — resolves (and auto-creates, on first use) the account for this email. */
  enterWithEmail: (email: string) => Promise<User>
  /** One-click "Try Demo" on the landing page — bypasses email entry entirely. Demo mode only. */
  loginAsDemo: () => User
  updateProfile: (profile: Partial<Pick<User, 'name' | 'email' | 'phone'>>) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      demoUsersByEmail: {},

      enterWithEmail: async (email) => {
        const normalized = email.trim().toLowerCase()
        if (!normalized.includes('@')) throw new Error('Enter a valid email address.')

        if (isFirebaseConfigured()) {
          const { firebaseAuthRepository } = await import('@/services/repositories/firebase/auth.repository')
          try {
            const user = await firebaseAuthRepository.enterWithEmail(normalized)
            set({ currentUser: user })
            return user
          } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Couldn’t sign you in — please try again.')
          }
        }

        await new Promise((r) => setTimeout(r, 400))
        const existing = get().demoUsersByEmail[normalized]
        if (existing) {
          set({ currentUser: existing })
          return existing
        }
        const id = await emailToUid(normalized)
        const name = defaultNameFromEmail(normalized)
        const user: User = { id, name, email: normalized, avatarColor: getAvatarColor(name), createdAt: nowIso() }
        set((s) => ({ currentUser: user, demoUsersByEmail: { ...s.demoUsersByEmail, [normalized]: user } }))
        return user
      },

      loginAsDemo: () => {
        const user: User = {
          id: DEMO_SELF_ID,
          name: 'Amal',
          email: 'amal@example.com',
          avatarColor: getAvatarColor('Amal'),
          createdAt: nowIso(),
        }
        set((s) => ({ currentUser: user, demoUsersByEmail: { ...s.demoUsersByEmail, 'amal@example.com': user } }))
        return user
      },

      updateProfile: async (profile) => {
        const current = get().currentUser
        if (!current) return
        if (isFirebaseConfigured()) {
          try {
            const [{ getFirebaseDb }, { doc, updateDoc }] = await Promise.all([
              import('@/services/firebase/client'),
              import('firebase/firestore'),
            ])
            await updateDoc(doc(getFirebaseDb(), 'users', current.id), { ...profile })
          } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Couldn’t update your profile — please try again.')
          }
        }
        const updated = { ...current, ...profile }
        set((s) => ({
          currentUser: updated,
          demoUsersByEmail: current.email ? { ...s.demoUsersByEmail, [current.email]: updated } : s.demoUsersByEmail,
        }))
      },

      logout: async () => {
        if (isFirebaseConfigured()) {
          const { firebaseAuthRepository } = await import('@/services/repositories/firebase/auth.repository')
          await firebaseAuthRepository.signOut()
          useDataStore.getState().clearRemoteData()
        }
        set({ currentUser: null })
      },
    }),
    {
      name: 'splitflow-auth',
      partialize: (s) => ({ currentUser: s.currentUser, demoUsersByEmail: s.demoUsersByEmail }),
    },
  ),
)
