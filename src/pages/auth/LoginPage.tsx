import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/pages/auth/AuthShell'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({ email: z.string().email('Enter a valid email address.') })
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const enterWithEmail = useAuthStore((s) => s.enterWithEmail)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: FormValues) {
    try {
      await enterWithEmail(values.email)
      navigate(ROUTES.dashboard)
    } catch (err) {
      form.setError('email', { message: err instanceof Error ? err.message : 'Couldn’t sign you in.' })
    }
  }

  return (
    <AuthShell step="Sign in">
      <h2 className="text-2xl font-bold tracking-tight">Welcome to SplitMate</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        No password needed — just enter your email and you're in. If it's your first time, we'll set up your account automatically.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" autoFocus autoComplete="email" placeholder="you@example.com" {...form.register('email')} />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={form.formState.isSubmitting}>
          Continue <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Groups you're part of are tied to this email — enter the same one anywhere to see them.
      </p>
    </AuthShell>
  )
}
