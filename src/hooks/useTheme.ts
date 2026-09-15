import { useEffect } from 'react'
import { applyThemeClass, useUiStore } from '@/store/uiStore'

export function useThemeEffect() {
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    applyThemeClass(theme)
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyThemeClass(theme)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [theme])
}
