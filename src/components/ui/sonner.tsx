import { Toaster as Sonner } from 'sonner'
import { resolveTheme, useUiStore } from '@/store/uiStore'

function Toaster() {
  const theme = useUiStore((s) => s.theme)
  const resolved = resolveTheme(theme)

  return (
    <Sonner
      theme={resolved}
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-border shadow-lg',
        },
      }}
    />
  )
}

export { Toaster }
