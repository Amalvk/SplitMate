import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Mic, Repeat, Sparkles, Users, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'
import { formatINR } from '@/utils/currency'

const FEATURES = [
  { icon: Sparkles, title: 'Smart splitting', desc: 'Equal, unequal, percentage or shares — the calculator handles every edge case, down to the paisa.' },
  { icon: Mic, title: 'Voice expense entry', desc: '"Amal paid 500 for everyone" — just say it, review it, done.' },
  { icon: Wallet, title: 'Instant balances', desc: 'Always know who owes what, updated the moment an expense is added.' },
  { icon: BarChart3, title: 'Smart settlements', desc: 'Settle up with the fewest payments possible — not a spreadsheet of IOUs.' },
  { icon: Users, title: 'Reusable members', desc: 'Add someone once, reuse them across every trip, room or event.' },
  { icon: Repeat, title: 'Group analytics', desc: 'See spending by category, over time, and who’s contributing what.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo)

  function handleTryDemo() {
    loginAsDemo()
    navigate(ROUTES.dashboard)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">S</div>
          <span className="font-semibold text-lg tracking-tight">SplitMate</span>
        </div>
        <Button onClick={() => navigate(ROUTES.login)}>Sign in</Button>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-12 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="size-3.5" /> Now with voice-powered expense entry
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Split expenses without the <span className="text-primary">spreadsheet headache.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Track group expenses, understand who owes whom, and settle up effortlessly — even with your voice.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate(ROUTES.login)}>
              Start Splitting <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleTryDemo}>
              Try Demo
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-16 mx-auto max-w-lg rounded-2xl border border-border bg-card shadow-xl p-5 text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Goa Trip 2026</span>
            <span className="text-xs text-muted-foreground">6 members</span>
          </div>
          <div className="flex items-center -space-x-2 mb-4">
            {['Amal', 'Rahul', 'Arun', 'Binu', 'Akhil', 'Chetan'].map((n) => (
              <Avatar key={n} name={n} size="sm" ring />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Total spent</p>
              <p className="font-bold num-tabular">{formatINR(2895000, { whole: true })}</p>
            </div>
            <div className="rounded-xl bg-success/10 p-3">
              <p className="text-xs text-success">You receive</p>
              <p className="font-bold num-tabular text-success">{formatINR(234000)}</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-border p-5"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        SplitMate — Spend together. Settle smarter.
      </footer>
    </div>
  )
}
