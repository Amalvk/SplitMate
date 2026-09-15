import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { type Firestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore'
import { type FirebaseStorage, getStorage } from 'firebase/storage'
import { firebaseConfig } from '@/services/firebase/config'

export { isFirebaseConfigured } from '@/services/firebase/config'

let app: FirebaseApp | undefined
let dbInstance: Firestore | undefined
let storageInstance: FirebaseStorage | undefined

/**
 * Dev-only opt-in (`VITE_USE_FIREBASE_EMULATOR=true`) to point at the local Firestore Emulator
 * instead of the real project — useful for testing without touching production data. Never
 * active in a production build.
 */
function useEmulator(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
}

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  }
  return app
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    // Optional Member/User fields (email, phone) are frequently set to an explicit `undefined`
    // rather than omitted; without this, Firestore throws on any write containing one.
    dbInstance = initializeFirestore(getFirebaseApp(), { ignoreUndefinedProperties: true })
    if (useEmulator()) connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080)
  }
  return dbInstance
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) storageInstance = getStorage(getFirebaseApp())
  return storageInstance
}
