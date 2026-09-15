import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

const HIGHLIGHTS = [
  { emoji: '🧳', text: 'Trips, hostels, offices, events — one place for every group' },
  { emoji: '🎙️', text: '"Amal paid 500 for everyone" — just say it' },
  { emoji: '✨', text: 'Smart settlements settle up in the fewest payments possible' },
]

export function AuthShell({ children, step }: { children: ReactNode; step?: string }) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10" />
        <div className="absolute -left-16 bottom-0 size-72 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 font-bold">S</div>
          <span className="font-semibold text-xl tracking-tight">SplitMate</span>
        </div>

        <div className="relative space-y-8 max-w-sm">
          <h1 className="text-3xl font-bold leading-tight">Spend together. Settle smarter.</h1>
          <div className="space-y-5">
            {HIGHLIGHTS.map((h) => (
              <motion.div
                key={h.text}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <span className="text-2xl leading-none">{h.emoji}</span>
                <p className="text-sm text-primary-foreground/90 pt-1">{h.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/70">Running in demo mode — no account needed.</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">S</div>
            <span className="font-semibold text-lg tracking-tight">SplitMate</span>
          </div>
          {step && <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{step}</p>}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
