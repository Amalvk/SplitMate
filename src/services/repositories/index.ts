import { isFirebaseConfigured } from '@/services/firebase/client'
import { localRepository } from '@/services/repositories/local'
import {
  firebaseActivityRepository,
  firebaseExpensesRepository,
  firebaseGroupsRepository,
  firebaseMembersRepository,
  firebaseNotificationsRepository,
  firebaseSettlementsRepository,
} from '@/services/repositories/firebase/data.repository'
import { firebaseAuthRepository } from '@/services/repositories/firebase/auth.repository'
import type { DataRepository } from '@/services/repositories/types'

const firebaseRepository: DataRepository = {
  auth: firebaseAuthRepository,
  members: firebaseMembersRepository,
  groups: firebaseGroupsRepository,
  expenses: firebaseExpensesRepository,
  settlements: firebaseSettlementsRepository,
  notifications: firebaseNotificationsRepository,
  activity: firebaseActivityRepository,
}

/** The active repository — Firebase when configured, local/demo mode otherwise. See services/repositories/types.ts. */
export const repository: DataRepository = isFirebaseConfigured() ? firebaseRepository : localRepository

export * from './types'
