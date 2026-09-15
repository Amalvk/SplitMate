import { useEffect } from 'react'
import { buildSeedData } from '@/data/seed'
import { isFirebaseConfigured } from '@/services/firebase/config'
import { useDataStore } from '@/store/dataStore'

/** Seeds realistic demo data into the local store once, on first ever app load — demo mode only. */
export function useBootstrapDemoData() {
  const seeded = useDataStore((s) => s.seeded)
  const seedDemoData = useDataStore((s) => s.seedDemoData)

  useEffect(() => {
    if (!seeded && !isFirebaseConfigured()) {
      seedDemoData(buildSeedData())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
